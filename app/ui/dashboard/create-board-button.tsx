'use client'

import { useCreateBoard } from "@/lib/hooks/use-create-board"

export function CreateBoardButton() {
	const { createBoard, isLoading } = useCreateBoard();

	return (
		<button
			onClick={createBoard}
			disabled={isLoading}
			className="p-6 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800/80 transition-all group"
		>
			<div className="w-12 h-12 bg-blue-500/20 group-hover:bg-blue-500/30 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors">
				<i className="fas fa-plus text-blue-400 text-2xl"></i>
			</div>
			<h3 className="font-semibold text-white text-center">{isLoading ? "Creating..." : "New Board"}</h3>
		</button>
	)
}