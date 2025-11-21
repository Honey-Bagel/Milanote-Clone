/**
 * useResizable Hook - With Manual History Tracking
 * 
 * Only creates history entries when you explicitly save after resize completes
 */

import { useCallback, useState, useRef } from "react";
import { useCanvasStore } from "../stores/canvas-store";
import { screenToCanvas } from "../utils/transform";
import { updateCardTransform } from "../data/cards-client";
import { getDefaultCardDimensions } from "../utils";
import type { Card } from "@/lib/types";

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
	const preResizeStateRef = useRef<Map<string, Card> | null>(null);

	const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'se' | 'e' | 's' | 'sw' | 'ne' | 'nw' | 'n' | 'w' = 'se') => {
		e.preventDefault();
		e.stopPropagation();

		const card = getCard(cardId);
		if (!card) return;

		const { minWidth, minHeight, defaultHeight, canResize, keepAspectRatio: maintainAspectRatio } = getDefaultCardDimensions(card.card_type);

		const startCanvasPos = screenToCanvas(e.clientX, e.clientY, viewport);
		startPosRef.current = startCanvasPos;
		startDimensionsRef.current = {
			width: card.width,
			height: card.height || 0,
		};
		
		if (maintainAspectRatio) {
			aspectRatioRef.current = card.width / (card.height || minHeight);
		}

		// Save pre-resize state and pause history tracking
		preResizeStateRef.current = new Map(useCanvasStore.getState().cards);
		useCanvasStore.temporal.getState().pause();

		setLocalIsResizing(true);
		setIsResizing(true);
		onResizeStart?.();

		const handleMouseMove = (e: MouseEvent) => {
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
					newWidth = newHeight ? newHeight * aspectRatioRef.current : null;
				}
			}

			let newX = card.position_x;
			let newY = card.position_y;
			
			if (handle.includes('w')) {
				newX = card.position_x - (newWidth - card.width);
			}
			if (handle.includes('n')) {
				newY = card.position_y - (newHeight - (card.height || minHeight));
			}

			updateCard(cardId, {
				...card,
				width: newWidth,
				height: newHeight ? newHeight : card.height,
				position_x: newX,
				position_y: newY,
			});

			onResize?.(newWidth, newHeight ? newHeight : card.height);
		};

		const handleMouseUp = async () => {
			setLocalIsResizing(false);
			setIsResizing(false);

			const card = getCard(cardId);

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);

			// Handle history based on whether size actually changed
			const temporal = useCanvasStore.temporal.getState();
			const sizeChanged = card && (
				Math.abs(card.width - startDimensionsRef.current.width) > 1 ||
				Math.abs((card.height || 0) - startDimensionsRef.current.height) > 1
			);

			if (sizeChanged && preResizeStateRef.current) {
				// Size changed - add pre-resize state to history
				const currentState = useCanvasStore.getState();
				const preResizePartialState = {
					cards: preResizeStateRef.current,
					viewport: currentState.viewport
				};

				temporal.pastStates.push(preResizePartialState);
				temporal.futureStates.length = 0;
				temporal.resume();
				preResizeStateRef.current = null;
			} else if (preResizeStateRef.current) {
				// No change - just resume without creating history
				temporal.resume();
				preResizeStateRef.current = null;
			}

			if (card) {
				onResizeEnd?.(card.width, card.height);

				if (sizeChanged) {
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