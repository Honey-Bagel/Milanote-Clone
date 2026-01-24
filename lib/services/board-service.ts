/**
 * Board Service - High-level board operations
 *
 * Handles board CRUD, sharing, and collaboration
 */

import { db, generateId, updateEntity } from '@/lib/db/client';
import { BOARD_DEFAULTS } from '@/lib/constants/defaults';
import { syncBoardTitle, syncBoardColor } from '@/lib/instant/board-title-sync';
import { TemplateService } from './template-service';
import { incrementCounterWithCheck, decrementCounter } from '../billing/atomic-counter-service';
import { SubscriptionTier, TIER_LIMITS } from '../billing/tier-limits';

// ============================================================================
// BOARD CREATION
// ============================================================================

export interface CreateBoardParams {
	ownerId: string;
	title?: string;
	parentId?: string;
	color?: string;
	isPublic?: boolean;
	boardId?: string; // Optional pre-generated ID for parallel operations
	fromTemplateId?: string; // Optional template ID for creating from template
}

/**
 * Create a new board
 *
 * @example
 * const boardId = await BoardService.createBoard({
 *	 ownerId: userId,
 *	 title: 'My Board',
 *	 color: '#3B82F6',
 * });
 */
export async function createBoard(params: CreateBoardParams): Promise<string> {
	// Get user's tier and check board limit
	const { data } = await db.queryOnce({
		profiles: { $: { where: { id: params.ownerId } } },
	});

	const tier = (data.profiles[0]?.subscription_tier || 'free') as SubscriptionTier;
	const limit = TIER_LIMITS[tier].boards;

	const result = await incrementCounterWithCheck(params.ownerId, 'board_count', 1, limit);
	if (!result.success) {
		throw new Error(result.reason || 'Board limit reached');
	}
	
	try {
		// If template specified, use instantiation instead
		if (params.fromTemplateId) {
			console.log('[BoardService] Creating board from template:', params.fromTemplateId);
			return TemplateService.instantiateTemplate(params.fromTemplateId, params.ownerId);
		}

		const boardId = params.boardId || generateId();
		const now = Date.now();

		console.log('[BoardService] Creating board with params:', {
			boardId,
			ownerId: params.ownerId,
			title: params.title,
			parentId: params.parentId,
			color: params.color,
		});

		const transactions = [
			db.tx.boards[boardId].update({
				title: params.title || 'New Board',
				parent_board_id: params.parentId || null,
				color: params.color || BOARD_DEFAULTS.color,
				is_public: params.isPublic || BOARD_DEFAULTS.is_public,
				created_at: now,
				updated_at: now,
			}),
			// Link board to the owner
			db.tx.$users[params.ownerId].link({ owned_boards: boardId }),
		];

		// If parentId is provided, also set up the relationship using the link
		if (params.parentId) {
			transactions.push(
				db.tx.boards[boardId].link({ parent: params.parentId })
			);
		}

		await db.transact(transactions);

		console.log('[BoardService] Board created successfully:', boardId);

		return boardId;
	} catch (error) {
		await decrementCounter(params.ownerId, 'board_count', 1);
		throw error;
	}
}

/**
 * Create a board with a corresponding board card (for nested boards)
 * This is optimized for speed - checks both limits atomically, then creates both in parallel
 *
 * @example
 * const { boardId, cardId } = await BoardService.createBoardWithCard({
 *   ownerId: userId,
 *   parentBoardId: 'parent-board-123',
 *   cardPosition: { x: 100, y: 200 },
 *   cardDimensions: { width: 300, height: 200 },
 *   title: 'My Board',
 *   color: '#3B82F6',
 * });
 */
export interface CreateBoardWithCardParams {
	ownerId: string;
	parentBoardId: string; // The board where the card will be created
	cardPosition: { x: number; y: number };
	cardDimensions: { width: number; height?: number };
	title?: string;
	color?: string;
	orderKey?: string;
}

export async function createBoardWithCard(
	params: CreateBoardWithCardParams
): Promise<{ boardId: string; cardId: string }> {
	// Pre-generate IDs
	const boardId = generateId();
	const cardId = generateId();
	const now = Date.now();
	const boardTitle = params.title || 'New Board';
	const boardColor = params.color || BOARD_DEFAULTS.color;

	// Start all operations in parallel
	const [profileData] = await Promise.all([
		// Query 1: Get profile to check limits (runs in parallel with creates)
		db.queryOnce({
			profiles: { $: { where: { id: params.ownerId } } },
		}),
		// Create 2: Board creation (starts immediately)
		db.transact([
			db.tx.boards[boardId].update({
				title: boardTitle,
				parent_board_id: params.parentBoardId,
				color: boardColor,
				is_public: BOARD_DEFAULTS.is_public,
				created_at: now,
				updated_at: now,
			}),
			db.tx.$users[params.ownerId].link({ owned_boards: boardId }),
			db.tx.boards[boardId].link({ parent: params.parentBoardId }),
		]),
		// Create 3: Card creation (starts immediately)
		db.transact([
			db.tx.cards[cardId].update({
				board_id: params.parentBoardId,
				card_type: 'board',
				position_x: params.cardPosition.x,
				position_y: params.cardPosition.y,
				width: params.cardDimensions.width,
				height: params.cardDimensions.height || 200,
				created_at: now,
				updated_at: now,
				order_key: params.orderKey || '',
				linked_board_id: boardId,
				board_title: boardTitle,
				board_color: boardColor,
				board_card_count: '0',
			}),
			db.tx.boards[params.parentBoardId].link({ cards: cardId }),
		]),
	]);

	// Check limits AFTER creation (optimistic approach)
	const profile = profileData.data.profiles[0];
	const tier = (profile?.subscription_tier || 'free') as SubscriptionTier;
	const boardLimit = TIER_LIMITS[tier].boards;
	const cardLimit = TIER_LIMITS[tier].cards;

	const currentBoardCount = profile?.board_count || 0;
	const currentCardCount = profile?.card_count || 0;

	// If limits exceeded, rollback everything
	if (boardLimit !== 'unlimited' && currentBoardCount >= boardLimit) {
		console.error('[BoardService] Board limit exceeded, rolling back');
		await Promise.all([
			db.transact([db.tx.boards[boardId].delete()]),
			db.transact([db.tx.cards[cardId].delete()]),
		]);
		throw new Error(`Board limit reached: ${currentBoardCount} / ${boardLimit}`);
	}

	if (cardLimit !== 'unlimited' && currentCardCount >= cardLimit) {
		console.error('[BoardService] Card limit exceeded, rolling back');
		await Promise.all([
			db.transact([db.tx.boards[boardId].delete()]),
			db.transact([db.tx.cards[cardId].delete()]),
		]);
		throw new Error(`Card limit reached: ${currentCardCount} / ${cardLimit}`);
	}

	// Update counters (this happens after creation for speed)
	await db.transact([
		db.tx.profiles[params.ownerId].update({
			board_count: currentBoardCount + 1,
			card_count: currentCardCount + 1,
		}),
	]);

	console.log('[BoardService] Board and card created successfully:', { boardId, cardId });

	return { boardId, cardId };
}

// ============================================================================
// BOARD UPDATES
// ============================================================================

/**
 * Update board settings
 *
 * @example
 * await BoardService.updateBoard('board-123', {
 *	 title: 'Updated Title',
 *	 color: '#FF0000',
 * });
 */
export async function updateBoard(
	boardId: string,
	updates: Partial<{
		title: string;
		color: string;
		is_public: boolean;
		share_token: string | null;
	}>
): Promise<void> {
	const { title, color, ...otherUpdates } = updates;

	// If title is being updated, use the sync function to update both boards and cards
	if (title !== undefined) {
		await syncBoardTitle(boardId, title);
	}

	// If color is being updated, use the sync function to update both boards and cards
	if (color !== undefined) {
		await syncBoardColor(boardId, color);
	}

	// If there are other updates (is_public, share_token), apply them normally
	if (Object.keys(otherUpdates).length > 0) {
		await db.transact([updateEntity('boards', boardId, otherUpdates)]);
	}
}

// ============================================================================
// PUBLIC SHARING
// ============================================================================

/**
 * Generate and set share token for public board
 *
 * @example
 * const shareToken = await BoardService.enablePublicSharing('board-123');
 * // Share URL: /board/public/${shareToken}
 */
export async function enablePublicSharing(boardId: string): Promise<string> {
	const shareToken = generateId(); // Use InstantDB's id() for unique tokens

	await updateBoard(boardId, {
		is_public: true,
		share_token: shareToken,
	});

	return shareToken;
}

/**
 * Disable public sharing
 */
export async function disablePublicSharing(boardId: string): Promise<void> {
	await updateBoard(boardId, {
		is_public: false,
		share_token: null,
	});
}

// ============================================================================
// BOARD DELETION
// ============================================================================

/**
 * Delete a board
 *
 * Note: This will also delete all cards in the board due to cascade behavior
 */
export async function deleteBoard(boardId: string, ownerId?: string): Promise<void> {
	// If ownerId not provided, fetch it first
	if (!ownerId) {
		const { data } = await db.queryOnce({
			boards: {
				$: { where: { id: boardId } },
				owner: {},
			},
		});
		const board = data.boards[0];
		if (board?.owner) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ownerId = (board.owner as any).id;
		}
	}

	// Delete the board
	await db.transact([db.tx.boards[boardId].delete()]);

	// Decrement board counter
	if (ownerId) {
		await decrementCounter(ownerId, 'board_count', 1);
	}
}

// ============================================================================
// BOARD DUPLICATION
// ============================================================================

/**
 * Duplicate a board (including all its cards)
 *
 * @param sourceBoardId - The board to duplicate
 * @param ownerId - Owner of the new board
 * @returns The ID of the new board
 */
export async function duplicateBoard(sourceBoardId: string, ownerId: string): Promise<string> {
	// TODO: Implement board duplication with cards
	// This is complex and would require:
	// 1. Query source board with all cards
	// 2. Create new board
	// 3. Create copies of all cards with new IDs
	// 4. Update any linked references (e.g., board cards linking to other boards)

	console.warn('Board duplication not yet implemented');
	throw new Error('Board duplication not yet implemented');
}

// ============================================================================
// EXPORTS
// ============================================================================

export const BoardService = {
	createBoard,
	createBoardWithCard,
	updateBoard,
	enablePublicSharing,
	disablePublicSharing,
	deleteBoard,
	duplicateBoard,
};
