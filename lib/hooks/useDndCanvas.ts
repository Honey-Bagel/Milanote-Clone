/**
 * useDndCanvas.ts
 *
 * Custom hook that encapsulates all dnd-kit logic for canvas drag and drop.
 * Handles:
 * - Sensor configuration
 * - Drag event handlers (start, move, end)
 * - Multi-select drag support
 * - Canvas coordinate transformation
 * - Column overlap detection
 * - Position persistence
 */

import { useCallback, useState } from 'react';
import { useSensors, useSensor, PointerSensor, MouseSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragMoveEvent, DragEndEvent } from '@dnd-kit/core';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { findOverlappingColumns } from '@/lib/utils/collision-detection';
import { CardService } from '@/lib/services/card-service';
import { bringCardsToFrontOnInteraction } from '@/lib/utils/order-key-manager';
import type { CardData } from '@/lib/types';
import { GRID_SIZE } from '../constants/defaults';

interface UseDndCanvasOptions {
	boardId: string | null;
	allCardsMap: Map<string, CardData>;
	viewport: { x: number; y: number; zoom: number };
}

interface UseDndCanvasReturn {
	// Sensors for DndContext
	sensors: ReturnType<typeof useSensors>;

	// Event handlers
	handleDragStart: (event: DragStartEvent) => void;
	handleDragMove: (event: DragMoveEvent) => void;
	handleDragEnd: (event: DragEndEvent) => Promise<void>;

	// Collision detection
	customCollisionDetection: (args: any) => any[];

	// Modifiers
	modifiers: Array<(args: any) => any>;

	// Active drag state
	activeId: string | null;
	activeDragCard: CardData | null;
	activeDragType: 'canvas-card' | 'column-card' | null;
}

export function useDndCanvas({
	boardId,
	allCardsMap,
	viewport,
}: UseDndCanvasOptions): UseDndCanvasReturn {

	const {
		selectedCardIds,
		setDragPositions,
		clearDragPositions,
		snapToGrid,
	} = useCanvasStore();

	// ============================================================================
	// STATE
	// ============================================================================

	const [activeId, setActiveId] = useState<string | null>(null);
	const [activeDragType, setActiveDragType] = useState<'canvas-card' | 'column-card' | null>(null);

	// ============================================================================
	// SENSORS
	// ============================================================================

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 3, // 3px drag threshold
			},
		}),
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 3,
			}
		})
	);

	// ============================================================================
	// CANVAS COORDINATE MODIFIER
	// ============================================================================

	const createCanvasCoordinateModifier = useCallback(() => {
		return ({ transform }: { transform: { x: number; y: number } }) => ({
			...transform,
			x: transform.x / viewport.zoom,
			y: transform.y / viewport.zoom,
		});
	}, [viewport.zoom]);

	const createSnapToGridModifier = useCallback(() => {
		return ({ transform }: { transform: { x: number; y: number } }) => ({
			...transform,
			x: snapToGrid ? Math.ceil(transform.x / GRID_SIZE) * GRID_SIZE : transform.x,
			y: snapToGrid ? Math.ceil(transform.y / GRID_SIZE) * GRID_SIZE : transform.y,
		});
	}, [snapToGrid]);

	const modifiers = [createCanvasCoordinateModifier(), createSnapToGridModifier()];

	// ============================================================================
	// COLLISION DETECTION
	// ============================================================================

	const customCollisionDetection = useCallback((args: any) => {
		const { active } = args;

		// For canvas cards, detect column overlaps
		if (active?.data?.current?.type === 'canvas-card') {
			const overlappingColumns = findOverlappingColumns(active.id as string, allCardsMap);
			if (overlappingColumns.length > 0) {
				return [{ id: overlappingColumns[0].id }];
			}
		}

		return [];
	}, [allCardsMap]);

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================

	const handleDragStart = useCallback((event: DragStartEvent) => {
		const { active } = event;
		const dragData = active.data.current;

		console.log("Dragging started");

		setActiveId(active.id as string);
		setActiveDragType(dragData?.type || 'canvas-card');

		// Bring dragged cards to front
		const cardsToBringToFront = selectedCardIds.has(active.id as string)
			? Array.from(selectedCardIds)
			: [active.id as string];

		if (boardId) {
			bringCardsToFrontOnInteraction(cardsToBringToFront, allCardsMap);
		}

		// Initialize drag positions for selected cards
		const positions = new Map<string, { x: number; y: number }>();

		if (selectedCardIds.has(active.id as string)) {
			// Multi-select drag
			selectedCardIds.forEach((cardId) => {
				const card = allCardsMap.get(cardId);
				if (card) {
					positions.set(cardId, { x: card.position_x, y: card.position_y });
				}
			});
		} else {
			// Single card drag
			const card = allCardsMap.get(active.id as string);
			if (card) {
				positions.set(card.id, { x: card.position_x, y: card.position_y });
			}
		}

		setDragPositions(positions);
	}, [selectedCardIds, allCardsMap, boardId, setDragPositions]);

	const handleDragMove = useCallback((event: DragMoveEvent) => {
		const { active, delta } = event;

		// Convert screen delta to canvas delta
		const canvasDelta = {
			x: delta.x / viewport.zoom,
			y: delta.y / viewport.zoom,
		};

		// Determine which cards are being dragged
		const cardsToDrag = selectedCardIds.has(active.id as string)
			? Array.from(selectedCardIds)
			: [active.id as string];

		// Update drag positions for all dragging cards
		const newPositions = new Map<string, { x: number; y: number }>();
		cardsToDrag.forEach((cardId) => {
			const card = allCardsMap.get(cardId);
			if (card) {
				newPositions.set(cardId, {
					x: card.position_x + canvasDelta.x,
					y: card.position_y + canvasDelta.y,
				});
			}
		});

		setDragPositions(newPositions);
	}, [viewport.zoom, selectedCardIds, allCardsMap, setDragPositions]);

	const handleDragEnd = useCallback(async (event: DragEndEvent) => {
		const { active, delta } = event;
		const dragData = active.data.current;

		// Convert screen delta to canvas delta
		const canvasDelta = {
			x: delta.x / viewport.zoom,
			y: delta.y / viewport.zoom,
		};

		// Determine which cards are being dragged
		const draggedCardIds = selectedCardIds.has(active.id as string)
			? Array.from(selectedCardIds)
			: [active.id as string];

		const draggedCard = allCardsMap.get(active.id as string);

		// ========================================================================
		// SCENARIO 1: Dragging onto a column
		// ========================================================================
		if (draggedCard && draggedCardIds.length === 1) {
			const overlappingColumns = findOverlappingColumns(active.id as string, allCardsMap);

			if (overlappingColumns.length > 0) {
				const targetColumn = overlappingColumns[0];

				// TODO: Add card to column
				console.log('Drop onto column:', targetColumn.id);

				clearDragPositions();
				setActiveId(null);
				setActiveDragType(null);
				return;
			}
		}

		// ========================================================================
		// SCENARIO 2: Canvas → Canvas (free positioning)
		// ========================================================================
		if (dragData?.type === 'canvas-card') {
			for (const cardId of draggedCardIds) {
				const card = allCardsMap.get(cardId);
				if (card && boardId) {
					const newX = card.position_x + canvasDelta.x;
					const newY = card.position_y + canvasDelta.y;

					await CardService.updateCardTransform({
						cardId: card.id,
						boardId: boardId,
						transform: {
							position_x: newX,
							position_y: newY,
						},
						withUndo: true,
						previousTransform: {
							position_x: card.position_x,
							position_y: card.position_y,
						},
					});
				}
			}
		}

		// ========================================================================
		// SCENARIO 3: Column → Canvas
		// ========================================================================
		if (dragData?.type === 'column-card' && draggedCard && boardId) {
			const newX = draggedCard.position_x + canvasDelta.x;
			const newY = draggedCard.position_y + canvasDelta.y;

			// TODO: Remove from column
			console.log('Removed from column:', dragData.columnId);

			await CardService.updateCardTransform({
				cardId: draggedCard.id,
				boardId: boardId,
				transform: {
					position_x: newX,
					position_y: newY,
				},
				withUndo: true,
				previousTransform: {
					position_x: draggedCard.position_x,
					position_y: draggedCard.position_y,
				},
			});
		}

		// Clear drag state
		clearDragPositions();
		setActiveId(null);
		setActiveDragType(null);
	}, [
		viewport.zoom,
		selectedCardIds,
		allCardsMap,
		boardId,
		snapToGrid,
		clearDragPositions,
	]);

	// ============================================================================
	// RETURN
	// ============================================================================

	const activeDragCard = activeId ? allCardsMap.get(activeId) || null : null;

	return {
		sensors,
		handleDragStart,
		handleDragMove,
		handleDragEnd,
		customCollisionDetection,
		modifiers,
		activeId,
		activeDragCard,
		activeDragType,
	};
}