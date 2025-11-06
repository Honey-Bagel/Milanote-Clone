/**
 * useKeyboardShortcuts Hook
 * 
 * Handles all keyboard shortcuts for the canvas
 */

import { useEffect } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';

interface UseKeyboardShortcutsOptions {
  /**
   * Whether keyboard shortcuts are enabled
   * @default true
   */
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options;

  const {
    selectedCardIds,
    deleteCards,
    copySelected,
    cutSelected,
    paste,
    undo,
    redo,
    selectAll,
    duplicateCard,
    bringToFront,
    sendToBack,
    zoomIn,
    zoomOut,
    resetViewport,
    zoomToFit,
  } = useCanvasStore();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input/textarea
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isMod = e.metaKey || e.ctrlKey;

      // ============================================================================
      // SELECTION SHORTCUTS
      // ============================================================================

      // Select All: Cmd/Ctrl + A
      if (isMod && e.key === 'a' && !isEditing) {
        e.preventDefault();
        selectAll();
        return;
      }

      // ============================================================================
      // CLIPBOARD SHORTCUTS
      // ============================================================================

      // Copy: Cmd/Ctrl + C
      if (isMod && e.key === 'c' && !isEditing && selectedCardIds.size > 0) {
        e.preventDefault();
        copySelected();
        return;
      }

      // Cut: Cmd/Ctrl + X
      if (isMod && e.key === 'x' && !isEditing && selectedCardIds.size > 0) {
        e.preventDefault();
        cutSelected();
        return;
      }

      // Paste: Cmd/Ctrl + V
      if (isMod && e.key === 'v' && !isEditing) {
        e.preventDefault();
        paste();
        return;
      }

      // Duplicate: Cmd/Ctrl + D
      if (isMod && e.key === 'd' && !isEditing && selectedCardIds.size > 0) {
        e.preventDefault();
        // Duplicate all selected cards
        Array.from(selectedCardIds).forEach((id) => duplicateCard(id));
        return;
      }

      // ============================================================================
      // DELETE SHORTCUTS
      // ============================================================================

      // Delete/Backspace: Delete selected cards
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !isEditing &&
        selectedCardIds.size > 0
      ) {
        e.preventDefault();
        deleteCards(Array.from(selectedCardIds));
        return;
      }

      // ============================================================================
      // UNDO/REDO SHORTCUTS
      // ============================================================================

      // Undo: Cmd/Ctrl + Z
      if (isMod && e.key === 'z' && !e.shiftKey && !isEditing) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        ((isMod && e.key === 'z' && e.shiftKey) || (isMod && e.key === 'y')) &&
        !isEditing
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // ============================================================================
      // LAYERING SHORTCUTS
      // ============================================================================

      // Bring to Front: Cmd/Ctrl + ]
      if (isMod && e.key === ']' && !isEditing && selectedCardIds.size > 0) {
        e.preventDefault();
        Array.from(selectedCardIds).forEach((id) => bringToFront(id));
        return;
      }

      // Send to Back: Cmd/Ctrl + [
      if (isMod && e.key === '[' && !isEditing && selectedCardIds.size > 0) {
        e.preventDefault();
        Array.from(selectedCardIds).forEach((id) => sendToBack(id));
        return;
      }

      // ============================================================================
      // ZOOM SHORTCUTS
      // ============================================================================

      // Zoom In: Cmd/Ctrl + Plus/Equals
      if (isMod && (e.key === '+' || e.key === '=') && !isEditing) {
        e.preventDefault();
        zoomIn();
        return;
      }

      // Zoom Out: Cmd/Ctrl + Minus
      if (isMod && (e.key === '-' || e.key === '_') && !isEditing) {
        e.preventDefault();
        zoomOut();
        return;
      }

      // Reset Zoom: Cmd/Ctrl + 0
      if (isMod && e.key === '0' && !isEditing) {
        e.preventDefault();
        resetViewport();
        return;
      }

      // Zoom to Fit: Cmd/Ctrl + 1
      if (isMod && e.key === '1' && !isEditing) {
        e.preventDefault();
        zoomToFit();
        return;
      }

      // ============================================================================
      // ESC - CLEAR SELECTION
      // ============================================================================

      if (e.key === 'Escape') {
        e.preventDefault();
        useCanvasStore.getState().clearSelection();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    selectedCardIds,
    deleteCards,
    copySelected,
    cutSelected,
    paste,
    undo,
    redo,
    selectAll,
    duplicateCard,
    bringToFront,
    sendToBack,
    zoomIn,
    zoomOut,
    resetViewport,
    zoomToFit,
  ]);
}

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = {
  selection: {
    'Cmd/Ctrl + A': 'Select all',
    Escape: 'Clear selection',
  },
  clipboard: {
    'Cmd/Ctrl + C': 'Copy',
    'Cmd/Ctrl + X': 'Cut',
    'Cmd/Ctrl + V': 'Paste',
    'Cmd/Ctrl + D': 'Duplicate',
  },
  delete: {
    'Delete/Backspace': 'Delete selected',
  },
  history: {
    'Cmd/Ctrl + Z': 'Undo',
    'Cmd/Ctrl + Shift + Z': 'Redo',
    'Cmd/Ctrl + Y': 'Redo',
  },
  layering: {
    'Cmd/Ctrl + ]': 'Bring to front',
    'Cmd/Ctrl + [': 'Send to back',
  },
  zoom: {
    'Cmd/Ctrl + Plus': 'Zoom in',
    'Cmd/Ctrl + Minus': 'Zoom out',
    'Cmd/Ctrl + 0': 'Reset zoom',
    'Cmd/Ctrl + 1': 'Zoom to fit',
  },
  pan: {
    'Space + Drag': 'Pan canvas',
    'Middle Mouse + Drag': 'Pan canvas',
  },
} as const;