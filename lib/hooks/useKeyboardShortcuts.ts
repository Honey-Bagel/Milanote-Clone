/**
 * useKeyboardShortcuts Hook
 *
 * Handles all keyboard shortcuts for the canvas
 * Updated to work with Zundo undo/redo
 */

import { useEffect } from 'react';
import { useCanvasStore, useCanvasHistory } from '../stores/canvas-store';
import { deleteCard as deleteCardDB, bringCardsToFront, sendCardsToBack, alignCardsTop, alignCardsBottom, alignCardsLeft, alignCardsRight } from '@/lib/instant/card-mutations';
import { useUndoStore } from '@/lib/stores/undo-store';
import { useBoardCards } from '@/lib/hooks/cards/use-board-cards';
// TODO Phase 3-7: Re-enable these imports when migrating content updates
// import { updateCardContent, restoreCard } from '../data/cards-client';
import type { Card } from '../types';

/**
 * Extract type-specific data from a card for re-creation
 */
function getTypeSpecificData(card: Card): any {
	switch (card.card_type) {
		case 'note':
			return {
				content: card.note_cards.content,
				color: card.note_cards.color,
			};
		case 'text':
			return {
				content: card.text_cards.content,
				title: card.text_cards.title,
			};
		case 'image':
			return {
				image_url: card.image_cards.image_url,
				caption: card.image_cards.caption,
				alt_text: card.image_cards.alt_text,
			};
		case 'link':
			return {
				url: card.link_cards.url,
				title: card.link_cards.title,
				favicon_url: card.link_cards.favicon_url,
			};
		case 'task_list':
			return {
				title: card.task_list_cards.title,
				tasks: card.task_list_cards.tasks,
			};
		case 'column':
			return {
				title: card.column_cards.title,
				column_items: card.column_cards.column_items,
			};
		default:
			return {};
	}
}

/**
 * Sync cards to database after undo/redo
 * Compares old and new state and persists any changes
 */
async function syncCardsToDatabase(
	oldCards: Map<string, Card>,
	newCards: Map<string, Card>
) {
	const promises: Promise<void>[] = [];

	// Handle deleted cards (existed in old, not in new)
	for (const [id] of oldCards) {
		if (!newCards.has(id)) {
			promises.push(deleteCard(id));
		}
	}

	// Handle added cards (exists in new, not in old) - restore with original ID
	for (const [id, newCard] of newCards) {
		if (!oldCards.has(id)) {
			const typeSpecificData = getTypeSpecificData(newCard);
			promises.push(
				restoreCard(
					id,
					newCard.board_id,
					newCard.card_type,
					{
						position_x: newCard.position_x,
						position_y: newCard.position_y,
						width: newCard.width,
						height: newCard.height ?? undefined,
						order_key: newCard.order_key,
						z_index: newCard.z_index,
					},
					typeSpecificData
				)
			);
			continue;
		}

		const oldCard = oldCards.get(id);
		if (!oldCard) continue;

		// Check for transform changes (position, size, z-index)
		const transformChanged =
			oldCard.position_x !== newCard.position_x ||
			oldCard.position_y !== newCard.position_y ||
			oldCard.width !== newCard.width ||
			oldCard.height !== newCard.height ||
			oldCard.order_key !== newCard.order_key;

		if (transformChanged) {
			promises.push(
				updateCardTransform(id, {
					position_x: newCard.position_x,
					position_y: newCard.position_y,
					width: newCard.width,
					height: newCard.height ?? undefined,
					order_key: newCard.order_key,
				})
			);
		}

		// Check for content changes based on card type
		if (newCard.card_type === 'note' && oldCard.card_type === 'note') {
			if (oldCard.note_cards.content !== newCard.note_cards.content ||
				oldCard.note_cards.color !== newCard.note_cards.color) {
				promises.push(
					updateCardContent(id, 'note', {
						content: newCard.note_cards.content,
						color: newCard.note_cards.color,
					})
				);
			}
		} else if (newCard.card_type === 'text' && oldCard.card_type === 'text') {
			if (oldCard.text_cards.content !== newCard.text_cards.content ||
				oldCard.text_cards.title !== newCard.text_cards.title) {
				promises.push(
					updateCardContent(id, 'text', {
						content: newCard.text_cards.content,
						title: newCard.text_cards.title,
					})
				);
			}
		} else if (newCard.card_type === 'link' && oldCard.card_type === 'link') {
			if (oldCard.link_cards.url !== newCard.link_cards.url ||
				oldCard.link_cards.title !== newCard.link_cards.title) {
				promises.push(
					updateCardContent(id, 'link', {
						url: newCard.link_cards.url,
						title: newCard.link_cards.title,
					})
				);
			}
		} else if (newCard.card_type === 'task_list' && oldCard.card_type === 'task_list') {
			if (oldCard.task_list_cards.title !== newCard.task_list_cards.title ||
				JSON.stringify(oldCard.task_list_cards.tasks) !== JSON.stringify(newCard.task_list_cards.tasks)) {
				promises.push(
					updateCardContent(id, 'task_list', {
						title: newCard.task_list_cards.title,
						tasks: newCard.task_list_cards.tasks,
					})
				);
			}
		} else if (newCard.card_type === 'image' && oldCard.card_type === 'image') {
			if (oldCard.image_cards.caption !== newCard.image_cards.caption ||
				oldCard.image_cards.alt_text !== newCard.image_cards.alt_text) {
				promises.push(
					updateCardContent(id, 'image', {
						caption: newCard.image_cards.caption,
						alt_text: newCard.image_cards.alt_text,
					})
				);
			}
		} else if (newCard.card_type === 'column' && oldCard.card_type === 'column') {
			if (oldCard.column_cards.title !== newCard.column_cards.title) {
				promises.push(
					updateCardContent(id, 'column', {
						title: newCard.column_cards.title,
					})
				);
			}
		}
	}

	try {
		await Promise.all(promises);
	} catch (error) {
		console.error('Failed to sync undo/redo changes:', error);
	}
}

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
		deleteCards,
		// TODO Phase 3-5: Re-enable these when implementing with InstantDB
		// copySelected,
		// cutSelected,
		// paste,
		// duplicateCard,
		zoomIn,
		zoomOut,
		resetViewport,
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
			// SELECTION SHORTCUTS
			// ============================================================================

			// TODO Phase 3: Re-enable Select All
			// Select All: Cmd/Ctrl + A
			// if (isMod && e.key === 'a' && !isEditing) {
			// 	e.preventDefault();
			// 	selectAll();
			// 	return;
			// }

			// ============================================================================
			// CLIPBOARD SHORTCUTS
			// ============================================================================

			// TODO Phase 3-5: Re-enable clipboard operations with InstantDB
			// Copy: Cmd/Ctrl + C
			// if (isMod && e.key === 'c' && !isEditing && selectedCardIds.size > 0) {
			// 	e.preventDefault();
			// 	copySelected();
			// 	return;
			// }

			// Cut: Cmd/Ctrl + X
			// if (isMod && e.key === 'x' && !isEditing && selectedCardIds.size > 0) {
			// 	e.preventDefault();
			// 	cutSelected();
			// 	return;
			// }

			// Paste: Cmd/Ctrl + V
			// if (isMod && e.key === 'v' && !isEditing) {
			// 	e.preventDefault();
			// 	paste();
			// 	return;
			// }

			// Duplicate: Cmd/Ctrl + D
			// if (isMod && e.key === 'd' && !isEditing && selectedCardIds.size > 0) {
			// 	e.preventDefault();
			// 	// Duplicate all selected cards
			// 	Array.from(selectedCardIds).forEach((id) => duplicateCard(id));
			// 	return;
			// }

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

				const cardIds = Array.from(selectedCardIds);

				// Get the card data for each card to handle board card cascade deletes
				const selectedCards = cards.filter(c => cardIds.includes(c.id));

				// Delete from database - use individual deleteCard for each to handle cascade (no await for instant UI update)
				selectedCards.forEach(card =>
					deleteCardDB(card.id, boardId, card).catch((error) => {
						console.error(`Failed to delete card ${card.id}:`, error);
					})
				);

				// Update UI state
				deleteCards(cardIds);

				// Add undo action (skip for now - complex)
				useUndoStore.getState().addAction({
					type: 'batch',
					timestamp: Date.now(),
					description: `Delete ${cardIds.length} card${cardIds.length > 1 ? 's' : ''}`,
					do: async () => {
						const deletePromises = selectedCards.map(card =>
							deleteCardDB(card.id, boardId, card)
						);
						await Promise.all(deletePromises);
					},
					undo: async () => {
						console.warn('Undo multi-delete not yet implemented');
					},
				});

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
				bringCardsToFront(cardIds, boardId, cards);
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

			// TODO Phase 5: Re-enable zoom to fit (needs card data)
			// Zoom to Fit: Cmd/Ctrl + 1
			// if (isMod && e.key === '1' && !isEditing) {
			// 	e.preventDefault();
			// 	zoomToFit();
			// 	return;
			// }

			// ============================================================================
			// ALIGNMENT SHORTCUTS (Arrow Keys)
			// ============================================================================

			// Only trigger alignment if multiple cards are selected and not editing
			if (!isEditing && selectedCardIds.size >= 2 && boardId) {
				const selectedCards = cards.filter(c => selectedCardIds.has(c.id));

				// Align Top: Up Arrow
				if (e.key === 'ArrowUp' && !isMod) {
					e.preventDefault();
					alignCardsTop(selectedCards, boardId);
					return;
				}

				// Align Bottom: Down Arrow
				if (e.key === 'ArrowDown' && !isMod) {
					e.preventDefault();
					alignCardsBottom(selectedCards, boardId);
					return;
				}

				// Align Left: Left Arrow
				if (e.key === 'ArrowLeft' && !isMod) {
					e.preventDefault();
					alignCardsLeft(selectedCards, boardId);
					return;
				}

				// Align Right: Right Arrow
				if (e.key === 'ArrowRight' && !isMod) {
					e.preventDefault();
					alignCardsRight(selectedCards, boardId);
					return;
				}
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
		boardId,
		selectedCardIds,
		deleteCards,
		undo,
		redo,
		zoomIn,
		zoomOut,
		resetViewport,
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