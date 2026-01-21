'use client';

import { db } from "@/lib/instant/db";
import { CardData as Card } from "@/lib/types";

/**
 * Fetch a single card by ID
 * 
 * @param {string | null} cardId - Card ID to fetch
 * @returns {Object} card - Card object or null
 * @returns {boolean} isLoading - Loading state
 * @return {Error} error - Error if any
 */
export function useCard(cardId: string | null) {
	const { data, isLoading, error } = db.useQuery(
		cardId ? {
			cards: {
				$: {
					where: {
						id: cardId,
					},
				},
			},
		} : null
	);

	const card = data?.cards?.[0] as Card | null;

	return {
		card,
		isLoading,
		error,
	};
}