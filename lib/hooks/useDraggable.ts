/**
 * useDraggable Hook - With Column Add/Remove Logic
 * 
 * Key behaviors:
 * 1. When dragging a card INTO a column -> add to column_items
 * 2. When dragging a card OUT of a column -> remove from column_items  
 * 3. Cards remain independent CanvasElements always
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { useCanvasStore, type Position } from '@/lib/stores/canvas-store';
import { screenToCanvas } from '@/lib/utils/transform';
import { updateCardTransform, addCardToColumn, removeCardFromColumn } from '@/lib/data/cards-client';
import { findOverlappingColumns } from '@/lib/utils/collision-detection';
import type { Card } from '@/lib/types';

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
	gridSize = 10,
	dragThreshold = 1,
}: UseDraggableOptions) {
	const {
		viewport,
		selectedCardIds,
		updateCards,
		setIsDragging: setGlobalDragging,
		getCard,
		selectCard,
		bringCardsToFrontOnInteraction,
		setPotentialColumnTarget,
		updateCard,
		cards,
		setDragPreview
	} = useCanvasStore();

	const [isDragging, setIsDragging] = useState(false);
	const isDraggingRef = useRef(false);
	const hasMovedRef = useRef(false);
	const startPosRef = useRef<{ screen: Position; canvas: Position }>({
		screen: { x: 0, y: 0 },
		canvas: { x: 0, y: 0 },
	});
	const lastCanvasPosRef = useRef<Position>({ x: 0, y: 0 });
	const initialPositionsRef = useRef<Map<string, Position>>(new Map());
	const cardsToMoveRef = useRef<string[]>([]);
	const zIndexUpdatesRef = useRef<Map<string, number>>(new Map());
	const startingColumnRef = useRef<string | null>(null); // Track which column card started in
	const cardId = card.id;
	const canvas = document.querySelector('div.canvas-viewport');

	/**
	 * Find which column (if any) a card belongs to
	 */
	const findCardColumn = (cardId: string): string | null => {
		const allCards = Array.from(cards.values());
		const columnCard = allCards.find(c => 
			c.card_type === 'column' && 
			c.column_cards?.column_items?.some(item => item.card_id === cardId)
		);
		
		return columnCard?.id || null;
	};

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.button !== 0) return;

			e.preventDefault();
			e.stopPropagation();

			const card = getCard(cardId);
			if (!card) return;

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

			// Bring cards to front
			zIndexUpdatesRef.current = bringCardsToFrontOnInteraction(cardsToMoveRef.current);

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
				const c = getCard(id);
				if (c) {
					initialPositionsRef.current.set(id, { 
						x: c.position_x, 
						y: c.position_y 
					});
				}
			});

			const handleMouseMove = (e: MouseEvent) => {
				const currentCanvasPos = screenToCanvas(e.clientX, e.clientY, viewport);

				if (findCardColumn(cardId) && canvas) {
					const rect = canvas.getBoundingClientRect();
					const clientX = e.clientX - rect.left;
					const clientY = e.clientY - rect.top;
					
					const canvasX = (clientX - viewport.x) / viewport.zoom;
					const canvasY = (clientY - viewport.y) / viewport.zoom;
					setDragPreview({
						cardType: card.card_type,
						canvasX,
						canvasY
					});
				}
				
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
				}

				const delta = {
					x: currentCanvasPos.x - lastCanvasPosRef.current.x,
					y: currentCanvasPos.y - lastCanvasPosRef.current.y,
				};

				lastCanvasPosRef.current = currentCanvasPos;

				const snapDelta = (value: number) =>
					snapToGrid ? Math.round(value / gridSize) * gridSize : value;

				// Update card positions
				const updates = cardsToMoveRef.current.map((id) => {
					const currentCard = getCard(id);
					
					if (!currentCard) {
						return { id, updates: {} };
					}

					const newX = currentCard.position_x + delta.x;
					const newY = currentCard.position_y + delta.y;

					return {
						id,
						updates: {
							position_x: snapDelta(newX),
							position_y: snapDelta(newY),
						},
					};
				});

				updateCards(updates);
				onDrag?.(delta);

				// ============================================================================
				// COLUMN OVERLAP DETECTION - ONLY FOR SINGLE CARD DRAG
				// ============================================================================
				if (cardsToMoveRef.current.length === 1) {
					const draggedCardId = cardsToMoveRef.current[0];
					const draggedCard = getCard(draggedCardId);
					
					// Only check for columns if dragging a non-column card
					if (draggedCard && draggedCard.card_type !== 'column') {
						const allCards = new Map(Array.from(useCanvasStore.getState().cards.entries()));
						const overlappingColumns = findOverlappingColumns(draggedCardId, allCards);
						
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

				// ============================================================================
				// HANDLE COLUMN MEMBERSHIP CHANGES
				// ============================================================================
				if (wasDragging && cardsToMoveRef.current.length === 1) {
					const draggedCardId = cardsToMoveRef.current[0];
					const draggedCard = getCard(draggedCardId);
					
					if (draggedCard && draggedCard.card_type !== 'column') {
						// Case 1: Dropped onto a column
						if (potentialTarget) {
							const targetColumn = getCard(potentialTarget) as ColumnCard | undefined;
							
							if (targetColumn) {
								try {
									// Remove from starting column if it was in one
									if (startingColumn && startingColumn !== potentialTarget) {
										await removeCardFromColumn(startingColumn, draggedCardId);
										
										// Update local state for starting column
										const startCol = getCard(startingColumn) as ColumnCard;
										if (startCol) {
											const updatedItems = (startCol.column_cards.column_items || [])
												.filter(item => item.card_id !== draggedCardId)
												.map((item, index) => ({ ...item, position: index }));
											
											updateCard(startingColumn, {
												...startCol,
												column_cards: {
													...startCol.column_cards,
													column_items: updatedItems
												}
											});
										}
									}
									
									// Add to new column (if not already in it)
									if (startingColumn !== potentialTarget) {
										const currentItems = targetColumn.column_cards.column_items || [];
										const newPosition = currentItems.length;
										
										await addCardToColumn(potentialTarget, draggedCardId, newPosition);
										
										// Update local state for target column
										const updatedColumnItems = [
											...currentItems,
											{ card_id: draggedCardId, position: newPosition }
										];
										
										updateCard(potentialTarget, {
											...targetColumn,
											column_cards: {
												...targetColumn.column_cards,
												column_items: updatedColumnItems
											}
										});
										
										console.log(`Added card ${draggedCardId} to column ${potentialTarget}`);
									}
								} catch (error) {
									console.error('Failed to update column membership:', error);
								}
							}
						}
						// Case 2: Dragged out of column (no overlap with any column)
						else if (startingColumn) {
							try {
								await removeCardFromColumn(startingColumn, draggedCardId);
								
								// Update local state
								const startCol = getCard(startingColumn) as ColumnCard;
								if (startCol) {
									const updatedItems = (startCol.column_cards.column_items || [])
										.filter(item => item.card_id !== draggedCardId)
										.map((item, index) => ({ ...item, position: index }));
									
									updateCard(startingColumn, {
										...startCol,
										column_cards: {
											...startCol.column_cards,
											column_items: updatedItems
										}
									});
								}
								
								console.log(`Removed card ${draggedCardId} from column ${startingColumn}`);
							} catch (error) {
								console.error('Failed to remove card from column:', error);
							}
						}
					}
				}

				// Clear potential target
				setPotentialColumnTarget(null);
				startingColumnRef.current = null;

				if (wasDragging) {
					const card = getCard(cardId);
					if (card) {
						onDragEnd?.({ x: card.position_x, y: card.position_y });
						
						// Sync moved cards to Supabase
						cardsToMoveRef.current.forEach(async (id) => {
							const movedCard = getCard(id);
							if (movedCard) {
								try {
									const newZIndex = zIndexUpdatesRef.current.get(id);
									await updateCardTransform(id, {
										position_x: movedCard.position_x,
										position_y: movedCard.position_y,
										z_index: newZIndex !== undefined ? newZIndex : movedCard.z_index,
									});
								} catch (error) {
									console.error('Failed to sync card position:', error);
								}
							}
						});

						// Sync z-index updates for non-moved cards
						zIndexUpdatesRef.current.forEach(async (zIndex, id) => {
							if (!cardsToMoveRef.current.includes(id)) {
								const card = getCard(id);
								if (card) {
									try {
										await updateCardTransform(id, { z_index: zIndex });
									} catch (error) {
										console.error('Failed to sync card z-index:', error);
									}
								}
							}
						});
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
			updateCards,
			setIsDragging,
			setGlobalDragging,
			getCard,
			selectCard,
			bringCardsToFrontOnInteraction,
			setPotentialColumnTarget,
			updateCard,
			onDragStart,
			onDrag,
			onDragEnd,
			snapToGrid,
			gridSize,
			dragThreshold,
			findCardColumn,
			setDragPreview
		]
	);

	useEffect(() => {
		return () => {
			document.onmousemove = null;
			document.onmouseup = null;
		};
	}, []);

	return {
		isDragging,
		handleMouseDown,
	};
}