/**
 * Transform Utilities
 * 
 * Helper functions for viewport transformations, coordinate conversions,
 * and matrix calculations matching Milanote's implementation.
 */

import type { Position, Viewport } from '@/lib/stores/canvas-store';

// ============================================================================
// VIEWPORT TRANSFORMS
// ============================================================================

/**
 * Create a CSS matrix3d transform string for the viewport
 * This matches Milanote's approach for better GPU acceleration
 */
export function createViewportMatrix(x: number, y: number, zoom: number): string {
  return `matrix3d(
    ${zoom}, 0, 0, 0,
    0, ${zoom}, 0, 0,
    0, 0, 1, 0,
    ${x}, ${y}, 0, 1
  )`;
}

/**
 * Alternative: Simple transform (less optimal but easier to read)
 */
export function createSimpleTransform(x: number, y: number, zoom: number): string {
  return `translate(${x}px, ${y}px) scale(${zoom})`;
}

// ============================================================================
// COORDINATE CONVERSIONS
// ============================================================================

/**
 * Convert screen coordinates to canvas coordinates
 * Takes viewport transform into account
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: Viewport
): Position {
  return {
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: Viewport
): Position {
  return {
    x: canvasX * viewport.zoom + viewport.x,
    y: canvasY * viewport.zoom + viewport.y,
  };
}

// ============================================================================
// BOUNDING BOX UTILITIES
// ============================================================================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number | null;
}

/**
 * Check if a point is inside a bounding box
 */
export function isPointInBox(
  point: Position,
  box: BoundingBox
): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

/**
 * Check if two bounding boxes intersect
 */
export function boxesIntersect(
  box1: BoundingBox,
  box2: BoundingBox
): boolean {
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
}

/**
 * Get normalized selection box (handles dragging in any direction)
 */
export function getNormalizedBox(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): BoundingBox {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  };
}

// ============================================================================
// ZOOM UTILITIES
// ============================================================================

/**
 * Calculate zoom level to fit all cards in viewport
 */
export function calculateZoomToFit(
  cards: Array<{ position: Position; size: { width: number; height: number } }>,
  viewportWidth: number,
  viewportHeight: number,
  padding = 100
): { zoom: number; x: number; y: number } {
  if (cards.length === 0) {
    return { zoom: 1, x: 0, y: 0 };
  }

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  cards.forEach((card) => {
    minX = Math.min(minX, card.position.x);
    minY = Math.min(minY, card.position.y);
    maxX = Math.max(maxX, card.position.x + card.size.width);
    maxY = Math.max(maxY, card.position.y + card.size.height);
  });

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Calculate zoom to fit with padding
  const zoom = Math.min(
    (viewportWidth - padding * 2) / contentWidth,
    (viewportHeight - padding * 2) / contentHeight,
    1 // Don't zoom in beyond 100%
  );

  // Center the content
  const x = (viewportWidth - contentWidth * zoom) / 2 - minX * zoom;
  const y = (viewportHeight - contentHeight * zoom) / 2 - minY * zoom;

  return { zoom, x, y };
}

/**
 * Zoom towards a specific point (usually mouse position)
 */
export function zoomToPoint(
  currentViewport: Viewport,
  zoomDelta: number,
  pointX: number,
  pointY: number,
  minZoom = 0.1,
  maxZoom = 3
): Viewport {
  const newZoom = Math.max(minZoom, Math.min(maxZoom, currentViewport.zoom * zoomDelta));
  const zoomRatio = newZoom / currentViewport.zoom;

  return {
    zoom: newZoom,
    x: pointX - (pointX - currentViewport.x) * zoomRatio,
    y: pointY - (pointY - currentViewport.y) * zoomRatio,
  };
}

// ============================================================================
// GRID UTILITIES
// ============================================================================

/**
 * Snap position to grid
 */
export function snapToGrid(position: Position, gridSize = 10): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * Calculate grid pattern for rendering
 */
export function calculateGridLines(
  viewport: Viewport,
  viewportWidth: number,
  viewportHeight: number,
  gridSize = 20
): { x: number[]; y: number[] } {
  const adjustedGridSize = gridSize * viewport.zoom;
  
  // Calculate visible canvas area
  const startX = -viewport.x / viewport.zoom;
  const startY = -viewport.y / viewport.zoom;
  const endX = startX + viewportWidth / viewport.zoom;
  const endY = startY + viewportHeight / viewport.zoom;

  // Calculate grid lines
  const xLines: number[] = [];
  const yLines: number[] = [];

  const firstX = Math.floor(startX / gridSize) * gridSize;
  const firstY = Math.floor(startY / gridSize) * gridSize;

  for (let x = firstX; x <= endX; x += gridSize) {
    xLines.push(x);
  }

  for (let y = firstY; y <= endY; y += gridSize) {
    yLines.push(y);
  }

  return { x: xLines, y: yLines };
}

// ============================================================================
// DISTANCE & ANGLE UTILITIES
// ============================================================================

/**
 * Calculate distance between two points
 */
export function distance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle between two points (in radians)
 */
export function angle(p1: Position, p2: Position): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Rotate a point around another point
 */
export function rotatePoint(
  point: Position,
  center: Position,
  angleRad: number
): Position {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

// ============================================================================
// ELEMENT BOUNDS UTILITIES
// ============================================================================

/**
 * Get element bounds in canvas coordinates
 */
export function getElementBounds(element: {
  position: Position;
  size: { width: number; height: number };
}): BoundingBox {
  return {
    x: element.position.x,
    y: element.position.y,
    width: element.size.width,
    height: element.size.height,
  };
}

/**
 * Get center point of an element
 */
export function getElementCenter(element: {
  position: Position;
  size: { width: number; height: number };
}): Position {
  return {
    x: element.position.x + element.size.width / 2,
    y: element.position.y + element.size.height / 2,
  };
}

/**
 * Get connection point on element edge
 */
export function getConnectionPoint(
  element: { position: Position; size: { width: number; height: number } },
  side: 'top' | 'right' | 'bottom' | 'left'
): Position {
  const { position, size } = element;
  
  switch (side) {
    case 'top':
      return { x: position.x + size.width / 2, y: position.y };
    case 'right':
      return { x: position.x + size.width, y: position.y + size.height / 2 };
    case 'bottom':
      return { x: position.x + size.width / 2, y: position.y + size.height };
    case 'left':
      return { x: position.x, y: position.y + size.height / 2 };
  }
}

// ============================================================================
// CLAMP UTILITIES
// ============================================================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp zoom level
 */
export function clampZoom(zoom: number, min = 0.1, max = 3): number {
  return clamp(zoom, min, max);
}