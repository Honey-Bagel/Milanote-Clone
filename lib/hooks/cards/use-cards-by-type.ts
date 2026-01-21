'use client';

import { db } from "@/lib/instant/db";
import { CardData as Card } from "@/lib/types";

/**
 * Fetch cards of a specific type for a board
 * 
 * @param {string | null} boardId - Board ID to fetch cards for
 * @param {Card["card_type"]} cardType - Type of cards to fetch
 * @returns {Object} cards - Array of cards of specified type
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error if any
 * @returns {number} count - Number of cards returned
 */
export function useCardsByType(boardId: string | null, cardType: Card["card_type"]) {
	const { data, isLoading, error } = db.useQuery(
		boardId ? {
			cards: {
				$: {
					where: {
						board_id: boardId,
						card_type: cardType,
					},
					order: {
						order_key: 'asc',
					},
				},
			},
		} : null
	);

	const cards = (data?.cards || []) as Card[];

	return {
		cards,
		isLoading,
		error,
		count: cards.length
	};
}