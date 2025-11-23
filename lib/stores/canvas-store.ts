import { create, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { temporal, TemporalState } from 'zundo';
import { enableMapSet } from 'immer';
import type { Card, Connection, LineCard } from '@/lib/types';
export type { Connection } from '@/lib/types';
import { deleteCard as deleteCardFromDB, createCard, updateCardTransform } from '@/lib/data/cards-client';
import { getAnchorPosition } from '@/lib/utils/connection-path';
import { createClient } from '@/lib/supabase/client';
import { getDefaultCardDimensions } from '@/lib/utils';
import {
	bringToFront as orderKeyBringToFront,
	sendToBack as orderKeySendToBack,
	cardsToOrderKeyList,
	getOrderKeyForNewCard,
	bringCardsToFrontOnInteraction
} from "@/lib/utils/order-key-manager";

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

export interface OptimisticCard {
	tempId: string;
	card: Card;
	status: 'pending' | 'error';
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface CanvasState {
	// Data - using your Card type from types.ts
	cards: Map<string, Card>;
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
	potentialColumnTarget: string | null; // Column card id

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

	// Optimistic cards (cards pending database confirmation)
	optimisticCards: Map<string, OptimisticCard>;

	// History tracking for edits
	_preEditCards: Map<string, Card> | null;

	// ============================================================================
	// CARD ACTIONS
	// ============================================================================

	loadCards: (cards: Card[]) => void;
	addCard: (card: Card) => void;
	updateCard: (id: string, updates: Partial<Card>) => void;
	updateCardPosition: (id: string, position: { x: number; y: number }) => void;
	deleteCard: (id: string) => Promise<void>;
	deleteCards: (ids: string[]) => Promise<void>;

	// Batch operations
	updateCards: (updates: Array<{ id: string; updates: Partial<Card> }>) => void;

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
	completeConnection: (cardId: string, side: 'top' | 'right' | 'bottom' | 'left', offset?: number) => Promise<LineCard | null>;
	cancelConnection: () => void;
	setDraggingLineEndpoint: (isDragging: boolean) => void;

	// ============================================================================
	// SELECTION ACTIONS
	// ============================================================================

	selectCard: (id: string, multi?: boolean) => void;
	selectCards: (ids: string[]) => void;
	clearSelection: () => void;
	selectAll: () => void;
	setSelectionBox: (box: SelectionBox | null) => void;

	// ============================================================================
	// VIEWPORT ACTIONS
	// ============================================================================

	setViewport: (viewport: Partial<Viewport>) => void;
	resetViewport: () => void;
	zoomIn: () => void;
	zoomOut: () => void;
	zoomToFit: () => void;

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

	// Optimistic card actions
	addOptimisticCard: (tempId: string, card: Card) => void;
	confirmOptimisticCard: (tempId: string, realCard: Card) => void;
	removeOptimisticCard: (tempId: string) => void;

	// ============================================================================
	// UTILITY ACTIONS
	// ============================================================================

	getCard: (id: string) => Card | undefined;
	getSelectedCards: () => Card[];
	bringToFront: (id: string) => void;
	sendToBack: (id: string) => void;
	bringSelectedToFront: () => void;
	sendSelectedToBack: () => void;

	/**
	 * Utility to bring cards to front when interacted with
	 */
	bringCardsToFrontOnInteraction: (cardIds: string[]) => Map<string, string>;

	/**
	 * Get the z-index for a new card
	 */
	getNewCardOrderKey: () => string;

	// ============================================================================
	// ALIGNMENT ACTIONS
	// ============================================================================

	/**
	 * Align selected cards to the top edge of the topmost card
	 */
	alignTop: () => Promise<void>;

	/**
	 * Align selected cards to the bottom edge of the bottommost card
	 */
	alignBottom: () => Promise<void>;

	/**
	 * Align selected cards to the left edge of the leftmost card
	 */
	alignLeft: () => Promise<void>;

	/**
	 * Align selected cards to the right edge of the rightmost card
	 */
	alignRight: () => Promise<void>;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useCanvasStore = create<CanvasState>()(
	devtools(
		temporal(
			immer((set, get) => ({
				// Initial state
				cards: new Map(),
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
				optimisticCards: new Map(),
				_preEditCards: null,

				// ============================================================================
				// CARD ACTIONS
				// ============================================================================

				loadCards: (cards) => {
					const temporal = useCanvasStore.temporal.getState();
					const wasTracking = temporal.isTracking;

					if (wasTracking) {
						temporal.pause();
					}

					set({ cards: new Map(cards.map(c => [c.id, c])) })

					if (wasTracking) {
						temporal.resume();

						setTimeout(() => {
							const currentPastStates = temporal.pastStates;
							if(currentPastStates.length > 0 && currentPastStates[currentPastStates.length - 1]) {
								const lastState = currentPastStates[currentPastStates.length - 1];
								if (lastState.cards?.size === cards.length) {
									temporal.clear();
								}
							}
						}, 0);
					}
				},

				addCard: (card) =>
					set((state) => {
						state.cards.set(card.id, card);
					}),

				updateCard: (id, updates) =>
					set((state) => {
						const card = state.cards.get(id);
						if (card) {
							state.cards.set(id, { ...card, ...updates });
						}
					}),

				updateCardPosition: (id, position) =>
					set((state) => {
						const card = state.cards.get(id);
						if (card) {
							state.cards.set(id, {
								...card,
								position_x: position.x,
								position_y: position.y,
							});
						}
					}),

				deleteCard: async (id) => {
					// Delete from local state first for immediate UI feedback
					set((state) => {
						state.cards.delete(id);
						state.selectedCardIds.delete(id);
						if (state.editingCardId === id) {
							state.editingCardId = null;
						}
					});

					// Then delete from database
					try {
						await deleteCardFromDB(id);
					} catch (error) {
						console.error('Failed to delete card from database:', error);
						// Optionally: re-fetch cards to sync state if deletion failed
					}
				},

				deleteCards: async (ids) => {
					// Delete from local state first for immediate UI feedback
					set((state) => {
						ids.forEach((id) => {
							const card = state.cards.get(id);
							if (card?.card_type === 'column') {
								card.column_cards.column_items?.forEach((card) => {
									state.cards.delete(card.card_id);
									ids.push(card.card_id);
								})
							}
							state.cards.delete(id);
							state.selectedCardIds.delete(id);
							if (state.editingCardId === id) {
								state.editingCardId = null;
							}
						});
					});

					// Then delete from database
					try {
						await Promise.all(ids.map(id => deleteCardFromDB(id)));
					} catch (error) {
						console.error('Failed to delete cards from database:', error);
						// Optionally: re-fetch cards to sync state if deletion failed
					}
				},

				updateCards: (updates) =>
					set((state) => {
						updates.forEach(({ id, updates }) => {
							const card = state.cards.get(id);
							if (card) {
								state.cards.set(id, { ...card, ...updates });
							}
						});
					}),

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

				completeConnection: async (cardId, side, offset = 0.5) => {
					const state = get();
					const pending = state.pendingConnection;

					if (!pending || pending.fromCardId === cardId) {
						set((s) => { s.pendingConnection = null; });
						return null;
					}

					// Get the source and target cards to calculate positions
					const fromCard = state.cards.get(pending.fromCardId);
					const toCard = state.cards.get(cardId);

					if (!fromCard || !toCard) {
						set((s) => { s.pendingConnection = null; });
						return null;
					}

					// Calculate anchor positions
					const fromAnchor = getAnchorPosition(fromCard, pending.fromSide, pending.fromOffset);
					const toAnchor = getAnchorPosition(toCard, side, offset);

					// Calculate line card position (use fromAnchor as the base position)
					const posX = fromAnchor.x;
					const posY = fromAnchor.y;

					// Calculate a nice default curve based on distance
					const endX = toAnchor.x - posX;
					const endY = toAnchor.y - posY;
					const distance = Math.sqrt(endX * endX + endY * endY);
					// Auto-curve: use ~20% of distance, direction based on source side
					let controlOffset = distance * 0.2;
					// Flip curve direction based on which sides are connected
					if (pending.fromSide === 'left' || pending.fromSide === 'top') {
						controlOffset = -controlOffset;
					}

					// Create line card data with endpoints relative to position
					const lineData = {
						start_x: 0,
						start_y: 0,
						end_x: endX,
						end_y: endY,
						color: '#6b7280',
						stroke_width: 2,
						line_style: 'solid' as const,
						start_cap: 'none' as const,
						end_cap: 'arrow' as const,
						curvature: 0,
						control_point_offset: controlOffset,
						reroute_nodes: null,
						start_attached_card_id: pending.fromCardId,
						start_attached_side: pending.fromSide,
						end_attached_card_id: cardId,
						end_attached_side: side,
					};

					// Clear pending connection immediately
					set((s) => { s.pendingConnection = null; });

					try {
						// Get order key for new card
						const orderKey = state.getNewCardOrderKey();

						// Create the line card in the database
						const lineCardId = await createCard(
							fromCard.board_id,
							'line',
							{
								position_x: posX,
								position_y: posY,
								width: 0,
								height: 0,
								order_key: orderKey,
								z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
							},
							lineData
						);

						// Fetch the created card with all related data
						const supabase = createClient();
						const { data } = await supabase
							.from('cards')
							.select(`*, line_cards!line_cards_id_fkey(*)`)
							.eq('id', lineCardId)
							.single();

						if (data) {
							set((s) => {
								s.cards.set(data.id, data as LineCard);
							});
						}

						return data as LineCard;
					} catch (error) {
						console.error('Failed to create line card connection:', error);
						return null;
					}
				},

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

				selectAll: () =>
					set((state) => {
						state.selectedCardIds.clear();
						state.cards.forEach((_, id) => state.selectedCardIds.add(id));
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

				zoomToFit: () =>
					set((state) => {
						if (state.cards.size === 0) return;

						let minX = Infinity,
							minY = Infinity,
							maxX = -Infinity,
							maxY = -Infinity;

						state.cards.forEach((card) => {
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

				setEditingCardId: (id) => {
					const currentEditingId = get().editingCardId;
					const temporal = useCanvasStore.temporal.getState();

					// Starting to edit a card
					if (id !== null && currentEditingId === null) {
						set((state) => {
							state._preEditCards = new Map(state.cards);
							state.editingCardId = id;
						});
						temporal.pause();
					}
					// Stopping editing
					else if (id === null && currentEditingId !== null) {
						const preEditCards = get()._preEditCards;

						if (preEditCards) {
							const currentCards = get().cards;
							const editedCard = currentCards.get(currentEditingId);
							const originalCard = preEditCards.get(currentEditingId);

							let contentChanged = false;
							if (editedCard && originalCard) {
								if (editedCard.card_type === 'note' && originalCard.card_type === 'note') {
									contentChanged = editedCard.note_cards.content !== originalCard.note_cards.content ||
										editedCard.note_cards.color !== originalCard.note_cards.color;
								} else if (editedCard.card_type === 'text' && originalCard.card_type === 'text') {
									contentChanged = editedCard.text_cards.content !== originalCard.text_cards.content ||
										editedCard.text_cards.title !== originalCard.text_cards.title;
								} else if (editedCard.card_type === 'link' && originalCard.card_type === 'link') {
									contentChanged = editedCard.link_cards.url !== originalCard.link_cards.url ||
										editedCard.link_cards.title !== originalCard.link_cards.title;
								} else if (editedCard.card_type === 'task_list' && originalCard.card_type === 'task_list') {
									contentChanged = editedCard.task_list_cards.title !== originalCard.task_list_cards.title ||
										JSON.stringify(editedCard.task_list_cards.tasks) !== JSON.stringify(originalCard.task_list_cards.tasks);
								} else if (editedCard.card_type === 'image' && originalCard.card_type === 'image') {
									contentChanged = editedCard.image_cards.caption !== originalCard.image_cards.caption ||
										editedCard.image_cards.alt_text !== originalCard.image_cards.alt_text;
								} else if (editedCard.card_type === 'column' && originalCard.card_type === 'column') {
									contentChanged = editedCard.column_cards.title !== originalCard.column_cards.title;
								}
							}

							if (contentChanged) {
								const preDragPartialState = {
									cards: preEditCards,
									viewport: get().viewport
								};
								temporal.pastStates.push(preDragPartialState);
								temporal.futureStates.length = 0;
							}
						}

						temporal.resume();
						set((state) => {
							state._preEditCards = null;
							state.editingCardId = null;
						});
					}
					else {
						set((state) => {
							state.editingCardId = id;
						});
					}
				},

				setSnapToGrid: (snapToGrid) =>
					set((state) => {
						state.snapToGrid = snapToGrid;
					}),

				// Column

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

				// Optimistic card actions
				addOptimisticCard: (tempId, card) =>
					set((state) => {
						state.optimisticCards.set(tempId, { tempId, card, status: 'pending' });
					}),

				confirmOptimisticCard: (tempId, realCard) =>
					set((state) => {
						state.optimisticCards.delete(tempId);
						state.cards.set(realCard.id, realCard);
						// If the optimistic card was selected, update selection to real ID
						if (state.selectedCardIds.has(tempId)) {
							state.selectedCardIds.delete(tempId);
							state.selectedCardIds.add(realCard.id);
						}
					}),

				removeOptimisticCard: (tempId) =>
					set((state) => {
						state.optimisticCards.delete(tempId);
						state.selectedCardIds.delete(tempId);
					}),

				// ============================================================================
				// UTILITY ACTIONS
				// ============================================================================

				getCard: (id) => {
					const state = get();
					// Check regular cards first, then optimistic cards
					const card = state.cards.get(id);
					if (card) return card;
					const optimistic = state.optimisticCards.get(id);
					return optimistic?.card;
				},

				getSelectedCards: () => {
					const state = get();
					return Array.from(state.selectedCardIds)
						.map((id) => state.cards.get(id))
						.filter((card): card is Card => card !== undefined);
				},

				bringToFront: (id) =>
					set((state) => {
						const allCards = Array.from(state.cards.values());
						const updates = orderKeyBringToFront([id], cardsToOrderKeyList(allCards));

						updates.forEach((orderKey, cardId) => {
							const card = state.cards.get(cardId);
							if (card) {
								state.cards.set(cardId, {
									...card,
									order_key: orderKey,
									z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
								});
							}
						});
					}),

				sendToBack: (id) => set((state) => {
					const allCards = Array.from(state.cards.values());
					const updates = orderKeySendToBack([id], cardsToOrderKeyList(allCards));

					updates.forEach((orderKey, cardId) => {
						const card = state.cards.get(cardId);
						if (card) {
							state.cards.set(cardId, {
								...card,
								order_key: orderKey,
								// ⚠️ DUAL-WRITE: Also update z_index during migration
								z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
							});
						}
					});
				}),

				bringSelectedToFront: () => set((state) => {
					const allCards = Array.from(state.cards.values());
					const selectedIds = Array.from(state.selectedCardIds);
					const updates = orderKeyBringToFront(selectedIds, cardsToOrderKeyList(allCards));

					updates.forEach((orderKey, cardId) => {
						const card = state.cards.get(cardId);
						if (card) {
							state.cards.set(cardId, {
								...card,
								order_key: orderKey,
								// ⚠️ DUAL-WRITE
								z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
							});
						}
					});
				}),

				sendSelectedToBack: () => set((state) => {
					const allCards = Array.from(state.cards.values());
					const selectedIds = Array.from(state.selectedCardIds);
					const updates = orderKeySendToBack(selectedIds, cardsToOrderKeyList(allCards));

					updates.forEach((orderKey, cardId) => {
						const card = state.cards.get(cardId);
						if (card) {
							state.cards.set(cardId, {
								...card,
								order_key: orderKey,
								// ⚠️ DUAL-WRITE
								z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
							});
						}
					});
				}),

				// ============================================================================
				// UTILITY ACTIONS
				// ============================================================================

				bringCardsToFrontOnInteraction: (cardIds) => {
					const state = get();
					const allCards = Array.from(state.cards.values());
					const updates = bringCardsToFrontOnInteraction(
						cardIds,
						cardsToOrderKeyList(allCards)
					);

					// Apply updates to store
					set((state) => {
						updates.forEach((orderKey, cardId) => {
							const card = state.cards.get(cardId);
							if (card) {
								state.cards.set(cardId, {
									...card,
									order_key: orderKey,
									// DUAL-WRITE
									z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
								});
							}
						});
					});

					return updates;
				},

				getNewCardOrderKey: () => {
					const state = get();
					const allCards = Array.from(state.cards.values());
					return getOrderKeyForNewCard(cardsToOrderKeyList(allCards));
				},

				// ============================================================================
				// ALIGNMENT ACTIONS
				// ============================================================================

				alignTop: async () => {
					const state = get();
					const selectedCards = Array.from(state.selectedCardIds)
						.map((id) => state.cards.get(id))
						.filter((card): card is Card => card !== undefined);

					if (selectedCards.length < 2) return;

					// Find the topmost card (minimum position_y)
					const minY = Math.min(...selectedCards.map((card) => card.position_y));

					// Update local state first for immediate feedback
					set((state) => {
						selectedCards.forEach((card) => {
							state.cards.set(card.id, {
								...card,
								position_y: minY,
							});
						});
					});

					// Sync to database
					try {
						await Promise.all(
							selectedCards.map((card) =>
								updateCardTransform(card.id, {
									position_y: minY,
								})
							)
						);
					} catch (error) {
						console.error('Failed to sync alignment to database:', error);
					}
				},

				alignBottom: async () => {
					const state = get();
					const selectedCards = Array.from(state.selectedCardIds)
						.map((id) => state.cards.get(id))
						.filter((card): card is Card => card !== undefined);

					if (selectedCards.length < 2) return;

					// Helper function to get actual rendered height
					const getActualHeight = (card: Card): number => {
						if (card.height) {
							return card.height;
						}

						// Try to get actual DOM height for auto-height cards
						const cardElement = document.querySelector(`[data-element-id="${card.id}"]`);
						if (cardElement) {
							const screenHeight = cardElement.getBoundingClientRect().height;
							return screenHeight / state.viewport.zoom;
						}

						// Fallback to default height
						const defaults = getDefaultCardDimensions(card.card_type);
						return defaults.defaultHeight || 200;
					};

					// Find the bottommost card (maximum position_y + actual height)
					const maxBottom = Math.max(
						...selectedCards.map((card) => card.position_y + getActualHeight(card))
					);

					// Update local state first for immediate feedback
					set((state) => {
						selectedCards.forEach((card) => {
							const actualHeight = getActualHeight(card);
							const newY = maxBottom - actualHeight;
							state.cards.set(card.id, {
								...card,
								position_y: newY,
							});
						});
					});

					// Sync to database
					try {
						await Promise.all(
							selectedCards.map((card) => {
								const actualHeight = getActualHeight(card);
								const newY = maxBottom - actualHeight;
								return updateCardTransform(card.id, {
									position_y: newY,
								});
							})
						);
					} catch (error) {
						console.error('Failed to sync alignment to database:', error);
					}
				},

				alignLeft: async () => {
					const state = get();
					const selectedCards = Array.from(state.selectedCardIds)
						.map((id) => state.cards.get(id))
						.filter((card): card is Card => card !== undefined);

					if (selectedCards.length < 2) return;

					// Find the leftmost card (minimum position_x)
					const minX = Math.min(...selectedCards.map((card) => card.position_x));

					// Update local state first for immediate feedback
					set((state) => {
						selectedCards.forEach((card) => {
							state.cards.set(card.id, {
								...card,
								position_x: minX,
							});
						});
					});

					// Sync to database
					try {
						await Promise.all(
							selectedCards.map((card) =>
								updateCardTransform(card.id, {
									position_x: minX,
								})
							)
						);
					} catch (error) {
						console.error('Failed to sync alignment to database:', error);
					}
				},

				alignRight: async () => {
					const state = get();
					const selectedCards = Array.from(state.selectedCardIds)
						.map((id) => state.cards.get(id))
						.filter((card): card is Card => card !== undefined);

					if (selectedCards.length < 2) return;

					// Find the rightmost card (maximum position_x + width)
					const maxRight = Math.max(
						...selectedCards.map((card) => card.position_x + card.width)
					);

					// Update local state first for immediate feedback
					set((state) => {
						selectedCards.forEach((card) => {
							const newX = maxRight - card.width;
							state.cards.set(card.id, {
								...card,
								position_x: newX,
							});
						});
					});

					// Sync to database
					try {
						await Promise.all(
							selectedCards.map((card) => {
								const newX = maxRight - card.width;
								return updateCardTransform(card.id, {
									position_x: newX,
								});
							})
						);
					} catch (error) {
						console.error('Failed to sync alignment to database:', error);
					}
				},

			})),
			{
				// ============================================================================
				// ZUNDO TEMPORAL OPTIONS
				// ============================================================================
				
				// Only track meaningful state changes - exclude transient UI states
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
						_preEditCards,
						...tracked
					} = state;

					// Track: cards, viewport
					return tracked;
				},

				// Limit history to 50 states
				limit: 50,

				// Use equality check to prevent storing duplicate states
				equality: (pastState, currentState) => {
					if (pastState.cards.size !== currentState.cards.size) return false;

					const viewportChanged =
						Math.abs(pastState.viewport.x - currentState.viewport.x) > 0.1 ||
						Math.abs(pastState.viewport.y - currentState.viewport.y) > 0.1 ||
						Math.abs(pastState.viewport.zoom - currentState.viewport.zoom) > 0.001;

					if (viewportChanged) return false;

					for (const [id, card] of pastState.cards) {
						const currentCard = currentState.cards.get(id);
						if (!currentCard) return false;

						// Check position changes
						if (
							Math.abs(card.position_x - currentCard.position_x) > 0.1 ||
							Math.abs(card.position_y - currentCard.position_y) > 0.1
						) {
							return false;
						}

						// Check dimension changes
						if (card.width !== currentCard.width || card.height !== currentCard.height) {
							return false;
						}

						// Check order key changes
						if (card.order_key !== currentCard.order_key) return false;

						// Check content changes based on card type
						if (card.card_type === 'note' && currentCard.card_type === 'note') {
							if (card.note_cards.content !== currentCard.note_cards.content ||
								card.note_cards.color !== currentCard.note_cards.color) {
								return false;
							}
						}

						if (card.card_type === 'text' && currentCard.card_type === 'text') {
							if (card.text_cards.content !== currentCard.text_cards.content ||
								card.text_cards.title !== currentCard.text_cards.title) {
								return false;
							}
						}

						if (card.card_type === 'image' && currentCard.card_type === 'image') {
							if (card.image_cards.image_url !== currentCard.image_cards.image_url ||
								card.image_cards.caption !== currentCard.image_cards.caption ||
								card.image_cards.alt_text !== currentCard.image_cards.alt_text) {
								return false;
							}
						}

						if (card.card_type === 'link' && currentCard.card_type === 'link') {
							if (card.link_cards.url !== currentCard.link_cards.url ||
								card.link_cards.title !== currentCard.link_cards.title) {
								return false;
							}
						}

						if (card.card_type === 'task_list' && currentCard.card_type === 'task_list') {
							if (card.task_list_cards.title !== currentCard.task_list_cards.title ||
								JSON.stringify(card.task_list_cards.tasks) !== JSON.stringify(currentCard.task_list_cards.tasks)) {
								return false;
							}
						}

						if (card.card_type === 'column' && currentCard.card_type === 'column') {
							if (card.column_cards.title !== currentCard.column_cards.title ||
								JSON.stringify(card.column_cards.column_items) !== JSON.stringify(currentCard.column_cards.column_items)) {
								return false;
							}
						}
					}

					return true;
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
 * Hook to access undo/redo functionality
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
	// Note: We need to use a selector to make this reactive
	// Otherwise the component won't re-render when history changes
	const pastStates = useCanvasStore.temporal((state) => state.pastStates);
	const futureStates = useCanvasStore.temporal((state) => state.futureStates);
	
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