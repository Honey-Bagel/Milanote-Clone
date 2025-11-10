/**
 * Z-Index Manager
 * 
 * Manages z-index values for canvas cards, ensuring proper layering and preventing conflicts.
 * Similar to Milanote's approach, z-indexes are managed in increments of 10 to allow for
 * easy insertion of cards between existing layers.
 * 
 * Key features:
 * - Z-indexes are multiples of 10 (0, 10, 20, 30, etc.)
 * - Cards are automatically brought to front when moved
 * - Supports batch operations for multiple cards
 * - Handles normalization to prevent extreme values
 */

const Z_INDEX_INCREMENT = 10;
const Z_INDEX_MIN = 0;
const Z_INDEX_MAX = 100000;

export interface CardZIndex {
	id: string;
	z_index: number;
}

/**
 * Normalize z-indexes for all cards, ensuring they're properly spaced
 * This is useful when z-indexes have become fragmented or reach high values
 */
export function normalizeZIndexes(cards: CardZIndex[]): Map<string, number> {
	const sortedCards = [...cards].sort((a, b) => a.z_index - b.z_index);
	const updates = new Map<string, number>();

	sortedCards.forEach((card, index) => {
		const newZIndex = index * Z_INDEX_INCREMENT;
		if (card.z_index !== newZIndex) {
			updates.set(card.id, newZIndex);
		}
	});

	return updates;
}

/**
 * Get the next available z-index (highest current + increment)
 */
export function getNextZIndex(cards: CardZIndex[]): number {
	if (cards.length === 0) return Z_INDEX_MIN;

	const maxZIndex = Math.max(...cards.map(c => c.z_index));
	const nextZIndex = maxZIndex + Z_INDEX_INCREMENT;

	// Check if we need to normalize
	if (nextZIndex > Z_INDEX_MAX) {
		// Return the max for now, normalization should be triggered
		return maxZIndex;
	}

	return nextZIndex;
}

/**
 * Bring card(s) to front, returning all necessary z-index updates
 * This is the main function to call when a card is moved or clicked
 * 
 * Smart behavior: Uses a bounded swapping system to prevent z-index climbing.
 * Instead of always incrementing, cards swap positions within the top tier.
 * 
 * Example with 2 cards:
 * - Click Card A: A=20, B=10
 * - Click Card B: B=20, A=10 (swapped, not incremented)
 * - Click Card A: A=20, B=10 (swapped back)
 * 
 * This keeps z-indexes bounded relative to the total number of cards.
 */
export function bringToFront(
	cardIds: string[],
	allCards: CardZIndex[]
): Map<string, number> {
	if (cardIds.length === 0) return new Map();

	const updates = new Map<string, number>();
	const sortedCards = [...allCards].sort((a, b) => b.z_index - a.z_index);
	
	// Check if all selected cards are already at the very top
	const topCards = sortedCards.slice(0, cardIds.length);
	const topCardIds = new Set(topCards.map(c => c.id));
	const allSelectedAreAtTop = cardIds.every(id => topCardIds.has(id));
	
	if (allSelectedAreAtTop) {
		// Cards are already at the top, no need to update
		return updates;
	}
	
	// Smart swapping system: Keep z-indexes bounded
	const totalCards = allCards.length;
	const maxReasonableZIndex = totalCards * Z_INDEX_INCREMENT;
	const currentMaxZIndex = sortedCards[0]?.z_index ?? Z_INDEX_MIN;
	
	// Check if we should normalize (z-indexes are too high relative to card count)
	const shouldNormalize = 
		currentMaxZIndex > maxReasonableZIndex * 2 || 
		currentMaxZIndex > Z_INDEX_MAX * 0.8;
	
	if (shouldNormalize) {
		// Normalize everything first
		const normalizeUpdates = normalizeZIndexes(allCards);
		normalizeUpdates.forEach((zIndex, id) => {
			updates.set(id, zIndex);
		});
		
		// After normalization, bring selected cards to top
		const normalizedMax = (totalCards - 1) * Z_INDEX_INCREMENT;
		cardIds.forEach((id, index) => {
			updates.set(id, normalizedMax - (cardIds.length - 1 - index) * Z_INDEX_INCREMENT);
		});
	} else {
		// Smart swapping within bounded range
		// Instead of incrementing, we swap positions with cards at the top
		
		// Get the target z-indexes (the top N positions)
		const targetZIndexes = sortedCards
			.slice(0, cardIds.length)
			.map(c => c.z_index)
			.sort((a, b) => b - a); // Highest to lowest
		
		// Get the cards that will be displaced
		const cardsToDisplace = sortedCards
			.slice(0, cardIds.length)
			.filter(c => !cardIds.includes(c.id));
		
		// Get the z-indexes that the selected cards currently occupy
		const selectedCardsCurrentZIndexes = allCards
			.filter(c => cardIds.includes(c.id))
			.map(c => c.z_index)
			.sort((a, b) => a - b); // Lowest to highest
		
		// Assign the top z-indexes to the selected cards
		cardIds.forEach((id, index) => {
			updates.set(id, targetZIndexes[index]);
		});
		
		// Assign the vacated z-indexes to the displaced cards (swap)
		cardsToDisplace.forEach((card, index) => {
			if (selectedCardsCurrentZIndexes[index] !== undefined) {
				updates.set(card.id, selectedCardsCurrentZIndexes[index]);
			}
		});
	}

	return updates;
}

/**
 * Send card(s) to back, returning all necessary z-index updates
 */
export function sendToBack(
	cardIds: string[],
	allCards: CardZIndex[]
): Map<string, number> {
	if (cardIds.length === 0) return new Map();

	const updates = new Map<string, number>();
	const currentMinZIndex = Math.min(...allCards.map(c => c.z_index), Z_INDEX_MIN);
	
	// Check if we can go lower
	const shouldNormalize = currentMinZIndex - (cardIds.length * Z_INDEX_INCREMENT) < Z_INDEX_MIN;
	
	if (shouldNormalize) {
		// Normalize all cards first, starting from a higher base
		const cardsNotBeingSent = allCards.filter(c => !cardIds.includes(c.id));
		const baseIndex = cardIds.length * Z_INDEX_INCREMENT;
		
		cardsNotBeingSent
			.sort((a, b) => a.z_index - b.z_index)
			.forEach((card, index) => {
				updates.set(card.id, baseIndex + (index * Z_INDEX_INCREMENT));
			});
		
		// Send selected cards to back
		cardIds.forEach((id, index) => {
			updates.set(id, index * Z_INDEX_INCREMENT);
		});
	} else {
		// Simple case: just send to back without normalization
		cardIds.forEach((id, index) => {
			updates.set(id, currentMinZIndex - ((cardIds.length - index) * Z_INDEX_INCREMENT));
		});
	}

	return updates;
}

/**
 * Move card(s) forward by one layer
 */
export function moveForward(
	cardIds: string[],
	allCards: CardZIndex[]
): Map<string, number> {
	if (cardIds.length === 0) return new Map();

	const updates = new Map<string, number>();
	const sortedAllCards = [...allCards].sort((a, b) => a.z_index - b.z_index);
	
	// For each card to move forward
	cardIds.forEach(cardId => {
		const currentCard = allCards.find(c => c.id === cardId);
		if (!currentCard) return;

		const currentIndex = sortedAllCards.findIndex(c => c.id === cardId);
		if (currentIndex === -1 || currentIndex === sortedAllCards.length - 1) {
			// Already at the top
			return;
		}

		// Get the card above
		const cardAbove = sortedAllCards[currentIndex + 1];
		const targetZIndex = cardAbove.z_index + Z_INDEX_INCREMENT;

		updates.set(cardId, targetZIndex);
	});

	return updates;
}

/**
 * Move card(s) backward by one layer
 */
export function moveBackward(
	cardIds: string[],
	allCards: CardZIndex[]
): Map<string, number> {
	if (cardIds.length === 0) return new Map();

	const updates = new Map<string, number>();
	const sortedAllCards = [...allCards].sort((a, b) => a.z_index - b.z_index);
	
	// For each card to move backward
	cardIds.forEach(cardId => {
		const currentCard = allCards.find(c => c.id === cardId);
		if (!currentCard) return;

		const currentIndex = sortedAllCards.findIndex(c => c.id === cardId);
		if (currentIndex === -1 || currentIndex === 0) {
			// Already at the bottom
			return;
		}

		// Get the card below
		const cardBelow = sortedAllCards[currentIndex - 1];
		const targetZIndex = cardBelow.z_index - Z_INDEX_INCREMENT;

		if (targetZIndex < Z_INDEX_MIN) {
			// Need to normalize
			const normalizeUpdates = normalizeZIndexes(allCards);
			normalizeUpdates.forEach((zIndex, id) => {
				updates.set(id, zIndex);
			});
			
			// Try again with normalized values
			const newCardBelow = normalizeUpdates.get(cardBelow.id);
			if (newCardBelow !== undefined) {
				updates.set(cardId, Math.max(Z_INDEX_MIN, newCardBelow - Z_INDEX_INCREMENT));
			}
		} else {
			updates.set(cardId, targetZIndex);
		}
	});

	return updates;
}

/**
 * Get z-index for a new card (places it on top)
 */
export function getZIndexForNewCard(allCards: CardZIndex[]): number {
	return getNextZIndex(allCards);
}

/**
 * Check if normalization is needed (z-indexes are getting too high or fragmented)
 */
export function shouldNormalize(cards: CardZIndex[]): boolean {
	if (cards.length === 0) return false;

	const maxZIndex = Math.max(...cards.map(c => c.z_index));
	const minZIndex = Math.min(...cards.map(c => c.z_index));

	// Normalize if we're approaching the max value
	if (maxZIndex > Z_INDEX_MAX * 0.8) return true;

	// Normalize if the range is much larger than needed
	const idealRange = cards.length * Z_INDEX_INCREMENT;
	const actualRange = maxZIndex - minZIndex;
	if (actualRange > idealRange * 3) return true;

	return false;
}

/**
 * Helper to convert Card objects to CardZIndex for the manager functions
 */
export function cardsToZIndexList<T extends { id: string; z_index: number }>(
	cards: T[]
): CardZIndex[] {
	return cards.map(card => ({
		id: card.id,
		z_index: card.z_index
	}));
}