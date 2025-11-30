import { createClient } from "@/lib/supabase/server";
import { BoardCollaborator, BoardRole } from "@/lib/types";

export async function getBoards(limit = 4) {
	const supabase = await createClient();

	// Use RPC function to fetch boards with collaborators and user details in one query
	const { data, error } = await supabase.rpc('get_recent_boards_with_collaborators', {
		p_limit: limit
	});

	if (error) {
		console.error("Error fetching recent boards:", error);
		return [];
	}

	return data || [];
}

export async function getFavoriteBoards(limit = 4) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("boards")
		.select("*")
		.eq("is_favorite", true)
		.order("updated_at", { ascending: false })
		.limit(limit)

	if (error) {
		console.error("Error fetching favorite boards:", error);
		return [];
	}

	return data;
}

export async function getCollaboratorBoards(userId: string, limit = 4) {
	const supabase = await createClient();

	// Use RPC function to bypass RLS issues
	const { data, error } = await supabase.rpc('get_collaborator_boards', {
		p_user_id: userId,
		p_limit: limit
	});

	if (error) {
		console.error("Error fetching collaborator boards:", error);
		return [];
	}

	return data || [];
}

// ============================================================================
// BOARD COLLABORATOR FUNCTIONS
// ============================================================================

/**
 * Get all collaborators for a board with their user details
 * Uses RPC function to access auth.users data
 */
export async function getBoardCollaborators(boardId: string): Promise<BoardCollaborator[]> {
	const supabase = await createClient();

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
	const supabase = await createClient();

	// First, check if the current user is the board owner
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
 * Update a collaborator's role
 */
export async function updateCollaboratorRole(
	boardId: string,
	userId: string,
	role: BoardRole
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();

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
		return { success: false, error: "Only board owner can update collaborator roles" };
	}

	// Update role
	const { error: updateError } = await supabase
		.from("board_collaborators")
		.update({ role, updated_at: new Date().toISOString() })
		.eq("board_id", boardId)
		.eq("user_id", userId);

	if (updateError) {
		console.error("Error updating collaborator role:", updateError);
		return { success: false, error: "Failed to update role" };
	}

	return { success: true };
}

/**
 * Remove a collaborator from a board
 */
export async function removeBoardCollaborator(
	boardId: string,
	userId: string
): Promise<{ success: boolean; error?: string }> {
	const supabase = await createClient();

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
		return { success: false, error: "Only board owner can remove collaborators" };
	}

	// Remove collaborator
	const { error: deleteError } = await supabase
		.from("board_collaborators")
		.delete()
		.eq("board_id", boardId)
		.eq("user_id", userId);

	if (deleteError) {
		console.error("Error removing collaborator:", deleteError);
		return { success: false, error: "Failed to remove collaborator" };
	}

	return { success: true };
}

/**
 * Check if a user has access to a board and return their role
 */
export async function checkBoardAccess(
	boardId: string,
	userId: string
): Promise<{ hasAccess: boolean; role?: BoardRole }> {
	const supabase = await createClient();

	// Check if user is the owner
	const { data: board, error: boardError } = await supabase
		.from("boards")
		.select("owner_id, is_public")
		.eq("id", boardId)
		.single();

	if (boardError || !board) {
		return { hasAccess: false };
	}

	// If user is owner, they have owner role
	if (board.owner_id === userId) {
		return { hasAccess: true, role: 'owner' };
	}

	// If board is public, user has viewer access
	if (board.is_public) {
		return { hasAccess: true, role: 'viewer' };
	}

	// Check if user is a collaborator
	const { data: collab, error: collabError } = await supabase
		.from("board_collaborators")
		.select("role")
		.eq("board_id", boardId)
		.eq("user_id", userId)
		.single();

	if (collabError || !collab) {
		return { hasAccess: false };
	}

	return { hasAccess: true, role: collab.role as BoardRole };
}

// ============================================================================
// PUBLIC BOARD FUNCTIONS
// ============================================================================

/**
 * Toggle a board's public status
 */
export async function toggleBoardPublic(
	boardId: string,
	isPublic: boolean
): Promise<{ success: boolean; error?: string; shareToken?: string }> {
	const supabase = await createClient();

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
	const supabase = await createClient();

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
	const supabase = await createClient();

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
	const supabase = await createClient();

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
 * Get a board by its public share token
 */
export async function getBoardByShareToken(token: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("boards")
		.select("*")
		.eq("share_token", token)
		.eq("is_public", true)
		.maybeSingle();

	if (error) {
		console.error("Error fetching board by share token:", error);
		return null;
	}

	return data;
}