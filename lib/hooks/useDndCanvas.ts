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
import type { CardData } from '@/lib/types';
import { GRID_SIZE } from '../constants/defaults';
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { closestCenter, KeyboardSensor } from '@dnd-kit/core';

interface UseDndCanvasOptions {
	boardId: string | null;
	allCardsMap: Map<string, CardData>;
	viewport: { x: number; y: number; zoom: number };
	selectCard: (id: string, multi?: boolean) => void;
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
	selectCard,
}: UseDndCanvasOptions): UseDndCanvasReturn {

	const {
		selectedCardIds,
		setDragPositions,
		clearDragPositions,
		snapToGrid,
		setPotentialColumnTarget,
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
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
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
		const { active, collisionRect } = args;
		const dragType = active?.data?.current?.type;

		// Canvas cards: check column overlap using the current drag position
		if (dragType === 'canvas-card') {
			// use CollisionRect (current position) instead of stored position
			const draggedCardRect = collisionRect;

			if (!draggedCardRect) return [];

			// Find columsn and check overlap with current drag position
			const columns = Array.from(allCardsMap.values()).filter(
				(card) => card.card_type === 'column'
			);

			const overlapping = columns.filter((column) => {
				const columnRect = {
					left: column.position_x,
					top: column.position_y,
					right: column.position_x + column.width,
					bottom: column.position_y + (column.height || 400),
				};

				const dragRect = {
					left: draggedCardRect.left,
					top: draggedCardRect.top,
					right: draggedCardRect.right,
					bottom: draggedCardRect.bottom,
				};

				// Check if rectangles overlap
				return !(
					dragRect.right < columnRect.left ||
					dragRect.left > columnRect.right ||
					dragRect.bottom < columnRect.top ||
					dragRect.top > columnRect.bottom
				);
			});

			if (overlapping.length > 0) {
				// Return the topmost column (highest order_key)
				const sorted = overlapping.sort((a, b) =>
					a.order_key > b.order_key ? -1 : 1
				);
				return [{ id: sorted[0].id }];
			}
		}

		// Column cards: use dnd-kit's closestCenter for sortable precision
		if (dragType === 'column-card') {
			return closestCenter(args);
		}

		return [];
	}, [allCardsMap]);

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================

	const handleDragStart = useCallback((event: DragStartEvent) => {
		const { active } = event;
		const dragData = active.data.current;
		const dragType = dragData?.type;

		console.log("Dragging started");

		setActiveId(active.id as string);
		setActiveDragType(dragType || 'canvas-card');

		// ========================================================================
  		// CANVAS CARD LOGIC
  		// ========================================================================
		if (dragType === 'canvas-card') {
			// Determine which cards to drag BEFORE state changes
			const isAlreadySelected = selectedCardIds.has(active.id as string);
			const cardsToDrag = isAlreadySelected
				? Array.from(selectedCardIds)
				: [active.id as string];

			// Auto-select the dragged card if not already selected
			if (!isAlreadySelected) {
				selectCard(active.id as string, false); // false = single select (clears others)
			}

			// Bring dragged cards to front (immediately persist to database for instant visual feedback)
			if (boardId) {
				const allCardsArray = Array.from(allCardsMap.values());
				CardService.bringCardsToFront(cardsToDrag, boardId, allCardsArray);
			}

			// Initialize drag positions for all cards being dragged
			const positions = new Map<string, { x: number; y: number }>();

			cardsToDrag.forEach((cardId) => {
				const card = allCardsMap.get(cardId);
				if (card) {
					positions.set(cardId, { x: card.position_x, y: card.position_y });
				}
			});

			setDragPositions(positions);
		}

		// ========================================================================
 		// COLUMN CARD LOGIC (ADD THIS ENTIRE SECTION)
  		// ========================================================================
		if (dragType === 'column-card') {
			const sourceColumnId = dragData?.columnId;
			const draggedCard = allCardsMap.get(active.id as string);

			if (!draggedCard || !sourceColumnId) return;

			// Initialize position based on column's position
			const sourceColumn = allCardsMap.get(sourceColumnId);
			if (sourceColumn) {
				const positions = new Map<string, { x: number, y: number }>();
				positions.set(active.id as string, {
					x: sourceColumn.position_x,
					y: sourceColumn.position_y,
				});
				setDragPositions(positions);
			}

			// Select the card
			selectCard(active.id as string, false);
		}

	}, [selectedCardIds, allCardsMap, boardId, setDragPositions, selectCard]);

	const handleDragMove = useCallback((event: DragMoveEvent) => {
		const { active, delta } = event;
		const dragType = active.data.current?.type;

		// Convert screen delta to canvas delta
		const canvasDelta = {
			x: (delta.x * viewport.zoom) / viewport.zoom,
			y: (delta.y * viewport.zoom) / viewport.zoom,
		};

		console.log(viewport.zoom, canvasDelta);

		// ========================================================================
  		// CANVAS CARD LOGIC
  		// ========================================================================

		if (dragType === 'canvas-card') {
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

			// Check for column overlap
			const overlappingColumns = findOverlappingColumns(active.id as string, allCardsMap);
			if (overlappingColumns.length > 0) {
				setPotentialColumnTarget(overlappingColumns[0].id);
			} else {
				setPotentialColumnTarget(null);
			}
		}

		// ========================================================================
 		// COLUMN CARD LOGIC
  		// ========================================================================
		if (dragType === 'column-card') {
			const dragData = active.data.current;
			const sourceColumnId = dragData?.columnId;
			const sourceColumn = allCardsMap.get(sourceColumnId);

			if (sourceColumn) {
				// Track position for potential canvas extraction
				const newPositions = new Map<string, { x: number; y: number }>();
				newPositions.set(active.id as string, {
					x: sourceColumn.position_x + canvasDelta.x,
					y: sourceColumn.position_y + canvasDelta.y,
				});
				setDragPositions(newPositions);

				// Check if dragging over a different column
				const overlappingColumns = findOverlappingColumns(active.id as string, allCardsMap);

				if (overlappingColumns.length === 0) {
					// Card is outside all columns - preparing for extraction
					setPotentialColumnTarget(null);
				} else {
					const targetColumn = overlappingColumns[0];
					if (targetColumn && targetColumn.id !== sourceColumnId) {
						// Hovering over different column
						setPotentialColumnTarget(targetColumn.id);
					} else {
						setPotentialColumnTarget(null);
					}
				}
			}
		}

	}, [viewport.zoom, selectedCardIds, allCardsMap, setDragPositions, setPotentialColumnTarget]);

	const handleDragEnd = useCallback(async (event: DragEndEvent) => {
		const { active, over, delta } = event;
		const dragData = active.data.current;
		const dragType = dragData?.type;

		console.log("Drag ended:", {
			dragType,
			activeId: active.id,
			overId: over?.id,
		});

		// Convert delta for canvas calculations
		const canvasDelta = {
			x: (delta.x * viewport.zoom)  / viewport.zoom,
			y: (delta.y * viewport.zoom) / viewport.zoom,
		};

		// ========================================================================
		// SCENARIO 1: CANVAS CARD → COLUMN
		// ========================================================================
		if (dragType === 'canvas-card') {
			const draggedCardIds = selectedCardIds.has(active.id as string)
			? Array.from(selectedCardIds)
			: [active.id as string];

			// Check for column overlap
			const overlappingColumns = findOverlappingColumns(active.id as string, allCardsMap);

			if (overlappingColumns.length > 0 && boardId) {
			const targetColumn = overlappingColumns[0];

			console.log(`Adding card(s) to column: ${targetColumn.id}`);

			// Add each card to the column
			for (const cardId of draggedCardIds) {
				await CardService.addCardToColumn({
				cardId,
				boardId,
				columnId: targetColumn.id,
				position: targetColumn.column_items?.length || 0, // Append to end
				});
			}

			clearDragPositions();
			setPotentialColumnTarget(null);
			setActiveId(null);
			setActiveDragType(null);
			return;
			}

			// No column overlap → Free canvas movement (existing logic)
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

			// Persist z-index
			if (boardId) {
			const allCardsArray = Array.from(allCardsMap.values());
			await CardService.bringCardsToFront(draggedCardIds, boardId, allCardsArray);
			}
		}

		// ========================================================================
		// SCENARIO 2: COLUMN CARD → CANVAS (Extract)
		// ========================================================================
		if (dragType === 'column-card') {
			const sourceColumnId = dragData?.columnId;
			const draggedCard = allCardsMap.get(active.id as string);

			if (!draggedCard || !sourceColumnId || !boardId) {
			clearDragPositions();
			setPotentialColumnTarget(null);
			setActiveId(null);
			setActiveDragType(null);
			return;
			}

			// Check if dropped over any column
			const overlappingColumns = findOverlappingColumns(active.id as string, allCardsMap);

			// No overlap → Extract to canvas
			if (overlappingColumns.length === 0) {
			const sourceColumn = allCardsMap.get(sourceColumnId);
			if (!sourceColumn) {
				clearDragPositions();
				setPotentialColumnTarget(null);
				setActiveId(null);
				setActiveDragType(null);
				return;
			}

			const newX = sourceColumn.position_x + canvasDelta.x;
			const newY = sourceColumn.position_y + canvasDelta.y;

			console.log(`Extracting card to canvas at (${newX}, ${newY})`);

			await CardService.extractCardFromColumn({
				cardId: active.id as string,
				boardId,
				columnId: sourceColumnId,
				position: { x: newX, y: newY },
			});

			// Bring to front
			const allCardsArray = Array.from(allCardsMap.values());
			await CardService.bringCardsToFront([active.id as string], boardId, allCardsArray);

			clearDragPositions();
			setPotentialColumnTarget(null);
			setActiveId(null);
			setActiveDragType(null);
			return;
			}

			// ======================================================================
			// SCENARIO 3: COLUMN CARD → DIFFERENT COLUMN (Transfer)
			// ======================================================================
			const targetColumn = overlappingColumns[0];
			if (targetColumn.id !== sourceColumnId) {
			console.log(`Transferring card from ${sourceColumnId} to ${targetColumn.id}`);

			const insertIndex = targetColumn.column_items?.length || 0;

			await CardService.transferCardBetweenColumns({
				cardId: active.id as string,
				boardId,
				fromColumnId: sourceColumnId,
				toColumnId: targetColumn.id,
				toIndex: insertIndex,
			});

			clearDragPositions();
			setPotentialColumnTarget(null);
			setActiveId(null);
			setActiveDragType(null);
			return;
			}

			// ======================================================================
			// SCENARIO 4: COLUMN CARD → SAME COLUMN (Reorder)
			// ======================================================================
			if (over && over.id !== active.id) {
			const sourceColumn = allCardsMap.get(sourceColumnId);
			if (!sourceColumn || sourceColumn.card_type !== 'column') {
				clearDragPositions();
				setPotentialColumnTarget(null);
				setActiveId(null);
				setActiveDragType(null);
				return;
			}

			const items = [...(sourceColumn.column_items || [])];

			const oldIndex = items.findIndex(item => item.card_id === active.id);
			const newIndex = items.findIndex(item => item.card_id === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				// Reorder array
				const [movedItem] = items.splice(oldIndex, 1);
				items.splice(newIndex, 0, movedItem);

				// Update positions
				const updatedItems = items.map((item, index) => ({
				...item,
				position: index,
				}));

				console.log(`Reordering within column ${sourceColumnId}`);

				await CardService.updateColumnItems(sourceColumnId, boardId, updatedItems);
			}
			}
		}

		// Clear drag state
		clearDragPositions();
		setPotentialColumnTarget(null);
		setActiveId(null);
		setActiveDragType(null);
		}, [
		viewport.zoom,
		selectedCardIds,
		allCardsMap,
		boardId,
		clearDragPositions,
		setPotentialColumnTarget,
		selectCard,
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