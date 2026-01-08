/**
 * Drawing Card Component
 *
 * Displays saved drawings using perfect-freehand.
 * Double-click to enter drawing mode and edit.
 */

'use client';

import { useMemo } from 'react';
import { getStroke } from 'perfect-freehand';
import type { DrawingCard, DrawingStroke } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface DrawingCardComponentProps {
	card: DrawingCard;
	isEditing: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert stroke points to SVG path string
 */
function getSvgPathFromStroke(stroke: number[][]): string {
	if (!stroke.length) return '';

	const d = stroke.reduce(
		(acc, [x0, y0], i, arr) => {
			const [x1, y1] = arr[(i + 1) % arr.length];
			acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
			return acc;
		},
		['M', ...stroke[0], 'Q']
	);

	d.push('Z');
	return d.join(' ');
}

/**
 * Render a single drawing stroke
 */
function renderStroke(drawingStroke: DrawingStroke, index: number): JSX.Element {
	// Get the stroke outline from perfect-freehand
	const strokeOutline = getStroke(drawingStroke.points, {
		size: drawingStroke.size,
		thinning: 0.5,
		smoothing: 0.5,
		streamline: 0.5,
	});

	// Convert to SVG path
	const pathData = getSvgPathFromStroke(strokeOutline);

	return (
		<path
			key={index}
			d={pathData}
			fill={drawingStroke.color}
			strokeWidth={0}
		/>
	);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DrawingCardComponent({
	card: propCard,
	isEditing: propIsEditing,
}: DrawingCardComponentProps) {
	// Try to use context, fall back to props for backwards compatibility
	const context = useOptionalCardContext();

	// Use context values if available, otherwise use props
	const card = (context?.card as DrawingCard) ?? propCard;

	// Calculate bounds of all strokes to properly size the SVG
	const bounds = useMemo(() => {
		if (!card.drawing_strokes || card.drawing_strokes.length === 0) {
			return { minX: 0, minY: 0, maxX: card.width, maxY: card.height || 300 };
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		card.drawing_strokes.forEach((stroke) => {
			stroke.points.forEach(([x, y]) => {
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			});
		});

		// Add padding for stroke width
		const padding = 20;
		return {
			minX: minX - padding,
			minY: minY - padding,
			maxX: maxX + padding,
			maxY: maxY + padding,
		};
	}, [card.drawing_strokes, card.width, card.height]);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="drawing-card bg-transparent w-full h-full overflow-hidden">
			{card.drawing_strokes && card.drawing_strokes.length > 0 ? (
				<svg
					width="100%"
					height="100%"
					viewBox={`${bounds.minX} ${bounds.minY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`}
					preserveAspectRatio="xMidYMid meet"
					className="w-full h-full"
				>
					{card.drawing_strokes.map((stroke, index) => renderStroke(stroke, index))}
				</svg>
			) : (
				<div className="flex items-center justify-center h-full bg-gray-50 text-gray-400">
					<p className="text-sm">Empty drawing</p>
				</div>
			)}
		</div>
	);
}
