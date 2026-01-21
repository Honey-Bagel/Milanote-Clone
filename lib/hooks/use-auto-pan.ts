/**
 * useAutoPan Hook - Auto-pans the canvas when dragging near edges
 *
 * This hook automatically pans the viewport when the mouse approaches
 * the edges of the canvas during drag operations, similar to Milanote's behavior.
 */

import { useRef, useCallback } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';

interface UseAutoPanOptions {
	/** Zone width from edge where auto-pan triggers (in pixels) */
	edgeThreshold?: number;
	/** Maximum pan speed (in canvas units per frame) */
	maxSpeed?: number;
	/** Whether auto-pan is enabled */
	enabled?: boolean;
}

export function useAutoPan({
	edgeThreshold = 50,
	maxSpeed = 20,
	enabled = true,
}: UseAutoPanOptions = {}) {
	const { viewport, setViewport } = useCanvasStore();
	const animationFrameRef = useRef<number | null>(null);
	const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

	/**
	 * Calculate pan velocity based on distance from edge
	 * Uses easing function for smooth acceleration
	 */
	const calculatePanVelocity = useCallback((
		mousePos: { x: number; y: number },
		viewportRect: DOMRect
	): { x: number; y: number } => {
		let velocityX = 0;
		let velocityY = 0;

		// Distance from edges
		const distanceFromLeft = mousePos.x;
		const distanceFromRight = viewportRect.width - mousePos.x;
		const distanceFromTop = mousePos.y;
		const distanceFromBottom = viewportRect.height - mousePos.y;

		// Calculate velocity for each edge
		// Speed increases as mouse gets closer to edge (inverse relationship)

		// Left edge
		if (distanceFromLeft < edgeThreshold) {
			const ratio = 1 - (distanceFromLeft / edgeThreshold);
			velocityX = maxSpeed * ratio * ratio; // Quadratic easing
		}
		// Right edge
		else if (distanceFromRight < edgeThreshold) {
			const ratio = 1 - (distanceFromRight / edgeThreshold);
			velocityX = -maxSpeed * ratio * ratio;
		}

		// Top edge
		if (distanceFromTop < edgeThreshold) {
			const ratio = 1 - (distanceFromTop / edgeThreshold);
			velocityY = maxSpeed * ratio * ratio;
		}
		// Bottom edge
		else if (distanceFromBottom < edgeThreshold) {
			const ratio = 1 - (distanceFromBottom / edgeThreshold);
			velocityY = -maxSpeed * ratio * ratio;
		}

		return { x: velocityX, y: velocityY };
	}, [edgeThreshold, maxSpeed]);

	/**
	 * Animation loop for smooth panning
	 */
	const panLoop = useCallback(() => {
		if (!lastMousePosRef.current || !enabled) {
			animationFrameRef.current = null;
			return;
		}

		const canvas = document.querySelector('.canvas-viewport');
		if (!canvas) {
			animationFrameRef.current = null;
			return;
		}

		const rect = canvas.getBoundingClientRect();
		const velocity = calculatePanVelocity(lastMousePosRef.current, rect);

		// Only pan if there's actual velocity
		if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
			const currentViewport = useCanvasStore.getState().viewport;

			setViewport({
				x: currentViewport.x + velocity.x,
				y: currentViewport.y + velocity.y,
			});
		}

		// Continue animation loop
		animationFrameRef.current = requestAnimationFrame(panLoop);
	}, [enabled, calculatePanVelocity, setViewport]);

	/**
	 * Start auto-panning based on mouse position
	 */
	const startAutoPan = useCallback((screenX: number, screenY: number) => {
		if (!enabled) return;

		const canvas = document.querySelector('.canvas-viewport');
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();

		// Convert screen coordinates to viewport-relative coordinates
		const relativeX = screenX - rect.left;
		const relativeY = screenY - rect.top;

		lastMousePosRef.current = { x: relativeX, y: relativeY };

		// Start animation loop if not already running
		if (animationFrameRef.current === null) {
			animationFrameRef.current = requestAnimationFrame(panLoop);
		}
	}, [enabled, panLoop]);

	/**
	 * Update mouse position during drag
	 */
	const updateMousePosition = useCallback((screenX: number, screenY: number) => {
		if (!enabled) return;

		const canvas = document.querySelector('.canvas-viewport');
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const relativeX = screenX - rect.left;
		const relativeY = screenY - rect.top;

		lastMousePosRef.current = { x: relativeX, y: relativeY };
	}, [enabled]);

	/**
	 * Stop auto-panning
	 */
	const stopAutoPan = useCallback(() => {
		lastMousePosRef.current = null;

		if (animationFrameRef.current !== null) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
	}, []);

	return {
		startAutoPan,
		updateMousePosition,
		stopAutoPan,
	};
}
