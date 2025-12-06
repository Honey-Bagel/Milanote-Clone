'use client';

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createBoard } from "@/lib/helpers/board-helpers";
import { db } from "@/lib/instant/db";

export function useCreateBoard() {
	const { userId } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const instantUser = db.useUser();

	const create = async (params?: {
		title?: string;
		parentId?: string;
		color?: string;
		isPublic?: boolean;
	}) => {
		if (!instantUser) {
			setError("Not authenticated");
			return null;
		}

		setIsLoading(true);
		setError(null);

		try {
			const boardId = await createBoard({
				...params,
				ownerId: instantUser.id,
			});

			return boardId;
		} catch (error) {
			console.error("Error creating board:", error);
			setError("Failed to create board");
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	return { createBoard: create, isLoading, error };
}