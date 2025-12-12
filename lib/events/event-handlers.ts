/**
 * Event Handlers
 *
 * Centralized handlers that respond to canvas events.
 * These connect the event bus to your existing services and stores.
 */

import { useEffect } from 'react';
import { useCanvasEvent, useCanvasEmit } from './event-bus';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CardService } from '@/lib/services/card-service';

// ============================================================================
// Selection Event Handlers
// ============================================================================

/**
 * Hook that handles card selection events
 * Manages the canvas store's selection state
 */
export function useSelectionEventHandlers() {
	const setSelectedCardIds = useCanvasStore((state) => state.setSelectedCardIds);
	const selectedCardIds = useCanvasStore((state) => state.selectedCardIds);

	// Handle single card selection
	useCanvasEvent('card.select', (event) => {
		if (event.addToSelection) {
			// Add to existing selection
			setSelectedCardIds(new Set([...selectedCardIds, event.cardId]));
		} else {
			// Replace selection
			setSelectedCardIds(new Set([event.cardId]));
		}
	});

	// Handle card deselection
	useCanvasEvent('card.deselect', (event) => {
		const newSelection = new Set(selectedCardIds);
		newSelection.delete(event.cardId);
		setSelectedCardIds(newSelection);
	});

	// Handle select all
	useCanvasEvent('card.selectAll', () => {
		// You'd get all card IDs from your cards query
		// For now, just a placeholder
		console.log('Select all cards');
	});

	// Handle deselect all
	useCanvasEvent('card.deselectAll', () => {
		setSelectedCardIds(new Set());
	});
}

// ============================================================================
// Card Movement Event Handlers
// ============================================================================

/**
 * Hook that handles card movement events
 * Coordinates drag state and persistence
 */
export function useCardMovementHandlers(boardId: string) {
	const setIsDragging = useCanvasStore((state) => state.setIsDragging);
	const setDragPositions = useCanvasStore((state) => state.setDragPositions);

	// Track movement state
	useCanvasEvent('card.moveStart', (event) => {
		setIsDragging(true);
		// Initialize drag positions
		const positions = new Map(
			event.cardIds.map((id) => [id, event.startPosition])
		);
		setDragPositions(positions);
	});

	useCanvasEvent('card.move', (event) => {
		// Update drag preview positions
		const positions = new Map(
			event.cardIds.map((id) => [
				id,
				{ x: event.delta.x, y: event.delta.y },
			])
		);
		setDragPositions(positions);
	});

	useCanvasEvent('card.moveEnd', async (event) => {
		setIsDragging(false);
		setDragPositions(new Map());

		// Persist to database
		for (const cardId of event.cardIds) {
			await CardService.updateCardTransform(cardId, boardId, {
				position_x: event.finalPosition.x,
				position_y: event.finalPosition.y,
			});
		}
	});
}

// ============================================================================
// Card Editing Event Handlers
// ============================================================================

/**
 * Hook that handles card editing events
 */
export function useCardEditingHandlers() {
	const setEditingCardId = useCanvasStore((state) => state.setEditingCardId);

	useCanvasEvent('card.editStart', (event) => {
		setEditingCardId(event.cardId);
	});

	useCanvasEvent('card.editEnd', () => {
		setEditingCardId(null);
	});
}

// ============================================================================
// Keyboard Event Handlers
// ============================================================================

/**
 * Hook that handles keyboard shortcuts via events
 */
export function useKeyboardEventHandlers(boardId: string) {
	const selectedCardIds = useCanvasStore((state) => state.selectedCardIds);
	const emit = useCanvasEmit();

	useCanvasEvent('keyboard.delete', async () => {
		if (selectedCardIds.size === 0) return;

		// Delete selected cards
		const cardIds = Array.from(selectedCardIds);
		for (const cardId of cardIds) {
			await CardService.deleteCard(cardId, boardId);
		}

		// Emit deleted event
		emit({ type: 'card.deleted', cardIds });

		// Clear selection
		emit({ type: 'card.deselectAll' });
	});

	useCanvasEvent('keyboard.escape', () => {
		// Clear selection on escape
		emit({ type: 'card.deselectAll' });

		// Exit edit mode
		emit({ type: 'card.editEnd', cardId: '' });
	});
}

// ============================================================================
// Master Event Handler Hook
// ============================================================================

/**
 * Main hook that initializes all event handlers
 * Use this in your Canvas component to set up the event system
 *
 * @example
 * function Canvas({ boardId }) {
 *	 useCanvasEventHandlers(boardId);
 *	 // ... rest of canvas
 * }
 */
export function useCanvasEventHandlers(boardId: string) {
	useSelectionEventHandlers();
	useCardMovementHandlers(boardId);
	useCardEditingHandlers();
	useKeyboardEventHandlers(boardId);

	// Log events in development
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			const { emit } = useCanvasEmit.getState();
			console.log('[Canvas Events] Event handlers initialized for board:', boardId);
		}
	}, [boardId]);
}
