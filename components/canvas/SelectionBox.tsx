/**
 * SelectionBox Component
 * 
 * Visual feedback for multi-select by dragging
 */

'use client';

import { useCanvasStore } from '@/lib/stores/canvas-store';
import { canvasToScreen, getNormalizedBox } from '@/lib/utils/transform';

export function SelectionBox() {
  const { selectionBox, viewport, isDrawingSelection } = useCanvasStore();

  // Only show if we're actively drawing a selection
  if (!selectionBox || !isDrawingSelection) {
	return null;
  };

  // Convert canvas coordinates to screen coordinates
  const start = canvasToScreen(selectionBox.startX, selectionBox.startY, viewport);
  const current = canvasToScreen(selectionBox.currentX, selectionBox.currentY, viewport);

  const box = getNormalizedBox(start.x, start.y, current.x, current.y);

  return (
    <div
      className="selection-box"
      style={{
        position: 'fixed',
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height || 0,
        border: '1px solid var(--primary)',
        backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)',
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    />
  );
}