'use client';

import { db } from "@/lib/instant/db";
import { id } from "@instantdb/react";
import { useState } from "react";
import { CollaboratorRole } from "@/lib/types";

/**
 * Hook for adding a collaborator by email
 * 
 * @returns {Function} addCollaboratorByEmail - Function to add collaborator by email
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error if any
 */
export function useAddCollaboratorByEmail() {
	const currentUser = db.useUser();
	const [isAdding, setIsAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Add a collaborator by email
	 * 
	 * @param boardId - ID of the board
	 * @param email - Email of the user to add
	 * @param role - Role for the collaborator
	 */
	const addCollaboratorByEmail = async (
		boardId: string,
		email: string,
		role: CollaboratorRole = 'viewer',
	) => {
		if (!currentUser) {
			setError('Not authenticated');
			return null;
		}

		setIsAdding(true);
		setError(null);

		try {
			// Find user by email
			const { data: userData } = await db.queryOnce({
				$users: {
				},
			});

			console.log(`${email}:`, userData);

			const userToAdd = userData?.$users?.[0];

			if (!userToAdd) {
				setError('User not found with email address');
				return null;
			}

			if (userToAdd.id === currentUser.id) {
				setError('Cannot add yourself as a collaborator');
				return null;
			}

			// Check if already a collaborator using links
			const { data: boardData } = await db.queryOnce({
				boards: {
					$: {
						where: {
							id: boardId,
						},
					},
					collaborators: {
						user: {},
					},
				},
			});

			const board = boardData?.boards?.[0];
			const isAlreadyCollaborator = board?.collaborators?.some(
				(c: any) => c.user?.id === userToAdd.id
			);

			if (isAlreadyCollaborator) {
				setError('User is already a collaborator on this board');
				return null;
			}

			// Add collaborator
			const collaboratorId = id();

			await db.transact([
				db.tx.board_collaborators[collaboratorId].update({
					role: role,
					created_at: Date.now(),
					updated_at: Date.now(),
				}),
				// Link to board
				db.tx.board_collaborators[collaboratorId].link({
					board: boardId,
				}),
				// Link to user
				db.tx.board_collaborators[collaboratorId].link({
					user: userToAdd.id,
				}),
			]);

			return {
				id: collaboratorId,
				user: {
					id: userToAdd.id,
					email: userToAdd.email,
				},
				role,
			};
		} catch (error) {
			console.error("Error adding collaborator by email:", error);
			setError("Failed to add collaborator");
			return null;
		} finally {
			setIsAdding(false);
		}
	};

	return {
		addCollaboratorByEmail,
		isAdding,
		error,
	};
}