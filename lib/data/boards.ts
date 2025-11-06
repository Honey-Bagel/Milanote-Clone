import { createClient } from "@/lib/supabase/server";

export async function getRecentBoards(limit = 4) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("boards")
		.select("*")
		.order("updated_at", { ascending: false })
		.limit(limit)
	
	if (error) {
		console.error("Error fetching recent boards:", error);
		return [];
	}

	return data;
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

	const { data, error } = await supabase
		.from("boards")
		.select(`
			*,
			board_collaborators!inner(user_id)
			`)
		.eq("board_collaborators.user_id", userId)
		.neq("owner_id", userId)
		.order("updated_at", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("Error fetching collaborator boards:", error);
		return [];
	}

	return data;
}