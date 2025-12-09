/**
 * useCanvasInteractions Hook
 * 
 * Handles pan (drag canvas), zoom (mouse wheel), and viewport controls
 */

import { useEffect, useRef, type RefObject } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { zoomToPoint, screenToCanvas } from '@/lib/utils/transform';

interface UseCanvasInteractionsOptions {
	/**
	 * Enable panning with space + drag or middle mouse
	 * @default true
	 */
	enablePan?: boolean;

	/**
	 * Enable zooming with Ctrl/Cmd + scroll
	 * @default true
	 */
	enableZoom?: boolean;

	/**
	 * Minimum zoom level
	 * @default 0.1
	 */
	minZoom?: boolean;

	/**
	 * Maximum zoom level
	 * @default 3
	 */
	maxZoom?: number;

	/**
	 * Zoom sensitivity (higher = faster zoom)
	 * @default 0.001
	 */
	zoomSensitivity?: number;
}

export function useCanvasInteractions(
	canvasRef: RefObject<HTMLDivElement>,
	options: UseCanvasInteractionsOptions = {}
) {
	const {
		enablePan = true,
		enableZoom = true,
		minZoom = 0.1,
		maxZoom = 3,
		zoomSensitivity = 0.001,
	} = options;

	const { viewport, setViewport, isPanning, setIsPanning, clearSelection, setEditingCardId, editingCardId } = useCanvasStore();

	const panStartRef = useRef({ x: 0, y: 0 });
	const spaceKeyPressedRef = useRef(false);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// ============================================================================
		// PANNING
		// ============================================================================

		const handleMouseDown = (e: MouseEvent) => {
			// Middle mouse button (1) or Space + left click
			const shouldPan =
				enablePan &&
				(e.button === 1 || (e.button === 0 && spaceKeyPressedRef.current));

			if (shouldPan) {
				e.preventDefault();
				setIsPanning(true);
				panStartRef.current = {
					x: e.clientX - viewport.x,
					y: e.clientY - viewport.y,
				};
				canvas.style.cursor = 'grabbing';
				return;
			}

			// Click on empty canvas to deselect all
			if (e.button === 0 && e.target === canvas && !e.shiftKey) {
				clearSelection();
				setEditingCardId(null);
			}
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isPanning) return;

			setViewport({
				x: e.clientX - panStartRef.current.x,
				y: e.clientY - panStartRef.current.y,
			});
		};

		const handleMouseUp = (e: MouseEvent) => {
			if (isPanning) {
				setIsPanning(false);
				canvas.style.cursor = spaceKeyPressedRef.current ? 'grab' : 'default';
			}
		};

		// ============================================================================
		// ZOOMING
		// ============================================================================

		const handleWheel = (e: WheelEvent) => {
			// Only zoom with Ctrl/Cmd held
			if (!enableZoom || !(e.ctrlKey || e.metaKey)) return;

			e.preventDefault();

			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			// Calculate zoom delta
			const delta = -e.deltaY * zoomSensitivity;
			const zoomDelta = 1 + delta;

			// Zoom towards mouse position
			const newViewport = zoomToPoint(
				viewport,
				zoomDelta,
				mouseX,
				mouseY,
				minZoom,
				maxZoom
			);

			setViewport(newViewport);
		};

		// ============================================================================
		// KEYBOARD (SPACE KEY FOR PAN)
		// ============================================================================

		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger space-to-pan when typing in an input/textarea
			const target = e.target as HTMLElement;
			const isEditing =
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable;

			if (e.code === 'Space' && !e.repeat && enablePan && editingCardId === null && !isEditing) {
				e.preventDefault();
				spaceKeyPressedRef.current = true;
				if (!isPanning) {
					canvas.style.cursor = 'grab';
				}
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code === 'Space' && enablePan) {
				spaceKeyPressedRef.current = false;
				if (!isPanning) {
					canvas.style.cursor = 'default';
				}
			}
		};

		// ============================================================================
		// PREVENT CONTEXT MENU ON MIDDLE CLICK
		// ============================================================================

		const handleContextMenu = (e: MouseEvent) => {
			if (e.button === 1) {
				e.preventDefault();
			}
		};

		// ============================================================================
		// EVENT LISTENERS
		// ============================================================================

		canvas.addEventListener('mousedown', handleMouseDown);
		canvas.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('mouseup', handleMouseUp);
		canvas.addEventListener('mouseleave', handleMouseUp);
		canvas.addEventListener('wheel', handleWheel, { passive: false });
		canvas.addEventListener('contextmenu', handleContextMenu);

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		// Cleanup
		return () => {
			canvas.removeEventListener('mousedown', handleMouseDown);
			canvas.removeEventListener('mousemove', handleMouseMove);
			canvas.removeEventListener('mouseup', handleMouseUp);
			canvas.removeEventListener('mouseleave', handleMouseUp);
			canvas.removeEventListener('wheel', handleWheel);
			canvas.removeEventListener('contextmenu', handleContextMenu);

			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [
		viewport,
		isPanning,
		setViewport,
		setIsPanning,
		clearSelection,
		enablePan,
		enableZoom,
		minZoom,
		maxZoom,
		zoomSensitivity,
		canvasRef,
		editingCardId,
		setEditingCardId
	]);
}