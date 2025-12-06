'use client';

import { db } from "@/lib/instant/db";

/**
 * Fetch a board with all its cards
 * 
 * @param {string | null} boardId - Board ID to fetch
 * @returns {Object} board - Board object or null
 * @returns {Array} cards - Array of card objects
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error object if any
 */
export function useBoardWithCards(boardId: string | null): object {
	const { data, isLoading, error } = db.useQuery(
		boardId
			? {
				boards: {
					$: {
						where: {
							id: boardId,
						},
					},
					cards: {
						$: {
							order: {
								updated_at: 'asc',
							},
						},
					},
				},
			} : null
	);

	const board = data?.boards?.[0];

	return {
		board: board || null,
		cards: board?.cards || [],
		isLoading,
		error
	};
}