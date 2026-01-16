/**
 * useCardBehavior Hook
 *
 * Returns the behavior configuration for a card type,
 * along with derived permissions based on current interaction mode.
 */

import { useMemo } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CARD_BEHAVIORS, type CardBehaviorConfig } from '@/lib/types/card-behaviors';
import type { Card } from '@/lib/types';

interface CardBehaviorPermissions extends CardBehaviorConfig {
	// Derived permissions based on current interaction mode
	canDragNow: boolean;
	canResizeNow: boolean;
	canEditNow: boolean;
}

/**
 * Get behavior configuration and current permissions for a card
 *
 * @param cardType - The type of card
 * @param cardId - The ID of the card (optional, used for permission checks)
 * @returns Behavior config plus current interaction permissions
 *
 * @example
 * const behavior = useCardBehavior('note', card.id);
 *
 * if (behavior.canEditNow) {
 *   // Show editor
 * }
 *
 * if (behavior.canResizeNow) {
 *   // Show resize handles
 * }
 */
export function useCardBehavior(
	cardType: Card['card_type'],
	cardId?: string
): CardBehaviorPermissions {
	const interactionMode = useCanvasStore((s) => s.interactionMode);

	const behavior = CARD_BEHAVIORS[cardType];

	return useMemo(() => {
		// Derived permissions based on interaction mode and card-specific behavior
		const canDragNow = behavior.draggable && (
			interactionMode.mode === 'idle' ||
			(interactionMode.mode === 'dragging' && cardId && interactionMode.cardIds.includes(cardId))
		);

		const canResizeNow = behavior.resizable !== 'none' && (
			interactionMode.mode === 'idle' ||
			(interactionMode.mode === 'resizing' && cardId && interactionMode.cardId === cardId)
		);

		const canEditNow = behavior.editable && (
			interactionMode.mode === 'idle' ||
			(interactionMode.mode === 'editing' && cardId && interactionMode.cardId === cardId)
		);

		return {
			...behavior,
			canDragNow,
			canResizeNow,
			canEditNow,
		};
	}, [behavior, interactionMode, cardId]);
}
