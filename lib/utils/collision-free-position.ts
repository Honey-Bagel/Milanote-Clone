/**
 * Finds a collision-free position for placing cards on a board
 */

import type { CardData } from '@/lib/types';

interface CardBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

const SPACING = 20; // Space between cards to prevent overlap
const DEFAULT_CARD_WIDTH = 300;
const DEFAULT_CARD_HEIGHT = 200;

/**
 * Checks if two rectangles overlap
 */
function rectanglesOverlap(a: CardBounds, b: CardBounds): boolean {
	return !(
		a.x + a.width + SPACING < b.x ||
		b.x + b.width + SPACING < a.x ||
		a.y + a.height + SPACING < b.y ||
		b.y + b.height + SPACING < a.y
	);
}

/**
 * Gets the bounds of a card
 */
function getCardBounds(card: CardData): CardBounds {
	return {
		x: card.position_x,
		y: card.position_y,
		width: card.width || DEFAULT_CARD_WIDTH,
		height: card.height || DEFAULT_CARD_HEIGHT,
	};
}

/**
 * Finds a collision-free position for a group of cards on the target board
 * Preserves relative positioning between cards in the group
 */
export function findCollisionFreePosition(
	draggedCards: CardData[],
	targetBoardCards: CardData[],
	initialPosition: { x: number; y: number } = { x: 100, y: 100 }
): Map<string, { x: number; y: number }> {
	if (draggedCards.length === 0) {
		return new Map();
	}

	// Calculate the bounding box of the dragged cards group
	const firstCard = draggedCards[0];
	let minX = firstCard.position_x;
	let minY = firstCard.position_y;
	let maxX = firstCard.position_x + (firstCard.width || DEFAULT_CARD_WIDTH);
	let maxY = firstCard.position_y + (firstCard.height || DEFAULT_CARD_HEIGHT);

	draggedCards.forEach((card) => {
		minX = Math.min(minX, card.position_x);
		minY = Math.min(minY, card.position_y);
		maxX = Math.max(maxX, card.position_x + (card.width || DEFAULT_CARD_WIDTH));
		maxY = Math.max(maxY, card.position_y + (card.height || DEFAULT_CARD_HEIGHT));
	});

	const groupWidth = maxX - minX;
	const groupHeight = maxY - minY;

	// Try positions in a spiral pattern from the initial position
	let testX = initialPosition.x;
	let testY = initialPosition.y;
	let spiralStep = 50; // How far to move in each direction
	let maxAttempts = 200; // Prevent infinite loop

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		// Calculate offset from original group position
		const offsetX = testX - minX;
		const offsetY = testY - minY;

		// Check if all cards in the group would collide at this position
		let hasCollision = false;

		for (const draggedCard of draggedCards) {
			const newX = draggedCard.position_x + offsetX;
			const newY = draggedCard.position_y + offsetY;
			const draggedBounds: CardBounds = {
				x: newX,
				y: newY,
				width: draggedCard.width || DEFAULT_CARD_WIDTH,
				height: draggedCard.height || DEFAULT_CARD_HEIGHT,
			};

			// Check against all existing cards on target board
			for (const existingCard of targetBoardCards) {
				// Skip if it's one of the cards we're moving (in case of same board)
				if (draggedCards.some(dc => dc.id === existingCard.id)) {
					continue;
				}

				const existingBounds = getCardBounds(existingCard);
				if (rectanglesOverlap(draggedBounds, existingBounds)) {
					hasCollision = true;
					break;
				}
			}

			if (hasCollision) break;
		}

		// Found a collision-free position!
		if (!hasCollision) {
			const positions = new Map<string, { x: number; y: number }>();
			draggedCards.forEach((card) => {
				positions.set(card.id, {
					x: card.position_x + offsetX,
					y: card.position_y + offsetY,
				});
			});
			return positions;
		}

		// Move to next position in spiral pattern
		// Spiral: right, down, left, up, repeat with increasing distance
		const spiralIndex = Math.floor(attempt / 4);
		const direction = attempt % 4;
		const distance = spiralStep * (spiralIndex + 1);

		switch (direction) {
			case 0: // Right
				testX = initialPosition.x + distance;
				testY = initialPosition.y;
				break;
			case 1: // Down
				testX = initialPosition.x;
				testY = initialPosition.y + distance;
				break;
			case 2: // Left
				testX = initialPosition.x - distance;
				testY = initialPosition.y;
				break;
			case 3: // Up
				testX = initialPosition.x;
				testY = initialPosition.y - distance;
				break;
		}
	}

	// Fallback: If no collision-free position found, place far to the right
	const fallbackX = 2000 + Math.random() * 500;
	const fallbackY = initialPosition.y;
	const offsetX = fallbackX - minX;
	const offsetY = fallbackY - minY;

	const positions = new Map<string, { x: number; y: number }>();
	draggedCards.forEach((card) => {
		positions.set(card.id, {
			x: card.position_x + offsetX,
			y: card.position_y + offsetY,
		});
	});

	return positions;
}
