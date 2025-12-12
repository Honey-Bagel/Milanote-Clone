/**
 * useCardDimensions Hook - Centralized dimension logic with clear contracts
 *
 * This hook provides a single source of truth for card dimensions, handling:
 * - Fixed height cards: Store height in DB, use for selection
 * - Dynamic height cards: Never store height, measure for selection
 * - Hybrid (Note cards): Auto-expand when content grows, new height becomes minimum
 * - Line cards: No dimensions (special case)
 *
 * Usage:
 * const dimensions = useCardDimensions(card);
 *
 * // dimensions.width - current width
 * // dimensions.height - current height or 'auto' for dynamic
 * // dimensions.resizeMode - 'both' | 'width-only' | 'none'
 * // dimensions.reportMeasuredHeight(height) - for dynamic/hybrid cards
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { Card, CardData } from '@/lib/types';
import { getDefaultCardDimensions } from '@/lib/utils';
import { CardService } from '@/lib/services';

// ============================================================================
// TYPES
// ============================================================================

export type HeightMode = 'fixed' | 'dynamic' | 'hybrid' | 'none';
export type ResizeMode = 'both' | 'width-only' | 'none';

export interface DimensionConfig {
	canResize: boolean;
	minWidth: number;
	minHeight: number | null; // null = no min height
	defaultWidth: number;
	defaultHeight: number | null; // null = dynamic height
	keepAspectRatio?: boolean;
}

export interface CardDimensions {
	// Current dimensions
	width: number;
	height: number | 'auto';

	// Constraints
	minWidth: number;
	minHeight: number | null;

	// For effective height calculation (used by CardFrame/SelectionOutline)
	effectiveHeight: number;

	// Resize capabilities
	canResize: boolean;
	resizeMode: ResizeMode;
	keepAspectRatio: boolean;

	// Height mode for this card type
	heightMode: HeightMode;

	// For selection outline - measured content height
	measuredHeight: number | null;

	// For hybrid cards - indicates if user has manually shrunk card below content
	isManuallyConstrained: boolean;

	// Actions
	reportMeasuredHeight: (height: number) => void;
	requestHeightExpansion: (newHeight: number) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine the height mode for a card type
 */
function getHeightMode(cardType: Card['card_type']): HeightMode {
	switch (cardType) {
		// Hybrid: User can resize, but content can auto-expand
		case 'note':
			return 'hybrid';

		// Fixed: Height is stored and user-controlled
		case 'image':
		case 'board':
		case 'file':
			return 'fixed';

		// Dynamic: Height is content-driven, not stored
		case 'task_list':
		case 'color_palette':
		case 'column':
		case 'link':
			return 'dynamic';

		// None: Line cards have no traditional dimensions
		case 'line':
			return 'none';

		default:
			return 'fixed';
	}
}

/**
 * Determine resize mode based on card type and config
 */
function getResizeMode(cardType: Card['card_type'], config: DimensionConfig): ResizeMode {
	if (!config.canResize) {
		return 'none';
	}

	// Dynamic height cards can only resize width
	if (config.defaultHeight === null) {
		return 'width-only';
	}

	// Line cards have no resize
	if (cardType === 'line') {
		return 'none';
	}

	return 'both';
}

// ============================================================================
// HOOK
// ============================================================================

export function useCardDimensions(card: Card | CardData): CardDimensions {
	// Get config for this card type
	const config = getDefaultCardDimensions(card.card_type as Card['card_type']);
	const heightMode = getHeightMode(card.card_type as Card['card_type']);
	const resizeMode = getResizeMode(card.card_type as Card['card_type'], config);

	// Track measured content height (for dynamic and hybrid cards)
	const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

	// Track if we're in the middle of auto-expansion
	const isAutoExpandingRef = useRef(false);

	// Track previous card height to detect external changes
	const prevCardHeightRef = useRef(card.height);

	// Track if user has manually shrunk the card below content height (disables auto-resize)
	const [isManuallyConstrained, setIsManuallyConstrained] = useState(false);
	const lastManualHeightRef = useRef<number | null>(null);

	// Calculate effective height based on height mode
	const effectiveHeight = useMemo(() => {
		const minH = config.minHeight ?? 0;
		const defaultH = config.defaultHeight ?? minH;

		switch (heightMode) {
			case 'none':
				// Line cards - no height concept
				return 0;

			case 'dynamic':
				// Dynamic cards use measured height or min height
				return measuredHeight || minH;

			case 'hybrid':
				// Hybrid (Note): Complex behavior like Milanote
				const storedHeight = card.height ?? minH;
				const contentHeight = measuredHeight || 0;

				// If user has manually constrained the card (shrunk below content),
				// don't auto-expand. Just use the stored height.
				if (isManuallyConstrained) {
					return storedHeight;
				}

				// Otherwise, auto-expand if content exceeds stored height
				return Math.max(storedHeight, contentHeight);

			case 'fixed':
			default:
				// Fixed cards use stored height or default
				return card.height ?? defaultH;
		}
	}, [heightMode, card.height, measuredHeight, config.minHeight, config.defaultHeight, isManuallyConstrained]);

	// Debounced save for auto-height expansion (hybrid mode)
	const debouncedHeightSave = useDebouncedCallback(async (newHeight: number) => {
		if (card.id === 'preview-card') return;
		if (heightMode !== 'hybrid') return;

		try {
			await CardService.updateCardTransform({
				cardId: card.id,
				boardId: card.board_id,
				transform: { height: newHeight },
				withUndo: false, // Don't create undo for auto-expansion
			});
		} catch (error) {
			console.error('[useCardDimensions] Failed to save auto-expanded height:', error);
		}
	}, 500);

	// Report measured height from content
	const reportMeasuredHeight = useCallback((height: number) => {
		console.log('[reportMeasuredHeight]', {
			cardId: card.id,
			measuredHeight: height,
			currentStoredHeight: card.height,
			isManuallyConstrained,
			heightMode,
		});

		setMeasuredHeight(prev => {
			// Avoid unnecessary state updates
			if (prev === height) return prev;
			return height;
		});

		// For hybrid cards, auto-expand and save if content exceeds stored height
		// BUT only if not manually constrained
		if (heightMode === 'hybrid' && !isManuallyConstrained) {
			const minH = config.minHeight ?? 0;
			const storedHeight = card.height ?? minH;
			console.log('[reportMeasuredHeight] Checking auto-expand:', {
				height,
				storedHeight,
				shouldExpand: height > storedHeight,
			});
			if (height > storedHeight) {
				console.log('[reportMeasuredHeight] Auto-expanding!', height);
				isAutoExpandingRef.current = true;
				debouncedHeightSave(height);
			}
		}
	}, [heightMode, card.height, card.id, config.minHeight, debouncedHeightSave, isManuallyConstrained]);

	// Request height expansion (manual trigger)
	const requestHeightExpansion = useCallback((newHeight: number) => {
		if (card.id === 'preview-card') return;
		if (heightMode === 'dynamic') return; // Dynamic cards don't store height

		const minH = config.minHeight ?? 0;
		const currentHeight = card.height ?? minH;
		if (newHeight > currentHeight) {
			debouncedHeightSave(newHeight);
		}
	}, [card.id, card.height, heightMode, config.minHeight, debouncedHeightSave]);

	// Detect manual resizing and update constraint state
	useEffect(() => {
		if (heightMode !== 'hybrid') return;
		if (card.height !== prevCardHeightRef.current) {
			const prevHeight = prevCardHeightRef.current;
			prevCardHeightRef.current = card.height;

			// Skip if this is the first render or auto-expansion
			if (prevHeight === undefined || isAutoExpandingRef.current) {
				isAutoExpandingRef.current = false;
				return;
			}

			const minH = config.minHeight ?? 0;
			const currentHeight = card.height ?? minH;
			const contentHeight = measuredHeight || 0;

			// User manually resized the card
			lastManualHeightRef.current = currentHeight;

			// Check if user shrunk the card below content height (enters constrained mode)
			if (contentHeight > 0 && currentHeight < contentHeight - 5) {
				// User has manually constrained the card
				console.log('[useCardDimensions] Card manually constrained', {
					cardId: card.id,
					currentHeight,
					contentHeight,
				});
				setIsManuallyConstrained(true);
			}
			// Check if user expanded the card to or above content height (exits constrained mode)
			else if (currentHeight >= contentHeight - 5) {
				// User has expanded card to content height or beyond - re-enable auto-resize
				console.log('[useCardDimensions] Card expanded above content, enabling auto-resize', {
					cardId: card.id,
					currentHeight,
					contentHeight,
				});
				setIsManuallyConstrained(false);
			}
		}
	}, [card.height, card.id, measuredHeight, heightMode, config.minHeight]);

	// Determine CSS height value
	const cssHeight = useMemo(() => {
		if (heightMode === 'none') return 0;
		if (heightMode === 'dynamic') return 'auto' as const;
		return effectiveHeight;
	}, [heightMode, effectiveHeight]);

	return {
		// Current dimensions
		width: card.width || config.defaultWidth,
		height: cssHeight,

		// Constraints
		minWidth: config.minWidth,
		minHeight: config.minHeight,

		// Effective height (always a number for calculations)
		effectiveHeight,

		// Resize capabilities
		canResize: config.canResize,
		resizeMode,
		keepAspectRatio: config.keepAspectRatio ?? false,

		// Height mode
		heightMode,

		// Measured height
		measuredHeight,

		// Manual constraint state
		isManuallyConstrained,

		// Actions
		reportMeasuredHeight,
		requestHeightExpansion,
	};
}

// ============================================================================
// UTILITY HOOK FOR CONTENT MEASUREMENT
// ============================================================================

/**
 * Hook to measure content height and report to dimensions
 * Use this in card components that need dynamic/hybrid height
 *
 * Usage:
 * const contentRef = useContentHeightMeasurement(dimensions.reportMeasuredHeight);
 * return <div ref={contentRef}>...</div>
 */
export function useContentHeightMeasurement(
	onHeightChange: (height: number) => void,
	enabled: boolean = true
) {
	const contentRef = useRef<HTMLDivElement>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);

	useEffect(() => {
		if (!enabled || !contentRef.current) return;

		const element = contentRef.current;

		resizeObserverRef.current = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const height = entry.contentRect.height;
				console.log('[ResizeObserver] Content height changed:', height);
				if (height > 0) {
					onHeightChange(height);
				}
			}
		});

		resizeObserverRef.current.observe(element);

		// Initial measurement
		const initialHeight = element.scrollHeight;
		console.log('[ResizeObserver] Initial measurement:', initialHeight);
		if (initialHeight > 0) {
			onHeightChange(initialHeight);
		}

		return () => {
			resizeObserverRef.current?.disconnect();
		};
	}, [enabled, onHeightChange]);

	return contentRef;
}
