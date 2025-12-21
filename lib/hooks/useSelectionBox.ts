/**
 * useSelectionBox Hook
 * 
 * Handles drawing a selection box to select multiple cards
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { screenToCanvas, boxesIntersect, getNormalizedBox } from '@/lib/utils/transform';
import { getDefaultCardDimensions } from '../utils';
import { useBoardCards } from './cards';

interface UseSelectionBoxOptions {
	/**
	 * Whether selection box is enabled
	 * @default true
	 */
	enabled?: boolean;
}

export function useSelectionBox(
	canvasRef: RefObject<HTMLDivElement | null>,
	options: UseSelectionBoxOptions = {}
) {
	const { enabled = true } = options;

	const {
		viewport,
		boardId,
		setIsDrawingSelection,
		setSelectionBox,
		selectCards,
		clearSelection,
		isPanning,
		isDragging,
		editingCardId,
	} = useCanvasStore();
	const { cards: cardArray } = useBoardCards(boardId);

	const cards = useMemo(
		() => new Map(cardArray.map(c => [c.id, c])),
		[cardArray]
	);

	const isDrawingRef = useRef(false);
	const startPosRef = useRef({ x: 0, y: 0 });

	useEffect(() => {
		if (!enabled) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleMouseDown = (e: MouseEvent) => {
			// Only start selection box if:
			// - Left mouse button
			// - Not panning
			// - Not already dragging a card
			// - Not editing a card
			// - Clicking on the canvas itself (not a card)
			if (
				e.button !== 0 ||
				isPanning ||
				isDragging ||
				editingCardId ||
				e.currentTarget !== canvas
			) {
				return;
			}

			// Check if clicking on a card element
			const target = e.target as HTMLElement;
			const clickedCard = target.closest('[data-card="true"]');
			if (clickedCard) {
				return;
			}

			// Don't start selection box if modifier keys are held
			if (e.shiftKey || e.metaKey || e.ctrlKey) {
				return;
			}

			// Prevent text selection
			e.preventDefault();

			// Get canvas-relative position
			const rect = canvas.getBoundingClientRect();
			const screenX = e.clientX - rect.left;
			const screenY = e.clientY - rect.top;

			const canvasPos = screenToCanvas(e.clientX, e.clientY, viewport);
			startPosRef.current = canvasPos;
			isDrawingRef.current = true;
			setIsDrawingSelection(true);

			// Clear existing selection
			clearSelection();

			// Initialize selection box
			setSelectionBox({
				startX: canvasPos.x,
				startY: canvasPos.y,
				currentX: canvasPos.x,
				currentY: canvasPos.y,
			});
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isDrawingRef.current) return;

			// Prevent text selection while dragging
			e.preventDefault();

			const canvasPos = screenToCanvas(e.clientX, e.clientY, viewport);

			// Update selection box
			setSelectionBox({
				startX: startPosRef.current.x,
				startY: startPosRef.current.y,
				currentX: canvasPos.x,
				currentY: canvasPos.y,
			});

			// Calculate which cards intersect with selection box
			const selectionBounds = getNormalizedBox(
				startPosRef.current.x,
				startPosRef.current.y,
				canvasPos.x,
				canvasPos.y
			);

			const intersectingCardIds: string[] = [];

			cards.forEach((card, id) => {
				let cardBounds: { x: number; y: number; width: number; height: number };
				if (card.position_x === null || card.position_y === null) return;
				const rect = canvas.getBoundingClientRect();

				// Special handling for line cards - use their start/end points and control point
				if (card.card_type === 'line') {
					const lineData = card;
					const absStartX = card.position_x + lineData.line_start_x;
					const absStartY = card.position_y + lineData.line_start_y;
					const absEndX = card.position_x + lineData.line_end_x;
					const absEndY = card.position_y + lineData.line_end_y;

					// Calculate control point position for curved lines
					const dx = absEndX - absStartX;
					const dy = absEndY - absStartY;
					const distance = Math.sqrt(dx * dx + dy * dy);
					const midX = (absStartX + absEndX) / 2;
					const midY = (absStartY + absEndY) / 2;

					let controlX = midX;
					let controlY = midY;

					if (distance > 0 && lineData.line_control_point_offset) {
						const nx = -dy / distance;
						const ny = dx / distance;
						controlX = midX + nx * lineData.line_control_point_offset;
						controlY = midY + ny * lineData.line_control_point_offset;
					}

					// Include reroute nodes in bounds
					const rerouteNodes = lineData.line_reroute_nodes || [];
					const allX = [absStartX, absEndX, controlX, ...rerouteNodes.map((n: any) => n ? card.position_x + n.x : midX)];
					const allY = [absStartY, absEndY, controlY, ...rerouteNodes.map((n: any) => n ? card.position_y + n.y : midY)];

					const minX = Math.min(...allX);
					const minY = Math.min(...allY);
					const maxX = Math.max(...allX);
					const maxY = Math.max(...allY);

					cardBounds = {
						x: minX + rect.left,
						y: minY + rect.top,
						width: Math.max(maxX - minX, 10), // Minimum width for selection
						height: Math.max(maxY - minY, 10), // Minimum height for selection
					};
				} else {
					let cardHeight: number;

					const cardElement = document.querySelector(`[data-element-id="${id}"]`);
					if (cardElement) { // Get the actual div height of the card
						const screenHeight = cardElement.getBoundingClientRect().height;
						cardHeight = screenHeight / viewport.zoom;
					} else if (card.height) { // Get the height of the card from card state
						cardHeight = card.height;
					} else { // Fallback: Get default height or 200 (Should never happen)
						const defaults = getDefaultCardDimensions(card.card_type);
						cardHeight = defaults.defaultHeight || 200;
					}

					cardBounds = {
						x: card.position_x + rect.left,
						y: card.position_y + rect.top,
						width: card.width,
						height: cardHeight
					};
				}

				if (boxesIntersect(selectionBounds, cardBounds)) {
					intersectingCardIds.push(id);
				}
			});

			// Update selection
			selectCards(intersectingCardIds);
		};

		const handleMouseUp = () => {
			if (isDrawingRef.current) {
				isDrawingRef.current = false;
				setIsDrawingSelection(false);
				setSelectionBox(null);
			}
		};

		// Attach listeners to canvas for mousedown, document for move/up
		canvas.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			canvas.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [
		enabled,
		viewport,
		cards,
		isPanning,
		isDragging,
		editingCardId,
		setIsDrawingSelection,
		setSelectionBox,
		selectCards,
		clearSelection,
		canvasRef
	]);
}