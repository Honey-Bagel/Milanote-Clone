"use client";

import TopToolbar from '@/app/ui/board/toolbars/top-toolbar';
import { Canvas } from '@/components/canvas/Canvas';
import { notFound } from 'next/navigation';
import { use } from "react";
import { useBoardByShareToken } from '@/lib/hooks/boards/use-board-by-share-token';

export default function PublicBoardPage({ params }: { params: Promise<{ token: string }> }) {
	const { token } = use(params);

	// Fetch board by share token
	const { board, isLoading } = useBoardByShareToken(token);

	console.log(board);
	if (!board && !isLoading) {
		notFound();
	}

	if (!board) return;

	// Cards will be loaded by InstantDB in the Canvas component via useBoardCards hook

	return (
		<div className="flex h-screen flex-col">
			<TopToolbar
				boardId={board.id}
				boardTitle={board.title}
				boardColor={board.color}
				isPublicView={true}
			/>
			<main className="flex-1 overflow-hidden">
				{/* Note: Full read-only mode to be implemented - board is currently viewable */}
				<Canvas
					boardId={board.id}
					enablePan={true}
					enableZoom={true}
					enableKeyboardShortcuts={false}
					enableSelectionBox={false}
					isPublicView={true}
				/>
			</main>
		</div>
	);
}
