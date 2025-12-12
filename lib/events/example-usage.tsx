/**
 * Example Usage of Event Architecture
 *
 * This file shows how to use the event bus in your components.
 * These are working examples you can adapt to your existing components.
 */

'use client';

import { useCanvasEvent, useCanvasEmit } from './event-bus';
import { useCanvasEventHandlers } from './event-handlers';

// ============================================================================
// Example 1: Using in Canvas Component
// ============================================================================

export function CanvasExample({ boardId }: { boardId: string }) {
  // Initialize all event handlers
  useCanvasEventHandlers(boardId);

  const emit = useCanvasEmit();

  const handleCanvasClick = (e: React.MouseEvent) => {
    // If clicking on empty canvas, deselect all cards
    if (e.target === e.currentTarget) {
      emit({ type: 'card.deselectAll' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      emit({ type: 'keyboard.delete' });
    }

    if (e.key === 'Escape') {
      emit({ type: 'keyboard.escape' });
    }

    if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
      if (e.shiftKey) {
        emit({ type: 'keyboard.redo' });
      } else {
        emit({ type: 'keyboard.undo' });
      }
    }
  };

  return (
    <div
      className="canvas"
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Canvas content */}
    </div>
  );
}

// ============================================================================
// Example 2: Using in Card Component
// ============================================================================

export function CardExample({ cardId }: { cardId: string }) {
  const emit = useCanvasEmit();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Emit selection event
    emit({
      type: 'card.select',
      cardId,
      addToSelection: e.shiftKey || e.metaKey || e.ctrlKey,
    });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Start editing on double click
    emit({
      type: 'card.editStart',
      cardId,
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    emit({
      type: 'card.moveStart',
      cardIds: [cardId],
      startPosition: { x: e.clientX, y: e.clientY },
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    emit({
      type: 'card.moveEnd',
      cardIds: [cardId],
      finalPosition: { x: e.clientX, y: e.clientY },
    });
  };

  return (
    <div
      className="card"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      Card content
    </div>
  );
}

// ============================================================================
// Example 3: Using in Toolbar Component
// ============================================================================

export function ToolbarExample() {
  const emit = useCanvasEmit();

  return (
    <div className="toolbar">
      <button
        onClick={() =>
          emit({ type: 'toolbar.alignCards', direction: 'left' })
        }
      >
        Align Left
      </button>

      <button
        onClick={() =>
          emit({ type: 'toolbar.alignCards', direction: 'top' })
        }
      >
        Align Top
      </button>

      <button
        onClick={() =>
          emit({ type: 'card.bringToFront', cardIds: [] }) // Would use selected cards
        }
      >
        Bring to Front
      </button>

      <button
        onClick={() =>
          emit({ type: 'grid.toggle' })
        }
      >
        Toggle Grid
      </button>
    </div>
  );
}

// ============================================================================
// Example 4: Custom Event Handler
// ============================================================================

/**
 * Custom hook that shows a toast when cards are deleted
 */
export function useDeleteNotifications() {
  useCanvasEvent('card.deleted', (event) => {
    const count = event.cardIds.length;
    console.log(`${count} card${count > 1 ? 's' : ''} deleted`);
    // You could trigger a toast notification here
  });
}

/**
 * Custom hook that logs all card movements
 */
export function useMovementLogger() {
  useCanvasEvent('card.moveEnd', (event) => {
    console.log('Cards moved:', {
      cardIds: event.cardIds,
      position: event.finalPosition,
    });
  });
}

/**
 * Custom hook that auto-saves on content changes
 */
export function useAutoSave(boardId: string) {
  useCanvasEvent('card.contentChange', async (event) => {
    console.log('Auto-saving card:', event.cardId);
    // Implement auto-save logic here
  });
}

// ============================================================================
// Example 5: Event-driven Undo/Redo
// ============================================================================

/**
 * Hook that captures events for undo/redo
 */
export function useUndoCapture() {
  // Capture move events
  useCanvasEvent('card.moveEnd', (event) => {
    // Create undo action
    console.log('Creating undo action for move');
    // Add to undo stack
  });

  // Capture resize events
  useCanvasEvent('card.resizeEnd', (event) => {
    console.log('Creating undo action for resize');
  });

  // Capture content changes
  useCanvasEvent('card.contentChange', (event) => {
    console.log('Creating undo action for content change');
  });

  // Capture deletion
  useCanvasEvent('card.deleted', (event) => {
    console.log('Creating undo action for deletion');
  });
}

// ============================================================================
// Example 6: Debugging Events
// ============================================================================

/**
 * Component that shows recent events (for debugging)
 */
export function EventDebugPanel() {
  const history = useEventHistory();

  return (
    <div className="debug-panel">
      <h3>Recent Events</h3>
      <ul>
        {history.slice(-10).map((event, i) => (
          <li key={i}>
            <strong>{event.type}</strong>
            <pre>{JSON.stringify(event, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Import helper
import { useEventHistory } from './event-bus';
