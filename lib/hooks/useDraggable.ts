/**
 * useDraggable Hook - Integrated Version
 * 
 * Handles dragging for cards and syncs to Supabase
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { useCanvasStore, type Position } from '@/lib/stores/canvas-store';
import { screenToCanvas } from '@/lib/utils/transform';
import { updateCardTransform } from '@/lib/data/cards-client';

interface UseDraggableOptions {
	cardId: string;
	
	onDragStart?: () => void;
	onDrag?: (delta: Position) => void;
	onDragEnd?: (finalPosition: Position) => void;
	
	snapToGrid?: boolean;
	gridSize?: number;
	dragThreshold?: number;
}

export function useDraggable({
	cardId,
	onDragStart,
	onDrag,
	onDragEnd,
	snapToGrid = false,
	gridSize = 10,
	dragThreshold = 1, // Reduced from 3 to 1 for more responsive dragging
}: UseDraggableOptions) {
	const {
		viewport,
		selectedCardIds,
		updateCards,
		setIsDragging: setGlobalDragging,
		getCard,
		selectCard,
		bringCardsToFrontOnInteraction,
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

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.button !== 0) return;

			e.preventDefault();
			e.stopPropagation();

			const card = getCard(cardId);
			if (!card) return;

			const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;
			
			// Update selection IMMEDIATELY and synchronously
			if (!selectedCardIds.has(cardId)) {
				selectCard(cardId, isMultiSelect);
				// After selection update, get the new selected cards
				cardsToMoveRef.current = [cardId];
			} else {
				// Card is already selected, use all selected cards
				cardsToMoveRef.current = Array.from(selectedCardIds);
			}

			// Brings cards to front when drag starts
			// This returns z-index updates that we'll sync to database later
			zIndexUpdatesRef.current = bringCardsToFrontOnInteraction(cardsToMoveRef.current);

			isDraggingRef.current = false;
			hasMovedRef.current = false;

			const canvasPos = screenToCanvas(e.clientX, e.clientY, viewport);
			startPosRef.current = {
				screen: { x: e.clientX, y: e.clientY },
				canvas: canvasPos,
			};
			lastCanvasPosRef.current = canvasPos;

			// Store initial positions for the cards we're going to move
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

				// Use the cards we determined at mousedown
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
			};

			const handleMouseUp = async () => {
				const wasDragging = isDraggingRef.current;
				
				// Immediately clear dragging state
				isDraggingRef.current = false;
				hasMovedRef.current = false;

				setIsDragging(false);
				setGlobalDragging(false);

				if (wasDragging) {
					const card = getCard(cardId);
					if (card) {
						onDragEnd?.({ x: card.position_x, y: card.position_y });
						
						// Sync moved cards to Supabase (fire and forget)
						cardsToMoveRef.current.forEach(async (id) => {
							const movedCard = getCard(id);
							if (movedCard) {
								try {
									// Get the z-index update for this card (if any)
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

						// Also sync z-index updates for cards that weren't moved but had their z-index changed
						zIndexUpdatesRef.current.forEach(async (zIndex, id) => {
							if (!cardsToMoveRef.current.includes(id)) {
								const card = getCard(id);
								if (card) {
									try {
										await updateCardTransform(id, {
											z_index: zIndex,
										});
									} catch (error) {
										console.error('Failed to sync card z-index:', error);
									}
								}
							}
						});
					}
				}

				// Clear the cards to move reference
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
			onDragStart,
			onDrag,
			onDragEnd,
			snapToGrid,
			gridSize,
			dragThreshold,
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