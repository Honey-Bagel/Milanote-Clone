/**
 * useCardPersistence Hook - Reusable save/undo logic for all card types
 *
 * This hook encapsulates the duplicated save/undo pattern found in all card components:
 * - Debounced saving to prevent excessive database writes
 * - Previous content tracking for undo operations
 * - Automatic undo action creation
 * - Error handling
 *
 * Usage:
 * const { saveContent, saveContentImmediate, isSaving } = useCardPersistence({
 *   card,
 *   cardType: 'note',
 *   debounceMs: 1000,
 * });
 *
 * // Later in your component:
 * saveContent({ note_content: newContent });
 */

'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { Card, CardData } from '@/lib/types';
import { CardService } from '@/lib/services';
import { useUndoStore } from '@/lib/stores/undo-store';

// ============================================================================
// TYPES
// ============================================================================

export type CardContentUpdates = Record<string, unknown>;

export interface UseCardPersistenceOptions {
	card: Card | CardData;
	cardType: Card['card_type'];
	debounceMs?: number;
}

export interface UseCardPersistenceReturn {
	/**
	 * Save content with debouncing - automatically creates undo action
	 */
	saveContent: (updates: CardContentUpdates) => void;

	/**
	 * Save content immediately without debouncing
	 */
	saveContentImmediate: (updates: CardContentUpdates) => Promise<void>;

	/**
	 * Whether a save is currently in progress
	 */
	isSaving: boolean;

	/**
	 * Cancel any pending debounced saves
	 */
	cancelPendingSave: () => void;

	/**
	 * Flush any pending debounced saves immediately
	 */
	flushPendingSave: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract type-specific content fields from a card for undo tracking
 */
function extractTypeSpecificContent(card: Card | CardData, cardType: Card['card_type']): CardContentUpdates {
	switch (cardType) {
		case 'note':
			return {
				note_content: (card as any).note_content,
				note_color: (card as any).note_color,
			};
		case 'image':
			return {
				image_url: (card as any).image_url,
				image_caption: (card as any).image_caption,
				image_alt_text: (card as any).image_alt_text,
			};
		case 'task_list':
			return {
				task_list_title: (card as any).task_list_title,
				tasks: (card as any).tasks,
			};
		case 'link':
			return {
				link_title: (card as any).link_title,
				link_url: (card as any).link_url,
				link_favicon_url: (card as any).link_favicon_url,
			};
		case 'file':
			return {
				file_name: (card as any).file_name,
				file_url: (card as any).file_url,
				file_size: (card as any).file_size,
				file_mime_type: (card as any).file_mime_type,
			};
		case 'color_palette':
			return {
				palette_title: (card as any).palette_title,
				palette_description: (card as any).palette_description,
				palette_colors: (card as any).palette_colors,
			};
		case 'column':
			return {
				column_title: (card as any).column_title,
				column_background_color: (card as any).column_background_color,
				column_is_collapsed: (card as any).column_is_collapsed,
				column_items: (card as any).column_items,
			};
		case 'board':
			return {
				linked_board_id: (card as any).linked_board_id,
				board_title: (card as any).board_title,
				board_color: (card as any).board_color,
				board_card_count: (card as any).board_card_count,
			};
		case 'line':
			return {
				line_start_x: (card as any).line_start_x,
				line_start_y: (card as any).line_start_y,
				line_end_x: (card as any).line_end_x,
				line_end_y: (card as any).line_end_y,
				line_color: (card as any).line_color,
				line_stroke_width: (card as any).line_stroke_width,
				line_style: (card as any).line_style,
				line_start_cap: (card as any).line_start_cap,
				line_end_cap: (card as any).line_end_cap,
				line_curvature: (card as any).line_curvature,
				line_control_point_offset: (card as any).line_control_point_offset,
				line_reroute_nodes: (card as any).line_reroute_nodes,
				line_start_attached_card_id: (card as any).line_start_attached_card_id,
				line_start_attached_side: (card as any).line_start_attached_side,
				line_end_attached_card_id: (card as any).line_end_attached_card_id,
				line_end_attached_side: (card as any).line_end_attached_side,
			};
		default:
			return {};
	}
}

/**
 * Get a human-readable description for the card type
 */
function getCardTypeDescription(cardType: Card['card_type']): string {
	switch (cardType) {
		case 'note': return 'note';
		case 'image': return 'image';
		case 'task_list': return 'task list';
		case 'link': return 'link';
		case 'file': return 'file';
		case 'color_palette': return 'color palette';
		case 'column': return 'column';
		case 'board': return 'board';
		case 'line': return 'line';
		default: return 'card';
	}
}

// ============================================================================
// HOOK
// ============================================================================

export function useCardPersistence({
	card,
	cardType,
	debounceMs = 1000,
}: UseCardPersistenceOptions): UseCardPersistenceReturn {
	// Track previous content for undo operations
	const previousContentRef = useRef<CardContentUpdates>({});
	const [isSaving, setIsSaving] = useState(false);

	// Track the card ID to detect card changes
	const cardIdRef = useRef(card.id);

	// Initialize previous content on mount and when card changes
	useEffect(() => {
		// Only update previousContent when the card ID changes (new card)
		// or on initial mount
		if (cardIdRef.current !== card.id) {
			cardIdRef.current = card.id;
			previousContentRef.current = extractTypeSpecificContent(card, cardType);
		} else if (Object.keys(previousContentRef.current).length === 0) {
			// Initial mount - populate with current content
			previousContentRef.current = extractTypeSpecificContent(card, cardType);
		}
	}, [card, cardType]);

	// The actual save function (without debouncing)
	const performSave = useCallback(async (updates: CardContentUpdates): Promise<void> => {
		// Skip preview cards
		if (card.id === 'preview-card') return;

		const oldContent = { ...previousContentRef.current };
		const cardId = card.id;
		const boardId = card.board_id;

		try {
			setIsSaving(true);

			// Save to database
			await CardService.updateCardContent(cardId, boardId, cardType, updates);

			// Add undo action
			useUndoStore.getState().addAction({
				type: 'card_content',
				timestamp: Date.now(),
				description: `Edit ${getCardTypeDescription(cardType)}`,
				do: () => CardService.updateCardContent(cardId, boardId, cardType, updates),
				undo: () => CardService.updateCardContent(cardId, boardId, cardType, oldContent),
			});

			// Update previous content with the new values
			previousContentRef.current = {
				...previousContentRef.current,
				...updates,
			};
		} catch (error) {
			console.error(`[useCardPersistence] Failed to update ${cardType}:`, error);
			throw error;
		} finally {
			setIsSaving(false);
		}
	}, [card.id, card.board_id, cardType]);

	// Debounced save function
	const debouncedSave = useDebouncedCallback(performSave, debounceMs);

	// Wrapper that calls the debounced version
	const saveContent = useCallback((updates: CardContentUpdates) => {
		debouncedSave(updates);
	}, [debouncedSave]);

	// Immediate save (bypasses debounce)
	const saveContentImmediate = useCallback(async (updates: CardContentUpdates) => {
		// Cancel any pending debounced saves
		debouncedSave.cancel();
		await performSave(updates);
	}, [debouncedSave, performSave]);

	// Cancel pending saves
	const cancelPendingSave = useCallback(() => {
		debouncedSave.cancel();
	}, [debouncedSave]);

	// Flush pending saves immediately
	const flushPendingSave = useCallback(() => {
		debouncedSave.flush();
	}, [debouncedSave]);

	return {
		saveContent,
		saveContentImmediate,
		isSaving,
		cancelPendingSave,
		flushPendingSave,
	};
}
