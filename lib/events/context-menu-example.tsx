/**
 * Context Menu Priority System
 *
 * This example shows how to handle conflicting context menus using the event system.
 * The key is to use event propagation control and priority handling.
 */

'use client';

import { useCanvasEvent, useCanvasEmit } from './event-bus';
import { useState } from 'react';

// ============================================================================
// Add Context Menu Events to event-bus.ts
// ============================================================================

/**
 * Add these to your CanvasEvent type in event-bus.ts:
 *
 * // Context Menu Events
 * | { type: 'contextMenu.request'; target: 'canvas' | 'card' | 'text-editor'; cardId?: string; position: Point; nativeEvent: React.MouseEvent }
 * | { type: 'contextMenu.open'; menuType: 'canvas' | 'card' | 'text-editor'; position: Point; cardId?: string }
 * | { type: 'contextMenu.close' }
 */

// ============================================================================
// Context Menu Priority Handler
// ============================================================================

/**
 * This hook determines which context menu should open based on priority:
 * 1. Text editor (highest priority - when editing)
 * 2. Card context menu
 * 3. Canvas context menu (lowest priority - fallback)
 */
export function useContextMenuPriority() {
  const [activeMenu, setActiveMenu] = useState<{
    type: 'canvas' | 'card' | 'text-editor';
    position: { x: number; y: number };
    cardId?: string;
  } | null>(null);

  const emit = useCanvasEmit();

  // Listen for context menu requests
  useCanvasEvent('contextMenu.request', (event) => {
    // Priority 1: If target is text-editor, allow native browser menu
    if (event.target === 'text-editor') {
      // Don't prevent default - let browser handle it
      console.log('Allowing native text editor context menu');
      return;
    }

    // Priority 2: Card context menu
    if (event.target === 'card') {
      event.nativeEvent.preventDefault();
      event.nativeEvent.stopPropagation();

      setActiveMenu({
        type: 'card',
        position: event.position,
        cardId: event.cardId,
      });

      emit({
        type: 'contextMenu.open',
        menuType: 'card',
        position: event.position,
        cardId: event.cardId,
      });
      return;
    }

    // Priority 3: Canvas context menu (fallback)
    if (event.target === 'canvas') {
      event.nativeEvent.preventDefault();
      setActiveMenu({
        type: 'canvas',
        position: event.position,
      });

      emit({
        type: 'contextMenu.open',
        menuType: 'canvas',
        position: event.position,
      });
    }
  });

  // Close menu on close event
  useCanvasEvent('contextMenu.close', () => {
    setActiveMenu(null);
  });

  return activeMenu;
}

// ============================================================================
// Canvas Component Integration
// ============================================================================

export function CanvasWithContextMenu({ boardId }: { boardId: string }) {
  const emit = useCanvasEmit();
  const activeMenu = useContextMenuPriority();

  const handleContextMenu = (e: React.MouseEvent) => {
    // Emit request for canvas context menu
    emit({
      type: 'contextMenu.request',
      target: 'canvas',
      position: { x: e.clientX, y: e.clientY },
      nativeEvent: e,
    });
  };

  return (
    <div className="canvas" onContextMenu={handleContextMenu}>
      {/* Canvas content */}

      {/* Render context menu based on active menu */}
      {activeMenu?.type === 'canvas' && (
        <CanvasContextMenu position={activeMenu.position} />
      )}
    </div>
  );
}

// ============================================================================
// Card Component Integration
// ============================================================================

export function CardWithContextMenu({ cardId }: { cardId: string }) {
  const emit = useCanvasEmit();
  const activeMenu = useContextMenuPriority();

  const handleContextMenu = (e: React.MouseEvent) => {
    // Stop propagation so canvas doesn't handle it
    e.stopPropagation();

    // Emit request for card context menu
    emit({
      type: 'contextMenu.request',
      target: 'card',
      cardId,
      position: { x: e.clientX, y: e.clientY },
      nativeEvent: e,
    });
  };

  return (
    <div className="card" onContextMenu={handleContextMenu}>
      {/* Card content */}

      {/* Render card context menu if this card's menu is active */}
      {activeMenu?.type === 'card' && activeMenu.cardId === cardId && (
        <CardContextMenu cardId={cardId} position={activeMenu.position} />
      )}
    </div>
  );
}

// ============================================================================
// Note Card Component Integration (THE KEY PART!)
// ============================================================================

export function NoteCardWithSmartContextMenu({ cardId }: { cardId: string }) {
  const emit = useCanvasEmit();
  const isEditing = useCanvasStore((state) => state.editingCardId === cardId);

  const handleContextMenu = (e: React.MouseEvent) => {
    // Check if we're inside the text editor
    const target = e.target as HTMLElement;
    const isTextEditor = target.closest('[contenteditable="true"]') ||
                        target.closest('.ProseMirror') ||
                        target.hasAttribute('contenteditable');

    if (isTextEditor && isEditing) {
      // We're in the text editor - let native browser menu handle it
      console.log('Inside text editor - allowing native context menu');

      // Emit event but don't prevent default
      emit({
        type: 'contextMenu.request',
        target: 'text-editor',
        cardId,
        position: { x: e.clientX, y: e.clientY },
        nativeEvent: e,
      });

      // DON'T call e.preventDefault() - this allows native menu
      return;
    }

    // We're outside the text editor - show card context menu
    e.preventDefault();
    e.stopPropagation();

    emit({
      type: 'contextMenu.request',
      target: 'card',
      cardId,
      position: { x: e.clientX, y: e.clientY },
      nativeEvent: e,
    });
  };

  return (
    <div className="card" onContextMenu={handleContextMenu}>
      {/* Your note card content */}
    </div>
  );
}

// ============================================================================
// Alternative: Using Event Delegation
// ============================================================================

/**
 * Even cleaner approach: Use a single context menu handler at the Canvas level
 * that inspects the event target to determine what menu to show
 */
export function CanvasWithSmartContextMenu({ boardId }: { boardId: string }) {
  const emit = useCanvasEmit();
  const activeMenu = useContextMenuPriority();

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Priority 1: Check if we're in a text editor
    const isInTextEditor =
      target.closest('[contenteditable="true"]') ||
      target.closest('.ProseMirror') ||
      target.closest('[data-text-editor]');

    if (isInTextEditor) {
      // Check if the card is being edited
      const cardElement = target.closest('[data-card-id]');
      const cardId = cardElement?.getAttribute('data-card-id');
      const editingCardId = useCanvasStore.getState().editingCardId;

      if (cardId === editingCardId) {
        // Allow native browser context menu
        console.log('Allowing native text editor context menu');
        return;
      }
    }

    // Priority 2: Check if we're on a card
    const cardElement = target.closest('[data-card-id]');
    if (cardElement) {
      const cardId = cardElement.getAttribute('data-card-id');

      e.preventDefault();
      e.stopPropagation();

      emit({
        type: 'contextMenu.request',
        target: 'card',
        cardId: cardId!,
        position: { x: e.clientX, y: e.clientY },
        nativeEvent: e,
      });
      return;
    }

    // Priority 3: Canvas context menu
    e.preventDefault();
    emit({
      type: 'contextMenu.request',
      target: 'canvas',
      position: { x: e.clientX, y: e.clientY },
      nativeEvent: e,
    });
  };

  return (
    <div className="canvas" onContextMenu={handleContextMenu}>
      {/* All cards will be rendered with data-card-id attribute */}
      {/* Text editors will be marked with data-text-editor attribute */}
    </div>
  );
}

// ============================================================================
// Placeholder Components
// ============================================================================

function CanvasContextMenu({ position }: { position: { x: number; y: number } }) {
  return (
    <div style={{ position: 'fixed', left: position.x, top: position.y }}>
      Canvas Menu
    </div>
  );
}

function CardContextMenu({ cardId, position }: { cardId: string; position: { x: number; y: number } }) {
  return (
    <div style={{ position: 'fixed', left: position.x, top: position.y }}>
      Card Menu for {cardId}
    </div>
  );
}

// Import statement (add to imports at top)
import { useCanvasStore } from '@/lib/stores/canvas-store';
