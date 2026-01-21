/**
 * Line Endpoint Calculator
 * 
 * Shared utility for calculating accurate line endpoint positions
 * accounting for card attachments, columns, and drag states.
 */

import type { Card, CardData, LineCard } from "@/lib/types";
import { getRayRectangleIntersection } from "./line-intersection";
import { getCardScreenPosition } from "./card-position";
import { controlVectorToCubicBezier, type CurveControl, type Point } from "./bezier-curve";

/**
 * Calculate the tangent direction vector at a Bezier curve endpoint
 */
function calculateEndpointTangent(
	endpoint: Point,
	controlPoint: Point,
	isStart: boolean,
): { x: number; y: number } {
	if (isStart) {
		// Tangent at start = direction from start to first control point
		const dx = controlPoint.x - endpoint.x;
		const dy = controlPoint.y - endpoint.y;
		const length = Math.sqrt(dx * dx + dy * dy);

		if (length === 0) return { x: 1, y: 0 };

		return { x: dx / length, y: dy / length };
	} else {
		// Tangent at end = direction from second control point to end
		const dx = endpoint.x - controlPoint.x;
		const dy = endpoint.y - controlPoint.y;
		const length = Math.sqrt(dx * dx + dy * dy);

		if (length === 0) return { x: 1, y: 0 };

		return { x: dx / length, y: dy / length };
	}
}

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
	dragPositions: Map<string, { x: number; y: number }>,
	curveControl?: { curvature: number; directionalBias: number }
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

	// Calculate initial endpoint positions (first pass)
	const firstPassStart = calculateSingleEndpoint(
		lineCard.line_start_attached_card_id,
		rawStartX,
		rawStartY,
		rawEndX,
		rawEndY,
		linePosX,
		linePosY,
		allCards,
		dragPositions,
		null
	);

	const firstPassEnd = calculateSingleEndpoint(
		lineCard.line_end_attached_card_id,
		rawEndX,
		rawEndY,
		firstPassStart.x - linePosX,
		firstPassStart.y - linePosY,
		linePosX,
		linePosY,
		allCards,
		dragPositions,
		null
	);

	// If no curvature or not attached, use first pass results (straight lines)
	if (!curveControl ||
		Math.abs(curveControl.curvature) < 0.001 ||
		(!lineCard.line_start_attached_card_id && !lineCard.line_end_attached_card_id)
	) {
		return {
			start: firstPassStart,
			end: firstPassEnd
		};
	}

	// For curved lines, use iterative convergence to find accurate endpoints
	let currentStart = firstPassStart;
	let currentEnd = firstPassEnd;

	const MAX_ITERATIONS = 5; // Converge within 5 iterations
	const CONVERGENCE_THRESHOLD = 0.5; // Stop when movement < 0.5px

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		// Calculate control points from current endpoints
		const { cp1, cp2 } = controlVectorToCubicBezier(
			currentStart,
			currentEnd,
			curveControl
		);

		// Calculate dynamic tangent distances (Milanote-style)
		const startTangentDist = calculateDynamicHandleLength(
			currentStart,
			currentEnd,
			cp1,
			lineCard.line_start_attached_card_id,
			allCards,
			dragPositions
		);
		const endTangentDist = calculateDynamicHandleLength(
			currentEnd,
			currentStart,
			cp2,
			lineCard.line_end_attached_card_id,
			allCards,
			dragPositions
		);

		// Recalculate control points with dynamic distances
		const adjustedCp1 = adjustControlPointDistance(currentStart, cp1, startTangentDist);
		const adjustedCp2 = adjustControlPointDistance(currentEnd, cp2, endTangentDist);

		// Calculate tangent directions at endpoints
		const startTangent = calculateEndpointTangent(currentStart, adjustedCp1, true);
		const endTangent = calculateEndpointTangent(currentEnd, adjustedCp2, false);

		// Calculate new endpoints using tangent directions (outward from endpoints)
		const newStart = calculateSingleEndpoint(
			lineCard.line_start_attached_card_id,
			rawStartX,
			rawStartY,
			rawEndX,
			rawEndY,
			linePosX,
			linePosY,
			allCards,
			dragPositions,
			startTangent // Use outward tangent (not inverted)
		);

		const newEnd = calculateSingleEndpoint(
			lineCard.line_end_attached_card_id,
			rawEndX,
			rawEndY,
			newStart.x - linePosX,
			newStart.y - linePosY,
			linePosX,
			linePosY,
			allCards,
			dragPositions,
			endTangent // Use outward tangent (not inverted)
		);

		// Check convergence
		const startDelta = Math.sqrt(
			Math.pow(newStart.x - currentStart.x, 2) +
			Math.pow(newStart.y - currentStart.y, 2)
		);
		const endDelta = Math.sqrt(
			Math.pow(newEnd.x - currentEnd.x, 2) +
			Math.pow(newEnd.y - currentEnd.y, 2)
		);

		currentStart = newStart;
		currentEnd = newEnd;

		if (startDelta < CONVERGENCE_THRESHOLD && endDelta < CONVERGENCE_THRESHOLD) {
			break; // Converged!
		}
	}

	return {
		start: currentStart,
		end: currentEnd
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
	dragPositions: Map<string, { x: number; y: number }>,
	tangentDirection: { x: number; y: number } | null,
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

	let targetX: number;
	let targetY: number;

	if (tangentDirection) {
		targetX = centerX -tangentDirection.x * 1000;
		targetY = centerY - tangentDirection.y * 1000;
	} else {
		targetX = linePosX + otherEndpointX;
		targetY = linePosY + otherEndpointY;
	}

	const intersection = getRayRectangleIntersection(
		{ x: cardPosX, y: cardPosY, width: cardWidth, height: cardHeight },
		{ x: centerX, y: centerY },
		{ x: targetX, y: targetY },
	);

	return {
		x: intersection.x,
		y: intersection.y,
	};
}

/**
 * Calculate dynamic handle length for smooth card connections (Milanote-style)
 *
 * The handle length varies based on:
 * - Distance between endpoints
 * - Angle between line and card edge
 * - Whether the endpoint is attached to a card
 *
 * This creates smoother connections that look more natural.
 */
function calculateDynamicHandleLength(
	endpoint: Point,
	otherEndpoint: Point,
	controlPoint: Point,
	attachedCardId: string | null,
	allCards: Map<string, Card | CardData>,
	dragPositions: Map<string, { x: number; y: number }>
): number {
	// Base distance: 1/3 of line length
	const dx = otherEndpoint.x - endpoint.x;
	const dy = otherEndpoint.y - endpoint.y;
	const lineLength = Math.sqrt(dx * dx + dy * dy);
	const baseDistance = lineLength / 3;

	// If not attached, use base distance
	if (!attachedCardId) {
		return baseDistance;
	}

	// Get attached card geometry
	const attachedCard = allCards.get(attachedCardId);
	if (!attachedCard || attachedCard.card_type === 'line') {
		return baseDistance;
	}

	// Get card position and dimensions
	const cardDragPos = dragPositions.get(attachedCardId);
	let cardPosX: number;
	let cardPosY: number;

	if (cardDragPos) {
		cardPosX = cardDragPos.x;
		cardPosY = cardDragPos.y;
	} else {
		const screenPos = getCardScreenPosition(attachedCard, allCards, dragPositions);
		if (!screenPos) {
			return baseDistance;
		}
		cardPosX = screenPos.x;
		cardPosY = screenPos.y;
	}

	const cardWidth = attachedCard.width;
	const cardHeight = attachedCard.height || 150;
	const centerX = cardPosX + cardWidth / 2;
	const centerY = cardPosY + cardHeight / 2;

	// Calculate angle between line direction and direction to card center
	const toOtherX = otherEndpoint.x - endpoint.x;
	const toOtherY = otherEndpoint.y - endpoint.y;
	const toCenterX = centerX - endpoint.x;
	const toCenterY = centerY - endpoint.y;

	const toOtherAngle = Math.atan2(toOtherY, toOtherX);
	const toCenterAngle = Math.atan2(toCenterY, toCenterX);
	let angleDiff = Math.abs(toOtherAngle - toCenterAngle);
	if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

	// Scale handle length based on angle
	// When the line points away from card center (sharp angle), use shorter handles
	// When the line aligns with card center (straight), use longer handles
	const angleScale = 0.5 + 0.5 * Math.cos(angleDiff); // Range: [0.5, 1.0]

	// Also scale based on distance to card center
	// Closer cards need shorter handles to avoid overshooting
	const distToCenter = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
	const maxCardDimension = Math.max(cardWidth, cardHeight);
	const distanceScale = Math.min(1.0, distToCenter / (maxCardDimension * 2));

	// Combine scales
	const dynamicDistance = baseDistance * angleScale * distanceScale;

	// Clamp to reasonable range
	return Math.max(20, Math.min(dynamicDistance, lineLength * 0.4));
}

/**
 * Adjust control point to be at specified distance from endpoint
 */
function adjustControlPointDistance(
	endpoint: Point,
	controlPoint: Point,
	desiredDistance: number
): Point {
	const dx = controlPoint.x - endpoint.x;
	const dy = controlPoint.y - endpoint.y;
	const currentDist = Math.sqrt(dx * dx + dy * dy);

	if (currentDist === 0) {
		return controlPoint;
	}

	const scale = desiredDistance / currentDist;

	return {
		x: endpoint.x + dx * scale,
		y: endpoint.y + dy * scale
	};
}