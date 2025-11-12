/**
 * Collision Detection Utilities
 * 
 * Detects when cards overlap for column card drop interactions
 */

import type { Card, ColumnCard } from '@/lib/types';

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Get bounding rectangle for a card
 */
export function getCardRect(card: Card): Rect {
	return {
		x: card.position_x,
		y: card.position_y,
		width: card.width,
		height: card.height || 200, // Default height if not specified
	};
}

/**
 * Check if two rectangles overlap with a minimum threshold
 * @param rect1 - The dragged card rectangle
 * @param rect2 - The column card rectangle
 * @param threshold - Minimum overlap ratio (0-1), default 0.4 means 40% of dragged card must overlap
 */
export function doRectsOverlap(rect1: Rect, rect2: Rect, threshold = 0.4): boolean {
	// Calculate intersection coordinates
	const xOverlap = Math.max(
		0,
		Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x)
	);
	const yOverlap = Math.max(
		0,
		Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y)
	);
	
	// Calculate intersection area
	const intersectionArea = xOverlap * yOverlap;
	
	// Calculate dragged card area
	const draggedCardArea = rect1.width * rect1.height;
	
	// Check if overlap meets threshold (e.g., 40% of dragged card overlaps)
	const overlapRatio = intersectionArea / draggedCardArea;
	return overlapRatio >= threshold;
}

/**
 * Find all column cards that the dragged card is overlapping
 * Only considers columns with LOWER z-index (so dragged card is on top)
 */
export function findOverlappingColumns(
	draggedCardId: string,
	allCards: Map<string, Card>
): ColumnCard[] {
	const draggedCard = allCards.get(draggedCardId);
	if (!draggedCard) return [];
	
	const draggedRect = getCardRect(draggedCard);
	const overlappingColumns: ColumnCard[] = [];
	
	allCards.forEach((card) => {
		// Only check column cards that:
		// 1. Are column type
		// 2. Have lower z-index (dragged card is above)
		// 3. Are not the dragged card itself
		// 4. Don't already contain this card
		if (
			card.card_type === 'column' &&
			card.z_index < draggedCard.z_index &&
			card.id !== draggedCardId
		) {
			const columnCard = card as ColumnCard;
			
			// Check if card is already in this column
			const alreadyInColumn = columnCard.column_cards.column_items?.some(
				item => item.card_id === draggedCardId
			) || false;
			
			if (!alreadyInColumn) {
				const columnRect = getCardRect(card);
				if (doRectsOverlap(draggedRect, columnRect)) {
					overlappingColumns.push(columnCard);
				}
			}
		}
	});
	
	// Sort by z-index descending - prefer the topmost column if multiple overlap
	return overlappingColumns.sort((a, b) => b.z_index - a.z_index);
}