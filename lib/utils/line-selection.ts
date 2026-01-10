/**
 * Line Selection Utilities
 *
 * Provides accurate line-segment vs rectangle intersection testing for
 * selection box functionality with Bézier curves.
 */

import { type CurveControl, calculateLocalFrame, controlVectorToCubicBezier } from './bezier-curve';

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
 * Check if a line segment intersects with a rectangle, accounting for stroke width.
 *
 * @param p1 - First endpoint of line segment
 * @param p2 - Second endpoint of line segment
 * @param rect - Rectangle to test against
 * @param strokeWidth - Width of the line stroke (expands hit area)
 * @returns True if line segment intersects rectangle
 */
export function lineSegmentIntersectsRect(
	p1: Point,
	p2: Point,
	rect: Rectangle,
	strokeWidth: number
): boolean {
	const halfStroke = strokeWidth / 2;

	// Expand rectangle by half stroke width (conservative test)
	const expandedRect = {
		x: rect.x - halfStroke,
		y: rect.y - halfStroke,
		width: rect.width + strokeWidth,
		height: rect.height + strokeWidth
	};

	// Check if either endpoint is inside expanded rectangle
	if (pointInRect(p1, expandedRect) || pointInRect(p2, expandedRect)) {
		return true;
	}

	// Check intersection with all 4 edges using parametric line equations
	const edges = [
		// Top edge
		{
			p1: { x: expandedRect.x, y: expandedRect.y },
			p2: { x: expandedRect.x + expandedRect.width, y: expandedRect.y }
		},
		// Right edge
		{
			p1: { x: expandedRect.x + expandedRect.width, y: expandedRect.y },
			p2: { x: expandedRect.x + expandedRect.width, y: expandedRect.y + expandedRect.height }
		},
		// Bottom edge
		{
			p1: { x: expandedRect.x + expandedRect.width, y: expandedRect.y + expandedRect.height },
			p2: { x: expandedRect.x, y: expandedRect.y + expandedRect.height }
		},
		// Left edge
		{
			p1: { x: expandedRect.x, y: expandedRect.y + expandedRect.height },
			p2: { x: expandedRect.x, y: expandedRect.y }
		}
	];

	return edges.some(edge => segmentsIntersect(p1, p2, edge.p1, edge.p2));
}

/**
 * Check if a point is inside a rectangle.
 */
function pointInRect(p: Point, rect: Rectangle): boolean {
	return p.x >= rect.x && p.x <= rect.x + rect.width &&
				 p.y >= rect.y && p.y <= rect.y + rect.height;
}

/**
 * Check if two line segments intersect using parametric line equations.
 */
function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
	const det = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
	if (Math.abs(det) < 1e-10) return false; // Parallel lines

	const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / det;
	const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / det;

	return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Sample a cubic Bézier curve into an array of points.
 *
 * @param p0 - Start point
 * @param cp1 - First control point
 * @param cp2 - Second control point
 * @param p3 - End point
 * @param numSamples - Number of sample points (default: 15)
 * @returns Array of points along the curve
 */
export function sampleCubicBezier(
	p0: Point,
	cp1: Point,
	cp2: Point,
	p3: Point,
	numSamples: number = 15
): Point[] {
	const points: Point[] = [];

	for (let i = 0; i <= numSamples; i++) {
		const t = i / numSamples;
		const t2 = t * t;
		const t3 = t2 * t;
		const mt = 1 - t;
		const mt2 = mt * mt;
		const mt3 = mt2 * mt;

		// Cubic Bézier formula
		const x = mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p3.x;
		const y = mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p3.y;

		points.push({ x, y });
	}

	return points;
}

/**
 * Sample a Bézier curve with 2-DOF control system.
 *
 * @param start - Start point
 * @param end - End point
 * @param control - Curve control (curvature and directional bias)
 * @param numSamples - Number of sample points (default: 15)
 * @returns Array of points along the curve
 */
function sampleBezierWithControl(
	start: Point,
	end: Point,
	control: CurveControl,
	numSamples: number = 15
): Point[] {
	// If straight line (curvature near 0), just return endpoints
	if (Math.abs(control.curvature) < 0.001) {
		return [start, end];
	}

	// Calculate control points from curvature/bias
	const { cp1, cp2 } = controlVectorToCubicBezier(start, end, control);

	return sampleCubicBezier(start, cp1, cp2, end, numSamples);
}

/**
 * Check if a Bézier curve path intersects with a selection rectangle.
 *
 * Samples the curve into line segments and tests each against the rectangle.
 * Handles both simple curves (no reroute nodes) and complex multi-segment paths.
 *
 * @param start - Start point of the line
 * @param end - End point of the line
 * @param curveControl - Curve control for simple lines (curvature and bias)
 * @param rerouteNodes - Array of intermediate reroute nodes for complex routing
 * @param rect - Selection rectangle to test against
 * @param strokeWidth - Width of the line stroke
 * @returns True if any part of the curve intersects the rectangle
 */
export function bezierPathIntersectsRect(
	start: Point,
	end: Point,
	curveControl: CurveControl,
	rerouteNodes: Array<{ x: number; y: number }>,
	rect: Rectangle,
	strokeWidth: number
): boolean {
	if (rerouteNodes.length === 0) {
		// Simple case: single Bézier curve
		const samples = sampleBezierWithControl(start, end, curveControl);

		// Test each segment
		for (let i = 0; i < samples.length - 1; i++) {
			if (lineSegmentIntersectsRect(samples[i], samples[i + 1], rect, strokeWidth)) {
				return true;
			}
		}
	} else {
		// Complex case: multiple segments with reroute nodes
		// Each segment between reroute nodes is treated as a simple line
		// (reroute nodes create smooth curves using Catmull-Rom style interpolation)
		const allPoints = [start, ...rerouteNodes, end];

		for (let i = 0; i < allPoints.length - 1; i++) {
			// For simplicity, treat each segment as straight line
			// (The actual rendering uses smooth curves, but for selection this is sufficient)
			const segmentSamples = sampleStraightLine(allPoints[i], allPoints[i + 1], 5);

			for (let j = 0; j < segmentSamples.length - 1; j++) {
				if (lineSegmentIntersectsRect(segmentSamples[j], segmentSamples[j + 1], rect, strokeWidth)) {
					return true;
				}
			}
		}
	}

	return false;
}

/**
 * Sample a straight line into points (used for reroute node segments).
 */
function sampleStraightLine(p1: Point, p2: Point, numSamples: number = 5): Point[] {
	const points: Point[] = [];

	for (let i = 0; i <= numSamples; i++) {
		const t = i / numSamples;
		points.push({
			x: p1.x + (p2.x - p1.x) * t,
			y: p1.y + (p2.y - p1.y) * t
		});
	}

	return points;
}
