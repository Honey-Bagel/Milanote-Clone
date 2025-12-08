import { create, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { temporal, TemporalState } from 'zundo';
import { enableMapSet } from 'immer';
import type { Card, Connection } from '@/lib/types';
export type { Connection } from '@/lib/types';

// Enable Immer's Map and Set support
enableMapSet();

// ============================================================================
// ADAPTED TYPES FOR YOUR SCHEMA
// ============================================================================

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number | null;
}

export interface Viewport {
	x: number;
	y: number;
	zoom: number;
}

export interface SelectionBox {
	startX: number;
	startY: number;
	currentX: number;
	currentY: number;
}

export interface DragPreviewState {
	cardType?: Card['card_type'];
	card?: Card;
	canvasX: number;
	canvasY: number;
}

export interface UploadingCard {
	id: string;
	filename: string;
	x: number;
	y: number;
	type: 'image' | 'file';
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface CanvasState {
	// Information
	boardId: string | null;
	// Data
	connections: Map<string, Connection>;

	// Viewport
	viewport: Viewport;

	// Selection
	selectedCardIds: Set<string>;
	selectionBox: SelectionBox | null;

	// Interaction states
	isDragging: boolean;
	isPanning: boolean;
	isDrawingSelection: boolean;
	isResizing: boolean;
	snapToGrid: boolean;
	editingCardId: string | null;

	// Column interaction state
	potentialColumnTarget: string | null;

	// Connection mode
	isConnectionMode: boolean;
	pendingConnection: {
		fromCardId: string;
		fromSide: 'top' | 'right' | 'bottom' | 'left';
		fromOffset: number;
	} | null;
	isDraggingLineEndpoint: boolean;

	// Visual states
	showGrid: boolean;
	dragPreview: DragPreviewState | null;

	// Uploading cards (loading state)
	uploadingCards: Map<string, UploadingCard>;

	setBoardId: (boardId: string) => void;

	// Simplified delete - only updates UI state (actual deletion happens via InstantDB)
	deleteCard: (cardId: string) => void;
	deleteCards: (cardIds: string[]) => void;

	// ============================================================================
	// CONNECTION ACTIONS
	// ============================================================================

	loadConnections: (connections: Connection[]) => void;
	addConnection: (connection: Connection) => void;
	updateConnection: (id: string, updates: Partial<Connection>) => void;
	deleteConnection: (id: string) => void;
	deleteConnectionsForCard: (cardId: string) => void;

	// Connection mode
	setConnectionMode: (enabled: boolean) => void;
	startConnection: (cardId: string, side: 'top' | 'right' | 'bottom' | 'left', offset?: number) => void;
	cancelConnection: () => void;
	setDraggingLineEndpoint: (isDragging: boolean) => void;

	// ============================================================================
	// SELECTION ACTIONS
	// ============================================================================

	selectCard: (id: string, multi?: boolean) => void;
	selectCards: (ids: string[]) => void;
	clearSelection: () => void;
	setSelectionBox: (box: SelectionBox | null) => void;

	// ============================================================================
	// VIEWPORT ACTIONS
	// ============================================================================

	setViewport: (viewport: Partial<Viewport>) => void;
	resetViewport: () => void;
	zoomIn: () => void;
	zoomOut: () => void;

	// ============================================================================
	// INTERACTION STATE ACTIONS
	// ============================================================================

	setIsDragging: (isDragging: boolean) => void;
	setIsPanning: (isPanning: boolean) => void;
	setIsDrawingSelection: (isDrawing: boolean) => void;
	setIsResizing: (isResizing: boolean) => void;
	setEditingCardId: (id: string | null) => void;
	setSnapToGrid: (snapToGrid: boolean) => void;

	// Column
	setPotentialColumnTarget: (columnId: string | null) => void;

	// ============================================================================
	// VISUAL STATE ACTIONS
	// ============================================================================

	setShowGrid: (showGrid: boolean) => void;
	setDragPreview: (preview: DragPreviewState | null) => void;
	addUploadingCard: (card: UploadingCard) => void;
	removeUploadingCard: (id: string) => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useCanvasStore = create<CanvasState>()(
	devtools(
		temporal(
			immer((set) => ({
				// Initial state
				boardId: null,
				connections: new Map(),
				viewport: { x: 0, y: 0, zoom: 1 },
				selectedCardIds: new Set(),
				selectionBox: null,
				isDragging: false,
				isPanning: false,
				isDrawingSelection: false,
				isResizing: false,
				showGrid: true,
				editingCardId: null,
				potentialColumnTarget: null,
				isConnectionMode: false,
				pendingConnection: null,
				isDraggingLineEndpoint: false,
				snapToGrid: false,
				dragPreview: null,
				uploadingCards: new Map(),

				setBoardId: (boardId: string) => {
					set((state) => {
						state.boardId = boardId
					})
				},

				deleteCard: (cardId: string) => {
					set((state) => {
						state.selectedCardIds.delete(cardId);
						if (state.editingCardId === cardId) {
							state.editingCardId = null;
						}
					});
				},

				deleteCards: (cardIds: string[]) => {
					set((state) => {
						cardIds.forEach((id) => {
							state.selectedCardIds.delete(id);
							if (state.editingCardId === id) {
								state.editingCardId = null;
							}
						});
					});
				},

				// ============================================================================
				// CONNECTION ACTIONS
				// ============================================================================

				loadConnections: (connections) =>
					set((state) => {
						state.connections = new Map(connections.map(c => [c.id, c]));
					}),

				addConnection: (connection) =>
					set((state) => {
						state.connections.set(connection.id, connection);
					}),

				updateConnection: (id, updates) =>
					set((state) => {
						const connection = state.connections.get(id);
						if (connection) {
							state.connections.set(id, { ...connection, ...updates });
						}
					}),

				deleteConnection: (id) =>
					set((state) => {
						state.connections.delete(id);
					}),

				deleteConnectionsForCard: (cardId) =>
					set((state) => {
						for (const [id, conn] of state.connections) {
							if (conn.fromAnchor.cardId === cardId || conn.toAnchor.cardId === cardId) {
								state.connections.delete(id);
							}
						}
					}),

				setConnectionMode: (enabled) =>
					set((state) => {
						state.isConnectionMode = enabled;
						if (!enabled) {
							state.pendingConnection = null;
						}
					}),

				startConnection: (cardId, side, offset = 0.5) =>
					set((state) => {
						state.pendingConnection = { fromCardId: cardId, fromSide: side, fromOffset: offset };
					}),

				cancelConnection: () =>
					set((state) => {
						state.pendingConnection = null;
					}),

				setDraggingLineEndpoint: (isDragging) =>
					set((state) => {
						state.isDraggingLineEndpoint = isDragging;
					}),

				// ============================================================================
				// SELECTION ACTIONS
				// ============================================================================

				selectCard: (id, multi = false) =>
					set((state) => {
						if (multi) {
							if (state.selectedCardIds.has(id)) {
								state.selectedCardIds.delete(id);
							} else {
								state.selectedCardIds.add(id);
							}
						} else {
							state.selectedCardIds.clear();
							state.selectedCardIds.add(id);
						}
					}),

				selectCards: (ids) =>
					set((state) => {
						state.selectedCardIds.clear();
						ids.forEach((id) => state.selectedCardIds.add(id));
					}),

				clearSelection: () =>
					set((state) => {
						state.selectedCardIds.clear();
					}),

				setSelectionBox: (box) =>
					set((state) => {
						state.selectionBox = box;
					}),

				// ============================================================================
				// VIEWPORT ACTIONS
				// ============================================================================

				setViewport: (viewport) =>
					set((state) => {
						state.viewport = { ...state.viewport, ...viewport };
					}),

				resetViewport: () =>
					set((state) => {
						state.viewport = { x: 0, y: 0, zoom: 1 };
					}),

				zoomIn: () =>
					set((state) => {
						const newZoom = Math.min(1.9, state.viewport.zoom + 0.15);
						state.viewport.zoom = newZoom;
					}),

				zoomOut: () =>
					set((state) => {
						const newZoom = Math.max(0.1, state.viewport.zoom - 0.15);
						state.viewport.zoom = newZoom;
					}),

				// ============================================================================
				// INTERACTION STATE ACTIONS
				// ============================================================================

				setIsDragging: (isDragging) =>
					set((state) => {
						state.isDragging = isDragging;
					}),

				setIsPanning: (isPanning) =>
					set((state) => {
						state.isPanning = isPanning;
					}),

				setIsDrawingSelection: (isDrawing) =>
					set((state) => {
						state.isDrawingSelection = isDrawing;
					}),

				setIsResizing: (isResizing) =>
					set((state) => {
						state.isResizing = isResizing;
					}),

				setEditingCardId: (id) =>
					set((state) => {
						state.editingCardId = id;
					}),

				setSnapToGrid: (snapToGrid) =>
					set((state) => {
						state.snapToGrid = snapToGrid;
					}),

				setPotentialColumnTarget: (columnId) =>
					set((state) => {
						state.potentialColumnTarget = columnId;
					}),

				// ============================================================================
				// VISUAL STATE ACTIONS
				// ============================================================================

				setShowGrid: (showGrid) =>
					set((state) => {
						state.showGrid = showGrid;
					}),

				setDragPreview: (preview) =>
					set({ dragPreview: preview }),

				addUploadingCard: (card) =>
					set((state) => {
						state.uploadingCards.set(card.id, card);
					}),

				removeUploadingCard: (id) =>
					set((state) => {
						state.uploadingCards.delete(id);
					}),

			})),
			{
				// ============================================================================
				// ZUNDO TEMPORAL OPTIONS
				// ============================================================================

				// Only track viewport changes (card operations will use custom undo store in Phase 2)
				partialize: (state) => {
					const {
						isDragging,
						isPanning,
						isDrawingSelection,
						isResizing,
						dragPreview,
						potentialColumnTarget,
						snapToGrid,
						showGrid,
						selectionBox,
						editingCardId,
						selectedCardIds,
						uploadingCards,
						connections,
						...tracked
					} = state;

					// Only track viewport for now
					return { viewport: tracked.viewport };
				},

				// Limit history to 50 states
				limit: 50,

				// Use equality check to prevent storing duplicate states
				equality: (pastState, currentState) => {
					const viewportChanged =
						Math.abs(pastState.viewport.x - currentState.viewport.x) > 0.1 ||
						Math.abs(pastState.viewport.y - currentState.viewport.y) > 0.1 ||
						Math.abs(pastState.viewport.zoom - currentState.viewport.zoom) > 0.001;

					return !viewportChanged;
				},
			}
		),
		{ name: 'CanvasStore' }
	)
);

// ============================================================================
// HELPER HOOKS FOR UNDO/REDO
// ============================================================================

/**
 * Hook to access undo/redo functionality (viewport only for now)
 *
 * @example
 * const { undo, redo, clear } = useCanvasHistory();
 *
 * <button onClick={() => undo()}>Undo</button>
 * <button onClick={() => redo()}>Redo</button>
 */
export const useCanvasHistory = () => {
	return useCanvasStore.temporal.getState();
};

export const useTemporalStore = <T extends unknown>(
	selector: (state: TemporalState<CanvasState>) => T,
	equality?: (a: T, b: T) => boolean,
) => useStore(useCanvasStore.temporal, selector, equality);


/**
 * Hook to reactively check if undo/redo is available
 *
 * @example
 * const { canUndo, canRedo } = useCanUndoRedo();
 *
 * <button disabled={!canUndo} onClick={() => undo()}>Undo</button>
 * <button disabled={!canRedo} onClick={() => redo()}>Redo</button>
 */
export const useCanUndoRedo = () => {
	const pastStates = useTemporalStore((state) => state.pastStates);
	const futureStates = useTemporalStore((state) => state.futureStates);

	return {
		canUndo: pastStates.length > 0,
		canRedo: futureStates.length > 0,
		undoDepth: pastStates.length,
		redoDepth: futureStates.length,
	};
};

/**
 * Hook to pause/resume history tracking
 * Useful when you want to make multiple changes without creating history entries
 *
 * @example
 * const { pause, resume, isTracking } = useHistoryTracking();
 *
 * pause();
 * // Make multiple state changes
 * resume();
 */
export const useHistoryTracking = () => {
	const { pause, resume, isTracking } = useCanvasStore.temporal.getState();

	return {
		pause,
		resume,
		isTracking,
	};
};
