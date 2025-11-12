import TopToolbar from '@/app/ui/board/top-toolbar';
import { Canvas } from '@/components/canvas/Canvas';
import { getBoardCards } from '@/lib/data/cards';
import { getBoardBreadcrumbs } from '@/lib/data/board-breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const supabase = await createClient();
	const { data: board, error } = await supabase
		.from("boards")
		.select('id, title, color')
		.eq('id', id)
		.single();

	if (error || !board) {
		notFound();
	}

	// Fetch cards and breadcrumbs in parallel
	const [cards, breadcrumbs] = await Promise.all([
		getBoardCards(id),
		getBoardBreadcrumbs(id)
	]);

	return (
		<div className="flex h-screen flex-col">
			<TopToolbar
				boardId={board.id}
				boardTitle={board.title}
				boardColor={board.color}
				breadcrumbs={breadcrumbs}
			/>
			<main className="flex-1 overflow-hidden">

				<Canvas
					initialCards={cards}
					boardId={id}
					enablePan={true}
					enableZoom={true}
					enableKeyboardShortcuts={true}
					enableSelectionBox={false}
				/>
			</main>
		</div>
	);
}
