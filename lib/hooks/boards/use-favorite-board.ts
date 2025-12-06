import { db } from "@/lib/instant/db";

/**
 * Add a board to user's favorites (without duplicates)
 */
export async function addBoardToFavorites(userId: string, boardId: string) {
	// First, fetch the current profile
	const { data } = await db.queryOnce({
		$users: {
			$: {
				where: {
					id: userId,
				},
			},
			profile: {},
		},
	});

	const profile = data?.$users?.[0]?.profile;
	const profileId = profile?.id;
	const currentFavorites = profile?.favorite_boards || [];

	// Check if already favorited
	if (currentFavorites.includes(boardId)) {
		console.log('Board already favorited');
		return;
	}

	// Add the new board ID
	const updatedFavorites = [...currentFavorites, boardId];

	// Update the profile
	await db.transact([
		db.tx.profiles[profileId].update({
			favorite_boards: updatedFavorites,
		}),
	]);
}

/**
 * Remove a board from user's favorites
 */
export async function removeBoardFromFavorites(userId: string, boardId: string) {
	const { data } = await db.queryOnce({
		$users: {
			$: {
				where: {
					id: userId,
				},
			},
			profile: {},
		},
	});

	const profile = data?.$users?.[0]?.profile;
	const profileId = profile?.id;
	const currentFavorites = profile?.favorite_boards || [];

	// Remove the board ID
	const updatedFavorites = currentFavorites?.filter(id => id !== boardId);

	// Update the profile
	await db.transact([
		db.tx.profiles[profileId].update({
			favorite_boards: updatedFavorites,
		}),
	]);
}

/**
 * Toggle favorite status for a board
 */
export async function toggleBoardFavorite(userId: string, boardId: string) {
	const { data } = await db.queryOnce({
		$users: {
			$: {
				where: {
					id: userId,
				},
			},
			profile: {},
		},
	});

	const profile = data?.$users?.[0]?.profile;
	const profileId = profile?.id;
	const currentFavorites = profile?.favorite_boards || [];

	// Toggle: add if not present, remove if present
	const updatedFavorites = currentFavorites.includes(boardId)
		? [...currentFavorites].filter(id => id !== boardId)
		: [...currentFavorites, boardId];

	await db.transact([
		db.tx.profiles[profileId].update({
			favorite_boards: updatedFavorites,
		}),
	]);
}