/**
 * Line Helpers
 *
 * Utility functions for line card dragging and snapping.
 */

import type { Card } from '@/lib/types';

const SNAP_DISTANCE = 30; // pixels - increased for better UX with card-based snapping

export interface SnapTarget {
  cardId: string;
  centerX: number;
  centerY: number;
  distance: number;
}

/**
 * Find the closest snap target (card center) within snap distance
 *
 * New behavior: Instead of snapping to specific sides, we snap to the card itself.
 * The line endpoint will be computed dynamically as the intersection of a ray
 * from the card's center toward the other endpoint with the card's edge.
 */
export function findSnapTarget(
  canvasX: number,
  canvasY: number,
  cards: Map<string, Card>,
  excludeCardId: string
): SnapTarget | null {
  let closest: SnapTarget | null = null;

  for (const [cardId, card] of cards) {
    // Don't snap to self or other line cards
    if (cardId === excludeCardId || card.card_type === 'line') continue;

    // Calculate card center
    const centerX = card.position_x + card.width / 2;
    const centerY = card.position_y + (card.height || 150) / 2;

    // Calculate distance from mouse to card center
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Also check if mouse is within card bounds (expanded by snap distance)
    const withinExpandedBounds =
      canvasX >= card.position_x - SNAP_DISTANCE &&
      canvasX <= card.position_x + card.width + SNAP_DISTANCE &&
      canvasY >= card.position_y - SNAP_DISTANCE &&
      canvasY <= card.position_y + (card.height || 150) + SNAP_DISTANCE;

    // Snap if within distance OR within expanded bounds
    if ((distance < SNAP_DISTANCE * 3 || withinExpandedBounds) && (!closest || distance < closest.distance)) {
      closest = { cardId, centerX, centerY, distance };
    }
  }

  return closest;
}

/**
 * Convert local SVG coordinates to canvas coordinates
 */
export function localToCanvasCoords(
  cardPosX: number,
  cardPosY: number,
  localX: number,
  localY: number
): { x: number; y: number } {
  return { x: cardPosX + localX, y: cardPosY + localY };
}

/**
 * Convert canvas coordinates to local SVG coordinates
 */
export function canvasToLocalCoords(
  cardPosX: number,
  cardPosY: number,
  canvasX: number,
  canvasY: number
): { x: number; y: number } {
  return { x: canvasX - cardPosX, y: canvasY - cardPosY };
}
