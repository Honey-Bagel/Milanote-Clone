'use client';

import { db } from "@/lib/instant/db";

/**
 * Check if the current user is a collaborator on a board
 * 
 * @param {string | null} boardId - Board ID to check
 * @returns {boolean} isCollaborator - Whether user is a collaborator
 * @returns {boolean} isLoading - Loading state
 * @returns {string | null} role - User's role on the board (if collaborating)
 */
export function useIsCollaborator(boardId: string | null) {
	const currentUser = db.useUser();

	const { data, isLoading } = db.useQuery(
		boardId && currentUser ? {
			boards: {
				$: {
					where: {
						id: boardId,
					},
				},
				collaborators: {
					user: {},
				},
				owner: {},
			},
		} : null
	);

	const board = data?.boards?.[0];

	// Check if user is the owner
	const isOwner = board?.owner?.id === currentUser?.id;

	// Check if user is in collaborators list
	const collaboration = board?.collaborators?.find(
		(c: any) => c.user?.id === currentUser?.id
	);

	const isCollaborator = isOwner || !!collaboration;
	const role = isOwner ? 'owner' : collaboration?.role || null;

	return {
		isCollaborator,
		isOwner,
		role,
		isLoading
	};
}