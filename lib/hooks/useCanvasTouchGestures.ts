/**
 * useCanvasTouchGestures Hook
 *
 * Handles touch gestures for mobile canvas interactions:
 * - Two-finger pan
 * - Pinch to zoom
 * - Long-press for context menu
 */

import { useEffect, useRef, type RefObject } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { zoomToPoint } from '@/lib/utils/transform';

interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

interface UseCanvasTouchGesturesOptions {
  /**
   * Enable touch panning (two-finger pan)
   * @default true
   */
  enablePan?: boolean;

  /**
   * Enable pinch to zoom
   * @default true
   */
  enableZoom?: boolean;

  /**
   * Enable long-press for context menu
   * @default true
   */
  enableLongPress?: boolean;

  /**
   * Long press duration in milliseconds
   * @default 500
   */
  longPressDuration?: number;

  /**
   * Callback for long press
   */
  onLongPress?: (x: number, y: number) => void;
}

export function useCanvasTouchGestures(
  canvasRef: RefObject<HTMLDivElement>,
  options: UseCanvasTouchGesturesOptions = {}
) {
  const {
    enablePan = true,
    enableZoom = true,
    enableLongPress = true,
    longPressDuration = 500,
    onLongPress,
  } = options;

  const {
    viewport,
    setViewport,
    setIsPanning,
    interactionMode,
    setInteractionMode,
    resetInteractionMode,
  } = useCanvasStore();

  const touchesRef = useRef<Map<number, TouchPoint>>(new Map());
  const initialDistanceRef = useRef<number>(0);
  const initialViewportRef = useRef(viewport);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Helper to get touch points
    const getTouchPoint = (touch: Touch): TouchPoint => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    });

    // Calculate distance between two touch points
    const getDistance = (p1: TouchPoint, p2: TouchPoint): number => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Calculate center point between two touches
    const getCenter = (p1: TouchPoint, p2: TouchPoint): { x: number; y: number } => ({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    });

    // Clear long press timer
    const clearLongPressTimer = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    // ============================================================================
    // TOUCH START
    // ============================================================================

    const handleTouchStart = (e: TouchEvent) => {
      // Disable touch interactions in drawing mode
      if (interactionMode.mode === 'drawing') return;

      // Update touch tracking
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const point = getTouchPoint(touch);
        touchesRef.current.set(point.id, point);
      }

      const touchCount = touchesRef.current.size;

      // Single touch - start long press timer
      if (touchCount === 1 && enableLongPress) {
        hasMoved.current = false;
        const touch = e.changedTouches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        longPressTimerRef.current = setTimeout(() => {
          if (!hasMoved.current && onLongPress) {
            // Trigger haptic feedback if available
            if ('vibrate' in navigator) {
              navigator.vibrate(50);
            }
            onLongPress(x, y);
          }
        }, longPressDuration);
      }

      // Two fingers - start pan or pinch
      if (touchCount === 2) {
        clearLongPressTimer();
        e.preventDefault(); // Prevent scrolling

        const touches = Array.from(touchesRef.current.values());
        const [p1, p2] = touches;

        // Store initial distance for pinch zoom
        if (enableZoom) {
          initialDistanceRef.current = getDistance(p1, p2);
          initialViewportRef.current = { ...viewport };
        }

        // Set panning mode
        if (enablePan) {
          setIsPanning(true);
          setInteractionMode({ mode: 'panning' });
        }
      }

      // Three or more fingers - clear everything
      if (touchCount >= 3) {
        clearLongPressTimer();
        touchesRef.current.clear();
      }
    };

    // ============================================================================
    // TOUCH MOVE
    // ============================================================================

    const handleTouchMove = (e: TouchEvent) => {
      if (interactionMode.mode === 'drawing') return;

      // Update touch tracking
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const point = getTouchPoint(touch);
        if (touchesRef.current.has(point.id)) {
          touchesRef.current.set(point.id, point);
        }
      }

      const touchCount = touchesRef.current.size;

      // Single touch movement - cancel long press
      if (touchCount === 1) {
        const touch = Array.from(touchesRef.current.values())[0];
        const movement = Math.abs(touch.x - e.changedTouches[0].clientX) +
                         Math.abs(touch.y - e.changedTouches[0].clientY);

        if (movement > 10) {
          hasMoved.current = true;
          clearLongPressTimer();
        }
      }

      // Two-finger gestures
      if (touchCount === 2) {
        e.preventDefault(); // Prevent scrolling

        const touches = Array.from(touchesRef.current.values());
        const [p1, p2] = touches;

        // Get current and previous touches from event
        const currentTouches = Array.from(e.touches).map(getTouchPoint);
        if (currentTouches.length !== 2) return;

        const [curr1, curr2] = currentTouches;
        const currentDistance = getDistance(curr1, curr2);
        const currentCenter = getCenter(curr1, curr2);

        // Calculate pinch zoom
        if (enableZoom && initialDistanceRef.current > 0) {
          const zoomDelta = currentDistance / initialDistanceRef.current;
          const rect = canvas.getBoundingClientRect();
          const centerX = currentCenter.x - rect.left;
          const centerY = currentCenter.y - rect.top;

          // Apply zoom around center point
          const newViewport = zoomToPoint(
            initialViewportRef.current,
            zoomDelta,
            centerX,
            centerY
          );

          setViewport(newViewport);
        }

        // Pan (uses the movement delta)
        if (enablePan) {
          // Calculate movement delta from stored touches
          const prevTouches = Array.from(touchesRef.current.values());
          const prevCenter = getCenter(prevTouches[0], prevTouches[1]);

          const deltaX = currentCenter.x - prevCenter.x;
          const deltaY = currentCenter.y - prevCenter.y;

          setViewport({
            x: viewport.x + deltaX,
            y: viewport.y + deltaY,
          });
        }
      }
    };

    // ============================================================================
    // TOUCH END
    // ============================================================================

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      clearLongPressTimer();

      // Remove ended touches
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        touchesRef.current.delete(touch.identifier);
      }

      const touchCount = touchesRef.current.size;

      // No more touches - reset panning state
      if (touchCount === 0) {
        setIsPanning(false);
        resetInteractionMode();
        initialDistanceRef.current = 0;
      }

      // One touch remaining after two-finger gesture - update initial distance
      if (touchCount === 1) {
        setIsPanning(false);
        resetInteractionMode();
        initialDistanceRef.current = 0;
      }
    };

    // ============================================================================
    // TOUCH CANCEL
    // ============================================================================

    const handleTouchCancel = (e: TouchEvent) => {
      clearLongPressTimer();

      // Remove cancelled touches
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        touchesRef.current.delete(touch.identifier);
      }

      // Reset state if no touches remain
      if (touchesRef.current.size === 0) {
        setIsPanning(false);
        resetInteractionMode();
        initialDistanceRef.current = 0;
      }
    };

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    // Cleanup
    return () => {
      clearLongPressTimer();
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [
    viewport,
    setViewport,
    setIsPanning,
    enablePan,
    enableZoom,
    enableLongPress,
    longPressDuration,
    onLongPress,
    canvasRef,
    interactionMode,
    setInteractionMode,
    resetInteractionMode,
  ]);
}
