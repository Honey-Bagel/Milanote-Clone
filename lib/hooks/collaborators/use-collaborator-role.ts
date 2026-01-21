'use client';

import { db } from "@/lib/instant/db";
import { CollaboratorRole } from "@/lib/types";

/**
 * Get the current user's role on a specific board
 * 
 * @param {string | null} boardId - Board ID to check
 * @returns {CollaboratorRole} role - User's role
 * @returns {boolean} isLoading - Loading state
 * @returns {boolean} canEdit - Whether user has edit permissions
 * @returns {boolean} canView - Whether user has view permissions
 * @returns {boolean} canManage - Whether user has manage permissions
 */
export function useCollaboratorRole(boardId: string | null) {
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
		} : null,
	);

	const board = data?.boards?.[0];

	// Check if user is the owner
	const isOwner = board?.owner?.id === currentUser?.id;

	// Find user's collaboration record
	const collaboration = board?.collaborators?.find(
		(c: any) => c.user?.id === currentUser?.id
	);

	const role: CollaboratorRole = isOwner ? 'owner': (collaboration?.role as CollaboratorRole || null);

	// Permission helpers
	const canView = role !== null || board?.is_public === true;
	const canEdit = role === 'owner' || role === 'editor';
	const canManage = role === 'owner';
	const canDelete = role === 'owner';

	return {
		role,
		isLoading,
		canView,
		canEdit,
		canManage,
		isOwner,
	};
}