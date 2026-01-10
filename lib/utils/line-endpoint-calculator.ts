/**
 * Line Endpoint Calculator
 * 
 * Shared utility for calculating accurate line endpoint positions
 * accounting for card attachments, columns, and drag states.
 */

import type { Card, CardData, LineCard } from "@/lib/types";
import { getRayRectangleIntersection } from "./line-intersection";
import { getCardScreenPosition } from "./card-position";

export interface LineEndpoints {
	start: { x: number; y: number };
	end: { x: number; y: number };
};

/**
 * Calculate absolute canvas positions for both endpoints of a line card.
 * 
 * This function:
 * - Checks if endpoints are attached to cards
 * - For attached endpoints, calculates ray-rectangle intersection
 * - Handles cards in columns and being dragged
 * - Returns absolute canvas coordinates
 * 
 * @param lineCard - The line card to calculate endpoints for
 * @param allCards - Map of all cards
 * @param dragPositions - Map of card IDs to drag postions
 * @returns Absolute canvas positions for start and end points
 */
export function calculateLineEndpoints(
	lineCard: LineCard,
	allCards: Map<string, Card | CardData>,
	dragPositions: Map<string, { x: number; y: number }>
): LineEndpoints {
	// Get line card's canvas position (check drag first)
	const lineDragPos = dragPositions.get(lineCard.id);
	const linePosX = lineDragPos?.x ?? lineCard.position_x;
	const linePosY = lineDragPos?.y ?? lineCard.position_y;

	// Get raw endpoint positions (relative to line)
	const rawStartX = lineCard.line_start_x;
	const rawStartY = lineCard.line_start_y;
	const rawEndX = lineCard.line_end_x;
	const rawEndY = lineCard.line_end_y;

	// Calculate endpoint positions
	const startPos = calculateSingleEndpoint(
		lineCard.line_start_attached_card_id,
		rawStartX,
		rawStartY,
		rawEndX,
		rawEndY,
		linePosX,
		linePosY,
		allCards,
		dragPositions
	);

	const endPos = calculateSingleEndpoint(
		lineCard.line_end_attached_card_id,
		rawEndX,
		rawEndY,
		startPos.x - linePosX,
		startPos.y - linePosY,
		linePosX,
		linePosY,
		allCards,
		dragPositions
	);

	return {
		start: startPos,
		end: endPos,
	};
}

/**
 * Calculate a single endpoint position with ray-rectangle intersection for attached cards.
 * 
 * @param attachedCardId - ID of card this endpoint is attached to (null if free)
 * @param fallbackX - Fallback X position relative to line card
 * @param fallbackY - Fallback Y position relative to line card
 * @param otherEndpointX - X position of other endpoint (relative)
 * @param otherEndpointY - Y position of other endpoint (relative)
 * @param linePosX - Line card's X position in canvas
 * @param linePosY - Line card's Y position in canvas
 * @param allCards
 * @param dragPositions
 * @returns Absolute canvas position of the endpoint
 */
function calculateSingleEndpoint(
	attachedCardId: string | null,
	fallbackX: number,
	fallbackY: number,
	otherEndpointX: number,
	otherEndpointY: number,
	linePosX: number,
	linePosY: number,
	allCards: Map<string, Card | CardData>,
	dragPositions: Map<string, { x: number; y: number }>
): { x: number; y: number } {
	// If not attached, use fallback position
	if (!attachedCardId) {
		return {
			x: linePosX + fallbackX,
			y: linePosY + fallbackY,
		};
	}

	// Get attached card
	const attachedCard = allCards.get(attachedCardId);
	if (!attachedCard || attachedCard.card_type === 'line') {
		return {
			x: linePosX + fallbackX,
			y: linePosY + fallbackY
		};
	}

	const cardDragPos = dragPositions.get(attachedCardId);

	let cardPosX: number;
	let cardPosY: number;

	if (cardDragPos) {
		cardPosX = cardDragPos.x;
		cardPosY = cardDragPos.y;
	} else {
		const screenPos = getCardScreenPosition(attachedCard, allCards, dragPositions);

		if (!screenPos) {
			return {
				x: linePosX + fallbackX,
				y: linePosY + fallbackY,
			};
		}

		cardPosX = screenPos.x;
		cardPosY = screenPos.y;
	}

	const cardWidth = attachedCard.width;
	const cardHeight = attachedCard.height || 150;

	const centerX = cardPosX + cardWidth / 2;
	const centerY = cardPosY + cardHeight / 2;

	const otherX = linePosX + otherEndpointX;
	const otherY = linePosY + otherEndpointY;

	const intersection = getRayRectangleIntersection(
		{ x: cardPosX, y: cardPosY, width: cardWidth, height: cardHeight },
		{ x: centerX, y: centerY },
		{ x: otherX, y: otherY },
	);

	return {
		x: intersection.x,
		y: intersection.y,
	};
}