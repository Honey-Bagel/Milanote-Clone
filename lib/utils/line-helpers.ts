/**
 * Line Helpers
 *
 * Utility functions for line card dragging and snapping.
 */

import type { Card, ConnectionSide } from '@/lib/types';
import { getAnchorPosition } from './connection-path';

const SNAP_DISTANCE = 20; // pixels

export interface SnapTarget {
  cardId: string;
  side: ConnectionSide;
  x: number;
  y: number;
  distance: number;
}

/**
 * Find the closest snap target (card edge) within snap distance
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

    const sides: ConnectionSide[] = ['top', 'right', 'bottom', 'left'];

    for (const side of sides) {
      const anchor = getAnchorPosition(card, side, 0.5);
      const dx = canvasX - anchor.x;
      const dy = canvasY - anchor.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < SNAP_DISTANCE && (!closest || distance < closest.distance)) {
        closest = { cardId, side, x: anchor.x, y: anchor.y, distance };
      }
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
