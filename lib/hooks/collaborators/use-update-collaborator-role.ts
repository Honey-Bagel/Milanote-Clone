'use client';

import { db } from "@/lib/instant/db";
import { useState } from "react";
import { CollaboratorRole } from "@/lib/types";

/**
 * Hook for updating a collaborator's role
 * 
 * @returns {Function} updateRole - Function to update a collaborator's role
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error if any
 */
export function useUpdateCollaboratorRole() {
	const currentUser = db.useUser();
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Update a collaborator's role
	 * 
	 * @param collaboratorId - ID of the board_collaborator record
	 * @param newRole - New role to assign
	 * @param boardId - (Optional) Board ID for permission checking
	 */
	const updateRole = async (
		collaboratorId: string,
		newRole: CollaboratorRole,
		boardId?: string,
	) => {
		if (!currentUser) {
			setError("Not authenticated");
			return false;
		}

		setIsUpdating(true);
		setError(null);

		try {
			// Optional: Check if current user is owner of the board
			if (boardId) {
				const boardCheck = await db.queryOnce({
					boards: {
						$: {
							where: {
								id: boardId,
							},
						},
						owner: {},
					},
				});

				const board = boardCheck.data?.boards?.[0];
				const isOwner = board?.owner?.id === currentUser.id;

				if (!isOwner) {
					setError("Only board owner can change collaborator roles");
					return false
				}
			}

			// Update the collaborator role
			await db.transact([
				db.tx.board_collaborators[collaboratorId].update({
					role: newRole,
					updated_at: Date.now(),
				}),
			]);

			return true;
		} catch (error) {
			console.error("Error updating collaborator role:", error);
			setError("Failed to update collaborator role");
			return false;
		} finally {
			setIsUpdating(false);
		}
	};

	return {
		updateRole,
		isUpdating,
		error,
	};
}