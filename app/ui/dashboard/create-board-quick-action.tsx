'use client'

import { Plus } from "lucide-react";
import { QuickActionCard } from "./quick-action-card";
import { useCreateBoard } from "@/lib/hooks/boards/use-create-board";
import { useRouter } from "next/navigation";

export function CreateBoardQuickAction() {
	const router = useRouter();
	const { createBoard, isLoading } = useCreateBoard();

	const handleClick = async () => {
		const boardId = await createBoard();

		if (boardId) {
			router.push(`/board/${boardId}`);
			router.refresh();
		}
	};

	return (
		<QuickActionCard
			icon={Plus}
			title={isLoading ? "Creating..." : "Create Board"}
			subtitle="Start from scratch"
			color="indigo"
			onClick={handleClick}
		/>
	);
}
