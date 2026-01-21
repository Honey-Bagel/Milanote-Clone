/**
 * useResizable Hook - With Manual History Tracking
 *
 * Only creates history entries when you explicitly save after resize completes
 */

import { useCallback, useState, useRef, useMemo } from "react";
import { useCanvasStore } from "../stores/canvas-store";
import { screenToCanvas } from "../utils/transform";
import { CardService } from "@/lib/services";
import { getDefaultCardDimensions } from "../utils";
import type { Card } from "@/lib/types";
import { useBoardCards } from "@/lib/hooks/cards";
import { getCardBehavior, type CardBehaviorConfig } from "@/lib/types/card-behaviors";

interface UseResizableOptions {
	card: Card;
	maxWidth?: number;
	maxHeight?: number;
	maintainAspectRatio?: boolean;
	behavior?: CardBehaviorConfig; // Optional: If not provided, will look up from card type
	measuredHeight?: number | null; // For note cards: content height for snap-to-content
	onResizeStart?: () => void;
	onResize?: (width: number, height: number) => void;
	onResizeEnd?: (width: number, height: number) => void;
}

interface Dimensions {
	width: number;
	height: number;
}

export function useResizable({
	card,
	maxWidth,
	maxHeight,
	maintainAspectRatio,
	behavior,
	measuredHeight,
	onResizeStart,
	onResize,
	onResizeEnd,
}: UseResizableOptions) {
	const { viewport, setIsResizing, setEditingCardId, setInteractionMode } = useCanvasStore();
	const cardId = card.id;

	// Get behavior config (use provided or look up from card type)
	const cardBehavior = behavior || getCardBehavior(card.card_type);

	// Use behavior config for constraints, with fallback to provided options
	const finalMaxWidth = maxWidth ?? cardBehavior.maxWidth ?? 1200;
	const finalMaxHeight = maxHeight ?? cardBehavior.maxHeight ?? 1200;
	const finalMaintainAspectRatio = maintainAspectRatio ?? cardBehavior.maintainAspectRatio;

	// Get cards from InstantDB
	const { cards: cardsArray } = useBoardCards(card.board_id);

	// Create a local cardsMap for lookups
	const cardsMap = useMemo(
		() => new Map(cardsArray.map(c => [c.id, c])),
		[cardsArray]
	);
	const [isResizing, setLocalIsResizing] = useState(false);
	const [localDimensions, setLocalDimensions] = useState<{ width: number; height: number; position_x: number; position_y: number } | null>(null);

	const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const startDimensionsRef = useRef<Dimensions & { position_x: number; position_y: number }>({
		width: 0,
		height: 0,
		position_x: 0,
		position_y: 0,
	});
	const currentDimensionsRef = useRef<{ width: number; height: number; position_x: number; position_y: number } | null>(null);
	const aspectRatioRef = useRef<number>(1);

	const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'se' | 'e' | 's' | 'sw' | 'ne' | 'nw' | 'n' | 'w' = 'se') => {
		e.preventDefault();
		e.stopPropagation();

		const cardData = cardsMap.get(cardId);
		if (!cardData) return;

		const { minWidth, minHeight, defaultHeight, canResize } = getDefaultCardDimensions(cardData.card_type);

		// Use behavior config for aspect ratio and constraints
		const shouldMaintainAspectRatio = finalMaintainAspectRatio;

		const startCanvasPos = screenToCanvas(e.clientX, e.clientY, viewport);
		startPosRef.current = startCanvasPos;
		startDimensionsRef.current = {
			width: cardData.width,
			height: cardData.height || 0,
			position_x: cardData.position_x,
			position_y: cardData.position_y,
		};

		if (shouldMaintainAspectRatio) {
			aspectRatioRef.current = cardData.width / (cardData.height || minHeight);
		}

		setLocalIsResizing(true);
		setIsResizing(true);
		// Set interaction mode to resizing
		setInteractionMode({ mode: 'resizing', cardId, handle });
		onResizeStart?.();

		const handleMouseMove = (e: MouseEvent) => {
			// Get fresh card data from the map on each move
			const currentCardData = cardsMap.get(cardId);
			if (!currentCardData) {
				console.error('[useResizable] Card not found in map during resize:', cardId);
				return;
			}

			const currentCanvasPos = screenToCanvas(e.clientX, e.clientY, viewport);

			let deltaX = 0;
			let deltaY = 0;

			if (handle.includes('e')) {
				deltaX = currentCanvasPos.x - startPosRef.current.x;
			}
			if (handle.includes('w')) {
				deltaX = startPosRef.current.x - currentCanvasPos.x;
			}
			if (handle.includes('s')) {
				deltaY = currentCanvasPos.y - startPosRef.current.y;
			}
			if (handle.includes('n')) {
				deltaY = startPosRef.current.y - currentCanvasPos.y;
			}

			let newWidth = Math.max(minWidth, Math.min(finalMaxWidth, startDimensionsRef.current.width + deltaX));
			let newHeight = defaultHeight ?
				Math.max(minHeight, Math.min(finalMaxHeight, startDimensionsRef.current.height + deltaY)) : null;

			if (shouldMaintainAspectRatio) {
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					newHeight = newWidth / aspectRatioRef.current;
				} else {
					newWidth = newHeight ? newHeight * aspectRatioRef.current : newWidth;
				}
			}

			// Snap-to-content for note cards (hybrid height mode)
			// When resizing height and within snap range of content height, snap to it
			const SNAP_RANGE = 20;
			const isNoteCard = currentCardData.card_type === 'note';
			const isResizingHeight = handle.includes('s') || handle.includes('n');

			if (isNoteCard && isResizingHeight && newHeight !== null) {
				console.log('[useResizable] Resize info:', {
					newHeight,
					measuredHeight,
					storedHeight: currentCardData.height,
					cardId: currentCardData.id,
				});

				if (measuredHeight && measuredHeight > 0) {
					const distanceFromContent = Math.abs(newHeight - measuredHeight);

					if (distanceFromContent <= SNAP_RANGE) {
						// Snap to content height!
						console.log('[useResizable] ✨ SNAPPING to content height during resize:', {
							from: newHeight,
							to: measuredHeight,
							distanceFromContent,
						});
						newHeight = measuredHeight;
					}
				} else {
					console.log('[useResizable] ⚠️ No measuredHeight available for snap');
				}
			}

			let newX = startDimensionsRef.current.position_x;
			let newY = startDimensionsRef.current.position_y;

			if (handle.includes('w')) {
				newX = startDimensionsRef.current.position_x - (newWidth - startDimensionsRef.current.width);
			}
			if (handle.includes('n')) {
				newY = startDimensionsRef.current.position_y - ((newHeight || startDimensionsRef.current.height || minHeight) - (startDimensionsRef.current.height || minHeight));
			}

			const newDimensions = {
				width: newWidth,
				height: newHeight !== null ? newHeight : (startDimensionsRef.current.height || 0),
				position_x: newX,
				position_y: newY,
			};

			// Store in ref immediately so handleMouseUp can access it
			currentDimensionsRef.current = newDimensions;

			// Update local state for immediate visual feedback
			setLocalDimensions(newDimensions);

			onResize?.(newWidth, newHeight !== null ? newHeight : (startDimensionsRef.current.height || 0));
		};

		const handleMouseUp = async () => {
			const currentCard = cardsMap.get(cardId);
			// Use the ref instead of state to get the most recent value
			const finalDimensions = currentDimensionsRef.current;

			console.log('[useResizable] Mouse up - starting cleanup:', {
				cardId,
				currentCardDimensions: currentCard ? { width: currentCard.width, height: currentCard.height } : null,
				finalDimensions,
				startDimensions: startDimensionsRef.current,
			});

			setEditingCardId(null);

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);

			// Clear resize state immediately
			setLocalIsResizing(false);
			setIsResizing(false);
			// Reset interaction mode to idle
			setInteractionMode({ mode: 'idle' });

			// Check if size actually changed using local dimensions
			const sizeChanged = finalDimensions && currentCard && (
				Math.abs(finalDimensions.width - startDimensionsRef.current.width) > 1 ||
				Math.abs(finalDimensions.height - startDimensionsRef.current.height) > 1
			);

			console.log('[useResizable] Size changed?', sizeChanged);

			if (currentCard && finalDimensions && sizeChanged) {
				onResizeEnd?.(finalDimensions.width, finalDimensions.height);

				// Sync to database with InstantDB
				const boardId = currentCard.board_id;
				const oldSize = startDimensionsRef.current;

				console.log('[useResizable] Syncing to database:', {
					cardId,
					boardId,
					newDimensions: finalDimensions,
					oldDimensions: oldSize,
				});

				try {
					await CardService.updateCardTransform({
						cardId,
						boardId,
						transform: {
							width: finalDimensions.width,
							height: finalDimensions.height,
							position_x: finalDimensions.position_x,
							position_y: finalDimensions.position_y,
						},
						withUndo: true,
						previousTransform: {
							width: oldSize.width,
							height: oldSize.height,
							position_x: oldSize.position_x,
							position_y: oldSize.position_y,
						},
					});

					console.log('[useResizable] DB update successful, clearing local state immediately');

					// Clear local dimensions immediately - no setTimeout to avoid visual jump
					// The DB will propagate the update and the card will use the DB value
					currentDimensionsRef.current = null;
					setLocalDimensions(null);
				} catch (error) {
					console.error('[useResizable] Failed to sync card dimensions:', error);
					// Clear local dimensions even on error
					currentDimensionsRef.current = null;
					setLocalDimensions(null);
				}
			} else {
				console.log('[useResizable] No change detected, clearing local dimensions immediately');
				// No change, clear immediately
				currentDimensionsRef.current = null;
				setLocalDimensions(null);
			}
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, [
		cardId,
		cardsMap,
		viewport,
		finalMaxWidth,
		finalMaxHeight,
		finalMaintainAspectRatio,
		measuredHeight,
		setIsResizing,
		setInteractionMode,
		onResizeStart,
		onResize,
		onResizeEnd,
		setEditingCardId,
	]);

	// Return the current dimensions (either local during resize or from DB)
	const currentDimensions = localDimensions || {
		width: card.width,
		height: card.height || 0,
		position_x: card.position_x,
		position_y: card.position_y,
	};

	return {
		isResizing,
		handleMouseDown,
		currentDimensions,
	};
}