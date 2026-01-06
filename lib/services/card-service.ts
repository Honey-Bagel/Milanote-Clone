/**
 * Card Service - High-level card operations with business logic
 *
 * Provides type-specific card handling, undo support, and validation
 */

import { db, generateId, withBoardUpdate, updateEntity, deleteEntity } from '@/lib/db/client';
import { useUndoStore } from '@/lib/stores/undo-store';
import type { CardData } from '@/lib/types';
import {
	bringToFront as orderKeyBringToFront,
	sendToBack as orderKeySendToBack,
	cardsToOrderKeyList,
	getOrderKeyForNewCard,
} from '@/lib/utils/order-key-manager';
import { PerformanceTimer } from '../utils/performance';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CreateCardParams {
	boardId: string;
	cardType: CardData['card_type'];
	position: { x: number; y: number };
	dimensions: { width: number; height?: number };
	data?: Record<string, any>; // Type-specific data
	orderKey?: string;
	withUndo?: boolean;
}

export interface UpdateCardTransformParams {
	cardId: string;
	boardId: string;
	transform: {
		position_x?: number;
		position_y?: number;
		width?: number;
		height?: number;
	};
	withUndo?: boolean;
	previousTransform?: {
		position_x?: number;
		position_y?: number;
		width?: number;
		height?: number;
	};
}

export interface UpdateCardContentOptions {
	withUndo?: boolean;
	previousContent?: Record<string, any>;
}

// ============================================================================
// CARD TRANSACTION BUILDER
// ============================================================================

/**
 * CardTransaction Builder - Enables batched card updates with single undo entry
 *
 * @example
 * // Drag multiple cards
 * const tx = new CardTransaction()
 *   .updateCard(id1, { position_x: 100, position_y: 200 })
 *   .updateCard(id2, { position_x: 300, position_y: 400 })
 *   .commit(boardId, { withUndo: true, description: 'Move cards' });
 *
 * @example
 * // Resize with width + height
 * await new CardTransaction()
 *   .updateCard(cardId, { width: 400, height: 300 })
 *   .commit(boardId);
 */
export class CardTransaction {
	private updates = new Map<string, Partial<CardData>>();
	private previousStates = new Map<string, Partial<CardData>>();

	/**
	 * Add a card update to the transaction
	 */
	updateCard(cardId: string, updates: Partial<CardData>, previousState?: Partial<CardData>): this {
		// Merge with existing updates for this card
		const existing = this.updates.get(cardId) || {};
		this.updates.set(cardId, { ...existing, ...updates });

		// Store previous state for undo
		if (previousState) {
			const existingPrev = this.previousStates.get(cardId) || {};
			this.previousStates.set(cardId, { ...existingPrev, ...previousState });
		}

		return this;
	}

	/**
	 * Update multiple cards with the same changes
	 *
	 * @example
	 * tx.updateCards([id1, id2, id3], { position_y: 100 });
	 */
	updateCards(
		cardIds: string[],
		updates: Partial<CardData>,
		previousStates?: Map<string, Partial<CardData>>
	): this {
		cardIds.forEach(cardId => {
			this.updateCard(cardId, updates, previousStates?.get(cardId));
		});
		return this;
	}

	/**
	 * Commit the transaction to the database
	 */
	async commit(
		boardId: string,
		options?: { withUndo?: boolean; description?: string }
	): Promise<void> {
		if (this.updates.size === 0) return;

		const now = Date.now();
		const transactions = Array.from(this.updates.entries()).map(([cardId, updates]) =>
			db.tx.cards[cardId].update({ ...updates, updated_at: now })
		);

		// Add board update
		transactions.push(db.tx.boards[boardId].update({ updated_at: now }));

		// Execute atomic transaction
		await db.transact(transactions);

		// Add single undo entry for entire batch
		if (options?.withUndo && this.previousStates.size > 0) {
			const currentUpdates = new Map(this.updates);
			const previousStates = new Map(this.previousStates);

			useUndoStore.getState().addAction({
				type: 'card_move',
				timestamp: now,
				description: options.description || `Update ${this.updates.size} card(s)`,
				do: async () => {
					const redoTx = new CardTransaction();
					currentUpdates.forEach((updates, cardId) => {
						redoTx.updateCard(cardId, updates);
					});
					await redoTx.commit(boardId, { withUndo: false });
				},
				undo: async () => {
					const undoTx = new CardTransaction();
					previousStates.forEach((prevState, cardId) => {
						undoTx.updateCard(cardId, prevState);
					});
					await undoTx.commit(boardId, { withUndo: false });
				},
			});
		}
	}

	/**
	 * Get the number of cards in this transaction
	 */
	get size(): number {
		return this.updates.size;
	}

	/**
	 * Clear all updates
	 */
	clear(): void {
		this.updates.clear();
		this.previousStates.clear();
	}
}

// ============================================================================
// CARD CREATION
// ============================================================================

/**
 * Generate a new order_key for a card using fractional indexing
 * This needs to query existing cards to find the highest order key
 */
async function generateOrderKey(boardId: string): Promise<string> {
	// Query existing cards in the board to find the highest order key
	const { data } = await db.queryOnce({
		cards: {
			$: {
				where: { board_id: boardId },
			},
		},
	});

	const existingCards = data?.cards || [];
	const orderKeyCards = existingCards.map(card => ({
		id: card.id,
		order_key: card.order_key,
	}));

	return getOrderKeyForNewCard(orderKeyCards);
}

/**
 * Validate and apply defaults for type-specific card data
 */
function validateCardData(
	cardType: CardData['card_type'],
	data: Record<string, any> = {}
): Record<string, any> {
	switch (cardType) {
		case 'note':
			return {
				note_content: data.note_content || '',
				note_color: data.note_color || 'yellow',
			};
		case 'image':
			if (!data.image_url && !data.image_url) {
				// Allow creation without URL (will be set later for file uploads)
			}
			return {
				image_url: data.image_url || '',
				image_caption: data.image_caption || '',
				image_alt_text: data.image_alt_text || '',
			};
		case 'task_list':
			return {
				task_list_title: data.task_list_title || 'Task List',
				tasks: data.tasks || [],
			};
		case 'link':
			return {
				link_title: data.link_title || 'New Link',
				link_url: data.link_url || '',
				link_favicon_url: data.link_favicon_url || '',
			};
		case 'file':
			return {
				file_name: data.file_name || 'file',
				file_url: data.file_url || '',
				file_size: data.file_size || 0,
				file_mime_type: data.file_mime_type || '',
			};
		case 'color_palette':
			return {
				palette_title: data.palette_title || 'Color Palette',
				palette_description: data.palette_description || '',
				palette_colors: data.palette_colors || ['#FF0000', '#00FF00', '#0000FF'],
			};
		case 'column':
			return {
				column_title: data.column_title || 'Column',
				column_background_color: data.column_background_color || '#f3f4f6',
				column_is_collapsed: data.column_is_collapsed || false,
				column_items: data.column_items || [],
			};
		case 'board':
			return {
				linked_board_id: data.linked_board_id || '',
				board_title: data.board_title || 'New Board',
				board_color: data.board_color || '#3B82F6',
				board_card_count: data.board_card_count || '0',
			};
		case 'line':
			return {
				line_start_x: data.line_start_x ?? 0,
				line_start_y: data.line_start_y ?? 50,
				line_end_x: data.line_end_x ?? 200,
				line_end_y: data.line_end_y ?? 50,
				line_color: data.line_color || '#6b7280',
				line_stroke_width: data.line_stroke_width || 2,
				line_style: data.line_style || 'solid',
				line_start_cap: data.line_start_cap || 'none',
				line_end_cap: data.line_end_cap || 'arrow',
				line_curvature: data.line_curvature || 0,
				line_control_point_offset: data.line_control_point_offset || 0,
				line_reroute_nodes: data.line_reroute_nodes || null,
				line_start_attached_card_id: data.line_start_attached_card_id || null,
				line_end_attached_card_id: data.line_end_attached_card_id || null,
			};
		default:
			return data;
	}
}

/**
 * Create a new card with type-specific defaults and validation
 *
 * @example
 * const cardId = await CardService.createCard({
 *	 boardId: 'board-123',
 *	 cardType: 'note',
 *	 position: { x: 100, y: 100 },
 *	 dimensions: { width: 300, height: 200 },
 *	 data: { note_content: 'Hello', note_color: 'yellow' },
 *	 withUndo: true,
 * });
 */
export async function createCard(params: CreateCardParams): Promise<string> {
	const cardId = generateId();
	const orderKey = params.orderKey || await generateOrderKey(params.boardId);

	// Validate and apply defaults for type-specific data
	const validatedData = validateCardData(params.cardType, params.data);

	const cardData: Partial<CardData> = {
		board_id: params.boardId,
		card_type: params.cardType,
		position_x: params.position.x,
		position_y: params.position.y,
		width: params.dimensions.width,
		height: params.dimensions.height,
		order_key: orderKey,
		...validatedData,
	};

	const now = Date.now();
	await db.transact([
		db.tx.cards[cardId].update({
			...cardData,
			created_at: now,
			updated_at: now,
		}),
		db.tx.boards[params.boardId].update({ updated_at: now }),
		db.tx.cards[cardId].link({ board: params.boardId }),
	]);

	// Add undo action
	if (params.withUndo) {
		useUndoStore.getState().addAction({
			type: 'card_create',
			timestamp: now,
			description: `Create ${params.cardType} card`,
			do: async () => {
				// Already created
			},
			undo: () => deleteCard(cardId, params.boardId, { withUndo: false }),
		});
	}

	return cardId;
}

// ============================================================================
// CARD TRANSFORM (Position & Size)
// ============================================================================

/**
 * Update card order key for z-ordering
 *
 * @example
 * await CardService.updateCardOrderKey('card-123', 'board-123', 'a5');
 */
export async function updateCardOrderKey(
	cardId: string,
	boardId: string,
	orderKey: string
): Promise<void> {
	await withBoardUpdate(boardId, [
		updateEntity('cards', cardId, { order_key: orderKey }),
	]);
}

/**
 * Toggle position lock for a card
 *
 * @example
 * await CardService.toggleCardPositionLock('card-123', 'board-123', true);
 */
export async function toggleCardPositionLock(
	cardId: string,
	boardId: string,
	isLocked: boolean
): Promise<void> {
	await withBoardUpdate(boardId, [
		updateEntity('cards', cardId, { is_position_locked: isLocked }),
	]);
}

/**
 * Update card position and/or size
 *
 * @example
 * await CardService.updateCardTransform({
 *	 cardId: 'card-123',
 *	 boardId: 'board-123',
 *	 transform: { position_x: 200, position_y: 300 },
 *	 withUndo: true,
 *	 previousTransform: { position_x: 100, position_y: 100 },
 * });
 */
export async function updateCardTransform(params: UpdateCardTransformParams): Promise<void> {

	await withBoardUpdate(params.boardId, [
		updateEntity('cards', params.cardId, params.transform),
	]);

	if (params.withUndo && params.previousTransform) {
		useUndoStore.getState().addAction({
			type: 'card_move',
			timestamp: Date.now(),
			description: 'Move/resize card',
			do: () =>
				updateCardTransform({
					...params,
					withUndo: false,
				}),
			undo: () =>
				updateCardTransform({
					cardId: params.cardId,
					boardId: params.boardId,
					transform: params.previousTransform!,
					withUndo: false,
				}),
		});
	}
}

// ============================================================================
// CARD CONTENT UPDATES (Type-Specific)
// ============================================================================

/**
 * Update card content (generic - works for any card type)
 *
 * @example
 * await CardService.updateCardContent('card-123', 'board-123', 'note', {
 *	 note_content: 'Updated content',
 * });
 */
export async function updateCardContent(
	cardId: string,
	boardId: string,
	cardType: string,
	content: Record<string, any>,
	options?: UpdateCardContentOptions
): Promise<void> {
	await withBoardUpdate(boardId, [updateEntity('cards', cardId, content)]);

	if (options?.withUndo && options.previousContent) {
		useUndoStore.getState().addAction({
			type: 'card_content',
			timestamp: Date.now(),
			description: `Edit ${cardType} card`,
			do: () => updateCardContent(cardId, boardId, cardType, content, { withUndo: false }),
			undo: () =>
				updateCardContent(cardId, boardId, cardType, options.previousContent!, { withUndo: false }),
		});
	}
}

/**
 * Update note card content
 */
export async function updateNoteCard(
	cardId: string,
	boardId: string,
	updates: { note_content?: string; note_color?: string },
	options?: UpdateCardContentOptions
): Promise<void> {
	return updateCardContent(cardId, boardId, 'note', updates, options);
}

/**
 * Update task list
 */
export async function updateTaskList(
	cardId: string,
	boardId: string,
	tasks: Array<{ text: string; completed: boolean; position: number }>,
	options?: UpdateCardContentOptions
): Promise<void> {
	return updateCardContent(cardId, boardId, 'task_list', { tasks }, options);
}

/**
 * Update image card
 */
export async function updateImageCard(
	cardId: string,
	boardId: string,
	updates: { image_url?: string; image_caption?: string; image_alt_text?: string },
	options?: UpdateCardContentOptions
): Promise<void> {
	return updateCardContent(cardId, boardId, 'image', updates, options);
}

/**
 * Update column items
 */
export async function updateColumnItems(
	columnId: string,
	boardId: string,
	items: Array<{ card_id: string; position: number }>
): Promise<void> {
	await withBoardUpdate(boardId, [updateEntity('cards', columnId, { column_items: items })]);
}

// ============================================================================
// CARD DELETION
// ============================================================================

/**
 * Delete a single card
 *
 * If the card is a board card with a linked board, also delete the linked board
 *
 * @example
 * await CardService.deleteCard('card-123', 'board-123', { withUndo: true });
 */
export async function deleteCard(
	cardId: string,
	boardId: string,
	options?: { withUndo?: boolean; cardData?: CardData }
): Promise<void> {
	console.log('[CardService] Deleting card:', {
		cardId,
		boardId,
		cardType: options?.cardData?.card_type,
		linkedBoardId: options?.cardData && 'linked_board_id' in options.cardData ? (options.cardData as { linked_board_id?: string }).linked_board_id : undefined,
	});

	// Delete associated files/images before deleting card
	if (options?.cardData) {
		const { FileService } = await import('./file-service');
		const cardType = options.cardData.card_type;

		if (cardType === 'image' && options.cardData.image_url) {
			console.log('[CardService] Deleting image file:', options.cardData.image_url);
			await FileService.safeDeleteFile(options.cardData.image_url, 'image');
		} else if (cardType === 'file' && options.cardData.file_url) {
			console.log('[CardService] Deleting file:', options.cardData.file_url);
			await FileService.safeDeleteFile(options.cardData.file_url, 'file');
		}
	}

	// If this is a board card, also delete the linked board
	if (options?.cardData?.card_type === 'board') {
		const boardCard = options.cardData as { linked_board_id?: string };
		const linkedBoardId = boardCard.linked_board_id;
		console.log('[CardService] Board card detected, linked_board_id:', linkedBoardId);
		if (linkedBoardId) {
			// Import BoardService to avoid circular dependency
			const { BoardService } = await import('./board-service');
			try {
				console.log('[CardService] Deleting linked board:', linkedBoardId);
				await BoardService.deleteBoard(linkedBoardId);
				console.log('[CardService] Successfully deleted linked board');
			} catch (error) {
				console.error('Failed to delete linked board:', error);
			}
		}
	}

	console.log('[CardService] Deleting card from database');
	await withBoardUpdate(boardId, [deleteEntity('cards', cardId)]);

	// Note: Undo for delete would require storing full card data before deletion
	// This is complex and may not be needed for MVP
	if (options?.withUndo && options.cardData) {
		useUndoStore.getState().addAction({
			type: 'card_delete',
			timestamp: Date.now(),
			description: 'Delete card',
			do: () => deleteCard(cardId, boardId, { withUndo: false }),
			undo: () => {
				// Re-creating a deleted card is complex - would need to preserve ID
				// For now, we'll skip undo for delete operations
				console.warn('Undo for card deletion not yet implemented');
			},
		});
	}
}

/**
 * Delete multiple cards
 */
export async function deleteCards(cardIds: string[], boardId: string): Promise<void> {
	const transactions = cardIds.map(id => deleteEntity('cards', id));
	await withBoardUpdate(boardId, transactions);
}

// ============================================================================
// CARD DUPLICATION
// ============================================================================

/**
 * Duplicate a card
 *
 * @example
 * const newCardId = await CardService.duplicateCard(sourceCard, { x: 20, y: 20 });
 */
export async function duplicateCard(
	sourceCard: CardData,
	offset: { x: number; y: number } = { x: 20, y: 20 }
): Promise<string> {
	const newCardId = generateId();
	const { id: _, created_at: __, updated_at: ___, ...cardData } = sourceCard as any;

	const now = Date.now();
	const orderKey = await generateOrderKey(sourceCard.board_id);

	await db.transact([
		db.tx.cards[newCardId].update({
			...cardData,
			position_x: sourceCard.position_x + offset.x,
			position_y: sourceCard.position_y + offset.y,
			is_position_locked: false,
			created_at: now,
			updated_at: now,
			order_key: orderKey,
		}),
		db.tx.boards[sourceCard.board_id].update({ updated_at: now }),
	]);

	return newCardId;
}

// ============================================================================
// Z-ORDERING
// ============================================================================

/**
 * Bring cards to front
 */
export async function bringCardsToFront(
	cardIds: string[],
	boardId: string,
	allCards: CardData[]
): Promise<void> {
	const updates = orderKeyBringToFront(cardIds, cardsToOrderKeyList(allCards));

	if (updates.size === 0) return;

	const now = Date.now();
	const transactions = Array.from(updates.entries()).map(([cardId, orderKey]) =>
		db.tx.cards[cardId].update({ order_key: orderKey, updated_at: now })
	);

	await withBoardUpdate(boardId, transactions);
}

/**
 * Send cards to back
 */
export async function sendCardsToBack(
	cardIds: string[],
	boardId: string,
	allCards: CardData[]
): Promise<void> {
	const updates = orderKeySendToBack(cardIds, cardsToOrderKeyList(allCards));

	if (updates.size === 0) return;

	const now = Date.now();
	const transactions = Array.from(updates.entries()).map(([cardId, orderKey]) =>
		db.tx.cards[cardId].update({ order_key: orderKey, updated_at: now })
	);

	await withBoardUpdate(boardId, transactions);
}

// ============================================================================
// ALIGNMENT
// ============================================================================

/**
 * Align cards to top edge
 */
export async function alignCardsTop(cards: CardData[], boardId: string): Promise<void> {
	if (cards.length === 0) return;

	const minY = Math.min(...cards.map(c => c.position_y));
	const now = Date.now();

	const transactions = cards.map(card =>
		db.tx.cards[card.id].update({
			position_y: minY,
			updated_at: now,
		})
	);

	await withBoardUpdate(boardId, transactions);
}

/**
 * Align cards to bottom edge
 */
export async function alignCardsBottom(cards: CardData[], boardId: string): Promise<void> {
	if (cards.length === 0) return;

	const maxY = Math.max(...cards.map(c => c.position_y + (c.height ?? 0)));
	const now = Date.now();

	const transactions = cards.map(card =>
		db.tx.cards[card.id].update({
			position_y: maxY - (card.height ?? 0),
			updated_at: now,
		})
	);

	await withBoardUpdate(boardId, transactions);
}

/**
 * Align cards to left edge
 */
export async function alignCardsLeft(cards: CardData[], boardId: string): Promise<void> {
	if (cards.length === 0) return;

	const minX = Math.min(...cards.map(c => c.position_x));
	const now = Date.now();

	const transactions = cards.map(card =>
		db.tx.cards[card.id].update({
			position_x: minX,
			updated_at: now,
		})
	);

	await withBoardUpdate(boardId, transactions);
}

/**
 * Align cards to right edge
 */
export async function alignCardsRight(cards: CardData[], boardId: string): Promise<void> {
	if (cards.length === 0) return;

	const maxX = Math.max(...cards.map(c => c.position_x + (c.width ?? 0)));
	const now = Date.now();

	const transactions = cards.map(card =>
		db.tx.cards[card.id].update({
			position_x: maxX - (card.width ?? 0),
			updated_at: now,
		})
	);

	await withBoardUpdate(boardId, transactions);
}

// ============================================================================
// COLUMN OPERATIONS
// ============================================================================

export interface AddCardToColumnParams {
	cardId: string;
	boardId: string;
	columnId: string;
	position: number;
};

export async function addCardToColumn(params: AddCardToColumnParams): Promise<void> {
	const { cardId, boardId, columnId, position } = params;

	// Fetch current column
	const { data } = await db.queryOnce({
		cards: {
			$: { where: { id: columnId } },
		},
	});

	const column = data?.cards[0];
	if (!column || column.card_type !== 'column') {
		throw new Error('Column not found');
	}

	// Prevent adding column cards to columns (no nesting)
	const cardToAdd = await db.queryOnce({
		cards: { $: { where: { id: cardId } } },
	});

	if (cardToAdd?.data?.cards[0]?.card_type === 'column') {
		throw new Error("Cannot add column cards to columns");
	}

	// Add card to column_items
	const updatedItems = [
		...(column.column_items || []),
		{ card_id: cardId, position },
	];

	// Reindex positions
	const reindexedItems = updatedItems.map((item, index) => ({
		...item,
		position: index,
	}));

	const now = Date.now();

	// Transaction: update column and clear card position
	await db.transact([
		db.tx.cards[columnId].update({
			column_items: reindexedItems,
			updated_at: now,
		}),
		db.tx.cards[cardId].update({
			position_x: null,
			position_y: null,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({ updated_at: now }),
	]);
}

export interface AddCardsToColumnBatchParams {
	cardIds: string[];
	boardId: string;
	column: CardData;
	startPosition?: number; // Optional: where to insert (defaults to end)
}

export async function addCardsToColumnBatch(
	params: AddCardsToColumnBatchParams
): Promise<void> {
	const { cardIds, boardId, column, startPosition } = params;

	const timer = new PerformanceTimer(`addCardsToColumnBatch(${cardIds.length} cards`);

	// Early return for empty array
	if (cardIds.length === 0) return;

	// Remove duplicates
	const uniqueCardIds = [...new Set(cardIds)];

	// Validate column type
	if (column.card_type !== 'column') {
		throw new Error(`Card ${column.id} is not a column`);
	}

	const existingItems = [...(column.column_items || [])]
		.sort((a, b) => a.position - b.position);

	const insertAt = 
		startPosition != null
		? Math.max(0, Math.min(startPosition, existingItems.length))
		: existingItems.length;

	// Remove cards if they already exist in the column
	const filteredItems = existingItems.filter(
		item => !uniqueCardIds.includes(item.card_id)
	);

	// Build inserted items
	const insertedItems = uniqueCardIds.map((cardId, index) => ({
		card_id: cardId,
		position: insertAt + index,
	}));

	// Insert
	const nextItems = [
		...filteredItems.slice(0, insertAt),
		...insertedItems,
		...filteredItems.slice(insertAt)
	];

	// Reindex cleanly
	const reindexedItems = nextItems.map((item, index) => ({
		...item,
		position: index,
	}));

	const now = Date.now();

	timer.mark('Transaction start');

	// Single atomic transaction
	await db.transact([
		// Update column with new items
		db.tx.cards[column.id].update({
			column_items: reindexedItems,
			updated_at: now,
		}),
		// Clear positions for all cards being added
		...uniqueCardIds.map(cardId =>
			db.tx.cards[cardId].update({
				position_x: null,
				position_y: null,
				updated_at: now,
			})
		),
		// Update board timestamp
		db.tx.boards[boardId].update({ updated_at: now }),
	]);

	timer.mark('Transaction complete');
	timer.log();
}

export interface ExtractCardFromColumnParams {
	cardId: string;
	boardId: string;
	column: CardData;
	position: { x: number; y: number; };
};

export async function extractCardFromColumn(params: ExtractCardFromColumnParams): Promise<void> {
	const { cardId, boardId, column, position } = params;

	const timer = new PerformanceTimer(`extractCardFromColumn(${cardId.slice(0, 8)})`);

	if (column.card_type !== 'column') {
		throw new Error(`Not a column card`);
	}

	// Remove card from column_items
	const updatedItems = (column.column_items || [])
		.filter(item => item.card_id !== cardId)
		.map((item, index) => ({ ...item, position: index }));

	const now = Date.now();

	timer.mark('Transaction start');

	// Transaction: update column and set card position
	await db.transact([
		db.tx.cards[column.id].update({
			column_items: updatedItems,
			updated_at: now,
		}),
		db.tx.cards[cardId].update({
			position_x: position.x,
			position_y: position.y,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({ updated_at: now }),
	]);

	timer.mark('Transaction complete');
	timer.log();
}

export interface TransferCardBetweenColumnsParams {
	cardId: string;
	boardId: string;
	fromColumn: CardData;
	toColumn: CardData;
	toIndex: number;
};

export async function transferCardBetweenColumns(params: TransferCardBetweenColumnsParams): Promise<void> {
	const { cardId, boardId, fromColumn, toColumn, toIndex } = params;

	const timer = new PerformanceTimer(`transferCardBetweenColumns(${cardId.slice(0, 8)})`);

	// Validate both are columns
	if (fromColumn.card_type !== 'column' || toColumn.card_type !== 'column') {
		throw new Error('Both cards must be columns');
	}

	// Remove from source
	const fromItems = (fromColumn.column_items || [])
		.filter(item => item.card_id !== cardId)
		.map((item, index) => ({ ...item, position: index }));

	// Add to target at specifiedindex
	const toItems = [...(toColumn.column_items || [])];
	toItems.splice(toIndex, 0, { card_id: cardId, position: toIndex });
	const reindexedItems = toItems.map((item, index) => ({
		...item,
		position: index,
	}));

	const now = Date.now();

	timer.mark('Transaction start');

	// Transaction
	await db.transact([
		db.tx.cards[fromColumn.id].update({
			column_items: fromItems,
			updated_at: now,
		}),
		db.tx.cards[toColumn.id].update({
			column_items: reindexedItems,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({ updated_at: now }),
	]);

	timer.mark('Transaction complete');
	timer.log();
}

export interface MoveCardsToBoardBatchParams {
	cardIds: string[];
	sourceBoardId: string;
	targetBoardId: string;
	positions: Map<string, { x: number; y: number }>;
	sourceColumns?: Map<string, CardData>;
};

/**
 * Move multiple cards to a different board atomically
 * Handles cards from canvas and cards inside columns
 */
export async function moveCardsToBoardBatch(
	params: MoveCardsToBoardBatchParams
): Promise<void> {
	const { cardIds, sourceBoardId, targetBoardId, positions, sourceColumns } = params;

	const timer = new PerformanceTimer(`moveCardsToBoardBatch(${cardIds.length} cards)`);

	if (cardIds.length === 0) return;

	// Remove duplicates
	const uniqueCardIds = [...new Set(cardIds)];

	const now = Date.now();
	const transactions = [];
	const unLinkTransactions = [];

	timer.mark('Building transactions');
	// 1. Update each card: change board_id and position
	uniqueCardIds.forEach(cardId => {
		const position = positions.get(cardId);
		if (!position) {
			console.warn(`No position found for card ${cardId}, skipping`);
			return;
		}

		transactions.push(
			db.tx.cards[cardId].update({
				board_id: targetBoardId,
				position_x: position.x,
				position_y: position.y,
				updated_at: now,
			})
		);

		// Unlink from old board, link to new board
		unLinkTransactions.push(db.tx.cards[cardId].unlink({ board: sourceBoardId }));
		transactions.push(db.tx.cards[cardId].link({ board: targetBoardId }));
	});

	// 2. If cards were in columns, reove them from column_items
	if (sourceColumns) {
		const columnsToUpdate = new Map<string, CardData>();

		sourceColumns.forEach((column, cardId) => {
			if (column.card_type === 'column') {
				columnsToUpdate.set(column.id, column);
			}
		});

		// Update each affected column
		columnsToUpdate.forEach((column) => {
			const updatedItems = (column.column_items || [])
				.filter(item => !uniqueCardIds.includes(item.card_id))
				.map((item, index) => ({ ...item, position: index }));

			transactions.push(
				db.tx.cards[column.id].update({
					column_items: updatedItems,
					updated_at: now,
				})
			);
		});
	}

	// 3. Update both board timestamps
	transactions.push(db.tx.boards[sourceBoardId].update({ updated_at: now }));
	transactions.push(db.tx.boards[targetBoardId].update({ updated_at: now }));

	timer.mark('Executing transaction');

	// Execute atomic transaction with unlink + link operations
	try {
		await db.transact([
			...unLinkTransactions,
			...transactions
		]);
	} catch (error) {
		console.error('Failed to move cards between boards:', error);
		throw error;
	}

	timer.mark('Transaction complete');
	timer.log();
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CardService = {
	CardTransaction,
	createCard,
	updateCardTransform,
	updateCardContent,
	updateNoteCard,
	updateTaskList,
	updateImageCard,
	updateColumnItems,
	deleteCard,
	deleteCards,
	duplicateCard,
	bringCardsToFront,
	sendCardsToBack,
	alignCardsTop,
	alignCardsBottom,
	alignCardsLeft,
	alignCardsRight,
	updateCardOrderKey,
	toggleCardPositionLock,
	addCardToColumn,
	addCardsToColumnBatch,
	extractCardFromColumn,
	transferCardBetweenColumns,
	moveCardsToBoardBatch,
};
