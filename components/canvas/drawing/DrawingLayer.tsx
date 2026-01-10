/**
 * Drawing Layer Component
 *
 * Provides an interactive drawing surface over the canvas.
 * Captures pointer events to create strokes using perfect-freehand.
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import type { DrawingStroke } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';

// ============================================================================
// TYPES
// ============================================================================

export interface DrawingTool {
	type: 'pen' | 'eraser';
	color: string;
	size: number;
}

interface CurrentStroke {
	points: number[][];
	color: string;
	size: number;
}

interface DrawingLayerProps {
	onSave: (strokes: DrawingStroke[]) => void;
	onCancel: () => void;
	initialStrokes?: DrawingStroke[];
	editingCardId?: string;
	tool: DrawingTool;
	onStrokesChange?: (strokes: DrawingStroke[]) => void;
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

// ============================================================================
// COMPONENT
// ============================================================================

export function DrawingLayer({
	onSave,
	onCancel,
	initialStrokes = [],
	editingCardId,
	tool,
	onStrokesChange,
}: DrawingLayerProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [strokes, setStrokes] = useState<DrawingStroke[]>(initialStrokes);
	const [currentStroke, setCurrentStroke] = useState<CurrentStroke | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [hoveredStrokeIndex, setHoveredStrokeIndex] = useState<number | null>(null);

	const viewport = useCanvasStore((state) => state.viewport);

	// ========================================================================
	// COORDINATE CONVERSION
	// ========================================================================

	const screenToCanvas = useCallback(
		(clientX: number, clientY: number): [number, number] => {
			if (!svgRef.current) return [0, 0];

			const svg = svgRef.current;
			const rect = svg.getBoundingClientRect();

			const screenX = clientX - rect.left;
			const screenY = clientY - rect.top;

			// Convert screen coordinates to canvas coordinates
			const canvasX = (screenX - viewport.x) / viewport.zoom;
			const canvasY = (screenY - viewport.y) / viewport.zoom;

			return [canvasX, canvasY];
		},
		[viewport]
	);

	// ========================================================================
	// DRAWING HANDLERS
	// ========================================================================

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<SVGSVGElement>) => {
			e.preventDefault();
			e.stopPropagation();

			const [x, y] = screenToCanvas(e.clientX, e.clientY);

			setIsDrawing(true);
			setCurrentStroke({
				points: [[x, y, e.pressure || 0.5]],
				color: tool.color,
				size: tool.size,
			});

			// Capture pointer
			(e.target as SVGSVGElement).setPointerCapture(e.pointerId);
		},
		[screenToCanvas, tool]
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<SVGSVGElement>) => {
			if (!isDrawing || !currentStroke) return;

			e.preventDefault();

			const [x, y] = screenToCanvas(e.clientX, e.clientY);

			setCurrentStroke((prev) => {
				if (!prev) return null;
				return {
					...prev,
					points: [...prev.points, [x, y, e.pressure || 0.5]],
				};
			});
		},
		[isDrawing, currentStroke, screenToCanvas]
	);

	const handlePointerHover = useCallback(
		(e: React.PointerEvent<SVGSVGElement>) => {
			if (tool.type !== 'eraser' || isDrawing) {
				if (hoveredStrokeIndex !== null) {
					setHoveredStrokeIndex(null);
				}
				return;
			}

			const [x, y] = screenToCanvas(e.clientX, e.clientY);

			for (let i = strokes.length - 1; i >= 0; i--) {
				if (isPointInStroke([x, y], strokes[i])) {
					if (hoveredStrokeIndex !== i) {
						setHoveredStrokeIndex(i);
					}
					return;
				}
			}
			
			// No stroke hovered
			if (hoveredStrokeIndex !== null) {
				setHoveredStrokeIndex(null);
			}
		},
		[tool.type, isDrawing, screenToCanvas, strokes, hoveredStrokeIndex]
	);

	const handlePointerUp = useCallback(
		(e: React.PointerEvent<SVGSVGElement>) => {
			if (!currentStroke) return;

			e.preventDefault();

			// Finalize the stroke
			const finalizedStroke: DrawingStroke = {
				points: currentStroke.points,
				color: currentStroke.color,
				size: currentStroke.size,
				timestamp: Date.now(),
			};

			if (tool.type === 'eraser') {
				// Delete the hovered stroke on click
				if (hoveredStrokeIndex !== null) {
					setStrokes((prev) => {
						const newStrokes = prev.filter((_, index) => index !== hoveredStrokeIndex);
						return newStrokes;
					});
					setHoveredStrokeIndex(null);
				}
			} else {
				// Pen mode: add the stroke
				setStrokes((prev) => {
					const newStrokes = [...prev, finalizedStroke];
					return newStrokes;
				});
			}

			setCurrentStroke(null);
			setIsDrawing(false);

			// Release pointer capture
			(e.target as SVGSVGElement).releasePointerCapture(e.pointerId);
		},
		[currentStroke, tool.type, hoveredStrokeIndex]
	);

	// ========================================================================
	// KEYBOARD SHORTCUTS
	// ========================================================================

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Escape to cancel
			if (e.key === 'Escape') {
				e.preventDefault();
				onCancel();
			}

			// Ctrl/Cmd + Z to undo
			if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				setStrokes((prev) => prev.slice(0, -1));
			}

			// Ctrl/Cmd + S to save
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault();
				onSave(strokes);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onCancel, onSave, strokes]);

	useEffect(() => {
		onStrokesChange?.(strokes);
	}, [strokes, onStrokesChange]);

	// ========================================================================
	// RENDER STROKE
	// ========================================================================

	const renderStroke = useCallback((drawingStroke: DrawingStroke, index: number) => {
		const strokeOutline = getStroke(drawingStroke.points, {
			size: drawingStroke.size,
			thinning: 0.5,
			smoothing: 0.5,
			streamline: 0.5,
		});

		const pathData = getSvgPathFromStroke(strokeOutline);
		const isHovered = hoveredStrokeIndex === index;

		return (
			<g key={index}>
				{/* Highlight outline when hovered in eraser mode */}
				{isHovered && tool.type === 'eraser' && (
					<path
						d={pathData}
						fill="none"
						stroke="#ef4444"
						strokeWidth={2}
						opacity={0.8}
						pointerEvents="none"
					/>
				)}
				{/* Actual stroke */}
				<path
					d={pathData}
					fill={drawingStroke.color}
					strokeWidth={0}
					opacity={isHovered && tool.type === 'eraser' ? 0.5 : 1}
				/>
			</g>
		);
	}, [hoveredStrokeIndex, tool.type]);

	const renderCurrentStroke = useCallback(() => {
		if (!currentStroke || currentStroke.points.length < 2) return null;

		const strokeOutline = getStroke(currentStroke.points, {
			size: currentStroke.size,
			thinning: 0.5,
			smoothing: 0.5,
			streamline: 0.5,
		});

		const pathData = getSvgPathFromStroke(strokeOutline);

		return (
			<path
				d={pathData}
				fill={currentStroke.color}
				strokeWidth={0}
				opacity={0.7}
			/>
		);
	}, [currentStroke]);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div
			className="absolute inset-0 z-100 pointer-events-auto"
			style={{
				cursor: tool.type === 'pen' ? 'crosshair' : 'pointer',
			}}
		>
			<svg
				ref={svgRef}
				className="w-full h-full"
				onPointerDown={handlePointerDown}
				onPointerMove={(e) => {
					handlePointerMove(e);
					handlePointerHover(e);
				}}
				onPointerUp={handlePointerUp}
				onPointerLeave={handlePointerUp}
				style={{
					touchAction: 'none',
				}}
			>
				{/* Render saved strokes */}
				{strokes.map((stroke, index) => renderStroke(stroke, index))}

				{/* Render current stroke being drawn */}
				{renderCurrentStroke()}
			</svg>

			{/* Toolbar will be positioned here by parent */}
		</div>
	);
}

// ============================================================================
// HELPER FUNCTIONS FOR ERASER
// ============================================================================

interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

function getStrokeBounds(stroke: DrawingStroke): Bounds {
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

function boundsIntersect(a: Bounds, b: Bounds): boolean {
	return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
}

/**
 * Check if a point is within a stroke's rendered path
 */
function isPointInStroke(
	point: [number, number],
	stroke: DrawingStroke,
	threshold: number = 10
): boolean {
	const bounds = getStrokeBounds(stroke);
	if (
		point[0] < bounds.minX - threshold ||
		point[0] > bounds.maxX + threshold ||
		point[1] < bounds.minY - threshold ||
		point[1] > bounds.maxY + threshold
	) {
		return false;
	}

	// Check if point is near any point in the stroke
	return stroke.points.some(([x, y]) => {
		const distance = Math.sqrt(
			Math.pow(point[0] - x, 2) + Math.pow(point[1] - y, 2)
		);
		return distance <= stroke.size / 2 + threshold;
	})
}