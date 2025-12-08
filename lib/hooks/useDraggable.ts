/**
 * useDraggable Hook - With Column Add/Remove Logic
 *
 * Key behaviors:
 * 1. When dragging a card INTO a column -> add to column_items
 * 2. When dragging a card OUT of a column -> remove from column_items
 * 3. Cards remain independent CanvasElements always
 */

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useCanvasStore, type Position } from '@/lib/stores/canvas-store';
import { screenToCanvas } from '@/lib/utils/transform';
import { CardService } from '@/lib/services';
import { findOverlappingColumns } from '@/lib/utils/collision-detection';
import type { Card } from '@/lib/types';
import { useAutoPan } from '@/lib/hooks/useAutoPan';
import { useBoardCards } from '@/lib/hooks/cards';
import { bringCardsToFrontOnInteraction, cardsToOrderKeyList } from '@/lib/utils/order-key-manager';

interface UseDraggableOptions {
	card: Card;
	
	onDragStart?: () => void;
	onDrag?: (delta: Position) => void;
	onDragEnd?: (finalPosition: Position) => void;
	
	snapToGrid?: boolean;
	gridSize?: number;
	dragThreshold?: number;
}

export function useDraggable({
	card,
	onDragStart,
	onDrag,
	onDragEnd,
	snapToGrid = false,
	gridSize = 20,
	dragThreshold = 1,
}: UseDraggableOptions) {
	const {
		viewport,
		selectedCardIds,
		setIsDragging: setGlobalDragging,
		selectCard,
		setPotentialColumnTarget,
		setDragPreview
	} = useCanvasStore();

	// Get cards from InstantDB
	const { cards: cardsArray } = useBoardCards(card.board_id);

	// Create a local cardsMap for lookups
	const cardsMap = useMemo(
		() => new Map(cardsArray.map(c => [c.id, c])),
		[cardsArray]
	);

	const { startAutoPan, updateMousePosition, stopAutoPan } = useAutoPan({
		edgeThreshold: 50,
		maxSpeed: 20,
		enabled: true,
	});

	const [isDragging, setIsDragging] = useState(false);
	const [localPosition, setLocalPosition] = useState<Position | null>(null);
	const isDraggingRef = useRef(false);
	const hasMovedRef = useRef(false);
	const startPosRef = useRef<{ screen: Position; canvas: Position }>({
		screen: { x: 0, y: 0 },
		canvas: { x: 0, y: 0 },
	});
	const lastCanvasPosRef = useRef<Position>({ x: 0, y: 0 });
	const initialPositionsRef = useRef<Map<string, Position>>(new Map());
	const currentPositionsRef = useRef<Map<string, Position>>(new Map()); // Track current positions during drag
	const cardsToMoveRef = useRef<string[]>([]);
	const startingColumnRef = useRef<string | null>(null); // Track which column card started in
	const cardId = card.id;
	const canvas = document.querySelector('div.canvas-viewport');

	/**
	 * Find which column (if any) a card belongs to
	 */
	const findCardColumn = (cardId: string): string | null => {
		const columnCard = cardsArray.find(c =>
			c.card_type === 'column' &&
			(c as any).column_cards?.column_items?.some((item: any) => item.card_id === cardId)
		);

		return columnCard?.id || null;
	};

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.button !== 0) return;

			e.preventDefault();
			e.stopPropagation();

			const cardData = cardsMap.get(cardId);
			if (!cardData) return;

			const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

			// Update selection
			if (!selectedCardIds.has(cardId)) {
				selectCard(cardId, isMultiSelect);
				cardsToMoveRef.current = [cardId];
			} else {
				cardsToMoveRef.current = Array.from(selectedCardIds);
			}

			// Track starting column
			if (cardsToMoveRef.current.length === 1) {
				startingColumnRef.current = findCardColumn(cardsToMoveRef.current[0]);
			}

			isDraggingRef.current = false;
			hasMovedRef.current = false;

			const canvasPos = screenToCanvas(e.clientX, e.clientY, viewport);
			startPosRef.current = {
				screen: { x: e.clientX, y: e.clientY },
				canvas: canvasPos,
			};
			lastCanvasPosRef.current = canvasPos;

			// Store initial positions
			initialPositionsRef.current.clear();
			cardsToMoveRef.current.forEach((id) => {
				const c = cardsMap.get(id);
				if (c) {
					initialPositionsRef.current.set(id, {
						x: c.position_x,
						y: c.position_y
					});
				}
			});

			const handleMouseMove = (e: MouseEvent) => {
				// Get the current viewport state (not from closure) to account for auto-panning
				const currentViewport = useCanvasStore.getState().viewport;
				const currentCanvasPos = screenToCanvas(e.clientX, e.clientY, currentViewport);

				if (findCardColumn(cardId) && canvas) {
					const rect = canvas.getBoundingClientRect();
					const clientX = e.clientX - rect.left;
					const clientY = e.clientY - rect.top;

					const canvasX = (clientX - currentViewport.x) / currentViewport.zoom;
					const canvasY = (clientY - currentViewport.y) / currentViewport.zoom;
					setDragPreview({
						cardType: card.card_type,
						canvasX,
						canvasY
					});
				}

				// Update auto-pan with current mouse position
				updateMousePosition(e.clientX, e.clientY);

				if (!hasMovedRef.current) {
					const distanceMoved = Math.sqrt(
						Math.pow(e.clientX - startPosRef.current.screen.x, 2) +
							Math.pow(e.clientY - startPosRef.current.screen.y, 2)
					);

					if (distanceMoved < dragThreshold) {
						return;
					}

					hasMovedRef.current = true;
					isDraggingRef.current = true;
					setIsDragging(true);
					setGlobalDragging(true);
					onDragStart?.();

					// Bring cards to front when drag starts
					const orderKeyUpdates = bringCardsToFrontOnInteraction(
						cardsToMoveRef.current,
						cardsToOrderKeyList(cardsArray)
					);

					// Update order keys in database if needed
					if (orderKeyUpdates.size > 0) {
						orderKeyUpdates.forEach(async (newOrderKey, cardId) => {
							try {
								await CardService.updateCardOrderKey(cardId, card.board_id, newOrderKey);
							} catch (error) {
								console.error('Failed to update card order key:', error);
							}
						});
					}

					// Start auto-pan when drag begins
					startAutoPan(e.clientX, e.clientY);
				}

				const delta = {
					x: currentCanvasPos.x - lastCanvasPosRef.current.x,
					y: currentCanvasPos.y - lastCanvasPosRef.current.y,
				};

				lastCanvasPosRef.current = currentCanvasPos;

				const snapPosition = (value: number) => {
					const shouldSnap = snapToGrid !== e.shiftKey;
					return shouldSnap ? Math.round(value / gridSize) * gridSize : value;
				};

				// Update current positions locally (no canvas store updates during drag)
				cardsToMoveRef.current.forEach((id) => {
					const initialPos = initialPositionsRef.current.get(id);

					if (initialPos) {
						// Calculate total delta from initial position
						const totalDeltaX = lastCanvasPosRef.current.x - startPosRef.current.canvas.x;
						const totalDeltaY = lastCanvasPosRef.current.y - startPosRef.current.canvas.y;

						// Apply delta to initial position, then snap the absolute position
						const newX = initialPos.x + totalDeltaX;
						const newY = initialPos.y + totalDeltaY;

						const snappedPos = {
							x: snapPosition(newX),
							y: snapPosition(newY),
						};

						currentPositionsRef.current.set(id, snappedPos);

						// Update local position for the main card being dragged
						if (id === cardId) {
							setLocalPosition(snappedPos);
						}
					}
				});
				
				onDrag?.(delta);

				// ============================================================================
				// COLUMN OVERLAP DETECTION - ONLY FOR SINGLE CARD DRAG
				// ============================================================================
				if (cardsToMoveRef.current.length === 1) {
					const draggedCardId = cardsToMoveRef.current[0];
					const draggedCard = cardsMap.get(draggedCardId);

					// Only check for columns if dragging a non-column, non-line card
					if (draggedCard && draggedCard.card_type !== 'column' && draggedCard.card_type !== 'line') {
						// Create a temporary card map with updated positions for collision detection
						const tempCardsMap = new Map(cardsMap) as unknown as Map<string, Card>;
						const currentPos = currentPositionsRef.current.get(draggedCardId);
						if (currentPos) {
							tempCardsMap.set(draggedCardId, {
								...draggedCard,
								position_x: currentPos.x,
								position_y: currentPos.y,
							} as unknown as Card);
						}

						const overlappingColumns = findOverlappingColumns(draggedCardId, tempCardsMap);

						// Set the first (topmost) overlapping column as potential target
						const targetColumnId = overlappingColumns.length > 0
							? overlappingColumns[0].id
							: null;

						setPotentialColumnTarget(targetColumnId);
					}
				} else {
					// Multi-select drag - no column drop
					setPotentialColumnTarget(null);
				}
			};

			const handleMouseUp = async () => {
				const wasDragging = isDraggingRef.current;
				const potentialTarget = useCanvasStore.getState().potentialColumnTarget;
				const startingColumn = startingColumnRef.current;

				// Clear dragging state immediately
				isDraggingRef.current = false;
				hasMovedRef.current = false;
				setIsDragging(false);
				setGlobalDragging(false);
				setDragPreview(null);
				setLocalPosition(null); // Clear local position

				// Stop auto-pan when drag ends
				stopAutoPan();

				// ============================================================================
				// HANDLE COLUMN MEMBERSHIP CHANGES
				// ============================================================================
				if (wasDragging && cardsToMoveRef.current.length === 1) {
					const draggedCardId = cardsToMoveRef.current[0];
					const draggedCard = cardsMap.get(draggedCardId);

					if (draggedCard && draggedCard.card_type !== 'column') {
						// Case 1: Dropped onto a column
						if (potentialTarget) {
							const targetColumn = cardsMap.get(potentialTarget) as any;

							if (targetColumn) {
								try {
									const boardId = draggedCard.board_id;

									// Remove from starting column if it was in one
									if (startingColumn && startingColumn !== potentialTarget) {
										const startCol = cardsMap.get(startingColumn) as any;
										if (startCol) {
											const updatedItems = ((startCol as any).column_items || [])
												.filter((item: any) => item.card_id !== draggedCardId)
												.map((item: any, index: number) => ({ ...item, position: index }));

											await CardService.updateColumnItems(startingColumn, boardId, updatedItems);
										}
									}

									// Add to new column (if not already in it)
									if (startingColumn !== potentialTarget) {
										const currentItems = (targetColumn as any).column_items || [];
										const newPosition = currentItems.length;
										const updatedColumnItems = [
											...currentItems,
											{ card_id: draggedCardId, position: newPosition }
										];

										await CardService.updateColumnItems(potentialTarget, boardId, updatedColumnItems);
									}
								} catch (error) {
									console.error('Failed to move card between columns:', error);
								}
							}

							setPotentialColumnTarget(null);
						}
						// Case 2: Card was in a column but dropped outside
						else if (startingColumn) {
							try {
								const boardId = draggedCard.board_id;
								const startCol = cardsMap.get(startingColumn) as any;
								if (startCol) {
									const updatedItems = ((startCol as any).column_items || [])
										.filter((item: any) => item.card_id !== draggedCardId)
										.map((item: any, index: number) => ({ ...item, position: index }));

									await CardService.updateColumnItems(startingColumn, boardId, updatedItems);
								}
							} catch (error) {
								console.error('Failed to remove card from column:', error);
							}
						}
					}
				}

				// ============================================================================
				// SYNC TO DATABASE
				// ============================================================================
				if (wasDragging) {
					// Calculate final position delta from initial
					const finalDelta = {
						x: lastCanvasPosRef.current.x - startPosRef.current.canvas.x,
						y: lastCanvasPosRef.current.y - startPosRef.current.canvas.y,
					};

					onDragEnd?.(finalDelta);

					// Sync moved cards to InstantDB using current positions
					cardsToMoveRef.current.forEach(async (id) => {
						const oldPosition = initialPositionsRef.current.get(id);
						const newPosition = currentPositionsRef.current.get(id);

						if (oldPosition && newPosition) {
							// Check if card actually moved
							const hasMoved =
								Math.abs(newPosition.x - oldPosition.x) > 0.1 ||
								Math.abs(newPosition.y - oldPosition.y) > 0.1;

							if (!hasMoved) {
								return;
							}

							try {
								const movedCard = cardsMap.get(id);
								if (movedCard) {
									const boardId = movedCard.board_id;

									await CardService.updateCardTransform({
										cardId: id,
										boardId: boardId,
										transform: {
											position_x: newPosition.x,
											position_y: newPosition.y,
										},
										withUndo: true,
										previousTransform: {
											position_x: oldPosition.x,
											position_y: oldPosition.y,
										},
									});
								}
							} catch (error) {
								console.error('Failed to sync card position:', error);
							}
						}
					});
				}

				setDragPreview(null);
				cardsToMoveRef.current = [];
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		},
		[
			cardId,
			viewport,
			selectedCardIds,
			setIsDragging,
			setGlobalDragging,
			selectCard,
			setPotentialColumnTarget,
			onDragStart,
			onDrag,
			onDragEnd,
			snapToGrid,
			gridSize,
			dragThreshold,
			findCardColumn,
			setDragPreview,
			startAutoPan,
			updateMousePosition,
			stopAutoPan,
			cardsMap,
			canvas,
			card
		]
	);

	useEffect(() => {
		return () => {
			document.onmousemove = null;
			document.onmouseup = null;
		};
	}, []);

	// Return the current position (either local during drag or from card prop)
	const currentPosition = localPosition || {
		x: card.position_x,
		y: card.position_y,
	};

	return {
		isDragging,
		handleMouseDown,
		currentPosition,
	};
}