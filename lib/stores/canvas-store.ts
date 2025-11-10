import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import type { Card } from '@/lib/types';
import { deleteCard as deleteCardFromDB } from '@/lib/data/cards-client';
import {
	bringToFront as zIndexBringToFront,
	sendToBack as zIndexSendToBack,
	cardsToZIndexList,
	getZIndexForNewCard,
} from "@/lib/utils/z-index-manager";

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
// STORE INTERFACE
// ============================================================================

interface CanvasState {
	// Data - using your Card type from types.ts
	cards: Map<string, Card>;
	
	// Viewport
	viewport: Viewport;

	// Selection
	selectedCardIds: Set<string>;
	selectionBox: SelectionBox | null;

	// Interaction states
	isDragging: boolean;
	isPanning: boolean;
	isDrawingSelection: boolean;
	editingCardId: string | null;

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
	setEditingCardId: (id: string | null) => void;

	// ============================================================================
	// UTILITY ACTIONS
	// ============================================================================

	getCard: (id: string) => Card | undefined;
	getSelectedCards: () => Card[];
	bringToFront: (id: string) => void;
	sendToBack: (id: string) => void;
	bringSelectedToFront: () => void;
	sendSelectedToBack: () => void;

	// ============================================================================
	// Z-Index Management
	// ============================================================================

	/**
	 * Automatically bring cards to front when they're moved or clicked
	 * This should be called whenever a card interaction begins
	 */
	bringCardsToFrontOnInteraction: (cardIds: string[]) => Map<string, number>;

	/**
	 * Get the z-index for a new card
	 */
	getNewCardZIndex: () => number;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useCanvasStore = create<CanvasState>()(
	devtools(
		immer((set, get) => ({
			// Initial state
			cards: new Map(),
			viewport: { x: 0, y: 0, zoom: 1 },
			selectedCardIds: new Set(),
			selectionBox: null,
			isDragging: false,
			isPanning: false,
			isDrawingSelection: false,
			editingCardId: null,

			// ============================================================================
			// CARD ACTIONS
			// ============================================================================

			loadCards: (cards) =>
				set((state) => {
					state.cards.clear();
					cards.forEach((card) => {
						state.cards.set(card.id, card);
					});
				}),

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

			setEditingCardId: (id) =>
				set((state) => {
					state.editingCardId = id;
				}),

			// ============================================================================
			// UTILITY ACTIONS
			// ============================================================================

			getCard: (id) => {
				return get().cards.get(id);
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
					const updates = zIndexBringToFront([id], cardsToZIndexList(allCards));

					updates.forEach((zIndex, cardId) => {
						const card = state.cards.get(cardId);
						if (card) {
							state.cards.set(cardId, { ...card, z_index: zIndex });
						}
					});
				}),

			sendToBack: (id) =>
				set((state) => {
					const allCards = Array.from(state.cards.values());
					const updates = zIndexSendToBack([id], cardsToZIndexList(allCards));

					updates.forEach((zIndex, cardId) => {
						const card = state.cards.get(cardId);
						if (card) {
							state.cards.set(cardId, { ...card, z_index: zIndex });
						}
					});
				}),

			bringSelectedToFront: () =>
				set((state) => {
					const selectedIds = Array.from(state.selectedCardIds);
					if (selectedIds.length === 0) return;

					const allCards = Array.from(state.cards.values());
					const updates = zIndexBringToFront(selectedIds, cardsToZIndexList(allCards));

					updates.forEach((zIndex, cardId) => {
						const card = state.cards.get(cardId);
						if (card) {
							state.cards.set(cardId, { ...card, z_index: zIndex });
						}
					});
				}),

			sendSelectedToBack: () =>
				set((state) => {
					const selectedIds = Array.from(state.selectedCardIds);
					if (selectedIds.length === 0) return;

					const allCards = Array.from(state.cards.values());
					const updates = zIndexSendToBack(selectedIds, cardsToZIndexList(allCards));

					updates.forEach((zIndex, cardId) => {
						const card = state.cards.get(cardId);
						if (card) {
							state.cards.set(cardId, { ...card, z_index: zIndex });
						}
					});
				}),

			// ============================================================================
			// UTILITY ACTIONS
			// ============================================================================

			bringCardsToFrontOnInteraction: (cardIds) => {
				const state = get();
				const allCards = Array.from(state.cards.values());
				const updates = zIndexBringToFront(cardIds, cardsToZIndexList(allCards));

				set((state) => {
					updates.forEach((zIndex, cardId) => {
						const card = state.cards.get(cardId);
						if (card) {
							state.cards.set(cardId, { ...card, z_index: zIndex });
						}
					});
				});

				return updates;
			},

			getNewCardZIndex: () => {
				const state = get();
				const allCards = Array.from(state.cards.values());
				return getZIndexForNewCard(cardsToZIndexList(allCards));
			},

		})),
		{ name: 'CanvasStore' }
	)
);