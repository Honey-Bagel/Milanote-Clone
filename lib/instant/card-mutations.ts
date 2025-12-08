import { db } from "./db";
import { id } from "@instantdb/react";
import type { CardData } from "@/lib/types";
import {
	bringToFront as orderKeyBringToFront,
	sendToBack as orderKeySendToBack,
	cardsToOrderKeyList,
} from "@/lib/utils/order-key-manager";

/**
 * Maps card types to their InstantDB field prefixes
 */
const getFieldPrefixes = (cardType: CardData["card_type"]): string => {
	return cardType;
}

// ============================================================================
// CREATE CARD
// ============================================================================

/**
 * Create a new card with type-specific data
 * 
 * @param cardData - Partial card data (must include board_id, card_type, position, width)
 * @returns {Promise<string>} cardId - ID of the newly created card
 * 
 * @example
 * const cardId = await createCard({
 *     board_id: '1234',
 *     card_type: 'note',
 *     position_x: 100,
 *     position_y: 100,
 *     width: 300,
 *     height: 200,
 *     note_content: 'Hello World',
 *     note_color: 'yellow',
 * });
 */
export async function createCard(cardData: Partial<CardData>): Promise<string> {
	const cardId = id();
	const now = Date.now();

	if (!cardData.board_id) {
		throw new Error("Card requires board_id");
	}

	if (!cardData.card_type) {
		throw new Error("Card requires card_type");
	}

	// Generate order_key for new card (will implement later)
	const order_key = cardData.order_key || generateOrderKey();

	await db.transact([
		db.tx.cards[cardId].update({
			...cardData,
			created_at: now,
			updated_at: now,
			order_key,
		}),
		db.tx.boards[cardData.board_id].update({
			updated_at: now,
		}),
		db.tx.cards[cardId].link({ board: cardData.board_id }),
	]);

	return cardId;
}

// ============================================================================
// UPDATE TRANSFORM (position, size)
// ============================================================================

/**
 * Update card transform (position and/or size)
 * 
 * @param cardId - Card ID
 * @param boardId - Board ID
 * @param transform - Transform updates (position_x, position_y, width, height)
 */
export async function updateCardTransform(
	cardId: string,
	boardId: string,
	transform: {
		position_x?: number;
		position_y?: number;
		width?: number;
		height?: number;
	}
): Promise<void> {
	const now = Date.now();

	await db.transact([
		db.tx.cards[cardId].update({
			...transform,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({
			updated_at: now,
		}),
	]);
}

// ============================================================================
// UPDATE CONTENT (type-specific fields)
// ============================================================================

/**
 * Update card content (type-specific fields)
 * 
 * @param cardId - Card ID
 * @param boardId - Board ID
 * @param cardType - Card type
 * @param content - Type-specific content updates
 * 
 * @example
 * // Update note card
 * await updateCardContent('1234', '1234', 'note', {
 *   note_content: 'Updated content',
 *   note_color: 'blue',
 * });
 */
export async function updateCardContent(
	cardId: string,
	boardId: string,
	cardType: string,
	content: Record<string, any>
): Promise<void> {
	const now = Date.now();

	await db.transact([
		db.tx.cards[cardId].update({
			...content,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({
			updated_at: now,
		}),
	]);
}

// ============================================================================
// DELETE CARD
// ============================================================================

/**
 * Delete a single card
 *
 * @param cardId - Card to delete
 * @param boardId - Board ID
 * @param cardData - Optional card data (needed for cascade delete of board cards)
 *
 * @example
 * await deleteCard('1234', '5678');
 */
export async function deleteCard(
	cardId: string,
	boardId: string,
	cardData?: CardData
): Promise<void> {
	const now = Date.now();

	console.log('[card-mutations] Deleting card:', {
		cardId,
		boardId,
		cardType: cardData?.card_type,
		linkedBoardId: cardData && 'linked_board_id' in cardData ? (cardData as any).linked_board_id : undefined,
	});

	// If this is a board card, delete both card and linked board in parallel for instant UI update
	if (cardData?.card_type === 'board' && 'linked_board_id' in cardData) {
		const linkedBoardId = (cardData as any).linked_board_id;
		console.log('[card-mutations] Board card detected, linked_board_id:', linkedBoardId);

		if (linkedBoardId) {
			// Delete board in parallel (no await)
			console.log('[card-mutations] Deleting linked board:', linkedBoardId);
			db.transact([
				db.tx.boards[linkedBoardId].delete(),
			]).then(() => {
				console.log('[card-mutations] Successfully deleted linked board');
			}).catch(error => {
				console.error('[card-mutations] Failed to delete linked board:', error);
			});
		}
	}

	// Delete card in parallel (no await for instant UI update)
	console.log('[card-mutations] Deleting card from database');
	await db.transact([
		db.tx.cards[cardId].delete(),
		db.tx.boards[boardId].update({
			updated_at: now,
		}),
	]);
	console.log('[card-mutations] Card deleted successfully');
}

/**
 * Delete multiple cards at once
 * 
 * @param cardIds - Array of card IDs
 * @param boardId - Board ID
 */
export async function deleteCards(cardIds: string[], boardId: string): Promise<void> {
	const now = Date.now();

	const transactions = cardIds.map(cardId => db.tx.cards[cardId].delete());
	transactions.push(db.tx.boards[boardId].update({ updated_at: now }));

	await db.transact(transactions);
}

// ============================================================================
// DUPLICATE CARD
// ============================================================================

/**
 * Duplicate a card
 * 
 * @param sourceCard - The card to duplicate
 * @param offset - Position offset for the duplicate (default: {x: 20, y: 20})
 * @returns {Promise<string>} newCardId - The ID of the new card
 */
export async function duplicateCard(
	sourceCard: CardData,
	offset: { x: number, y: number } = { x: 20, y: 20 }
): Promise<string> {
	const newCardId = id();
	const now = Date.now();

	// Copy all fields except id, created_at, updated_at
	const { id: _, created_at: __, updated_at: ___, ...cardData } = sourceCard as any;

	await db.transact([
		db.tx.cards[newCardId].update({
			...cardData,
			position_x: sourceCard.position_x + offset.x,
			position_y: sourceCard.position_y + offset.y,
			created_at: now,
			updated_at: now,
			order_key: generateOrderKey(),
		}),
		db.tx.boards[sourceCard.board_id].update({
			updated_at: now,
		}),
	]);

	return newCardId;
}

// ============================================================================
// Z-ORDERING (Phase 5)
// ============================================================================

/**
 * Update card z-order using order_key
 *
 * @param cardId - The ID of the card to update
 * @param boardId - Board ID
 * @param newOrderKey - New order key
 */
export async function updateCardOrderKey(
	cardId: string,
	boardId: string,
	newOrderKey: string,
): Promise<void> {
	const now = Date.now();

	await db.transact([
		db.tx.cards[cardId].update({
			order_key: newOrderKey,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({
			updated_at: now,
		}),
	]);
}

/**
 * Bring card(s) to front
 *
 * @param cardIds - IDs of cards to bring to front
 * @param boardId - Board ID
 * @param allCards - All cards in the current board
 *
 * @example
 * await bringCardsToFront(['card-1'], 'board-123', allCards);
 */
export async function bringCardsToFront(
	cardIds: string[],
	boardId: string,
	allCards: CardData[]
): Promise<void> {
	const updates = orderKeyBringToFront(cardIds, cardsToOrderKeyList(allCards));

	if (updates.size === 0) return;

	const now = Date.now();
	const transactions = [];

	updates.forEach((orderKey, cardId) => {
		transactions.push(db.tx.cards[cardId].update({ order_key: orderKey, updated_at: now }));
	});

	transactions.push(db.tx.boards[boardId].update({ updated_at: now }));

	await db.transact(transactions);
}

/**
 * Send card(s) to back
 *
 * @param cardIds - IDs of cards to send to back
 * @param boardId - Board ID
 * @param allCards - All cards in the current board
 *
 * @example
 * await sendCardsToBack(['card-1'], 'board-123', allCards);
 */
export async function sendCardsToBack(
	cardIds: string[],
	boardId: string,
	allCards: CardData[]
): Promise<void> {
	const updates = orderKeySendToBack(cardIds, cardsToOrderKeyList(allCards));

	if (updates.size === 0) return;

	const now = Date.now();
	const transactions = [];

	updates.forEach((orderKey, cardId) => {
		transactions.push(db.tx.cards[cardId].update({ order_key: orderKey, updated_at: now }));
	});

	transactions.push(db.tx.boards[boardId].update({ updated_at: now }));

	await db.transact(transactions);
}

// ============================================================================
// ALIGNMENT (Phase 5)
// ============================================================================

/**
 * Align cards to top edge
 *
 * @param cards - Cards to align
 * @param boardId - Board ID
 *
 * @example
 * await alignCardsTop(selectedCards, 'board-123');
 */
export async function alignCardsTop(
	cards: CardData[],
	boardId: string
): Promise<void> {
	if (cards.length === 0) return;

	const minY = Math.min(...cards.map(c => c.position_y));
	const now = Date.now();

	const transactions = [
		...cards.map(card =>
			db.tx.cards[card.id].update({
				position_y: minY,
				updated_at: now,
			})
		),
		db.tx.boards[boardId].update({ updated_at: now })
	];

	await db.transact(transactions);
}

/**
 * Align cards to bottom edge
 *
 * @param cards - Cards to align
 * @param boardId - Board ID
 *
 * @example
 * await alignCardsBottom(selectedCards, 'board-123');
 */
export async function alignCardsBottom(
	cards: CardData[],
	boardId: string
): Promise<void> {
	if (cards.length === 0) return;

	const maxY = Math.max(...cards.map(c => c.position_y + (c.height ?? 0)));
	const now = Date.now();

	const transactions = [
		...cards.map(card =>
			db.tx.cards[card.id].update({
				position_y: maxY - (card.height ?? 0),
				updated_at: now,
			})
		),
		db.tx.boards[boardId].update({ updated_at: now })
	];

	await db.transact(transactions);
}

/**
 * Align cards to left edge
 *
 * @param cards - Cards to align
 * @param boardId - Board ID
 *
 * @example
 * await alignCardsLeft(selectedCards, 'board-123');
 */
export async function alignCardsLeft(
	cards: CardData[],
	boardId: string
): Promise<void> {
	if (cards.length === 0) return;

	const minX = Math.min(...cards.map(c => c.position_x));
	const now = Date.now();

	const transactions = [
		...cards.map(card =>
			db.tx.cards[card.id].update({
				position_x: minX,
				updated_at: now,
			})
		),
		db.tx.boards[boardId].update({ updated_at: now })
	];

	await db.transact(transactions);
}

/**
 * Align cards to right edge
 *
 * @param cards - Cards to align
 * @param boardId - Board ID
 *
 * @example
 * await alignCardsRight(selectedCards, 'board-123');
 */
export async function alignCardsRight(
	cards: CardData[],
	boardId: string
): Promise<void> {
	if (cards.length === 0) return;

	const maxX = Math.max(...cards.map(c => c.position_x + (c.width ?? 0)));
	const now = Date.now();

	const transactions = [
		...cards.map(card =>
			db.tx.cards[card.id].update({
				position_x: maxX - (card.width ?? 0),
				updated_at: now,
			})
		),
		db.tx.boards[boardId].update({ updated_at: now })
	];

	await db.transact(transactions);
}

// ============================================================================
// COLUMN OPERATIONS (Phase 6)
// ============================================================================

/**
 * Update column card items
 * 
 * @param columnId - Column card ID
 * @param boardId - Board ID
 * @param items - New column items array
 */
export async function updateColumnItems(
	columnId: string,
	boardId: string,
	items: Array<{ card_id: string, position: number }>
): Promise<void> {
	const now = Date.now();

	await db.transact([
		db.tx.cards[columnId].update({
			column_items: items,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({
			updated_at: now,
		}),
	]);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a new order_key
 */
function generateOrderKey(): string {
	// Temporary implementation
	return `a${Date.now()}`;
}