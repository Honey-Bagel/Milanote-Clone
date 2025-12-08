import TopToolbar from '@/app/ui/board/top-toolbar';
import { Canvas } from '@/components/canvas/Canvas';
import { getBoardByShareToken } from '@/lib/instant/server-queries';
import { notFound } from 'next/navigation';

export default async function PublicBoardPage({ params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;

	// Fetch board by share token
	const board = await getBoardByShareToken(token);

	if (!board) {
		notFound();
	}

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
