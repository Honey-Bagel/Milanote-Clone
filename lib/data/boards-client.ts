'use client';

import { createClient } from "@/lib/supabase/client";
import { BoardCollaborator, BoardRole } from "@/lib/types";

/**
 * Client-side functions for board collaboration
 * These are wrappers that use the browser client
 */

/**
 * Get all collaborators for a board with their user details
 * Uses RPC function to access auth.users data
 */
export async function getBoardCollaborators(boardId: string): Promise<BoardCollaborator[]> {
	const supabase = createClient();

	const { data, error } = await supabase.rpc('get_board_collaborators_with_users', {
		p_board_id: boardId
	});

	if (error) {
		console.error("Error fetching board collaborators:", error);
		return [];
	}

	if (!data) {
		return [];
	}

	// Transform the data to match our BoardCollaborator interface
	return data.map((collab: any) => ({
		id: collab.id,
		boardId: collab.board_id,
		userId: collab.user_id,
		role: collab.role as BoardRole,
		createdAt: new Date(collab.created_at),
		updatedAt: new Date(collab.updated_at),
		user: {
			id: collab.user_id,
			email: collab.user_email,
			display_name: collab.user_display_name || null,
			avatar_url: collab.user_avatar_url || null,
		},
	}));
}

/**
 * Add a collaborator to a board by email
 * Uses RPC function to look up users by email securely
 */
export async function addBoardCollaborator(
	boardId: string,
	email: string,
	role: BoardRole = 'viewer'
): Promise<{ success: boolean; error?: string; collaborator?: BoardCollaborator }> {
	const supabase = createClient();

	// First, check if the current user is the board owner
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "Not authenticated" };
	}

	// Check if the email being added is the owner's email
	if (email === user.email) {
		return { success: false, error: "You can't add yourself as a collaborator" };
	}

	const { data: board, error: boardError } = await supabase
		.from("boards")
		.select("owner_id")
		.eq("id", boardId)
		.single();

	if (boardError || !board) {
		return { success: false, error: "Board not found" };
	}

	if (board.owner_id !== user.id) {
		return { success: false, error: "Only board owner can add collaborators" };
	}

	// Call Supabase RPC function to add collaborator by email
	const { data, error: rpcError } = await supabase.rpc('add_board_collaborator_by_email', {
		p_board_id: boardId,
		p_email: email,
		p_role: role
	});

	if (rpcError) {
		console.error("Error adding collaborator:", rpcError);
		return { success: false, error: rpcError.message || "Failed to add collaborator" };
	}

	if (!data || !data.success) {
		return { success: false, error: data?.error || "User not found with that email" };
	}

	// Refresh collaborators list to get the new one
	const collabs = await getBoardCollaborators(boardId);
	const newCollab = collabs.find(c => c.userId === data.user_id);

	return {
		success: true,
		collaborator: newCollab,
	};
}

/**
 * Update a collaborator's role - uses RPC to bypass RLS
 */
export async function updateCollaboratorRole(
	boardId: string,
	userId: string,
	role: BoardRole
): Promise<{ success: boolean; error?: string }> {
	const supabase = createClient();

	console.log('[updateCollaboratorRole] Starting:', { boardId, userId, role });

	// Use RPC function to bypass RLS
	const { data, error } = await supabase.rpc('update_board_collaborator_role', {
		p_board_id: boardId,
		p_user_id: userId,
		p_role: role
	});

	console.log('[updateCollaboratorRole] RPC result:', { data, error });

	if (error) {
		console.error("Error updating collaborator role:", error);
		return { success: false, error: error.message };
	}

	if (!data || !data.success) {
		return { success: false, error: data?.error || "Failed to update role" };
	}

	return { success: true };
}

/**
 * Remove a collaborator from a board - uses RPC to bypass RLS
 */
export async function removeBoardCollaborator(
	boardId: string,
	userId: string
): Promise<{ success: boolean; error?: string }> {
	const supabase = createClient();

	console.log('[removeBoardCollaborator] Starting:', { boardId, userId });

	// Use RPC function to bypass RLS
	const { data, error } = await supabase.rpc('remove_board_collaborator', {
		p_board_id: boardId,
		p_user_id: userId
	});

	console.log('[removeBoardCollaborator] RPC result:', { data, error });

	if (error) {
		console.error("Error removing collaborator:", error);
		return { success: false, error: error.message };
	}

	if (!data || !data.success) {
		return { success: false, error: data?.error || "Failed to remove collaborator" };
	}

	return { success: true };
}

/**
 * Toggle a board's public status
 */
export async function toggleBoardPublic(
	boardId: string,
	isPublic: boolean
): Promise<{ success: boolean; error?: string; shareToken?: string }> {
	const supabase = createClient();

	// Check if current user is board owner
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "Not authenticated" };
	}

	const { data: board, error: boardError } = await supabase
		.from("boards")
		.select("owner_id, share_token")
		.eq("id", boardId)
		.single();

	if (boardError || !board) {
		return { success: false, error: "Board not found" };
	}

	if (board.owner_id !== user.id) {
		return { success: false, error: "Only board owner can change public status" };
	}

	// If making public and no share token exists, generate one
	let shareToken = board.share_token;
	if (isPublic && !shareToken) {
		shareToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
	}

	// Update board
	const { error: updateError } = await supabase
		.from("boards")
		.update({
			is_public: isPublic,
			share_token: isPublic ? shareToken : board.share_token,
			updated_at: new Date().toISOString()
		})
		.eq("id", boardId);

	if (updateError) {
		console.error("Error updating board public status:", updateError);
		return { success: false, error: "Failed to update board" };
	}

	return { success: true, shareToken: isPublic ? shareToken : undefined };
}

/**
 * Get all child boards (boards referenced by board cards) for a given board
 */
async function getChildBoards(boardId: string): Promise<string[]> {
	const supabase = createClient();

	// Get all board cards on this board
	const { data: cards, error } = await supabase
		.from("cards")
		.select("id, board_cards(linked_board_id)")
		.eq("board_id", boardId)
		.eq("card_type", "board");

	if (error || !cards) {
		console.error("Error fetching child boards:", error);
		return [];
	}

	// Extract linked board IDs
	const childBoardIds = cards
		.filter((card): card is typeof card & { board_cards: { linked_board_id: string } } =>
			card.board_cards !== null &&
			typeof card.board_cards === 'object' &&
			'linked_board_id' in card.board_cards &&
			typeof (card.board_cards as { linked_board_id?: string }).linked_board_id === 'string'
		)
		.map(card => card.board_cards.linked_board_id);

	return childBoardIds;
}

/**
 * Recursively get all descendant boards (children, grandchildren, etc.)
 */
async function getAllDescendantBoards(boardId: string): Promise<string[]> {
	const childIds = await getChildBoards(boardId);

	if (childIds.length === 0) {
		return [];
	}

	// Recursively get descendants of each child
	const allDescendants = [...childIds];
	for (const childId of childIds) {
		const childDescendants = await getAllDescendantBoards(childId);
		allDescendants.push(...childDescendants);
	}

	return allDescendants;
}

/**
 * Toggle a board and all its child boards' public status recursively
 */
export async function toggleBoardPublicRecursive(
	boardId: string,
	isPublic: boolean
): Promise<{ success: boolean; error?: string; boardsUpdated?: number }> {
	const supabase = createClient();

	// Check if current user is board owner
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "Not authenticated" };
	}

	const { data: board, error: boardError } = await supabase
		.from("boards")
		.select("owner_id")
		.eq("id", boardId)
		.single();

	if (boardError || !board) {
		return { success: false, error: "Board not found" };
	}

	if (board.owner_id !== user.id) {
		return { success: false, error: "Only board owner can change public status" };
	}

	// Get all descendant boards
	const descendantIds = await getAllDescendantBoards(boardId);
	const allBoardIds = [boardId, ...descendantIds];

	// Filter to only boards owned by current user
	const { data: ownedBoards, error: ownerCheckError } = await supabase
		.from("boards")
		.select("id")
		.in("id", allBoardIds)
		.eq("owner_id", user.id);

	if (ownerCheckError || !ownedBoards) {
		return { success: false, error: "Failed to verify board ownership" };
	}

	const boardsToUpdate = ownedBoards.map(b => b.id);

	// Generate share tokens for boards that need them
	const updates = boardsToUpdate.map(id => {
		const shareToken = isPublic ? crypto.randomUUID().replace(/-/g, '').substring(0, 16) : null;
		return {
			id,
			is_public: isPublic,
			share_token: shareToken,
			updated_at: new Date().toISOString()
		};
	});

	// Update all boards in batches to avoid timeout
	const batchSize = 50;
	for (let i = 0; i < updates.length; i += batchSize) {
		const batch = updates.slice(i, i + batchSize);

		// Update each board in the batch
		for (const update of batch) {
			const { error: updateError } = await supabase
				.from("boards")
				.update({
					is_public: update.is_public,
					share_token: update.share_token,
					updated_at: update.updated_at
				})
				.eq("id", update.id);

			if (updateError) {
				console.error(`Error updating board ${update.id}:`, updateError);
			}
		}
	}

	return { success: true, boardsUpdated: boardsToUpdate.length };
}

/**
 * Generate a new share token for a public board
 */
export async function generateShareToken(
	boardId: string
): Promise<{ success: boolean; error?: string; shareToken?: string }> {
	const supabase = createClient();

	// Check if current user is board owner
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "Not authenticated" };
	}

	const { data: board, error: boardError } = await supabase
		.from("boards")
		.select("owner_id, is_public")
		.eq("id", boardId)
		.single();

	if (boardError || !board) {
		return { success: false, error: "Board not found" };
	}

	if (board.owner_id !== user.id) {
		return { success: false, error: "Only board owner can regenerate share token" };
	}

	// Generate new token
	const newToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

	const { error: updateError } = await supabase
		.from("boards")
		.update({
			share_token: newToken,
			updated_at: new Date().toISOString()
		})
		.eq("id", boardId);

	if (updateError) {
		console.error("Error generating share token:", updateError);
		return { success: false, error: "Failed to generate token" };
	}

	return { success: true, shareToken: newToken };
}

/**
 * Get board info including public status and share token
 */
export async function getBoardInfo(boardId: string) {
	const supabase = createClient();

	const { data, error } = await supabase
		.from("boards")
		.select("id, owner_id, is_public, share_token")
		.eq("id", boardId)
		.single();

	if (error) {
		console.error("Error fetching board info:", error);
		return null;
	}

	return data;
}
