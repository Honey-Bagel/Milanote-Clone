'use client';

import { db } from "@/lib/instant/db";
import { CardData as Card } from "@/lib/types";

/**
 * Fetch all cards for a board
 * 
 * @param {string | null} boardId - Board ID to fetch cards for
 * @returns {Object} cards - Array of card objects
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error if any
 * @returns {number} count - Number of cards returned
 */
export function useBoardCards(boardId: string | null) {
	const { data, isLoading, error } = db.useQuery(
		boardId ? {
			boards: {
				$: {
					where: {
						id: boardId,
					},
				},
				cards: {
					$: {
						order: {
							order_key: 'asc',
						},
					},
				},
			},
		} : null
	);

	const board = data?.boards?.[0];
	const cards = (board?.cards || []) as Card[];

	return {
		cards,
		isLoading,
		error,
		count: cards.length,
	};
}

/**
 * Fetch cards grouped by type
 * 
 * @param {string | null} boardId - Board ID to fetch cards for
 */
export function useBoardCardsGrouped(boardId: string | null) {
	const { cards, isLoading, error } = useBoardCards(boardId);

	const grouped = cards.reduce((acc, card) => {
		const type = card.card_type;
		if (!acc[type]) {
			acc[type] = [];
		}
		acc[type].push(card);
		return acc;
	}, {} as Record<string, Card[]>);

	return {
		cards,
		grouped,
		isLoading,
		error,
		noteCards: grouped.note || [],
		imageCards: grouped.image || [],
		taskCards: grouped.task || [],
		linkCards: grouped.link || [],
		fileCards: grouped.file || [],
		paletteCards: grouped.palette || [],
		columnCards: grouped.column || [],
		boardCards: grouped.board || [],
		lineCards: grouped.line || [],
	};
}