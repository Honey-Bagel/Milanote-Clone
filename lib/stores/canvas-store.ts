import { create, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { temporal, TemporalState } from 'zundo';
import { enableMapSet } from 'immer';
import type { Card, CardData, Connection } from '@/lib/types';
export type { Connection } from '@/lib/types';
import { ZOOM_STEPS } from '../constants/defaults';

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

// ============================================================================
// INTERACTION MODE STATE MACHINE
// ============================================================================

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export type InteractionMode =
	| { mode: 'idle' }
	| { mode: 'selecting'; startPos: Position }
	| { mode: 'dragging'; cardIds: string[] }
	| { mode: 'resizing'; cardId: string; handle: ResizeHandle }
	| { mode: 'editing'; cardId: string }
	| { mode: 'connecting'; fromCardId: string }
	| { mode: 'panning' };

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
// EPHEMERAL STATE (UI-only, not persisted)
// ============================================================================

export interface NoteCardHeightState {
	heightMode: 'normal' | 'shrunk';
	editMode: 'view' | 'editing';
	currentHeight: number;
	naturalContentHeight: number;
	userSetHeight: number | null;
	heightBeforeEdit: number | null;
}

export interface EphemeralCardState {
	// Hover state
	hoveredCardId: string | null;

	// Note card height calculations (complex state machine)
	noteHeights: Record<string, NoteCardHeightState>;

	// Temporary overrides during drag (60fps updates, not committed to DB)
	dragPositions: Record<string, Position>;

	// Temporary overrides during resize
	resizeDimensions: Record<string, { width: number; height?: number }>;
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

	// NEW: Centralized interaction mode state machine
	interactionMode: InteractionMode;

	// NEW: Ephemeral card state (UI-only, not persisted)
	ephemeralCardState: EphemeralCardState;

	// DEPRECATED: Legacy interaction states (keep for backward compatibility during migration)
	// TODO: Remove these after all components migrated to use interactionMode
	isDragging: boolean;
	isPanning: boolean;
	isDrawingSelection: boolean;
	isResizing: boolean;
	snapToGrid: boolean;
	editingCardId: string | null;

	// Drag positions (map of card IDs to their current positions during drag)
	dragPositions: Map<string, Position>;

	// Column interaction state
	potentialColumnTarget: string | null;
	potentialBoardTarget: string | null;

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
	completeConnection: (toCardId: string, toSide: 'top' | 'right' | 'bottom' | 'left', toOffset?: number) => void;
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
	zoomToFit: (cards: Array<Partial<CardData>>) => void;

	// ============================================================================
	// INTERACTION MODE ACTIONS (NEW)
	// ============================================================================

	setInteractionMode: (mode: InteractionMode) => void;
	resetInteractionMode: () => void;

	// ============================================================================
	// EPHEMERAL STATE ACTIONS (NEW)
	// ============================================================================

	// Note card height state
	setNoteCardHeight: (cardId: string, state: Partial<NoteCardHeightState>) => void;
	getNoteCardHeight: (cardId: string) => NoteCardHeightState | undefined;
	initializeNoteCardHeight: (cardId: string, initialState: NoteCardHeightState) => void;

	// Hover state
	setHoveredCard: (cardId: string | null) => void;

	// Drag positions (60fps updates during drag)
	setEphemeralDragPosition: (cardId: string, position: Position) => void;
	clearEphemeralDragPositions: () => void;

	// Resize dimensions (60fps updates during resize)
	setEphemeralResizeDimensions: (cardId: string, dimensions: { width: number; height?: number }) => void;
	clearEphemeralResizeDimensions: () => void;

	// ============================================================================
	// INTERACTION STATE ACTIONS (DEPRECATED - use setInteractionMode instead)
	// ============================================================================

	setIsDragging: (isDragging: boolean) => void;
	setIsPanning: (isPanning: boolean) => void;
	setIsDrawingSelection: (isDrawing: boolean) => void;
	setIsResizing: (isResizing: boolean) => void;
	setEditingCardId: (id: string | null) => void;
	setSnapToGrid: (snapToGrid: boolean) => void;
	selectAll: (allCards: Set<string>) => void;

	// Drag positions
	setDragPositions: (positions: Map<string, Position>) => void;
	clearDragPositions: () => void;

	// Potential targets
	setPotentialColumnTarget: (columnId: string | null) => void;
	setPotentialBoardTarget: (boardCardId: string | null) => void;

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

				// NEW: Centralized interaction mode
				interactionMode: { mode: 'idle' } as InteractionMode,

				// NEW: Ephemeral card state
				ephemeralCardState: {
					hoveredCardId: null,
					noteHeights: {},
					dragPositions: {},
					resizeDimensions: {},
				},

				// DEPRECATED: Legacy states (kept for backward compatibility)
				isDragging: false,
				isPanning: false,
				isDrawingSelection: false,
				isResizing: false,
				showGrid: true,
				editingCardId: null,
				dragPositions: new Map(),
				potentialColumnTarget: null,
				potentialBoardTarget: null,
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

				completeConnection: (toCardId, toSide, toOffset = 0.5) =>
					set((state) => {
						const pending = state.pendingConnection;
						if (!pending || pending.fromCardId === toCardId) {
							// No pending connection or trying to connect to self
							state.pendingConnection = null;
							return;
						}

						// Create new connection
						const newConnection: Connection = {
							id: `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
							from_card_id: pending.fromCardId,
							to_card_id: toCardId,
							from_side: pending.fromSide,
							to_side: toSide,
							from_offset: pending.fromOffset,
							to_offset: toOffset,
						};

						state.connections.set(newConnection.id, newConnection);
						state.pendingConnection = null;
						state.isConnectionMode = false;
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
						const newZoom = Math.min(3, state.viewport.zoom + 0.15);
						state.viewport.zoom = newZoom;
					}),

				zoomOut: () =>
					set((state) => {
						const newZoom = Math.max(0.25, state.viewport.zoom - 0.15);
						state.viewport.zoom = newZoom;
					}),

				zoomToFit: (cards) =>
					set((state) => {
						if (cards.length === 0) return;

						let minX = Infinity,
							minY = Infinity,
							maxX = -Infinity,
							maxY = -Infinity;

						cards.forEach((card) => {
							minX = Math.min(minX, card.position_x);
							minY = Math.min(minY, card.position_y);
							maxX = Math.max(maxX, card.position_x + card.width);
							maxY = Math.max(maxY, card.position_y + (card.height || 150));
						});

						const width = maxX - minX;
						const height = maxY - minY;
						const padding = 100;

						const viewportWidth = window.innerWidth;
						const viewportHeight = window.innerHeight;

						const zoom = Math.min(
							(viewportWidth - padding * 2) / width,
							(viewportHeight - padding * 2) / height,
							1
						);

						state.viewport = {
							x: -minX * zoom + padding,
							y: -minY * zoom + padding,
							zoom,
						};
					}),

				// ============================================================================
				// INTERACTION MODE ACTIONS (NEW)
				// ============================================================================

				setInteractionMode: (mode) =>
					set((state) => {
						state.interactionMode = mode;

						// BACKWARD COMPATIBILITY: Also update legacy boolean flags
						// TODO: Remove this after all components migrated to interactionMode
						state.isDragging = mode.mode === 'dragging';
						state.isPanning = mode.mode === 'panning';
						state.isDrawingSelection = mode.mode === 'selecting';
						state.isResizing = mode.mode === 'resizing';
						state.editingCardId = mode.mode === 'editing' ? mode.cardId : null;
						state.isConnectionMode = mode.mode === 'connecting';
					}),

				resetInteractionMode: () =>
					set((state) => {
						state.interactionMode = { mode: 'idle' };

						// BACKWARD COMPATIBILITY: Clear legacy flags
						state.isDragging = false;
						state.isPanning = false;
						state.isDrawingSelection = false;
						state.isResizing = false;
						state.editingCardId = null;
					}),

				// ============================================================================
				// EPHEMERAL STATE ACTIONS (NEW)
				// ============================================================================

				setNoteCardHeight: (cardId, partialState) =>
					set((state) => {
						if (!state.ephemeralCardState.noteHeights[cardId]) {
							console.warn(`[setNoteCardHeight] Note card ${cardId} not initialized`);
							return;
						}
						state.ephemeralCardState.noteHeights[cardId] = {
							...state.ephemeralCardState.noteHeights[cardId],
							...partialState,
						};
					}),

				getNoteCardHeight: (cardId) => {
					const state = useCanvasStore.getState();
					return state.ephemeralCardState.noteHeights[cardId];
				},

				initializeNoteCardHeight: (cardId, initialState) =>
					set((state) => {
						state.ephemeralCardState.noteHeights[cardId] = initialState;
					}),

				setHoveredCard: (cardId) =>
					set((state) => {
						state.ephemeralCardState.hoveredCardId = cardId;
					}),

				setEphemeralDragPosition: (cardId, position) =>
					set((state) => {
						state.ephemeralCardState.dragPositions[cardId] = position;
					}),

				clearEphemeralDragPositions: () =>
					set((state) => {
						state.ephemeralCardState.dragPositions = {};
					}),

				setEphemeralResizeDimensions: (cardId, dimensions) =>
					set((state) => {
						state.ephemeralCardState.resizeDimensions[cardId] = dimensions;
					}),

				clearEphemeralResizeDimensions: () =>
					set((state) => {
						state.ephemeralCardState.resizeDimensions = {};
					}),

				// ============================================================================
				// INTERACTION STATE ACTIONS (DEPRECATED)
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

				selectAll: (allCards: Set<string>) =>
					set((state) => {
						state.selectedCardIds = allCards
					}),

				setPotentialColumnTarget: (columnId) =>
					set((state) => {
						state.potentialColumnTarget = columnId;
					}),

				setPotentialBoardTarget: (boardCardId) =>
					set((state) => {
						state.potentialBoardTarget = boardCardId;
					}),

				setDragPositions: (positions) =>
					set((state) => {
						state.dragPositions = positions;
					}),

				clearDragPositions: () =>
					set((state) => {
						state.dragPositions.clear();
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

				// Only track viewport changes (card operations will use custom undo store in Phase 3)
				partialize: (state) => {
					const {
						interactionMode,
						ephemeralCardState,
						isDragging,
						isPanning,
						isDrawingSelection,
						isResizing,
						dragPreview,
						dragPositions,
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
