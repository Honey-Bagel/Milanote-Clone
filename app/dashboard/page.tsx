import Sidebar from '@/app/ui/home/sidebar';
import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import Link from 'next/link';
import { getTimeAgo } from '@/lib/utils';
import { CreateBoardButton } from '@/app/ui/dashboard/create-board-button';
import { getRecentBoards, getFavoriteBoards, getCollaboratorBoards } from '@/lib/data/boards';
import { BoardCard } from '../ui/dashboard/board-card';

export default async function Dashboard() {
	const supabase = await createClient();

	const { data: { user }, error } = await supabase.auth.getUser();

	if (error || !user) {
		redirect("/auth");
	}

	const displayName = user.user_metadata?.display_name || user.email;

	// Fetch all boards in parallel
	const [recentBoards, favoriteBoards, collaboratorBoards] = await Promise.all([
		getRecentBoards(),
		getFavoriteBoards(),
		getCollaboratorBoards(user.id)
	]);

	return (
		<div className="flex h-screen">
			<Sidebar />

			<main className="flex-1 overflow-auto bg-gray-900 custom-scrollbar">
				{/* Header */}
				<header className="bg-gray-800 border-b border-gray-700 px-8 py-6">
					<div className="max-w-7xl mx-auto">
						<h1 className="text-3xl font-bold text-white mb-2">Home</h1>
						<p className="text-gray-400">Welcome back, {displayName}!</p>
					</div>
				</header>
				
				{/* Content */}
				<div className="max-w-7xl mx-auto px-8 py-8">

					{/* Quick Actions */}
					<div className="mb-8">
						<h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
						<div className="grid grid-cols-4 gap-4">
							<CreateBoardButton />

							<button className="p-6 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 transition-all">
								<div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
									<i className="fas fa-folder text-purple-400 text-2xl"></i>
								</div>
								<h3 className="font-semibold text-white text-center">Browse Templates</h3>
							</button>

							<button className="p-6 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 transition-all">
								<div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
									<i className="fas fa-upload text-green-400 text-2xl"></i>
								</div>
								<h3 className="font-semibold text-white text-center">Import Board</h3>
							</button>

							<button className="p-6 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 transition-all">
								<div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
									<i className="fas fa-users text-orange-400 text-2xl"></i>
								</div>
								<h3 className="font-semibold text-white text-center">Invite Team</h3>
							</button>
						</div>
					</div>
					
					{/* Recent Boards */}
					<div className="mb-8">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-white">Recent Boards</h2>
							<a href="#" className="text-sm text-blue-400 hover:text-blue-300 font-medium">View all</a>
						</div>

						<div className="grid grid-cols-4 gap-4">
							{recentBoards && recentBoards.map((board) => (
								<BoardCard
									key={board.id}
									board={board}
								/>
							))}
						</div>
					</div>
					
					{/* Favorites */}
					{favoriteBoards && favoriteBoards.length > 0 && (
						<div className="mb-8">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-lg font-semibold text-white">Favorites</h2>
								<a href="#" className="text-sm text-blue-400 hover:text-blue-300 font-medium">View all</a>
							</div>

							<div className="grid grid-cols-4 gap-4">
								{favoriteBoards.map((board) => (
									<BoardCard
										key={board.id}
										board={board}
										isFavorite={true}
									/>
								))}
							</div>
						</div>
					)}
					
					{/* Shared with me */}
					{collaboratorBoards && collaboratorBoards.length > 0 && (
						<div>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-lg font-semibold text-white">Shared with me</h2>
								<a href="#" className="text-sm text-blue-400 hover:text-blue-300 font-medium">View all</a>
							</div>

							<div className="grid grid-cols-4 gap-4">
								{collaboratorBoards.map((board) => (
									<BoardCard
										key={board.id}
										board={board}
										isShared={true}
										sharedBy="unknown"
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}