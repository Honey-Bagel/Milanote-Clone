/**
 * Board Title Sync Utility
 *
 * Keeps board titles synchronized between:
 * 1. The boards table (source of truth for board data)
 * 2. The cards table (board cards that reference other boards)
 *
 * Usage:
 * - Use syncBoardTitle() when updating from either table
 * - It will automatically sync to the other table
 */

import { db } from "./db";

/**
 * Sync board title between boards table and board cards
 *
 * @param boardId - The ID of the board whose title is being updated
 * @param newTitle - The new title to set
 * @param options - Optional configuration
 * @param options.skipBoardUpdate - Skip updating the boards table (use when updating from boards table)
 * @param options.skipCardUpdate - Skip updating cards table (use when updating from a board card)
 *
 * @example
 * // Update board title from the top toolbar (boards table)
 * await syncBoardTitle('board-123', 'New Title', { skipBoardUpdate: false });
 *
 * @example
 * // Update board title from a board card
 * await syncBoardTitle('board-123', 'New Title', { skipCardUpdate: false });
 */
export async function syncBoardTitle(
	boardId: string,
	newTitle: string,
	options?: {
		skipBoardUpdate?: boolean;
		skipCardUpdate?: boolean;
	}
): Promise<void> {
	const now = Date.now();
	const transactions = [];

	// Update the boards table
	if (!options?.skipBoardUpdate) {
		transactions.push(
			db.tx.boards[boardId].update({
				title: newTitle,
				updated_at: now,
			})
		);
	}

	// Find and update all board cards that link to this board
	if (!options?.skipCardUpdate) {
		// Query all cards that link to this board
		const query = await db.queryOnce({
			cards: {
				$: {
					where: {
						card_type: 'board',
						linked_board_id: boardId,
					},
				},
			},
		});
		const boardCards = query.data.cards;

		// Update each board card's title
		boardCards.forEach((card: any) => {
			transactions.push(
				db.tx.cards[card.id].update({
					board_title: newTitle,
					updated_at: now,
				})
			);
		});
	}

	// Execute all updates in a single transaction
	if (transactions.length > 0) {
		await db.transact(transactions);
	}
}

/**
 * Update board title and sync to all related board cards
 *
 * This is a convenience wrapper that always updates both tables.
 * Use this when you want full bidirectional sync.
 *
 * @param boardId - The ID of the board
 * @param newTitle - The new title
 *
 * @example
 * await updateBoardTitleWithSync('board-123', 'New Title');
 */
export async function updateBoardTitleWithSync(
	boardId: string,
	newTitle: string
): Promise<void> {
	await syncBoardTitle(boardId, newTitle);
}
