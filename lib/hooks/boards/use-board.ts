'use client';

import { db } from "@/lib/instant/db";

/**
 * Fetch a single board by ID
 * 
 * @param {string | null} boardId - Board ID to fetch
 * @returns {Object} board - Board object or null
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error object if any
 */
export function useBoard(boardId: string | null) {
	const { data, isLoading, error } = db.useQuery(
		boardId
			? {
				boards: {
					$: {
						where: {
							id: boardId,
						},
					},
					owner: {}
				},
			} : null
	);

	return {
		board: data?.boards?.[0] || null,
		isLoading,
		error
	};
}