import TopToolbar from '@/app/ui/board/top-toolbar';
// import Canvas from '@/app/ui/board/canvas';
import { Canvas } from '@/components/canvas/Canvas';
import { getBoardCards } from '@/lib/data/cards';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const cards = await getBoardCards(id);

	return (
		<div className="flex h-screen flex-col">
			<TopToolbar />
			<main className="flex-1 overflow-hidden">

				<Canvas
					initialCards={cards}
					boardId={id}
					enablePan={true}
					enableZoom={true}
					enableKeyboardShortcuts={true}
					showGrid={true}
					enableSelectionBox={false}
				/>
			</main>
		</div>
	);
}
