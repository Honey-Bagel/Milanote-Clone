'use client';

import { db } from "@/lib/instant/db";
import { useAuth } from "@clerk/nextjs";

/**
 * Fetch all boards for the current user
 * 
 * @returns {Object} boards - Array of board objects
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error object if any
 * @returns {number} count - Total number of boards returned
 */
export function useBoards() {
	const { userId } = useAuth();

	const { data, isLoading, error } = db.useQuery(
		userId
			? {
				boards: {
					$: {
						where: {
							owner_id: userId,
						},
						order: {
							updated_at: 'desc'
						},
					},
				},
			} : null,
	);

	return {
		boards: data?.boards || [],
		isLoading,
		error,
		count: data?.boards?.length || 0,
	};
}