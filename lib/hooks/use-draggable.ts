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
import { CardService, CardTransaction } from '@/lib/services';
import { findOverlappingColumns } from '@/lib/utils/collision-detection';
import type { Card, ColumnCard } from '@/lib/types';
import type { ColumnItem } from '@/lib/types/helpers';
import { useAutoPan } from '@/lib/hooks/use-auto-pan';
import { useBoardCards } from '@/lib/hooks/cards';
import { bringCardsToFrontOnInteraction, cardsToOrderKeyList } from '@/lib/utils/order-key-manager';
import { updateEntity, withBoardUpdate } from '@/lib/db/client';

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
		setDragPreview,
		setDragPositions,
		clearDragPositions,
		setInteractionMode,
		resetInteractionMode,
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
		const columnCard = cardsArray.find((c): c is ColumnCard =>
			c.card_type === 'column' &&
			(c as ColumnCard).column_items?.some((item: ColumnItem) => item.card_id === cardId)
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
				const singleCard = cardsMap.get(cardId);
				cardsToMoveRef.current = singleCard?.is_position_locked ? [] : [cardId];
			} else {
				// Multi-select - filter out locked cards
				const unlocked = Array.from(selectedCardIds).filter(id => {
					const c = cardsMap.get(id);
					return !c?.is_position_locked;
				});
				cardsToMoveRef.current = unlocked;
			}

			// Special case: locked card in column → drag entire column
			if (cardsToMoveRef.current.length === 0 && selectedCardIds.has(cardId)) {
				const draggedCard = cardsMap.get(cardId);
				if (draggedCard?.is_position_locked) {
					const columnId = findCardColumn(cardId);
					if (columnId) {
						const columnCard = cardsMap.get(columnId);
						if (columnCard && !columnCard.is_position_locked) {
							cardsToMoveRef.current = [columnId];
							selectCard(columnId, false);
						}
					}
				}
			}

			// Track starting column
			if (cardsToMoveRef.current.length === 1) {
				startingColumnRef.current = findCardColumn(cardsToMoveRef.current[0]);
			}

			// Don't proceed if no cards to move (all locked)
			if (cardsToMoveRef.current.length === 0) {
				return;
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

					// Set interaction mode to dragging
					setInteractionMode({ mode: 'dragging', cardIds: cardsToMoveRef.current });

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

				// Update canvas store with all drag positions for real-time line updates
				setDragPositions(new Map(currentPositionsRef.current));
				
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
				clearDragPositions(); // Clear drag positions from canvas store

				// Reset interaction mode to idle
				resetInteractionMode();

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
									const transactions = [];

									// Remove from starting column if it was in one
									if (startingColumn && startingColumn !== potentialTarget) {
										const startCol = cardsMap.get(startingColumn);
										if (startCol && startCol.card_type === 'column') {
											const startColumnCard = startCol as ColumnCard;
											const updatedItems: ColumnItem[] = (startColumnCard.column_items || [])
												.filter((item: ColumnItem) => item.card_id !== draggedCardId)
												.map((item: ColumnItem, index: number) => ({ ...item, position: index }));

											transactions.push(updateEntity('cards', startingColumn, { column_items: updatedItems }));
										}
									}

									// Add to new column (if not already in it)
									if (startingColumn !== potentialTarget) {
										const currentItems: ColumnItem[] = (targetColumn as ColumnCard).column_items || [];
										const newPosition = currentItems.length;
										const updatedColumnItems: ColumnItem[] = [
											...currentItems,
											{ card_id: draggedCardId, position: newPosition }
										];

										transactions.push(updateEntity('cards', potentialTarget, { column_items: updatedColumnItems }));
									}

									// Execute all column updates in a single transaction
									if (transactions.length > 0) {
										await withBoardUpdate(boardId, transactions);
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
								const startCol = cardsMap.get(startingColumn);
								if (startCol && startCol.card_type === 'column') {
									const startColumnCard = startCol as ColumnCard;
									const updatedItems: ColumnItem[] = (startColumnCard.column_items || [])
										.filter((item: ColumnItem) => item.card_id !== draggedCardId)
										.map((item: ColumnItem, index: number) => ({ ...item, position: index }));

									await withBoardUpdate(boardId, [
										updateEntity('cards', startingColumn, { column_items: updatedItems })
									]);
								}
							} catch (error) {
								console.error('Failed to remove card from column:', error);
							}
						}
					}
				}

				// ============================================================================
				// SYNC TO DATABASE USING CARDTRANSACTION (BATCHED UPDATE)
				// ============================================================================
				if (wasDragging) {
					// Calculate final position delta from initial
					const finalDelta = {
						x: lastCanvasPosRef.current.x - startPosRef.current.canvas.x,
						y: lastCanvasPosRef.current.y - startPosRef.current.canvas.y,
					};

					onDragEnd?.(finalDelta);

					// Use CardTransaction for batched update with single undo entry
					const tx = new CardTransaction();
					let hasAnyMoved = false;

					cardsToMoveRef.current.forEach((id) => {
						const oldPosition = initialPositionsRef.current.get(id);
						const newPosition = currentPositionsRef.current.get(id);

						if (oldPosition && newPosition) {
							// Check if card actually moved
							const hasMoved =
								Math.abs(newPosition.x - oldPosition.x) > 0.1 ||
								Math.abs(newPosition.y - oldPosition.y) > 0.1;

							if (hasMoved) {
								hasAnyMoved = true;
								tx.updateCard(
									id,
									{
										position_x: newPosition.x,
										position_y: newPosition.y,
									},
									{
										position_x: oldPosition.x,
										position_y: oldPosition.y,
									}
								);
							}
						}
					});

					// Commit all updates in a single transaction
					if (hasAnyMoved) {
						try {
							const firstMovedCard = cardsMap.get(cardsToMoveRef.current[0]);
							if (firstMovedCard) {
								const boardId = firstMovedCard.board_id;
								const cardCount = tx.size;
								await tx.commit(boardId, {
									withUndo: true,
									description: `Move ${cardCount} card${cardCount > 1 ? 's' : ''}`,
								});
							}
						} catch (error) {
							console.error('Failed to sync card positions:', error);
						}
					}
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
			card,
			cardsArray,
			clearDragPositions,
			setDragPositions,
			setInteractionMode,
			resetInteractionMode,
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