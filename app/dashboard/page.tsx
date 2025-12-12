'use client';

import { BoardCard } from '../ui/dashboard/board-card';
import { Bell, Grid, Layers, Search, Users, LucideIcon, Star, Clock, Filter, List } from 'lucide-react';
import { QuickActionCardWrapper } from '../ui/dashboard/quick-action-card-wrapper';
import { CreateBoardQuickAction } from '../ui/dashboard/create-board-quick-action';
import UserMenu from '../ui/dashboard/profile-dropdown';
import { DashboardCreateBoardButton } from '../ui/dashboard/dashboard-create-board-button';
import { useBoardsWithCollaborators } from '@/lib/hooks/boards';
import { db } from '@/lib/instant/db';
import { DashboardLoadingSkeleton } from '../ui/dashboard/dashboard-loading-skeleton';
import { useMemo, useState } from 'react';
import { BoardListRow } from '../ui/dashboard/board-list-row';
import { Separator } from "radix-ui";

type Tabtype = 'my-boards' | 'shared' | 'favorites';

export default function Dashboard() {
	const { user } = db.useAuth();
	const { boards, isLoading } = useBoardsWithCollaborators(true);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [activeTab, setActiveTab] = useState<Tabtype>('my-boards');

	// Filter boards based on active tab
	const filteredBoards = useMemo(() => {
		if (!boards || !user) return [];

		switch(activeTab) {
			case 'my-boards':
				return boards.filter(board => board.owner.id === user.id);
			case 'shared':
				// Boards NOT owner by the owner (shared with them)
				return boards.filter(board => board.owner.id !== user.id);
			case 'favorites':
				// Filter boards that are in the user's favorite_boards array
				return boards.filter(board => board.is_favorite);
			default:
				return boards;
		}
	}, [boards, activeTab, user]);

	// Show loading skeleton while data is being fetched
	if (isLoading) {
		return (
			<db.SignedIn>
				<DashboardLoadingSkeleton />
			</db.SignedIn>
		);
	}

	return (
		<db.SignedIn>
			<div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex flex-col">

				{/* Full-Width Navigation Bar */}
				<div className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
					<div className="flex items-center justify-between px-6 py-4">
						<div className="flex items-center gap-6">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
									<Layers size={18} className="text-white"/>
								</div>
								<span className="font-bold text-white text-lg">Milanote Clone</span>
							</div>
							<div className="hidden md:flex items-center gap-2 bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 min-w-[320px]">
								<Search size={16} className="text-slate-500"/>
								<input
									type="text"
									placeholder="Search boards"
									className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full"
								/>
								<kbd className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-slate-500 font-mono">CtrlK</kbd>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<button className="p-2 hover:bg-white/5 rounded-lg transition-colors relative">
								<Bell size={18} className="text-slate-400"/>
								<div className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full"></div>
							</button>
							<UserMenu />
						</div>
					</div>

					{/* Sub-Navigation tools */}
					<div className="flex gap-1 px-6 pb-0">
						<TabButton
							active={activeTab === 'my-boards'}
							icon={Grid}
							onClick={() => setActiveTab('my-boards')}
						>My Boards</TabButton>
						<TabButton
							active={activeTab === 'shared'}
							icon={Users}
							onClick={() => setActiveTab('shared')}
						>Shared</TabButton>
						<TabButton
							active={activeTab === 'favorites'}
							icon={Star}
							onClick={() => setActiveTab('favorites')}
						>Favorites</TabButton>
					</div>
				</div>

				{/* Main Content Area */}
				<div className="flex-1 p-8 max-w-[2000px] mx-auto w-full">

					{/* Quick actions Section */}
					<div className="mb-12">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quick Start</h3>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
							<CreateBoardQuickAction />
							<QuickActionCardWrapper iconName="Layout" title="Browse Templates" subtitle="Find the perfect template" color="cyan"/>
							<QuickActionCardWrapper iconName="Palette" title="Import Board" subtitle="Use a board from somewhere else	" color="purple"/>
							<QuickActionCardWrapper iconName="Code" title="Tech specs" subtitle="Documentation" color="emerald"/>
						</div>
					</div>

					<Separator.Root className="bg-slate-800 h-px w-full my-4" decorative={true}/>

					{/* Boards Section */}
					<div className="mb-6 flex items-center justify-between">
						<div></div>
						<div className="flex items-center gap-2">
							<button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
								<Filter size={16} className="text-slate-400"/>
							</button>
							<button
								onClick={() => setViewMode('grid')}
								className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
								<Grid size={16}/>
							</button>
							<button
								onClick={() => setViewMode('list')}
								className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
								<List size={16} className="text-slate-400"/>
							</button>
						</div>
					</div>

					{/* Board rendering with empty state */}
					{filteredBoards && filteredBoards.length > 0 ? (
						<>
							{viewMode === 'grid' ? (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
									{filteredBoards.map((board) => (
										<BoardCard
											key={board.id}
											board={board}
										/>
									))}
								</div>
							) : (
								<div className="flex flex-col gap-2">
									{filteredBoards.map((board) => (
										<BoardListRow
											key={board.id}
											board={board}
										/>
									))}
								</div>
							)}
						</>
					) : (
						<>
							{activeTab === 'shared' ? (
								<div className="flex flex-col items-center justify-center py-24 px-4">
									<h3 className="text-xl font-semibold text-white mb-2">No boards have been shared with you yet</h3>
								</div>
							) : activeTab === 'favorites' ? (
								<div className="flex flex-col items-center justify-center py-24 px-4">
									<h3 className="text-xl font-semibold text-white mb-2">No favorite boards yet</h3>
									<p className="text-slate-400 text-center mb-8 max-w-md">
										Star boards to add them to your favorites.
									</p>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-24 px-4">
									<h3 className="text-xl font-semibold text-white mb-2">No boards yet</h3>
									<p className="text-slate-400 text-center mb-8 max-w-md">
										Get started by creating your first board.
									</p>
									<DashboardCreateBoardButton />
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</db.SignedIn>
	)
}

interface TabButtonProps {
	children: React.ReactNode;
	icon: LucideIcon;
	active?: boolean;
	onClick?: () => void;
}

function TabButton({ children, icon: Icon, active, onClick }: TabButtonProps) {
	return (
		<button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium transition-all ${
			active
				? 'bg-gradient-to-t from-indigo-500/10 to-transparent text-white border-b-2 border-indigo-500'
				: 'text-slate-400 hover:text-white hover:bg-white/5'
		}`}>
			<Icon size={14} />
			{children}
		</button>
	)
}