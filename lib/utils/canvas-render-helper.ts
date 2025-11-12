/**
 * Helper functions for rendering cards on the canvas
 * Add this file as: lib/utils/canvas-render-helper.ts
 */

import type { Card, ColumnCard } from '@/lib/types';

/**
 * Get all card IDs that are inside columns
 * These cards should not be rendered directly on the canvas
 */
export function getCardIdsInColumns(cards: Map<string, Card>): Set<string> {
	const cardsInColumns = new Set<string>();
	
	// Find all column cards
	cards.forEach((card) => {
		if (card.card_type === 'column') {
			const columnCard = card as ColumnCard;
			const items = columnCard.column_cards?.column_items || [];
			
			// Add all card IDs that are in this column
			items.forEach((item) => {
				cardsInColumns.add(item.card_id);
			});
		}
	});
	
	return cardsInColumns;
}

/**
 * Filter cards to only include those that should be rendered on the canvas
 * (i.e., cards that are not inside any column)
 */
export function getCanvasCards(cards: Map<string, Card>): Card[] {
	const cardsInColumns = getCardIdsInColumns(cards);
	
	return Array.from(cards.values()).filter(
		(card) => !cardsInColumns.has(card.id)
	);
}

/**
 * Check if a card is inside any column
 */
export function isCardInColumn(cardId: string, cards: Map<string, Card>): boolean {
	const cardsInColumns = getCardIdsInColumns(cards);
	return cardsInColumns.has(cardId);
}

/**
 * Get the column that contains a specific card
 */
export function getColumnContainingCard(
	cardId: string, 
	cards: Map<string, Card>
): ColumnCard | null {
	for (const card of cards.values()) {
		if (card.card_type === 'column') {
			const columnCard = card as ColumnCard;
			const items = columnCard.column_cards?.column_items || [];
			
			if (items.some((item) => item.card_id === cardId)) {
				return columnCard;
			}
		}
	}
	
	return null;
}