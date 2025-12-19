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
import type { DragStartEvent, DragMoveEvent, DragEndEvent, DragOverEvent, Over } from '@dnd-kit/core';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { findOverlappingColumns } from '@/lib/utils/collision-detection';
import { CardService } from '@/lib/services/card-service';
import type { CardData } from '@/lib/types';
import { GRID_SIZE } from '../constants/defaults';
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
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
	handleDragOver: (event: DragOverEvent) => void;

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
		const snapPosition = (value: number) => {
			return snapToGrid ? Math.round(value / GRID_SIZE) * GRID_SIZE : value;
		};
		
		return ({ transform }: { transform: { x: number; y: number } }) => {
			return ({
				...transform,
				x: snapPosition(transform.x),
				y: snapPosition(transform.y),
			})
		};
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
	// MISC
	// ============================================================================

	const getColumnIdFromOver = useCallback((over: Over | null): string | null => {
		if (!over) return null;

		const meta = over.data?.current;

		// Case 1: Directly over column droppable
		if(meta?.type === 'column') {
			return meta.columnId || over.id as string;
		}

		// Case 2: Over a sortable item inside a column
		if (meta?.type === 'column-card') {
			return meta.columnId || meta.parentColumnId;
		}

		// Case 3: Fallback - check if over.id is a column
		const card = allCardsMap.get(over.id as string);
		if (card?.card_type === 'column') {
			return card.id;
		}

		return null;
	}, [allCardsMap]);

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================

	const handleDragStart = useCallback((event: DragStartEvent) => {
		const { active } = event;
		const dragData = active.data.current;
		const dragType = dragData?.type;


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
		const { active, delta, over } = event;
		const dragType = active.data.current?.type;

		// Convert screen delta to canvas delta
		const canvasDelta = {
			x: (delta.x * viewport.zoom) / viewport.zoom,
			y: (delta.y * viewport.zoom) / viewport.zoom,
		};


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

		console.log(over);

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

			const targetColumnId = getColumnIdFromOver(over);

			if (targetColumnId && boardId) {
				const targetColumn = allCardsMap.get(targetColumnId);

				if (targetColumn?.card_type === 'column') {
					const draggedCards = draggedCardIds
						.map(id => allCardsMap.get(id))
						.filter(card => card !== undefined);

					const isDraggingColumn = draggedCards.some(
						card => card.card_type === 'column'
					);

					if (!isDraggingColumn) {
						// Batch add all cards to column with optimistic update
						await CardService.addCardsToColumnBatch({
							cardIds: draggedCardIds,
							boardId,
							columnId: targetColumn.id,
							startPosition: targetColumn.column_items?.length || 0,
						});

						clearDragPositions();
						setPotentialColumnTarget(null);
						setActiveId(null);
						setActiveDragType(null);
						return;
					}
				}
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

			if (over && over.id !== active.id && over.data?.current?.columnId === sourceColumnId) {
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
					const reorderedItems = arrayMove(items, oldIndex, newIndex);

					// Update positions
					const updatedItems = reorderedItems.map((item, index) => ({
						...item,
						position: index,
					}));

					await CardService.updateColumnItems(sourceColumnId, boardId, updatedItems);
				}

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
		getColumnIdFromOver,
		]);

	const handleDragOver = useCallback((event: DragOverEvent) => {
		const { over } = event;

		console.log("over: ", over);

		return;
	}, [])

	// ============================================================================
	// RETURN
	// ============================================================================

	const activeDragCard = activeId ? allCardsMap.get(activeId) || null : null;

	return {
		sensors,
		handleDragStart,
		handleDragMove,
		handleDragEnd,
		handleDragOver,
		customCollisionDetection,
		modifiers,
		activeId,
		activeDragCard,
		activeDragType,
	};
}