'use client';

import TopToolbar from "@/app/ui/board/toolbars/top-toolbar";
import { Canvas } from "@/components/canvas/Canvas";
import { useBoard } from "@/lib/hooks/boards";
import { notFound } from "next/navigation";
import { use } from "react";
import { db } from "@/lib/instant/db";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const { user, isLoading: isAuthLoading } = db.useAuth();
	const { board, isLoading, error } = useBoard(id);

	// Wait for auth to be ready before making any decisions
	if (isAuthLoading) {
		return <div>Loading...</div>;
	}

	// Only show 404 if auth is ready AND we have an error or no board after loading
	if (error) {
		notFound();
	}

	if (isLoading || !board) {
		return <div>Loading...</div>;
	}

	return (
		<db.SignedIn>
			<div className="min-h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden flex flex-col h-screen selection:bg-indigo-500/30 selection:text-white">
				<TopToolbar
					boardId={board.id}
					boardTitle={board.title}
					boardColor={board.color}
					isViewerOnly={false}
				/>
				<main className="flex-1 overflow-hidden relative">
					<Canvas
						boardId={id}
						enablePan={true}
						enableZoom={true}
						enableKeyboardShortcuts={true}
						enableSelectionBox={true}
						isPublicView={false}
					/>
				</main>
			</div>
		</db.SignedIn>
	);
}