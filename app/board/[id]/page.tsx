import TopToolbar from '@/app/ui/board/top-toolbar';
import { Canvas } from '@/components/canvas/Canvas';
import { getBoardCards } from '@/lib/data/cards';
import { getBoardBreadcrumbs } from '@/lib/data/board-breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const supabase = await createClient();

	// Get current user
	const { data: { user } } = await supabase.auth.getUser();

	// Fetch board with public status
	const { data: board, error } = await supabase
		.from("boards")
		.select('id, title, color, owner_id, is_public, share_token')
		.eq('id', id)
		.single();

	if (error || !board) {
		notFound();
	}

	// Check user role and access
	let userRole: 'owner' | 'editor' | 'viewer' | null = null;
	let isViewerOnly = false;

	if (user) {
		const isOwner = board.owner_id === user.id;

		if (isOwner) {
			userRole = 'owner';
		} else {
			// Check if user is a collaborator and get their role
			const { data: collaboration } = await supabase
				.from("board_collaborators")
				.select('role')
				.eq('board_id', id)
				.eq('user_id', user.id)
				.single();

			if (collaboration) {
				userRole = collaboration.role as 'editor' | 'viewer';
				isViewerOnly = collaboration.role === 'viewer';
			} else if (board.is_public && board.share_token) {
				// User is not owner/collaborator but board is public - redirect
				redirect(`/board/public/${board.share_token}`);
			}
		}
	} else if (board.is_public && board.share_token) {
		// No user logged in but board is public - redirect to public view
		redirect(`/board/public/${board.share_token}`);
	}

	// Fetch cards and breadcrumbs in parallel
	const [cards, breadcrumbs] = await Promise.all([
		getBoardCards(id),
		getBoardBreadcrumbs(id)
	]);

	return (
		<div className="min-h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden flex flex-col h-screen selection:bg-indigo-500/30 selection:text-white">
			<TopToolbar
				boardId={board.id}
				boardTitle={board.title}
				boardColor={board.color}
				initialBreadcrumbs={breadcrumbs}
				isViewerOnly={isViewerOnly}
			/>
			<main className="flex-1 overflow-hidden relative">
				<Canvas
					initialCards={cards}
					boardId={id}
					enablePan={true}
					enableZoom={true}
					enableKeyboardShortcuts={!isViewerOnly}
					enableSelectionBox={!isViewerOnly}
					isPublicView={isViewerOnly}
				/>
			</main>
		</div>
	);
}