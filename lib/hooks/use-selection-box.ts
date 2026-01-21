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
import { bezierPathIntersectsRect } from '@/lib/utils/line-selection';
import type { LineCard } from '@/lib/types';
import { calculateLineEndpoints } from '../utils/line-endpoint-calculator';

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
		setInteractionMode,
		resetInteractionMode,
		setSelectionBox,
		selectCards,
		clearSelection,
		isPanning,
		isDragging,
		editingCardId,
		dragPositions
	} = useCanvasStore();
	const { cards: cardArray } = useBoardCards(boardId);

	const cards = useMemo(
		() => new Map(cardArray.map(c => [c.id, c])),
		[cardArray]
	);

	const isDrawingRef = useRef(false);
	const startPosRef = useRef({ x: 0, y: 0 });
	const isSpacePressed = useRef(false);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.code === 'Space') isSpacePressed.current = true;
		};
		const up = (e: KeyboardEvent) => {
			if (e.code === 'Space') isSpacePressed.current = false;
		};

		window.addEventListener('keydown', down);
		window.addEventListener('keyup', up);
		return () => {
			window.removeEventListener('keydown', down);
			window.removeEventListener('keyup', up);
		};
	}, []);

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
				e.currentTarget !== canvas ||
				isSpacePressed.current
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
			setInteractionMode({ mode: 'selecting', startPos: canvasPos });

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

				// Skip presentation nodes - they should never be selectable via selection box
				if (card.card_type === 'presentation_node') return;

				const rect = canvas.getBoundingClientRect();
				const ox = rect.left / viewport.zoom;
				const oy = rect.top / viewport.zoom;

				// Special handling for line cards - use accurate path intersection
				if (card.card_type === 'line') {
					const lineCard = card as unknown as LineCard;

					// Calculate accuratae endpoint positions
					const endpoints = calculateLineEndpoints(lineCard, cards, dragPositions);

					const adjustedStart = {
						x: endpoints.start.x + ox,
						y: endpoints.start.y + oy,
					};
					const adjustedEnd = {
						x: endpoints.end.x + ox,
						y: endpoints.end.y + oy,
					};

					// Get curve control (handle backward compatibility)
					let curveControl = { curvature: 0, directionalBias: 0 };
					if (lineCard.line_curvature !== undefined && lineCard.line_directional_bias !== undefined) {
						curveControl = {
							curvature: lineCard.line_curvature,
							directionalBias: lineCard.line_directional_bias
						};
					} else if (lineCard.line_control_point_offset !== undefined) {
						// Convert legacy offset to new format
						curveControl = {
							curvature: lineCard.line_control_point_offset * 2,
							directionalBias: 0
						};
					}

					// Get reroute nodes (convert to absolute coordinates)
					const lineDragPos = dragPositions.get(card.id);
					const linePosX = lineDragPos?.x ?? card.position_x;
					const linePosY = lineDragPos?.y ?? card.position_y;

					const rerouteNodes = (Array.isArray(lineCard.line_reroute_nodes) ? lineCard.line_reroute_nodes : [])
						.filter((n: any) => n != null)
						.map((n: any) => ({
							x: linePosX + (n.x ?? 0),
							y: linePosY + (n.y ?? 0)
						}));

					const intersects = bezierPathIntersectsRect(
						adjustedStart,
						adjustedEnd,
						curveControl,
						rerouteNodes,
						selectionBounds as { x: number; y: number; width: number; height: number },
						lineCard.line_stroke_width ?? 2
					);

					if (intersects) intersectingCardIds.push(id);

					return; // Skip the cardBounds assignment and intersection test below
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
						x: card.position_x + rect.left / viewport.zoom,
						y: card.position_y + rect.top / viewport.zoom,
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
				resetInteractionMode();
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
		setInteractionMode,
		resetInteractionMode,
		setSelectionBox,
		selectCards,
		clearSelection,
		canvasRef,
		dragPositions
	]);
}