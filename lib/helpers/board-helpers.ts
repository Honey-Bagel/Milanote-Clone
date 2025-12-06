import { db } from "../instant/db";
import { id } from "@instantdb/react";
import { BOARD_DEFAULTS } from "../constants/defaults";

export async function createBoard(params: {
	ownerId: string;
	title?: string;
	parentId?: string;
	color?: string;
	isPublic?: boolean;
}) {
	const boardId = id();

	await db.transact([
		db.tx.boards[boardId].update({
			title: params.title || "New Board",
			parent_board_id: params.parentId || null,
			color: params.color || BOARD_DEFAULTS.color,
			is_public: params.isPublic || BOARD_DEFAULTS.is_public,
			created_at: Date.now(),
			updated_at: Date.now(),
		}),

		// Link board to the user
		db.tx.$users[params.ownerId].link({ owned_boards: boardId }),
	]);

	return boardId;
};

export async function updateboard(
	boardId: string,
	updates: Partial<{
		title: string;
		color: string;
		isPublic: string;
		share_token: string;
	}>
) {
	await db.transact([
		db.tx.boards[boardId].update({
			...updates,
			updated_at: Date.now(),
		}),
	]);
};