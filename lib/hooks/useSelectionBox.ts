/**
 * useSelectionBox Hook
 * 
 * Handles drawing a selection box to select multiple cards
 */

import { useEffect, useRef, type RefObject } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { screenToCanvas, boxesIntersect, getNormalizedBox } from '@/lib/utils/transform';

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
		cards,
		setIsDrawingSelection,
		setSelectionBox,
		selectCards,
		clearSelection,
		isPanning,
		isDragging,
		editingCardId,
	} = useCanvasStore();

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
				const cardBounds = {
					x: card.position_x,
					y: card.position_y,
					width: card.width,
					height: card.height || 150, // Use default height if not set
				};

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
	]);
}