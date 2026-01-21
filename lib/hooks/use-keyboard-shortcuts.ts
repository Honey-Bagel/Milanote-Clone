/**
 * useKeyboardShortcuts Hook
 *
 * Handles all keyboard shortcuts for the canvas
 * Updated to work with Zundo undo/redo
 */

import { useEffect } from 'react';
import { useCanvasStore } from '../stores/canvas-store';
import { useUndoStore } from '@/lib/stores/undo-store';
import { useBoardCards } from '@/lib/hooks/cards/use-board-cards';
import {
	deleteCards,
	bringCardsToFront,
	sendCardsToBack,
	alignCardsTop,
	alignCardsBottom,
	alignCardsLeft,
	alignCardsRight
} from '../services/card-service';

interface UseKeyboardShortcutsOptions {
	/**
	 * Whether keyboard shortcuts are enabled
	 * @default true
	 */
	enabled?: boolean;
}

export function useKeyboardShortcuts(
	boardId: string | null,
	options: UseKeyboardShortcutsOptions = {}
) {
	const { enabled = true } = options;

	const {
		selectedCardIds,
		zoomIn,
		zoomOut,
		resetViewport,
		enterPresentationMode,
	} = useCanvasStore();

	const { undo, redo } = useUndoStore();

	// Get cards for z-ordering and alignment
	const { cards } = useBoardCards(boardId);

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
			// DELETE SHORTCUTS
			// ============================================================================

			// Delete/Backspace: Delete selected cards
			if (
				(e.key === 'Delete' || e.key === 'Backspace') &&
				!isEditing &&
				selectedCardIds.size > 0
			) {
				e.preventDefault();

				if (!boardId) return;

				const cardIds = Array.from(selectedCardIds) as string[];

				deleteCards(cardIds, boardId);
				return;
			}

			// ============================================================================
			// UNDO/REDO SHORTCUTS (powered by Zundo - viewport only for now)
			// ============================================================================

			// TODO Phase 2: Implement custom undo store for card operations
			// Undo: Cmd/Ctrl + Z
			if (isMod && e.key === 'z' && !e.shiftKey && !isEditing) {
				e.preventDefault();
				undo(); // Only undoes viewport changes for now
				return;
			}

			// Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
			if (
				((isMod && e.key === 'z' && e.shiftKey) || (isMod && e.key === 'y')) &&
				!isEditing
			) {
				e.preventDefault();
				redo(); // Only redoes viewport changes for now
				return;
			}

			// ============================================================================
			// LAYERING SHORTCUTS
			// ============================================================================

			// Bring to Front: Cmd/Ctrl + ]
			if (isMod && e.key === ']' && !isEditing && selectedCardIds.size > 0 && boardId) {
				e.preventDefault();
				const cardIds = Array.from(selectedCardIds);
				bringCardsToFront(cardIds as string[], boardId, cards);
				return;
			}

			// Send to Back: Cmd/Ctrl + [
			if (isMod && e.key === '[' && !isEditing && selectedCardIds.size > 0 && boardId) {
				e.preventDefault();
				const cardIds = Array.from(selectedCardIds);
				sendCardsToBack(cardIds, boardId, cards);
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

			// ============================================================================
			// ALIGNMENT SHORTCUTS (Arrow Keys)
			// ============================================================================

			// Only trigger alignment if multiple cards are selected and not editing
			if (!isEditing && selectedCardIds.size >= 2 && boardId) {
				const selectedCards = cards.filter(c => selectedCardIds.has(c.id));
				const movableCards = selectedCards.filter(c => !c.is_position_locked);

				if (movableCards.length >= 2) {
					// Align Top: Up Arrow
					if (e.key === 'ArrowUp' && !isMod) {
						e.preventDefault();
						alignCardsTop(movableCards, boardId);
						return;
					}

					// Align Bottom: Down Arrow
					if (e.key === 'ArrowDown' && !isMod) {
						e.preventDefault();
						alignCardsBottom(movableCards, boardId);
						return;
					}

					// Align Left: Left Arrow
					if (e.key === 'ArrowLeft' && !isMod) {
						e.preventDefault();
						alignCardsLeft(movableCards, boardId);
						return;
					}

					// Align Right: Right Arrow
					if (e.key === 'ArrowRight' && !isMod) {
						e.preventDefault();
						alignCardsRight(movableCards, boardId);
						return;
					}
				}
			}

			// ============================================================================
			// PRESENTATION MODE
			// ============================================================================

			// Shift + F5: Always start basic presentation mode (fullscreen with pan/zoom)
			if (e.key === 'F5' && e.shiftKey) {
				e.preventDefault();
				enterPresentationMode('basic');
				return;
			}

			// F5 or Cmd/Ctrl + Enter: Start presentation (advanced if nodes exist, basic otherwise)
			if (e.key === 'F5' || (isMod && e.key === 'Enter')) {
				e.preventDefault();
				const presentationNodes = cards.filter(c => c.card_type === 'presentation_node');

				if (presentationNodes.length > 0) {
					enterPresentationMode('advanced');
				} else {
					enterPresentationMode('basic');
				}
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
		cards,
		enabled,
		boardId,
		selectedCardIds,
		undo,
		redo,
		zoomIn,
		zoomOut,
		resetViewport,
		enterPresentationMode
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
	alignment: {
		'Up Arrow': 'Align selected cards to top',
		'Down Arrow': 'Align selected cards to bottom',
		'Left Arrow': 'Align selected cards to left',
		'Right Arrow': 'Align selected cards to right',
	},
} as const;