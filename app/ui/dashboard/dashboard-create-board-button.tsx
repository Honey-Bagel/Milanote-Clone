'use client';

import { useCreateBoard } from "@/lib/hooks/boards/use-create-board";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardCreateBoardButton() {
	const { createBoard, isLoading } = useCreateBoard();
	const router = useRouter();

	const handleClick = async () => {
		const boardId = await createBoard();

		if (boardId) {
			router.push(`/board/${boardId}`);
			router.refresh();
		}
	}

	return (
		<button onClick={handleClick} disabled={isLoading} className="px-6 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white font-medium hover:bg-[#1e293b] transition-colors flex items-center gap-2">
			<Plus size={16} />
			Create Your First Board
		</button>
	)
}