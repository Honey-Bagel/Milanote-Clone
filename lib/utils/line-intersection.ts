/**
 * Line intersection utilities for Milanote-style line endpoints
 *
 * This module provides pure geometric intersection calculations for line endpoints
 * that attach to card edges. The key behavior is that attached endpoints always
 * render at the edge of the card using a ray-rectangle intersection from the card's
 * center toward the other endpoint.
 *
 * CRITICAL MILANOTE BEHAVIORS:
 * - Ray always originates from card CENTER
 * - Ray always points toward OTHER endpoint position
 * - Returns FIRST intersection point (continuous sliding along edges)
 * - NO discrete side selection or quadrant logic
 * - Endpoint attachment slides continuously along card edges as cards move
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate ray-rectangle intersection for Milanote-style line endpoints
 *
 * Given a card's bounding box and center, plus another endpoint's position,
 * this function calculates where a ray from the card center toward the other
 * endpoint intersects the card's edge.
 *
 * ALGORITHM:
 * 1. Cast a ray from cardCenter toward otherEndpoint
 * 2. Test intersection with all 4 rectangle edges using parametric equations
 * 3. Return the closest intersection point (smallest t > 0)
 *
 * EDGE CASES:
 * - If both endpoints are at the same position (zero-length ray), returns card center
 * - If no intersection found, returns card center as fallback
 *
 * @param rect - Card bounding box
 * @param cardCenter - Center of the card (ray origin)
 * @param otherEndpoint - Position of the OTHER line endpoint (ray direction target)
 * @returns Intersection point where ray crosses card edge
 */
export function getRayRectangleIntersection(
  rect: Rectangle,
  cardCenter: Point,
  otherEndpoint: Point
): Point {
  // Direction vector from card center to other endpoint
  const dx = otherEndpoint.x - cardCenter.x;
  const dy = otherEndpoint.y - cardCenter.y;

  // Guard: Degenerate case where both endpoints at same position
  if (dx === 0 && dy === 0) {
    // Zero-length ray: return card center as safe fallback
    return { x: cardCenter.x, y: cardCenter.y };
  }

  // Parametric ray: P(t) = cardCenter + t * (otherEndpoint - cardCenter)
  // For t ∈ [0, ∞): t=0 is cardCenter, t=1 is otherEndpoint

  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  const intersections: Array<{ t: number; x: number; y: number }> = [];

  // Test intersection with top edge: y = top
  if (dy !== 0) {
    const t = (top - cardCenter.y) / dy;
    const x = cardCenter.x + t * dx;
    if (t > 0 && x >= left && x <= right) {
      intersections.push({ t, x, y: top });
    }
  }

  // Test intersection with right edge: x = right
  if (dx !== 0) {
    const t = (right - cardCenter.x) / dx;
    const y = cardCenter.y + t * dy;
    if (t > 0 && y >= top && y <= bottom) {
      intersections.push({ t, x: right, y });
    }
  }

  // Test intersection with bottom edge: y = bottom
  if (dy !== 0) {
    const t = (bottom - cardCenter.y) / dy;
    const x = cardCenter.x + t * dx;
    if (t > 0 && x >= left && x <= right) {
      intersections.push({ t, x, y: bottom });
    }
  }

  // Test intersection with left edge: x = left
  if (dx !== 0) {
    const t = (left - cardCenter.x) / dx;
    const y = cardCenter.y + t * dy;
    if (t > 0 && y >= top && y <= bottom) {
      intersections.push({ t, x: left, y });
    }
  }

  // Return closest intersection (smallest t > 0)
  if (intersections.length === 0) {
    // Fallback: This shouldn't happen unless card center is outside bounds
    // or ray points away from rectangle
    console.warn('No intersection found - using card center as fallback');
    return { x: cardCenter.x, y: cardCenter.y };
  }

  // Sort by t (distance from origin) and take first
  intersections.sort((a, b) => a.t - b.t);
  const closest = intersections[0];

  return { x: closest.x, y: closest.y };
}
