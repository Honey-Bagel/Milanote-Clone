'use client';

import { useCreateBoard } from "@/lib/hooks/use-create-board";
import { Plus } from "lucide-react";

export function DashboardCreateBoardButton() {
	const { createBoard, isLoading } = useCreateBoard();

	return (
		<button onClick={createBoard} disabled={isLoading} className="px-6 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white font-medium hover:bg-[#1e293b] transition-colors flex items-center gap-2">
			<Plus size={16} />
			Create Your First Board
		</button>
	)
}