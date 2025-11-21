/**
 * Connection Path Utilities
 *
 * Blueprint-style bezier curve calculations for connection lines.
 * Inspired by Unreal Engine Blueprint node connections.
 */

import type { ConnectionSide, Connection } from '@/lib/types';
import type { Card } from '@/lib/types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Get the connection point position on a card edge
 */
export function getAnchorPosition(
  card: Card,
  side: ConnectionSide,
  offset: number = 0.5
): Point {
  const x = card.position_x;
  const y = card.position_y;
  const width = card.width;
  const height = card.height || 150;

  switch (side) {
    case 'top':
      return { x: x + width * offset, y: y };
    case 'right':
      return { x: x + width, y: y + height * offset };
    case 'bottom':
      return { x: x + width * offset, y: y + height };
    case 'left':
      return { x: x, y: y + height * offset };
  }
}

/**
 * Get the direction vector for a connection side
 */
function getSideDirection(side: ConnectionSide): Point {
  switch (side) {
    case 'top':
      return { x: 0, y: -1 };
    case 'right':
      return { x: 1, y: 0 };
    case 'bottom':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
  }
}

/**
 * Calculate control point for bezier curve
 * Control points extend perpendicular to the connection point
 */
function getControlPoint(
  point: Point,
  side: ConnectionSide,
  distance: number
): Point {
  const dir = getSideDirection(side);
  return {
    x: point.x + dir.x * distance,
    y: point.y + dir.y * distance,
  };
}

/**
 * Calculate the curvature distance based on the distance between points
 * and the curvature setting
 */
function calculateCurvatureDistance(
  from: Point,
  to: Point,
  curvature: number
): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Minimum curvature distance for visible curves
  const minDistance = 50;
  // Scale with distance but cap it
  const scaledDistance = Math.min(distance * 0.4, 200);

  return minDistance + (scaledDistance - minDistance) * curvature;
}

/**
 * Generate SVG path data for a connection
 * Supports straight lines and Blueprint-style bezier curves
 */
export function generateConnectionPath(
  from: Point,
  fromSide: ConnectionSide,
  to: Point,
  toSide: ConnectionSide,
  curvature: number = 0.5
): string {
  // Straight line when curvature is 0
  if (curvature === 0) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  const curveDistance = calculateCurvatureDistance(from, to, curvature);

  const cp1 = getControlPoint(from, fromSide, curveDistance);
  const cp2 = getControlPoint(to, toSide, curveDistance);

  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
}

/**
 * Generate path for a connection between two cards
 */
export function generateCardConnectionPath(
  connection: Connection,
  cards: Map<string, Card>
): string | null {
  const fromCard = cards.get(connection.fromAnchor.cardId);
  const toCard = cards.get(connection.toAnchor.cardId);

  if (!fromCard || !toCard) return null;

  const fromPoint = getAnchorPosition(
    fromCard,
    connection.fromAnchor.side,
    connection.fromAnchor.offset
  );
  const toPoint = getAnchorPosition(
    toCard,
    connection.toAnchor.side,
    connection.toAnchor.offset
  );

  return generateConnectionPath(
    fromPoint,
    connection.fromAnchor.side,
    toPoint,
    connection.toAnchor.side,
    connection.curvature
  );
}

/**
 * Determine the best side to connect from based on relative positions
 */
export function getAutoSide(
  fromCard: Card,
  toCard: Card
): { fromSide: ConnectionSide; toSide: ConnectionSide } {
  const fromCenterX = fromCard.position_x + fromCard.width / 2;
  const fromCenterY = fromCard.position_y + (fromCard.height || 150) / 2;
  const toCenterX = toCard.position_x + toCard.width / 2;
  const toCenterY = toCard.position_y + (toCard.height || 150) / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  // Determine primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection
    if (dx > 0) {
      return { fromSide: 'right', toSide: 'left' };
    } else {
      return { fromSide: 'left', toSide: 'right' };
    }
  } else {
    // Vertical connection
    if (dy > 0) {
      return { fromSide: 'bottom', toSide: 'top' };
    } else {
      return { fromSide: 'top', toSide: 'bottom' };
    }
  }
}
