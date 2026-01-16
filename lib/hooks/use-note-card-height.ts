/**
 * useNoteCardHeight Hook - Note card height state machine
 *
 * Manages the complex height behavior for note cards:
 * - Normal mode: Auto-expands to fit content
 * - Shrunk mode: User manually resized below content height
 * - Edit mode: Temporarily expands to show all content
 *
 * This hook integrates with the ephemeral store so height state
 * persists across component remounts and can be accessed globally.
 */

import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CardService } from '@/lib/services/card-service';
import { useDebouncedCallback } from 'use-debounce';
import type { Card } from '@/lib/types';

interface UseNoteCardHeightOptions {
	card: Card & { card_type: 'note' };
	isEditing: boolean;
	minHeight?: number;
}

export interface NoteCardHeightResult {
	/**
	 * Current height to render (px)
	 * - In normal mode: max(userSetHeight || minHeight, naturalContentHeight)
	 * - In shrunk mode (view): userSetHeight
	 * - In shrunk mode (editing): naturalContentHeight (temporary expansion)
	 */
	currentHeight: number;

	/**
	 * Whether the card is in shrunk mode (user resized below content)
	 */
	isShrunk: boolean;

	/**
	 * Report measured content height from ResizeObserver
	 */
	reportContentHeight: (height: number) => void;

	/**
	 * Called when user manually resizes the card
	 */
	onManualResize: (newHeight: number) => void;
}

export function useNoteCardHeight({
	card,
	isEditing,
	minHeight = 100,
}: UseNoteCardHeightOptions): NoteCardHeightResult {
	const {
		getNoteCardHeight,
		setNoteCardHeight,
		initializeNoteCardHeight,
	} = useCanvasStore();

	// Initialize ephemeral state if not exists
	useEffect(() => {
		const existing = getNoteCardHeight(card.id);
		if (!existing) {
			// Default to auto mode (userSetHeight: null)
			// This means the card will automatically resize to fit content
			initializeNoteCardHeight(card.id, {
				heightMode: 'normal',
				editMode: 'view',
				currentHeight: card.height ?? minHeight,
				naturalContentHeight: 0,
				userSetHeight: null, // null = auto mode by default
				heightBeforeEdit: null,
			});
		}
	}, [card.id, card.height, minHeight, getNoteCardHeight, initializeNoteCardHeight]);

	const heightState = getNoteCardHeight(card.id);

	// Sync edit mode with ephemeral store
	useEffect(() => {
		if (!heightState) return;

		const newEditMode = isEditing ? 'editing' : 'view';
		if (heightState.editMode !== newEditMode) {
			if (isEditing) {
				// Entering edit mode: save current height and expand to content
				setNoteCardHeight(card.id, {
					editMode: 'editing',
					heightBeforeEdit: heightState.currentHeight,
					currentHeight: heightState.naturalContentHeight || heightState.currentHeight,
				});
			} else {
				// Exiting edit mode: restore previous height
				setNoteCardHeight(card.id, {
					editMode: 'view',
					currentHeight: heightState.heightBeforeEdit ?? heightState.userSetHeight ?? minHeight,
					heightBeforeEdit: null,
				});
			}
		}
	}, [isEditing, card.id, heightState, setNoteCardHeight, minHeight]);

	// Debounced save to database
	const debouncedSave = useDebouncedCallback(async (newHeight: number) => {
		if (card.id === 'preview-card') return;

		try {
			await CardService.updateCardTransform({
				cardId: card.id,
				boardId: card.board_id,
				transform: { height: newHeight },
				withUndo: false, // Don't create undo for auto-expansion
			});
		} catch (error) {
			console.error('[useNoteCardHeight] Failed to save height:', error);
		}
	}, 500);

	// Report content height from ResizeObserver
	const reportContentHeight = useCallback(
		(height: number) => {
			if (!heightState) return;

			// Update naturalContentHeight
			setNoteCardHeight(card.id, {
				naturalContentHeight: height,
			});

			// Auto-resize logic (only in normal mode, not shrunk)
			if (heightState.heightMode === 'normal') {
				// If userSetHeight is null, we're in true auto mode - always match content
				const isAutoMode = heightState.userSetHeight === null;
				const currentHeight = heightState.currentHeight;
				const heightDiff = Math.abs(height - currentHeight);

				// Threshold of 2px to avoid measurement drift
				if (heightDiff > 2 && height >= minHeight) {
					if (isAutoMode) {
						// True auto mode: always match content, don't save to DB
						setNoteCardHeight(card.id, {
							currentHeight: height,
							// Keep userSetHeight as null to maintain auto mode
						});
						// Save to DB so the card height is preserved on reload
						debouncedSave(height);
					} else {
						// Manual height set, but in normal mode: allow expansion but not shrinking
						if (height > currentHeight) {
							setNoteCardHeight(card.id, {
								currentHeight: height,
								userSetHeight: height,
							});
							debouncedSave(height);
						}
					}
				}
			}

			// In editing mode, always expand to show full content
			if (isEditing && heightState.heightMode === 'shrunk') {
				setNoteCardHeight(card.id, {
					currentHeight: height,
				});
			}
		},
		[card.id, heightState, isEditing, minHeight, setNoteCardHeight, debouncedSave]
	);

	// Handle manual resize (user dragging resize handle)
	const onManualResize = useCallback(
		(newHeight: number) => {
			if (!heightState) return;
			if (newHeight < minHeight) return;

			const contentHeight = heightState.naturalContentHeight;
			const SNAP_RANGE = 20; // Pixels within content height to snap

			// Check if we're within snap range of content height
			const isNearContentHeight = contentHeight > 0 &&
				Math.abs(newHeight - contentHeight) <= SNAP_RANGE;

			if (isNearContentHeight) {
				// Snap to content height and return to auto mode
				setNoteCardHeight(card.id, {
					heightMode: 'normal',
					currentHeight: contentHeight,
					userSetHeight: null, // null means auto-height
				});
				// Save content height to DB
				debouncedSave(contentHeight);
			}
			// User is shrinking below content (enters shrunk mode)
			else if (contentHeight > 0 && newHeight < contentHeight - SNAP_RANGE) {
				setNoteCardHeight(card.id, {
					heightMode: 'shrunk',
					currentHeight: newHeight,
					userSetHeight: newHeight,
				});
				// Save to database
				debouncedSave(newHeight);
			}
			// User expanded above content (set explicit height, stay in normal mode)
			else {
				setNoteCardHeight(card.id, {
					heightMode: 'normal',
					currentHeight: newHeight,
					userSetHeight: newHeight,
				});
				// Save to database
				debouncedSave(newHeight);
			}
		},
		[card.id, heightState, minHeight, setNoteCardHeight, debouncedSave]
	);

	// Calculate current height based on state machine
	const currentHeight = heightState?.currentHeight ?? card.height ?? minHeight;
	const isShrunk = heightState?.heightMode === 'shrunk';

	return {
		currentHeight,
		isShrunk,
		reportContentHeight,
		onManualResize,
	};
}
