/**
 * Practical Solution for NoteCard Context Menu Conflict
 *
 * This shows exactly how to integrate the event system into your existing NoteCardComponent
 * to fix the context menu conflict.
 */

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCanvasEmit } from './event-bus';
import { useCanvasStore } from '@/lib/stores/canvas-store';

// ============================================================================
// Step 1: Update Your Event Types
// ============================================================================

/**
 * Add these events to your CanvasEvent type in event-bus.ts:
 *
 * // Context Menu Events
 * | { type: 'contextMenu.request';
 *     target: 'canvas' | 'card' | 'text-editor';
 *     cardId?: string;
 *     position: Point;
 *     element: HTMLElement;
 *     shouldPreventDefault: boolean }
 * | { type: 'contextMenu.show'; menuType: string; position: Point; cardId?: string }
 * | { type: 'contextMenu.hide' }
 */

// ============================================================================
// Step 2: Smart Context Menu Handler Hook
// ============================================================================

/**
 * Hook that determines whether to show custom context menu or allow native
 */
export function useSmartContextMenu(cardId: string, isEditing: boolean) {
  const emit = useCanvasEmit();

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if we're inside a TipTap editor
    const isProseMirror = target.closest('.ProseMirror');
    const isContentEditable = target.closest('[contenteditable="true"]');
    const isTextEditor = isProseMirror || isContentEditable;

    // If we're in the text editor AND editing this card, allow native menu
    if (isTextEditor && isEditing) {
      console.log('📝 Native text editor context menu');

      // Emit event but DON'T prevent default
      emit({
        type: 'contextMenu.request',
        target: 'text-editor',
        cardId,
        position: { x: e.clientX, y: e.clientY },
        element: target,
        shouldPreventDefault: false,
      });

      // Allow native browser context menu
      return;
    }

    // Otherwise, show custom card context menu
    e.preventDefault();
    e.stopPropagation();

    console.log('🎴 Custom card context menu');

    emit({
      type: 'contextMenu.request',
      target: 'card',
      cardId,
      position: { x: e.clientX, y: e.clientY },
      element: target,
      shouldPreventDefault: true,
    });
  };

  return handleContextMenu;
}

// ============================================================================
// Step 3: Updated NoteCardComponent
// ============================================================================

export function NoteCardComponentWithSmartMenu({ cardId }: { cardId: string }) {
  const emit = useCanvasEmit();
  const editingCardId = useCanvasStore((state) => state.editingCardId);
  const isEditing = editingCardId === cardId;

  // Get smart context menu handler
  const handleContextMenu = useSmartContextMenu(cardId, isEditing);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Your note content here</p>',
    editable: isEditing,
  });

  return (
    <div
      className="note-card"
      data-card-id={cardId}
      onContextMenu={handleContextMenu}
      onClick={() => {
        if (!isEditing) {
          emit({ type: 'card.select', cardId, addToSelection: false });
        }
      }}
      onDoubleClick={() => {
        emit({ type: 'card.editStart', cardId });
      }}
    >
      {/* Mark the editor with data attribute for easier detection */}
      <div data-text-editor="true">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ============================================================================
// Step 4: Even Simpler - Inline Detection
// ============================================================================

/**
 * The simplest possible solution - just check the target inline
 */
export function NoteCardSimpleSolution({ cardId }: { cardId: string }) {
  const editingCardId = useCanvasStore((state) => state.editingCardId);
  const isEditing = editingCardId === cardId;

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if click is on text editor content
    const isOnEditor = target.closest('.ProseMirror') !== null;

    if (isOnEditor && isEditing) {
      // We're editing text - allow native menu for spell check, etc.
      console.log('Allowing native context menu in text editor');
      return; // Don't prevent default!
    }

    // Otherwise show custom card menu
    e.preventDefault();
    console.log('Showing custom card context menu');

    // Your custom context menu logic here
    // (You can keep your existing context menu code)
  };

  const editor = useEditor({
    extensions: [StarterKit],
    editable: isEditing,
  });

  return (
    <div className="note-card" onContextMenu={handleContextMenu}>
      <EditorContent editor={editor} />
    </div>
  );
}

// ============================================================================
// Step 5: Canvas-Level Context Menu Handler (Recommended)
// ============================================================================

/**
 * Put this in your Canvas component for centralized control
 */
export function useCanvasContextMenuHandler() {
  const emit = useCanvasEmit();
  const editingCardId = useCanvasStore((state) => state.editingCardId);

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 1. Check if we're in a text editor that's currently being edited
    const editorElement = target.closest('.ProseMirror');
    if (editorElement) {
      const cardElement = target.closest('[data-card-id]');
      const cardId = cardElement?.getAttribute('data-card-id');

      if (cardId === editingCardId) {
        // Allow native browser menu for spell check, etc.
        console.log('✅ Native text menu allowed');
        return;
      }
    }

    // 2. Check if we're on a card (but not in editor)
    const cardElement = target.closest('[data-card-id]');
    if (cardElement) {
      const cardId = cardElement.getAttribute('data-card-id')!;

      e.preventDefault();
      e.stopPropagation();

      emit({
        type: 'contextMenu.show',
        menuType: 'card',
        position: { x: e.clientX, y: e.clientY },
        cardId,
      });
      return;
    }

    // 3. Otherwise it's canvas
    e.preventDefault();
    emit({
      type: 'contextMenu.show',
      menuType: 'canvas',
      position: { x: e.clientX, y: e.clientY },
    });
  };

  return handleContextMenu;
}

// ============================================================================
// How to Use in Your Canvas
// ============================================================================

export function CanvasExample() {
  const handleContextMenu = useCanvasContextMenuHandler();

  return (
    <div className="canvas" onContextMenu={handleContextMenu}>
      {/* Your cards here */}
      {/* Cards must have data-card-id attribute */}
    </div>
  );
}

// ============================================================================
// Summary: What This Solves
// ============================================================================

/**
 * PROBLEM:
 * - Right-click on canvas → Want custom canvas menu
 * - Right-click on card → Want custom card menu
 * - Right-click on text while editing → Want native browser menu (spell check, etc.)
 *
 * SOLUTION:
 * 1. Use event.target to detect where the click happened
 * 2. Check if we're inside .ProseMirror (TipTap's editor class)
 * 3. Check if the card is currently being edited
 * 4. If both true → Don't call preventDefault(), allow native menu
 * 5. Otherwise → Call preventDefault() and show custom menu
 *
 * KEY INSIGHT:
 * The browser's native context menu appears when you DON'T call preventDefault().
 * So for text editors, simply return early without preventing default.
 *
 * BENEFITS OF EVENT SYSTEM:
 * - Centralized logic in one place
 * - Easy to debug (log all context menu events)
 * - Can add analytics, undo actions, etc. based on menu events
 * - Testable (emit events in tests)
 */
