/**
 * Card Behavior Configuration System
 *
 * Defines the capabilities and constraints for each card type in a declarative way.
 * This makes it easy to understand what each card can do and add new card types.
 */

import type { Card } from '@/lib/types';

// ============================================================================
// BEHAVIOR TYPES
// ============================================================================

export interface CardBehaviorConfig {
	// Interaction capabilities
	resizable: 'none' | 'width-only' | 'full';
	draggable: boolean;
	editable: boolean;
	selectable: boolean;

	// Layout behaviors
	heightMode: 'fixed' | 'auto' | 'content-aware';
	maintainAspectRatio: boolean;

	// Container semantics
	canContainCards: boolean;
	canBeContained: boolean;

	// Connection capabilities
	canConnectFrom: boolean;
	canConnectTo: boolean;

	// Constraints
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
}

// ============================================================================
// CARD BEHAVIOR CONFIGURATIONS
// ============================================================================

export const CARD_BEHAVIORS: Record<Card['card_type'], CardBehaviorConfig> = {
	note: {
		resizable: 'width-only',
		draggable: true,
		editable: true,
		selectable: true,
		heightMode: 'content-aware', // Auto-height with manual override
		maintainAspectRatio: false,
		canContainCards: false,
		canBeContained: true,
		canConnectFrom: true,
		canConnectTo: true,
		minWidth: 200,
		maxWidth: 800,
	},

	image: {
		resizable: 'full',
		draggable: true,
		editable: false,
		selectable: true,
		heightMode: 'fixed',
		maintainAspectRatio: true,
		canContainCards: false,
		canBeContained: true,
		canConnectFrom: true,
		canConnectTo: true,
		minWidth: 100,
		maxWidth: 1200,
		minHeight: 100,
		maxHeight: 1200,
	},

	task_list: {
		resizable: 'width-only',
		draggable: true,
		editable: true,
		selectable: true,
		heightMode: 'auto', // Height grows with tasks
		maintainAspectRatio: false,
		canContainCards: false,
		canBeContained: true,
		canConnectFrom: true,
		canConnectTo: true,
		minWidth: 250,
		maxWidth: 600,
	},

	link: {
		resizable: 'width-only',
		draggable: true,
		editable: false,
		selectable: true,
		heightMode: 'auto',
		maintainAspectRatio: false,
		canContainCards: false,
		canBeContained: true,
		canConnectFrom: true,
		canConnectTo: true,
		minWidth: 250,
		maxWidth: 600,
	},

	file: {
		resizable: 'width-only',
		draggable: true,
		editable: false,
		selectable: true,
		heightMode: 'auto',
		maintainAspectRatio: false,
		canContainCards: false,
		canBeContained: true,
		canConnectFrom: true,
		canConnectTo: true,
		minWidth: 250,
		maxWidth: 600,
	},

	color_palette: {
		resizable: 'full',
		draggable: true,
		editable: false,
		selectable: true,
		heightMode: 'auto',
		maintainAspectRatio: false,
		canContainCards: false,
		canBeContained: true,
		canConnectFrom: true,
		canConnectTo: true,
		minWidth: 150,
		maxWidth: 400,
	},

	column: {
		resizable: 'full',
		draggable: true,
		editable: false, // Columns don't have text editing
		selectable: true,
		heightMode: 'auto', // Height based on contained cards
		maintainAspectRatio: false,
		canContainCards: true, // Key difference!
		canBeContained: false, // Columns can't be in other columns
		canConnectFrom: true,
		canConnectTo: true,
		minWidth: 250,
		maxWidth: 600,
		minHeight: 300,
	},

	board: {
		resizable: 'full',
		draggable: true,
		editable: false,
		selectable: true,
		heightMode: 'fixed',
		maintainAspectRatio: false,
		canContainCards: false,
		canBeContained: true,
		canConnectFrom: true,
		canConnectTo: true,
		minWidth: 200,
		maxWidth: 600,
		minHeight: 150,
		maxHeight: 400,
	},

	line: {
		resizable: 'none', // Lines resize by dragging endpoints
		draggable: false, // Lines move by dragging endpoints
		editable: false,
		selectable: true,
		heightMode: 'auto', // SVG height calculated from path
		maintainAspectRatio: false,
		canContainCards: false,
		canBeContained: false,
		canConnectFrom: false,
		canConnectTo: false,
	},
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get behavior configuration for a card type
 */
export function getCardBehavior(cardType: Card['card_type']): CardBehaviorConfig {
	return CARD_BEHAVIORS[cardType];
}

/**
 * Check if a card can be resized
 */
export function canResize(cardType: Card['card_type']): boolean {
	return CARD_BEHAVIORS[cardType].resizable !== 'none';
}

/**
 * Check if a card can contain other cards
 */
export function canContain(cardType: Card['card_type']): boolean {
	return CARD_BEHAVIORS[cardType].canContainCards;
}

/**
 * Check if a card can be placed inside containers
 */
export function canBeContained(cardType: Card['card_type']): boolean {
	return CARD_BEHAVIORS[cardType].canBeContained;
}
