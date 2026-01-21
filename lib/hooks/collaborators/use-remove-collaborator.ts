'use client';

import { useState } from "react";
import { db } from "@/lib/instant/db";
import { CollaboratorRole } from "@/lib/types";

/**
 * Hook for removing a collaborator from a board
 * 
 * @returns {Function} removeCollaborator - Function to remove a collaborator
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error if any
 */
export function useRemoveCollaborator() {
	const currentUser = db.useUser();
	const [isRemoving, setIsRemoving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Remove a collaborator from a board
	 * 
	 * @param collaboratorId - ID of the board_collaborators record to remove
	 * @param boardId - (Optional) board ID for permission checking
	 */
	const removeCollaborator = async (
		collaboratorId: string,
		boardId?: string,
	) => {
		if (!currentUser) {
			setError("User not authenticated");
			return false;
		}

		setIsRemoving(true);
		setError(null);

		try {
			// Optional: Check if user is owner of the board
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

				const board = boardCheck?.data?.boards?.[0];
				const isOwner = board?.owner?.id === currentUser.id;

				if (!isOwner) {
					setError("Only board owner can remove collaborators");
					return false;
				}
			}

			// Check if trying to remove owner
			const collaboratorsCheck = await db.queryOnce({
				board_collaborators: {
					$: {
						where: {
							id: collaboratorId,
						},
					},
				},
			});

			const collaborator = collaboratorsCheck.data?.board_collaborators?.[0];

			if (collaborator?.role === 'owner') {
				setError("Cannot remove board owner");
				return false;
			}

			// Delete the collaborator
			await db.transact([
				db.tx.board_collaborators[collaboratorId].delete(),
			]);

			return true;
		} catch (error) {
			console.error("Error removing collaborator:", error);
			setError("Failed to remove collaborator");
			return false;
		} finally {
			setIsRemoving(true);
		}
	};

	return {
		removeCollaborator,
		isRemoving,
		error,
	};
}