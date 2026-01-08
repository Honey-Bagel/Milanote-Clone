/**
 * Stroke Clustering Algorithm
 *
 * Groups drawing strokes that are nearby or touching into clusters.
 * Each cluster will become a separate drawing card.
 */

import type { DrawingStroke } from '@/lib/types';
import { Viewport } from '../stores/canvas-store';

// ============================================================================
// TYPES
// ============================================================================

export interface StrokeBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface StrokeCluster {
	strokes: DrawingStroke[];
	bounds: StrokeBounds;
	position: { x: number; y: number };
	width: number;
	height: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate bounding box for a single stroke
 */
export function getStrokeBounds(stroke: DrawingStroke): StrokeBounds {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	stroke.points.forEach(([x, y]) => {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	});

	// Add padding for stroke width
	const padding = stroke.size;
	return {
		minX: minX - padding,
		minY: minY - padding,
		maxX: maxX + padding,
		maxY: maxY + padding,
	};
}

/**
 * Check if two bounding boxes are close or intersecting
 * @param a First bounds
 * @param b Second bounds
 * @param threshold Distance threshold for "nearby" (in pixels)
 */
function boundsAreNearby(a: StrokeBounds, b: StrokeBounds, threshold: number = 50): boolean {
	// Check if bounds intersect
	const intersects = !(
		a.maxX < b.minX ||
		a.minX > b.maxX ||
		a.maxY < b.minY ||
		a.minY > b.maxY
	);

	if (intersects) return true;

	// Check if bounds are within threshold distance
	const horizontalDistance = Math.max(0, Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX));
	const verticalDistance = Math.max(0, Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY));
	const distance = Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);

	return distance <= threshold;
}

/**
 * Merge two bounding boxes
 */
function mergeBounds(a: StrokeBounds, b: StrokeBounds): StrokeBounds {
	return {
		minX: Math.min(a.minX, b.minX),
		minY: Math.min(a.minY, b.minY),
		maxX: Math.max(a.maxX, b.maxX),
		maxY: Math.max(a.maxY, b.maxY),
	};
}

// ============================================================================
// MAIN CLUSTERING ALGORITHM
// ============================================================================

/**
 * Cluster strokes using a union-find (disjoint set) algorithm
 *
 * This groups strokes that are touching or nearby into the same cluster.
 * Time complexity: O(n²) for comparing all pairs, O(n log n) for union-find operations
 *
 * @param strokes Array of drawing strokes
 * @param proximityThreshold Distance in pixels to consider strokes as "nearby"
 * @returns Array of stroke clusters
 */
export function clusterStrokes(
	strokes: DrawingStroke[],
	proximityThreshold: number = 50
): StrokeCluster[] {
	if (strokes.length === 0) return [];
	if (strokes.length === 1) {
		const bounds = getStrokeBounds(strokes[0]);
		return [{
			strokes: [strokes[0]],
			bounds,
			position: { x: bounds.minX, y: bounds.minY },
			width: bounds.maxX - bounds.minX,
			height: bounds.maxY - bounds.minY,
		}];
	}

	// Calculate bounds for each stroke
	const strokeBounds = strokes.map((stroke) => getStrokeBounds(stroke));

	// Union-Find data structure
	const parent = Array.from({ length: strokes.length }, (_, i) => i);

	function find(x: number): number {
		if (parent[x] !== x) {
			parent[x] = find(parent[x]); // Path compression
		}
		return parent[x];
	}

	function union(x: number, y: number): void {
		const rootX = find(x);
		const rootY = find(y);
		if (rootX !== rootY) {
			parent[rootY] = rootX;
		}
	}

	// Compare all pairs of strokes and union nearby ones
	for (let i = 0; i < strokes.length; i++) {
		for (let j = i + 1; j < strokes.length; j++) {
			if (boundsAreNearby(strokeBounds[i], strokeBounds[j], proximityThreshold)) {
				union(i, j);
			}
		}
	}

	// Group strokes by their root parent
	const clusters = new Map<number, number[]>();
	for (let i = 0; i < strokes.length; i++) {
		const root = find(i);
		if (!clusters.has(root)) {
			clusters.set(root, []);
		}
		clusters.get(root)!.push(i);
	}

	// Convert to StrokeCluster objects
	const result: StrokeCluster[] = [];

	clusters.forEach((strokeIndices) => {
		const clusterStrokes = strokeIndices.map((i) => strokes[i]);
		const clusterBounds = strokeIndices
			.map((i) => strokeBounds[i])
			.reduce((acc, bounds) => mergeBounds(acc, bounds));

		result.push({
			strokes: clusterStrokes,
			bounds: clusterBounds,
			position: { x: clusterBounds.minX, y: clusterBounds.minY },
			width: clusterBounds.maxX - clusterBounds.minX,
			height: clusterBounds.maxY - clusterBounds.minY,
		});
	});

	return result;
}

/**
 * Convert stroke points to be relative to a given position
 * This is useful when creating cards from clusters
 */
export function makeStrokesRelative(
	strokes: DrawingStroke[],
	offsetX: number,
	offsetY: number
): DrawingStroke[] {
	return strokes.map((stroke) => ({
		...stroke,
		points: stroke.points.map(([x, y, pressure]) => [x - offsetX, y - offsetY, pressure]),
	}));
}

/**
 * Convert stroke points from relative to absolute coordinates
 * This is useful when editing an existing drawing card
 */
export function makeStrokesAbsolute(
	strokes: DrawingStroke[],
	offsetX: number,
	offsetY: number
): DrawingStroke[] {
	return strokes.map((stroke) => ({
		...stroke,
		points: stroke.points.map(([x, y, pressure]) => [x + offsetX, y + offsetY, pressure]),
	}));
}

/**
 * Convert strokes from window view to offset viewport coords
 */
export function convertStrokesToViewport(
	strokes: DrawingStroke[],
	viewport: Viewport,
): DrawingStroke[] {
	return strokes.map((stroke) => {
		stroke.points = stroke.points.map((point) => {
			point[0] = (point[0] - viewport.x) / viewport.zoom;
			point[1] = (point[1] - viewport.y) / viewport.zoom;
			return point;
		})
		return stroke;
	});
}