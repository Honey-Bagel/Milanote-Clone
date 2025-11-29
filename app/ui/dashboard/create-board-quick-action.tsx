'use client'

import { Plus } from "lucide-react";
import { useCreateBoard } from "@/lib/hooks/use-create-board";
import { QuickActionCard } from "./quick-action-card";

export function CreateBoardQuickAction() {
	const { createBoard, isLoading } = useCreateBoard();

	return (
		<QuickActionCard
			icon={Plus}
			title={isLoading ? "Creating..." : "Create Board"}
			subtitle="Start from scratch"
			color="indigo"
			onClick={createBoard}
		/>
	);
}
