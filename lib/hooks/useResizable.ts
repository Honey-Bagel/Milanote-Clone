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

interface UseResizableOptions {
	card: Card;
	maxWidth?: number;
	maxHeight?: number;
	maintainAspectRatio?: boolean;
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
	maxWidth = 1200,
	maxHeight = 1200,
	maintainAspectRatio = false,
	onResizeStart,
	onResize,
	onResizeEnd,
}: UseResizableOptions) {
	const { viewport, setIsResizing } = useCanvasStore();
	const cardId = card.id;

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

		const { minWidth, minHeight, defaultHeight, canResize, keepAspectRatio: maintainAspectRatio } = getDefaultCardDimensions(cardData.card_type);

		const startCanvasPos = screenToCanvas(e.clientX, e.clientY, viewport);
		startPosRef.current = startCanvasPos;
		startDimensionsRef.current = {
			width: cardData.width,
			height: cardData.height || 0,
			position_x: cardData.position_x,
			position_y: cardData.position_y,
		};

		if (maintainAspectRatio) {
			aspectRatioRef.current = cardData.width / (cardData.height || minHeight);
		}

		setLocalIsResizing(true);
		setIsResizing(true);
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

			let newWidth = Math.max(minWidth, Math.min(maxWidth, startDimensionsRef.current.width + deltaX));
			let newHeight = defaultHeight ?
				Math.max(minHeight, Math.min(maxHeight, startDimensionsRef.current.height + deltaY)) : null;

			if (maintainAspectRatio) {
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					newHeight = newWidth / aspectRatioRef.current;
				} else {
					newWidth = newHeight ? newHeight * aspectRatioRef.current : newWidth;
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

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);

			// Clear resize state immediately
			setLocalIsResizing(false);
			setIsResizing(false);

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

					console.log('[useResizable] DB update successful, waiting 100ms before clearing local state');

					// Wait a bit for the DB update to propagate before clearing local dimensions
					setTimeout(() => {
						console.log('[useResizable] Clearing local dimensions after timeout');
						currentDimensionsRef.current = null;
						setLocalDimensions(null);
					}, 100);
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
		maxWidth,
		maxHeight,
		maintainAspectRatio,
		setIsResizing,
		onResizeStart,
		onResize,
		onResizeEnd,
		card.card_type,
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