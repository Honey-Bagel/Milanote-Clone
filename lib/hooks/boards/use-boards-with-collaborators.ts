'use client';

import { db } from "@/lib/instant/db";

/**
 * Fetch a board with all it's collaborators
 * 
 * @param {boolean} forDashboard - Boolean to check if should fetch for dashboard (only retrieves top level boards)
 * @returns {Object} board - Board object (with collaborators) or null
 * @returns {boolean} isLoading - Loading state
 * @returns {Error} error - Error object if any
 * @returns {number} count - Total number of boards returned
 */
export function useBoardsWithCollaborators(forDashboard: boolean) {
	const { user } = db.useAuth();
	const id = user?.id;

	const { data, isLoading, error } = db.useQuery(
		id
			? {
				$users: {
					$: {
						where: {
							id: id,
						},
					},
					profile: {}, // Get current user's favorites
					owned_boards: {
						$: {
							order: {
								updated_at: 'desc',
							},
							// If forDashboard is true, only fetch boards where parent_board_id is null
							...(forDashboard && {
								where: {
									parent_board_id: { $isNull: true },
								},
							}),
						},
						collaborators: {
							user: {},
						},
					},
					collaborations: { // Boards where user is a collaborator
						board: {
							$: {
								// If forDashboard is true, only fetch boards where parent_board_id is null
								...(forDashboard && {
									where: {
										parent_board_id: { $isNull: true },
									},
								}),
							},
							owner: {},
							collaborators: {
								user: {},
							},
						},
					},
				},
			}
			: null
	);

	const userProfile = data?.$users?.[0]?.profile;
	const favoriteBoards = userProfile?.favorite_boards || [];
	
	// Get boards user owns
	const ownedBoards = data?.$users?.[0]?.owned_boards || [];
	
	// Get boards user collaborates on
	const collaboratedBoards = data?.$users?.[0]?.collaborations?.map(collab => collab.board).filter(Boolean) || [];
	
	// Combine and deduplicate boards
	const allBoardsMap = new Map();
	
	[...ownedBoards, ...collaboratedBoards].forEach(board => {
		if (board && board.id) {
			allBoardsMap.set(board.id, board);
		}
	});
	
	// Add isFavorited flag to each board
	const boardsWithFavorites = Array.from(allBoardsMap.values()).map(board => ({
		...board,
		is_favorite: favoriteBoards.includes(board.id),
	}));

	return {
		boards: boardsWithFavorites,
		isLoading,
		error,
		count: boardsWithFavorites.length,
	};
}