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

import { use, useCallback, useRef, useState } from 'react';
import { useSensors, useSensor, PointerSensor, MouseSensor, pointerWithin } from '@dnd-kit/core';
import type { DragStartEvent, DragMoveEvent, DragEndEvent, DragOverEvent, Over, CollisionDetection } from '@dnd-kit/core';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { findOverlappingColumns } from '@/lib/utils/collision-detection';
import { CardService, CardTransaction } from '@/lib/services/card-service';
import type { CardData, LineCard } from '@/lib/types';
import { GRID_SIZE } from '../constants/defaults';
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { closestCenter, KeyboardSensor } from '@dnd-kit/core';
import { PerformanceTimer } from '../utils/performance';
import { findCollisionFreePosition } from '@/lib/utils/collision-free-position';
import { db } from '@/lib/instant/db';

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

function getInsertionIndex(params: {
	items: string[];
	overId: string;
	pointerY: number;
	overRect: { top: number; height: number } | null;
}) {
	const { items, overId, pointerY, overRect } = params;

	const overIndex = items.indexOf(overId);

	if (overIndex === -1 || !overRect) return -1;
	
	const overMiddleY = overRect.top + overRect.height / 2;
	const insertAfter = pointerY > overMiddleY;

	return overIndex + (insertAfter ? 1 : 0);
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
		setPotentialBoardTarget,
		setColumnInsertionIndexTarget,
		columnInsertionIndexTarget
	} = useCanvasStore();

	// ============================================================================
	// STATE
	// ============================================================================

	const [activeId, setActiveId] = useState<string | null>(null);
	const [activeDragType, setActiveDragType] = useState<'canvas-card' | 'column-card' | null>(null);
	const [activeCardPosition, setActiveCardPosition] = useState<{ x: number; y: number } | null>(null);
	const dropTimestampRef = useRef<number | null>(null);

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
		return ({ transform }: { transform: { x: number; y: number } }) => {
			// If snap disabled or no active position, return unchanged
			if (!snapToGrid || !activeCardPosition) {
				return transform;
			}

			// Calculate absolute position (original + delta)
			const absoluteX = activeCardPosition.x + transform.x;
			const absoluteY = activeCardPosition.y + transform.y;

			// Snap absolute position to grid points
			const snappedX = Math.round(absoluteX / GRID_SIZE) * GRID_SIZE;
			const snappedY = Math.round(absoluteY / GRID_SIZE) * GRID_SIZE;

			// Calculate corrected delta
			return {
				...transform,
				x: snappedX - activeCardPosition.x,
				y: snappedY - activeCardPosition.y,
			};
		};
	}, [snapToGrid, activeCardPosition]);

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

	const columnAwareCollisionDetection: CollisionDetection = (args) => {
		const { active, droppableContainers } = args;
		const activeType = active.data.current?.type;

		// Use pointerWithin first
		const pointerCollisions = pointerWithin(args);

		if (activeType !== "canvas-card" && activeType !== "column-card") {
			return pointerCollisions.length ? pointerCollisions : [];
		}

		if (!pointerCollisions.length) {
			return [];
		}

		// Resolve the droppable container we're currently "over"
		const overId = pointerCollisions[0].id;
		const overContainer = droppableContainers.find((c) => c.id === overId);
		const overType = overContainer?.data.current?.type;

		if (overType === "column-card") {
			return pointerCollisions;
		}

		if (overType === "column") {
			const columnId = overContainer?.data.current?.columnId ?? String(overId);

			const columnItemDroppables = droppableContainers.filter((c) => {
				const data = c.data.current;
				return data?.type === 'column-card' && data?.columnId === columnId;
			});

			if (!columnItemDroppables.length) {
				return pointerCollisions;
			}

			return closestCenter({
				...args,
				droppableContainers: columnItemDroppables,
			});
		}

		return pointerCollisions;
	}

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

	const getBoardCardIdFromOver = useCallback((over: Over | null): string | null => {
		if (!over) return null;

		const meta = over.data?.current;

		// Case 1: Directly over board card droppable
		if (meta?.type === 'board-card') {
			return meta.boardCardId || over.id as string;
		}

		// Case 2: Fallback - check if over.id is a board card
		const card = allCardsMap.get(over.id as string);
		if (card?.card_type === 'board') {
			return card.id;
		}

		return null;
	}, [allCardsMap]);

	const getBreadcrumbIdFromOver = useCallback((over: Over | null): string | null => {
		if (!over) return null;

		const meta = over.data?.current;

		// Check if dropped on breadcrumb
		if (meta?.type === 'breadcrumb') {
			return meta.boardId;
		}

		return null;
	}, []);

	const isCardInAnyColumn = useCallback((cardId: string): boolean => {
		for (const c of allCardsMap.values()) {
			if (c.card_type === 'column') {
				const items = (c as any).column_items as any[] | undefined;
				if (items?.some(item => item.card_id === cardId)) return true;
			}
		}
		return false;
	}, [allCardsMap]);

	type ExpandDragGroupResult = {
		dragIds: string[];
		blocked: boolean;
		isImplicitLineAttachmentDrag: boolean;
	};

	const expandDragGroupWithLineAttachments = useCallback((
		baseIds: string[],
		activeId: string
	): ExpandDragGroupResult => {
		const baseSet = new Set(baseIds);
		const dragSet = new Set(baseIds);
		let blocked = false;

		for (const id of baseIds) {
			const card = allCardsMap.get(id);
			if (!card || card.card_type !== 'line') continue;

			const line = card as any;
			const attachedIds = [line.line_start_attached_card_id, line.line_end_attached_card_id].filter(Boolean) as string[];
			for (const attachedId of attachedIds) {
				const attached = allCardsMap.get(attachedId);
				if (!attached) continue;

				const cannotMove = attached.is_position_locked || isCardInAnyColumn(attachedId);
				if (cannotMove) {
					blocked = true;
					continue;
				}

				dragSet.add(attachedId);
			}
		}

		const expandedIds = Array.from(dragSet);
		const isImplicitLineAttachmentDrag = activeId !== null && (() => {
			const activeCard = allCardsMap.get(activeId);
			if (!activeCard || activeCard.card_type !== 'line') return false;
			return expandedIds.some(id => !baseSet.has(id));
		})();

		return { dragIds: expandedIds, blocked, isImplicitLineAttachmentDrag };
	}, [allCardsMap, isCardInAnyColumn]);

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================

	const handleDragStart = useCallback((event: DragStartEvent) => {
		const { active, activatorEvent } = event;
		const dragData = active.data.current;
		const dragType = dragData?.type;


		setActiveId(active.id as string);
		setActiveDragType(dragType || 'canvas-card');

		// Capture active card position for grid snapping
		const activeCard = allCardsMap.get(active.id as string);
		if (activeCard) {
			setActiveCardPosition({
				x: activeCard.position_x,
				y: activeCard.position_y,
			});
		}

		// ========================================================================
  		// CANVAS CARD LOGIC
  		// ========================================================================
		if (dragType === 'canvas-card') {
			// Determine which cards to drag BEFORE state changes
			const activeCard = allCardsMap.get(active.id as string);
			const isAlreadySelected = selectedCardIds.has(active.id as string);

			// Filter out locked cards
			let cardsToDrag: string[];
			if (isAlreadySelected) {
				cardsToDrag = Array.from(selectedCardIds).filter(id => {
					const card = allCardsMap.get(id);
					return !card?.is_position_locked;
				});
			} else {
				cardsToDrag = activeCard?.is_position_locked ? [] : [active.id as string];
			}

			const expandedDragGroup = expandDragGroupWithLineAttachments(cardsToDrag, active.id as string);

			if (expandedDragGroup.blocked) {
				const activeCardFrozen = allCardsMap.get(active.id as string);
				if (activeCardFrozen) {
					const frozen = new Map<string, { x: number, y: number }>();
					frozen.set(active.id as string, { x: activeCardFrozen.position_x, y: activeCardFrozen.position_y });
					setDragPositions(frozen);
				}
				return;
			}

			cardsToDrag = expandedDragGroup.dragIds;

			// Special case: locked card in column → drag column instead
			if (cardsToDrag.length === 0 && activeCard?.is_position_locked) {
				const parentColumn = Array.from(allCardsMap.values()).find(c =>
					c.card_type === 'column' &&
					(c as any).column_items?.some((item: any) => item.card_id === active.id)
				);

				if (parentColumn && !parentColumn.is_position_locked) {
					cardsToDrag = [parentColumn.id];
					selectCard(parentColumn.id, false);
				} else {
					return; // Early exit - nothing to drag
				}
			}

			if (cardsToDrag.length === 0) {
				return; // Early exit
			}

			// Auto-select the dragged card if not already selected
			if (!isAlreadySelected && !activeCard?.is_position_locked) {
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
 		// COLUMN CARD LOGIC
  		// ========================================================================
		if (dragType === 'column-card') {
			const sourceColumnId = dragData?.columnId;
			const draggedCard = allCardsMap.get(active.id as string);
			const draggedElement = (activatorEvent?.target as HTMLElement)?.closest('[data-card="true"]');

			if (!draggedCard || !sourceColumnId) return;

			if (draggedElement) {
				const rect = draggedElement.getBoundingClientRect();

				// Get canvas viewport container's position
				const canvasViewport = document.querySelector('[data-canvas-root="true"]');
				const canvasRect = canvasViewport?.getBoundingClientRect();

				if (canvasRect) {
					const viewportRelativeX = rect.left - canvasRect.left;
					const viewportRelativeY = rect.top - canvasRect.top;

					const canvasX = (viewportRelativeX - viewport.x) / viewport.zoom;
					const canvasY = (viewportRelativeY - viewport.y) / viewport.zoom;;

					setActiveCardPosition({
						x: canvasX,
						y: canvasY,
					});
				}
			}

			// Select the card
			selectCard(active.id as string, false);
		}

	}, [selectedCardIds, allCardsMap, boardId, setDragPositions, selectCard, viewport, expandDragGroupWithLineAttachments]);

	const handleDragMove = useCallback((event: DragMoveEvent) => {
		const { active, delta, over, activatorEvent } = event;
		const dragType = active.data.current?.type;
		const overData = over?.data.current;
		const activeData = active.data.current;

		// Delta is already in screen coordinates; canvas coordinate modifier handles zoom
		const canvasDelta = {
			x: delta.x,
			y: delta.y,
		};

		// ========================================================================
  		// CANVAS CARD LOGIC
  		// ========================================================================

		if (activeData?.type === "canvas-card" || activeData?.type === "column-card") {
			const card = allCardsMap.get(active.id as string);

			if (!card || card.card_type === "column" || card.card_type === "line") {
				setColumnInsertionIndexTarget(null);
			} else {
				const columnId =
					overData?.type === "column" ? overData.columnId :
					overData?.type === "column-card" ? overData.columnId :
					null;

				if (columnId) {
					const column = allCardsMap.get(columnId);
					const columnItems = column?.card_type === "column" ? column.column_items : [];
					const items = columnItems?.map((value) => value.card_id);
					const clientY = activatorEvent.clientY + canvasDelta.y;

					if (clientY != null) {
						const index = getInsertionIndex({
							items,
							overId: String(over.id),
							pointerY: clientY,
							overRect: over.rect ?? null
						});

						if (index !== -1) setColumnInsertionIndexTarget(index);
					}
				}
			}
		} else {
			setColumnInsertionIndexTarget(null);
		}

		if (dragType === 'canvas-card') {
			// Determine which cards are being dragged - filter out locked cards
			let cardsToDrag = selectedCardIds.has(active.id as string)
				? Array.from(selectedCardIds).filter(id => {
					const card = allCardsMap.get(id);
					return !card?.is_position_locked;
				  })
				: [active.id as string];

			if (cardsToDrag.length === 0) {
				return; // Early exit if all cards are locked
			}

			const activeCard = allCardsMap.get(active.id as string);
			if (!activeCard) return;

			const expandedDragGroup = expandDragGroupWithLineAttachments(cardsToDrag, active.id as string);
			cardsToDrag = expandedDragGroup.dragIds;

			// Calculate active card's new position
			let activeCardNewX = activeCard.position_x + canvasDelta.x;
			let activeCardNewY = activeCard.position_y + canvasDelta.y;

			// Apply grid snapping if enabled
			if (snapToGrid) {
				activeCardNewX = Math.round(activeCardNewX / GRID_SIZE) * GRID_SIZE;
				activeCardNewY = Math.round(activeCardNewY / GRID_SIZE) * GRID_SIZE;
			}

			// Calculate snapped delta for all cards
			const snappedDeltaX = activeCardNewX - activeCard.position_x;
			const snappedDeltaY = activeCardNewY - activeCard.position_y;

			// Update drag positions for all dragging cards
			const newPositions = new Map<string, { x: number; y: number }>();
			cardsToDrag.forEach((cardId) => {
				const card = allCardsMap.get(cardId);
				if (card) {
					newPositions.set(cardId, {
						x: card.position_x + snappedDeltaX,
						y: card.position_y + snappedDeltaY,
					});
				}
			});

			setDragPositions(newPositions);

			if (expandedDragGroup.isImplicitLineAttachmentDrag) {
				setPotentialColumnTarget(null);
				return;
			}

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
	}, [selectedCardIds, allCardsMap, setDragPositions, setPotentialColumnTarget, snapToGrid, setColumnInsertionIndexTarget, expandDragGroupWithLineAttachments]);

	const handleDragEnd = useCallback(async (event: DragEndEvent) => {
		const { active, over, delta, activatorEvent } = event;
		const dragData = active.data.current;
		const dragType = dragData?.type;

		setColumnInsertionIndexTarget(null);

		// Delta is already in screen coordinates; canvas coordinate modifier handles zoom
		const canvasDelta = {
			x: delta.x,
			y: delta.y,
		};

		// ========================================================================
		// SCENARIO 1: CANVAS CARD → COLUMN
		// ========================================================================
		if (dragType === 'canvas-card') {
			const timer = new PerformanceTimer('[DND DROP] Canvas card → Column');
			dropTimestampRef.current = performance.now();

			let draggedCardIds = selectedCardIds.has(active.id as string)
			? Array.from(selectedCardIds).filter(id => {
				const card = allCardsMap.get(id);
				return !card?.is_position_locked;
			  })
			: [active.id as string];

			if (draggedCardIds.length === 0) {
				// All cards are locked, clear drag state
				clearDragPositions();
				setPotentialColumnTarget(null);
				setActiveId(null);
				setActiveDragType(null);
				return;
			}

			const expandedDragGroup = expandDragGroupWithLineAttachments(draggedCardIds, active.id as string);

			if (expandedDragGroup.blocked) {
				clearDragPositions();
				setPotentialBoardTarget(null);
				setPotentialColumnTarget(null);
				setActiveId(null);
				setActiveDragType(null);
				return;
			}

			draggedCardIds = expandedDragGroup.dragIds;
			const forceCanvasMoveOnly = expandedDragGroup.isImplicitLineAttachmentDrag;

			const targetColumnId = forceCanvasMoveOnly ? null : getColumnIdFromOver(over);
			const targetIndex = over?.data?.current?.sortable?.index;
			
			if (targetColumnId && boardId) {
				const targetColumn = allCardsMap.get(targetColumnId);

				if (targetColumn?.card_type === 'column') {
					const draggedCards = draggedCardIds
						.map(id => allCardsMap.get(id))
						.filter(card => card !== undefined);

					const isDraggingColumn = draggedCards.some(
						card => card.card_type === 'column'
					);

					const activeCard = allCardsMap.get(active.id as string);
					const isDraggingLine = activeCard?.card_type === "line";

					if (!isDraggingColumn && !isDraggingLine) {
						timer.mark('CardService.addCardsToColumnBatch start');
						// Batch add all cards to column with optimistic update
						await CardService.addCardsToColumnBatch({
							cardIds: draggedCardIds,
							boardId,
							column: targetColumn,
							startPosition: columnInsertionIndexTarget || 0,
						});

						timer.mark('CardService.addCardsToColumnBatch complete');
						timer.mark('Clear drag state');

						clearDragPositions();
						setPotentialColumnTarget(null);
						setActiveId(null);
						setActiveDragType(null);

						timer.log();
						console.log('⏱️  [REACTIVITY] Waiting for InstantDB update and React re-render...');
						return;
					}
				}
			}

			const targetBoardCardId = getBoardCardIdFromOver(over);

			if (targetBoardCardId && boardId && targetBoardCardId !== active.id) {
				const targetBoardCard = allCardsMap.get(targetBoardCardId);

				if (targetBoardCard?.card_type === 'board') {
					const linkedBoardId = (targetBoardCard as any).linked_board_id;

					if (linkedBoardId) {
						const firstCardId = draggedCardIds[0];
						const firstCard = allCardsMap.get(firstCardId);

						if (!firstCard) {
							clearDragPositions();
							setPotentialColumnTarget(null);
							setPotentialBoardTarget(null);
							setActiveId(null);
							setActiveDragType(null);
							return;
						}

						const positions = new Map<string, { x: number; y: number }>();

						draggedCardIds.forEach(cardId => {
							const card = allCardsMap.get(cardId);
							if (card) {
								const offsetX = card.position_x - firstCard.position_x;
								const offsetY = card.position_y - firstCard.position_y;

								positions.set(cardId, {
									x: 0 + offsetX,
									y: 0 + offsetY,
								});
							}
						});

						// Move cards to target board
						await CardService.moveCardsToBoardBatch({
							cardIds: draggedCardIds,
							sourceBoardId: boardId,
							targetBoardId: linkedBoardId,
							positions,
							sourceColumns: undefined,
						});

						clearDragPositions();
						setPotentialColumnTarget(null);
						setPotentialBoardTarget(null);
						setActiveId(null);
						setActiveDragType(null);

						return;
					}
				}
			}

			// Handle drop on breadcrumb
			const breadcrumbId = getBreadcrumbIdFromOver(over);
			if (breadcrumbId && boardId && breadcrumbId !== boardId) {
				// Fetch target board cards to check for collisions
				const targetBoardCardsQuery = await db.queryOnce({
					cards: {
						$: {
							where: {
								board_id: breadcrumbId,
							},
						},
					},
				});

				const targetBoardCards = (targetBoardCardsQuery?.data?.cards || []) as CardData[];

				// Get the cards being dragged
				const draggedCards: CardData[] = draggedCardIds
					.map(id => allCardsMap.get(id))
					.filter((card): card is CardData => card !== undefined);

				// Find collision-free positions
				const positions = findCollisionFreePosition(
					draggedCards,
					targetBoardCards,
					{ x: 100, y: 100 }
				);

				await CardService.moveCardsToBoardBatch({
					cardIds: draggedCardIds,
					sourceBoardId: boardId,
					targetBoardId: breadcrumbId,
					positions,
					sourceColumns: undefined,
				});

				clearDragPositions();
				setPotentialColumnTarget(null);
				setPotentialBoardTarget(null);
				setActiveId(null);
				setActiveDragType(null);

				return;
			}

			// No column overlap → Free canvas movement (batch update)
			const tx = new CardTransaction();
			let hasAnyMoved = false;

			for (const cardId of draggedCardIds) {
				const card = allCardsMap.get(cardId);
				if (card && boardId) {
					let newX = card.position_x + canvasDelta.x;
					let newY = card.position_y + canvasDelta.y;

					// Apply grid snapping
					if (snapToGrid && cardId === active.id) {
						// Active card: snap directly
						newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
						newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
					} else if (snapToGrid) {
						// Other cards: use delta from active card's snap
						const activeCard = allCardsMap.get(active.id as string);
						if (activeCard) {
							const activeNewX = Math.round((activeCard.position_x + canvasDelta.x) / GRID_SIZE) * GRID_SIZE;
							const activeNewY = Math.round((activeCard.position_y + canvasDelta.y) / GRID_SIZE) * GRID_SIZE;
							const snappedDeltaX = activeNewX - activeCard.position_x;
							const snappedDeltaY = activeNewY - activeCard.position_y;

							newX = card.position_x + snappedDeltaX;
							newY = card.position_y + snappedDeltaY;
						}
					}

					// Check if card actually moved
					const hasMoved =
						Math.abs(newX - card.position_x) > 0.1 ||
						Math.abs(newY - card.position_y) > 0.1;

					if (hasMoved) {
						hasAnyMoved = true;
						tx.updateCard(
							cardId,
							{
								position_x: newX,
								position_y: newY,
							},
							{
								position_x: card.position_x,
								position_y: card.position_y,
							}
						);
					}
				}
			}

			// Commit all updates in a single transaction
			if (hasAnyMoved && boardId) {
				await tx.commit(boardId, {
					withUndo: true,
					description: `Move ${tx.size} card${tx.size > 1 ? 's' : ''}`,
				});
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
			const timer = new PerformanceTimer('[DND DROP] Column card → Canvas');
			dropTimestampRef.current = performance.now();

			const sourceColumnId = dragData?.columnId;
			const draggedCard = allCardsMap.get(active.id as string);

			if (!draggedCard || !sourceColumnId || !boardId) {
				clearDragPositions();
				setPotentialColumnTarget(null);
				setActiveId(null);
				setActiveDragType(null);
				return;
			}

			// Check if was moved within the same column
			if (over && over.data?.current?.columnId === sourceColumnId) {
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
			const targetColumnId = getColumnIdFromOver(over);

			// No overlap → Extract to canvas
			if (!targetColumnId) {
				const sourceColumn = allCardsMap.get(sourceColumnId);
				if (!sourceColumn) {
					clearDragPositions();
					setPotentialColumnTarget(null);
					setActiveId(null);
					setActiveDragType(null);
					return;
				}

				if (!activeCardPosition) {
					console.warn('Missing activeCardPostion for column card extraction');
					clearDragPositions();
					setPotentialColumnTarget(null);
					setActiveId(null);
					setActiveDragType(null);
					return;
				}

				let newX = activeCardPosition.x + canvasDelta.x;
				let newY = activeCardPosition.y + canvasDelta.y;

				// Apply grid snapping if enabled
				if (snapToGrid) {
					newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
					newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
				}

				console.log(`Extracting card to canvas at (${newX}, ${newY})`);

				timer.mark('CardService.extractCardFromColumn start');

				clearDragPositions();

				await CardService.extractCardFromColumn({
					cardId: active.id as string,
					boardId,
					column: sourceColumn,
					position: { x: newX, y: newY },
				});

				timer.mark('CardService.extractCardFromColumn complete');
				timer.mark('CardService.bringCardsToFront start');

				// Bring to front
				const allCardsArray = Array.from(allCardsMap.values());
				await CardService.bringCardsToFront([active.id as string], boardId, allCardsArray);

				timer.mark('CardService.bringCardsToFront complete');
				timer.mark('Clear drag state');

				setPotentialColumnTarget(null);
				setActiveId(null);
				setActiveDragType(null);

				timer.log();
				console.log('⏱️  [REACTIVITY] Waiting for InstantDB update and React re-render...');
				return;
			}

			// ======================================================================
			// SCENARIO 3: COLUMN CARD → DIFFERENT COLUMN (Transfer)
			// ======================================================================
			const sourceColumn = allCardsMap.get(sourceColumnId);
			const targetColumn = allCardsMap.get(targetColumnId);
			if (sourceColumn && targetColumnId !== sourceColumnId) {
				console.log(`Transferring card from ${sourceColumnId} to ${targetColumnId}`);

				await CardService.transferCardBetweenColumns({
					cardId: active.id as string,
					boardId,
					fromColumn: sourceColumn,
					toColumn: targetColumn as unknown as CardData,
					toIndex: columnInsertionIndexTarget || 0,
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
		setActiveCardPosition(null);
	}, [
		selectedCardIds,
		allCardsMap,
		boardId,
		clearDragPositions,
		setPotentialColumnTarget,
		setPotentialBoardTarget,
		getColumnIdFromOver,
		getBoardCardIdFromOver,
		getBreadcrumbIdFromOver,
		snapToGrid,
		columnInsertionIndexTarget,
		setColumnInsertionIndexTarget,
		activeCardPosition,
		expandDragGroupWithLineAttachments,
	]);

	const handleDragOver = useCallback((event: DragOverEvent) => {
		const { over } = event;

		if (!over) return;

		console.log(event);


		if (over.data?.current?.type === 'board-card') {
			const boardCardId = over.data.current.boardCardId || over.id as string;
			setPotentialBoardTarget(boardCardId);
		} else {
			setPotentialBoardTarget(null);
		}
	}, [setPotentialBoardTarget]);

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
		customCollisionDetection: columnAwareCollisionDetection,
		modifiers,
		activeId,
		activeDragCard,
		activeDragType,
	};
}