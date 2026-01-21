'use client';

import { db } from "@/lib/instant/db";
import { CollaboratorRole } from "@/lib/types";

export interface Collaborator {
	id: string;
	role: CollaboratorRole;
	created_at: number;
	updated_at: number;
	user: {
		id: string;
		email: string;
		profile?: {
			display_name?: string;
			avatar_url?: string;
		};
	};
}

/**
 * Fetch collaborators for a board by board id
 * 
 * @param {string | null} boardId - Board to fetch collaborators for
 * @returns {Object} collaborators - Array of collaborator objects
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error object if any
 * @returns {number} count - Total number of collaborators returned
 */
export function useCollaborators(boardId: string | null) {
	const { data, isLoading, error } = db.useQuery(
		boardId ? {
			boards: {
				$: {
					where: {
						id: boardId,
					},
				},
				collaborators: {
					user: {
						profile: {},
					},
				},
			},
		} : null
	);

	const board = data?.boards?.[0];
	const collaborators: Collaborator[] = board?.collaborators?.map((collab: any) => ({
		id: collab.id,
		role: collab.role as CollaboratorRole,
		created_at: collab.created_at,
		updated_at: collab.updated_at,
		user: {
			id: collab.user?.id || '',
			email: collab.user?.email || '',
			profile: collab.user?.profile || undefined,
		},
	})) || [];

	return {
		collaborators,
		isLoading,
		error,
		count: collaborators.length
	};
}