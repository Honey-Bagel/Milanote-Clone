'use client';

import TopToolbar from "@/app/ui/board/toolbars/top-toolbar";
import { Canvas } from "@/components/canvas/Canvas";
import { useBoard } from "@/lib/hooks/boards";
import { notFound } from "next/navigation";
import { use } from "react";
import { db } from "@/lib/instant/db";
import { DndContextProvider } from "@/components/canvas/DndContextProvider";
import { useBoardCards } from "@/lib/hooks/cards";
import type { CardData } from "@/lib/types";
import { useBoardStore } from "@/lib/stores/board-store";
import { ImportDrawer } from "@/components/import/ImportDrawer";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const { user, isLoading: isAuthLoading } = db.useAuth();
	const { board, isLoading, error } = useBoard(id);
	const { cards: cardArray, isLoading: isCardsLoading } = useBoardCards(id);
	const { importDrawerOpen, setImportDrawerOpen } = useBoardStore();

	// Wait for auth to be ready before making any decisions
	if (isAuthLoading) {
		return <div>Loading...</div>;
	}

	// Only show 404 if auth is ready AND we have an error or no board after loading
	if (error) {
		notFound();
	}

	if (isLoading || !board || isCardsLoading) {
		return <div>Loading...</div>;
	}

	// Create cards map for DndContextProvider
	const allCardsMap = new Map<string, CardData>(
		cardArray.map((card) => [card.id, card])
	);

	return (
		<db.SignedIn>
			<DndContextProvider boardId={id} allCardsMap={allCardsMap}>
				<div className="min-h-screen bg-[#020617] text-foreground font-sans overflow-hidden flex flex-col h-screen selection:bg-primary/30 selection:text-white">
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
						<ImportDrawer boardId={id} onClose={() => setImportDrawerOpen(false)} isOpen={importDrawerOpen} />
					</main>
				</div>
			</DndContextProvider>
		</db.SignedIn>
	);
}