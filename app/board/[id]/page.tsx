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
import { PresentationSidebar } from "@/components/presentation";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import EmptyBoardSuggestion from "@/components/templates/EmptyBoardSuggestion";
import ShareModal from "@/app/ui/board/share-modal";
import { CardsLoadingIndicator } from "@/app/ui/board/cards-loading-indicator";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const { isLoading: isAuthLoading } = db.useAuth();
	const { board, error } = useBoard(id);
	const { cards: cardArray, isLoading: isCardsLoading } = useBoardCards(id);
	const { importDrawerOpen, setImportDrawerOpen, presentationSidebarOpen, setPresentationSidebarOpen, shareModalOpen, setShareModalOpen } = useBoardStore();
	const { clearSelection } = useCanvasStore();

	// Wait for auth to complete
	if (isAuthLoading) {
		return null;
	}

	if (error) {
		notFound();
	}

	// Show board UI immediately, even if data is still loading
	// Board metadata and cards will populate as they arrive
	const boardTitle = board?.title || 'Loading...';
	const boardColor = board?.color || '#4f46e5';
	const boardId = board?.id || id;

	// Create cards map for DndContextProvider (empty initially, will populate)
	const allCardsMap = new Map<string, CardData>(
		cardArray.map((card) => [card.id, card])
	);

	return (
		<db.SignedIn>
			<DndContextProvider boardId={id} allCardsMap={allCardsMap}>
				<div className="min-h-screen bg-[#020617] text-foreground font-sans overflow-hidden flex flex-col h-screen selection:bg-primary/30 selection:text-white">
					<TopToolbar
						boardId={boardId}
						boardTitle={boardTitle}
						boardColor={boardColor}
						isViewerOnly={false}
					/>
					<main className="flex-1 overflow-hidden relative">
						{/* Cards loading indicator */}
						{isCardsLoading && <CardsLoadingIndicator />}

						{/* Empty Board Suggestion - only when cards done loading */}
						{!isCardsLoading && cardArray.length === 0 && <EmptyBoardSuggestion boardId={id} />}

						<Canvas
							boardId={id}
							enablePan={true}
							enableZoom={true}
							enableKeyboardShortcuts={true}
							enableSelectionBox={true}
							isPublicView={false}
						/>
						<ImportDrawer boardId={id} onOpen={() => setImportDrawerOpen(true)} onClose={() => setImportDrawerOpen(false)} isOpen={importDrawerOpen} />
						{presentationSidebarOpen && (
							<PresentationSidebar
								boardId={id}
								onClose={() => {
									setPresentationSidebarOpen(false);
									clearSelection();
								}}
							/>
						)}

						<ShareModal boardId={id} isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} />
					</main>
				</div>
			</DndContextProvider>
		</db.SignedIn>
	);
}