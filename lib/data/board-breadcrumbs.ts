import { createClient } from "@/lib/supabase/server";

export type BreadcrumbItem = {
	id: string;
	title: string;
	color?: string;
	shareToken?: string | null;
};

/**
 * Gets the breadcrumb path for a board by traversing parent relationships
 * Returns an array of boards from root to current board
 */
export async function getBoardBreadcrumbs(boardId: string): Promise<BreadcrumbItem[]> {
	const supabase = await createClient();
	const breadcrumbs: BreadcrumbItem[] = [];
	let currentBoardId: string | null = boardId;
	const maxDepth = 10; // Prevent infinite loops
	let depth = 0;

	while (currentBoardId && depth < maxDepth) {
		const { data: board, error } = await supabase
			.from("boards")
			.select("id, title, color, parent_board_id")
			.eq("id", currentBoardId)
			.single();

		if (error || !board) {
			console.error("Error fetching board:", error);
			break;
		}

		// Add to the beginning of the array to build path from root
		breadcrumbs.unshift({
			id: board.id,
			title: board.title,
			color: board.color,
		});

		// Move to parent
		currentBoardId = board.parent_board_id;
		depth++;
	}

	return breadcrumbs;
}

/**
 * Gets the breadcrumb path including share tokens for public boards
 * Used when viewing a public board to enable navigation via public links
 */
export async function getBoardBreadcrumbsWithShareTokens(boardId: string): Promise<BreadcrumbItem[]> {
	const supabase = await createClient();
	const breadcrumbs: BreadcrumbItem[] = [];
	let currentBoardId: string | null = boardId;
	const maxDepth = 10; // Prevent infinite loops
	let depth = 0;

	while (currentBoardId && depth < maxDepth) {
		const { data: board, error } = await supabase
			.from("boards")
			.select("id, title, color, parent_board_id, share_token, is_public")
			.eq("id", currentBoardId)
			.single();

		if (error || !board) {
			console.error("Error fetching board:", error);
			break;
		}

		// Add to the beginning of the array to build path from root
		breadcrumbs.unshift({
			id: board.id,
			title: board.title,
			color: board.color,
			shareToken: board.is_public ? board.share_token : null,
		});

		// Move to parent
		currentBoardId = board.parent_board_id;
		depth++;
	}

	return breadcrumbs;
}

/**
 * Gets child boards for a given board
 */
export async function getChildBoards(boardId: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("boards")
		.select("id, title, color, updated_at")
		.eq("parent_board_id", boardId)
		.order("updated_at", { ascending: false });

	if (error) {
		console.error("Error fetching child boards:", error);
		return [];
	}

	return data;
}