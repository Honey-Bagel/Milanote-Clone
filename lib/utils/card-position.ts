/**
 * Card Position Utilities
 *
 * Calculates visual screen positions for cards, including cards inside columns.
 *
 * IMPORTANT: These constants must match the styling in ColumnCardComponent.tsx
 *
 * Current values based on ColumnCardComponent.tsx:
 * - Header: px-6 py-4 (24px top/bottom padding)
 * - Title + badge: ~40px total height
 * - Body: p-2 (8px padding on all sides)
 * - Card gap: space-y-3 (12px gap between cards)
 *
 * If column styling changes, update these constants!
 */

import type { Card, ColumnCard, CardData } from '@/lib/types';

// Layout constants - must match ColumnCardComponent.tsx styling
const COLUMN_HEADER_HEIGHT = 64; // py-4 (16px * 2) + title + badge content (~32px)
const COLUMN_PADDING_X = 8; // p-2 (8px)
const COLUMN_PADDING_TOP = 80; // Header height + body top padding (64 + 8)
const CARD_GAP = 12; // space-y-3 (0.75rem = 12px)

export interface CardPosition {
	x: number;
	y: number;
}

/**
 * Get the visual screen position of a card, accounting for cards inside columns
 * and dragged columns.
 *
 * For cards on canvas: returns position_x, position_y (or dragPosition if dragging)
 * For cards inside columns: calculates position based on column position and card index,
 * checking if parent column is being dragged
 *
 * @param card - The card to get position for
 * @param allCards - Map of all cards (needed to find parent column)
 * @param dragPositions - Optional map of drag positions for cards being dragged
 * @returns Card position in canvas coordinates, or null if position cannot be determined
 */
export function getCardScreenPosition(
	card: Card | CardData,
	allCards: Map<string, Card | CardData>,
	dragPositions?: Map<string, { x: number; y: number }>
): CardPosition | null {
	// Case 1: Card has explicit position (on canvas)
	if (card.position_x !== null && card.position_y !== null) {
		// Check if this card is being dragged
		if (dragPositions) {
			const dragPos = dragPositions.get(card.id);
			if (dragPos) {
				return { x: dragPos.x, y: dragPos.y };
			}
		}
		return { x: card.position_x, y: card.position_y };
	}

	// Case 2: Card is inside a column (position_x is null)
	// Find parent column
	const parentColumn = findColumnContainingCard(card.id, allCards);
	if (!parentColumn) {
		console.warn(`Card ${card.id} has null position but no parent column found`);
		return null;
	}

	// Check if parent column is being dragged
	let columnX = parentColumn.position_x;
	let columnY = parentColumn.position_y;

	if (dragPositions) {
		const columnDragPos = dragPositions.get(parentColumn.id);
		if (columnDragPos) {
			// Column is being dragged - use its drag position
			columnX = columnDragPos.x;
			columnY = columnDragPos.y;
		}
	}

	// Find card's index in column
	const columnItems = parentColumn.column_items || [];
	const cardIndex = columnItems.findIndex(item => item.card_id === card.id);

	if (cardIndex === -1) {
		console.warn(`Card ${card.id} not found in parent column items`);
		return null;
	}

	// Calculate Y offset by summing heights of previous cards
	let yOffset = COLUMN_PADDING_TOP;

	for (let i = 0; i < cardIndex; i++) {
		const prevCardId = columnItems[i].card_id;
		const prevCard = allCards.get(prevCardId);

		if (prevCard) {
			// Use actual height or default
			const cardHeight = prevCard.height || 150;
			yOffset += cardHeight + CARD_GAP;
		}
	}

	return {
		x: columnX + COLUMN_PADDING_X,
		y: columnY + yOffset
	};
}

/**
 * Find the column that contains a given card.
 *
 * @param cardId - ID of the card to find
 * @param allCards - Map of all cards to search
 * @returns The column card containing this card, or null if not found
 */
function findColumnContainingCard(
	cardId: string,
	allCards: Map<string, Card | CardData>
): ColumnCard | null {
	for (const card of allCards.values()) {
		if (card.card_type === 'column') {
			const columnCard = card as ColumnCard;
			const containsCard = columnCard.column_items?.some(
				item => item.card_id === cardId
			);
			if (containsCard) {
				return columnCard;
			}
		}
	}
	return null;
}

/**
 * Get card center position for line attachment calculations.
 *
 * @param card - The card to get center position for
 * @param allCards - Map of all cards (needed for column calculations)
 * @param dragPositions - Optional map of drag positions for cards being dragged
 * @returns Card center position in canvas coordinates, or null if position cannot be determined
 */
export function getCardCenterPosition(
	card: Card | CardData,
	allCards: Map<string, Card | CardData>,
	dragPositions?: Map<string, { x: number; y: number }>
): { x: number; y: number } | null {
	const pos = getCardScreenPosition(card, allCards, dragPositions);
	if (!pos) return null;

	const width = card.width;
	const height = card.height || 50;

	return {
		x: pos.x + width / 2,
		y: pos.y + height / 2
	};
}