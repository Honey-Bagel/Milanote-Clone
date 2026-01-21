import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export type UndoActionType =
  | 'card_move'
  | 'card_resize'
  | 'card_create'
  | 'card_delete'
  | 'card_content'
  | 'card_reorder'
  | 'card_duplicate'
  | 'batch'; // For multi-select operations

export interface UndoAction {
  type: UndoActionType;
  timestamp: number;
  description: string; // For debugging/display
  do: () => Promise<void | string>; // Forward action
  undo: () => Promise<void>; // Reverse action
}

interface UndoState {
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  maxHistorySize: number;
  isUndoing: boolean; // Prevent adding actions during undo/redo

  // Actions
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  addAction: (action: UndoAction) => void;
  clear: () => void;
  clearOnBoardChange: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useUndoStore = create<UndoState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,
  isUndoing: false,

  undo: async () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];

    set({ isUndoing: true });

    try {
      await action.undo();

      set((state) => ({
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, action],
      }));
    } catch (error) {
      console.error('Undo failed:', error);
    } finally {
      set({ isUndoing: false });
    }
  },

  redo: async () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];

    set({ isUndoing: true });

    try {
      await action.do();

      set((state) => ({
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, action],
      }));
    } catch (error) {
      console.error('Redo failed:', error);
    } finally {
      set({ isUndoing: false });
    }
  },

  addAction: (action) => {
    const { isUndoing, maxHistorySize, undoStack } = get();

    // Don't add actions during undo/redo
    if (isUndoing) return;

    set({
      undoStack: [...undoStack.slice(-(maxHistorySize - 1)), action],
      redoStack: [], // Clear redo stack when new action is added
    });
  },

  clear: () => {
    set({ undoStack: [], redoStack: [] });
  },

  clearOnBoardChange: () => {
    set({ undoStack: [], redoStack: [] });
  },
}));

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook to check if undo/redo is available
 */
export function useCanUndoRedo() {
  const undoStack = useUndoStore((state) => state.undoStack);
  const redoStack = useUndoStore((state) => state.redoStack);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoDepth: undoStack.length,
    redoDepth: redoStack.length,
  };
}