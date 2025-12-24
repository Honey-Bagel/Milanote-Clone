/**
 * CardContext - Shared state and actions for all card components
 *
 * This context eliminates prop drilling and provides a unified interface
 * for card components to access shared functionality like:
 * - Card data and state (isEditing, isSelected, etc.)
 * - Persistence (save content with automatic undo/redo)
 * - Dimensions (with proper contract for different height modes)
 */

'use client';

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import type { Card, CardData } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useCardPersistence, type CardContentUpdates } from './useCardPersistence';
import { useCardDimensions, type CardDimensions } from './useCardDimensions';

// ============================================================================
// TYPES
// ============================================================================

export interface CardContextValue {
	// Card data
	card: Card;
	cardId: string;
	boardId: string;

	// State
	isEditing: boolean;
	isSelected: boolean;
	isReadOnly: boolean;
	isInsideColumn: boolean;

	// Dimensions (from useCardDimensions)
	dimensions: CardDimensions;

	// Persistence actions (from useCardPersistence)
	saveContent: (updates: CardContentUpdates) => void;
	saveContentImmediate: (updates: CardContentUpdates) => Promise<void>;
	isSaving: boolean;

	// UI Actions
	setEditing: (editing: boolean) => void;
	stopEditing: () => void;

	// Height management (for hybrid height cards like Note)
	reportContentHeight: (height: number) => void;
}

export interface CardProviderProps {
	card: Card;
	boardId: string;
	isSelected: boolean;
	isReadOnly?: boolean;
	isInsideColumn?: boolean;
	allCards?: Map<string, Card | CardData>;
	children: ReactNode;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CardContext = createContext<CardContextValue | null>(null);

/**
 * Hook to access card context - must be used within CardProvider
 */
export function useCardContext(): CardContextValue {
	const context = useContext(CardContext);
	if (!context) {
		throw new Error('useCardContext must be used within a CardProvider');
	}
	return context;
}

/**
 * Optional hook that returns null if not in a CardProvider
 * Useful for components that may or may not be in a card context
 */
export function useOptionalCardContext(): CardContextValue | null {
	return useContext(CardContext);
}

// ============================================================================
// PROVIDER
// ============================================================================

export function CardProvider({
	card,
	boardId,
	isSelected,
	isReadOnly = false,
	isInsideColumn = false,
	children,
}: CardProviderProps) {
	// Get editing state from canvas store
	const { editingCardId, setEditingCardId } = useCanvasStore();
	const isEditing = editingCardId === card.id;

	// Initialize persistence hook
	const {
		saveContent,
		saveContentImmediate,
		isSaving,
	} = useCardPersistence({
		card,
		cardType: card.card_type,
		debounceMs: 1000,
	});

	// Initialize dimensions hook
	const dimensions = useCardDimensions(card, isEditing);

	// UI Actions
	const setEditing = useCallback((editing: boolean) => {
		if (isReadOnly) return;
		setEditingCardId(editing ? card.id : null);
	}, [card.id, isReadOnly, setEditingCardId]);

	const stopEditing = useCallback(() => {
		setEditingCardId(null);
	}, [setEditingCardId]);

	// Height reporting for hybrid height cards (Note)
	const reportContentHeight = useCallback((height: number) => {
		dimensions.reportMeasuredHeight(height);
	}, [dimensions]);

	// Memoize context value to prevent unnecessary re-renders
	const contextValue = useMemo<CardContextValue>(() => ({
		// Card data
		card,
		cardId: card.id,
		boardId,

		// State
		isEditing,
		isSelected,
		isReadOnly,
		isInsideColumn,

		// Dimensions
		dimensions,

		// Persistence
		saveContent,
		saveContentImmediate,
		isSaving,

		// UI Actions
		setEditing,
		stopEditing,

		// Height management
		reportContentHeight,
	}), [
		card,
		boardId,
		isEditing,
		isSelected,
		isReadOnly,
		isInsideColumn,
		dimensions,
		saveContent,
		saveContentImmediate,
		isSaving,
		setEditing,
		stopEditing,
		reportContentHeight,
	]);

	return (
		<CardContext.Provider value={contextValue}>
			{children}
		</CardContext.Provider>
	);
}

// ============================================================================
// UTILITY HOOKS FOR SPECIFIC CARD TYPES
// ============================================================================

/**
 * Type-safe hook for Note cards
 */
export function useNoteCardContext() {
	const context = useCardContext();
	if (context.card.card_type !== 'note') {
		throw new Error('useNoteCardContext must be used with a note card');
	}
	return context as CardContextValue & { card: Card & { card_type: 'note' } };
}

/**
 * Type-safe hook for Image cards
 */
export function useImageCardContext() {
	const context = useCardContext();
	if (context.card.card_type !== 'image') {
		throw new Error('useImageCardContext must be used with an image card');
	}
	return context as CardContextValue & { card: Card & { card_type: 'image' } };
}

/**
 * Type-safe hook for TaskList cards
 */
export function useTaskListCardContext() {
	const context = useCardContext();
	if (context.card.card_type !== 'task_list') {
		throw new Error('useTaskListCardContext must be used with a task_list card');
	}
	return context as CardContextValue & { card: Card & { card_type: 'task_list' } };
}

/**
 * Type-safe hook for Column cards
 */
export function useColumnCardContext() {
	const context = useCardContext();
	if (context.card.card_type !== 'column') {
		throw new Error('useColumnCardContext must be used with a column card');
	}
	return context as CardContextValue & { card: Card & { card_type: 'column' } };
}
