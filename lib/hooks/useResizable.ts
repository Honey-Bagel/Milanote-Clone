/**
 * useResizable Hook
 * 
 * Handles resizing cards and syncing to Supabase
 */

import { useCallback, useState, useRef } from "react";
import { useCanvasStore } from "../stores/canvas-store";
import { screenToCanvas } from "../utils/transform";
import { updateCardTransform } from "../data/cards-client";
import { getDefaultCardDimensions } from "../utils";

interface UseResizableOptions {
	cardId: string;
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
	cardId,
	maxWidth = 1200,
	maxHeight = 1200,
	maintainAspectRatio = false,
	onResizeStart,
	onResize,
	onResizeEnd,
}: UseResizableOptions) {
	const { getCard, updateCard, viewport, setIsResizing } = useCanvasStore();
	const [isResizing, setLocalIsResizing] = useState(false);
	
	const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const startDimensionsRef = useRef<Dimensions>({ width: 0, height: 0 });
	const aspectRatioRef = useRef<number>(1);

	const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'se' | 'e' | 's' | 'sw' | 'ne' | 'nw' | 'n' | 'w' = 'se') => {
		e.preventDefault();
		e.stopPropagation();

		const card = getCard(cardId);
		if (!card) return;

		// Get default data per card type
		const { minWidth, minHeight, canResize, keepAspectRatio: maintainAspectRatio } = getDefaultCardDimensions(card.card_type);

		if (!canResize) return;

		// Store initial state
		const startCanvasPos = screenToCanvas(e.clientX, e.clientY, viewport);
		startPosRef.current = startCanvasPos;
		startDimensionsRef.current = {
			width: card.width,
			height: card.height || minHeight,
		};
		
		// Calculate aspect ratio if needed
		if (maintainAspectRatio) {
			aspectRatioRef.current = card.width / (card.height || minHeight);
		}

		setLocalIsResizing(true);
		setIsResizing(true);
		onResizeStart?.();

		const handleMouseMove = (e: MouseEvent) => {
			const currentCanvasPos = screenToCanvas(e.clientX, e.clientY, viewport);
			
			// Calculate deltas based on handle direction
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

			// Calculate new dimensions
			let newWidth = Math.max(minWidth, Math.min(maxWidth, startDimensionsRef.current.width + deltaX));
			let newHeight = Math.max(minHeight, Math.min(maxHeight, startDimensionsRef.current.height + deltaY));

			// Maintain aspect ratio if needed
			if (maintainAspectRatio) {
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					newHeight = newWidth / aspectRatioRef.current;
				} else {
					newWidth = newHeight * aspectRatioRef.current;
				}
			}

			// Handle position changes for north/west handles
			let newX = card.position_x;
			let newY = card.position_y;
			
			if (handle.includes('w')) {
				newX = card.position_x - (newWidth - card.width);
			}
			if (handle.includes('n')) {
				newY = card.position_y - (newHeight - (card.height || minHeight));
			}

			// Update card in store
			updateCard(cardId, {
				...card,
				width: newWidth,
				height: newHeight,
				position_x: newX,
				position_y: newY,
			});

			onResize?.(newWidth, newHeight);
		};

		const handleMouseUp = async () => {
			setLocalIsResizing(false);
			setIsResizing(false);

			const card = getCard(cardId);

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			if (card) {
				onResizeEnd?.(card.width, card.height || minHeight);

				// Sync to database
				try {
					await updateCardTransform(cardId, {
						width: card.width,
						height: card.height,
						position_x: card.position_x,
						position_y: card.position_y,
					});
				} catch (error) {
					console.error('Failed to sync card dimensions:', error);
				}
			}
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, [
		cardId, 
		getCard, 
		updateCard, 
		viewport, 
		maxWidth, 
		maxHeight,
		maintainAspectRatio,
		setIsResizing,
		onResizeStart,
		onResize,
		onResizeEnd,
	]);

	return {
		isResizing,
		handleMouseDown,
	};
}