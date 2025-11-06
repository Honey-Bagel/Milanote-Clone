'use client'

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useCreateBoard() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const createBoard = async () => {
		setIsLoading(true);
		const supabase = createClient();

		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			console.error("No user found");
			setIsLoading(false);
			return null;
		}

		const { data, error } = await supabase
			.from("boards")
			.insert({
				title: "New Board",
				owner_id: user.id
			})
			.select()
			.single();
		
		if (error) {
			console.error("Error creating board:", error);
			setIsLoading(false);
			return null;
		}

		router.push(`/board/${data.id}`);
		router.refresh();

		return data;
	};

	return { createBoard, isLoading };
}