import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { getRecentBoards, getFavoriteBoards, getCollaboratorBoards } from '@/lib/data/boards';
import { BoardCard } from '../ui/dashboard/board-card';
import { Bell, Grid, Layers, Search, Settings, Users, LucideIcon, Star, Clock, Filter, List } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QuickActionCardWrapper } from '../ui/dashboard/quick-action-card-wrapper';
import { CreateBoardQuickAction } from '../ui/dashboard/create-board-quick-action';

export default async function Dashboard() {
	const supabase = await createClient();

	const { data: { user }, error } = await supabase.auth.getUser();

	if (error || !user) {
		redirect("/auth");
	}

	const displayName = user.user_metadata?.display_name || user.email;
	const avatarUrl = user.user_metadata?.avatar_url || null;

	// Fetch all boards in parallel
	const [recentBoards, favoriteBoards, collaboratorBoards] = await Promise.all([
		getRecentBoards(),
		getFavoriteBoards(),
		getCollaboratorBoards(user.id)
	]);

	// return (
	// 	<div className="flex h-screen">
	// 		<Sidebar />

	// 		<main className="flex-1 overflow-auto bg-background custom-scrollbar">
	// 			{/* Header */}
	// 			<header className="bg-card border-b border-border px-8 py-6">
	// 				<div className="max-w-7xl mx-auto">
	// 					<h1 className="text-3xl font-bold text-foreground mb-2">Home</h1>
	// 					<p className="text-muted-foreground">Welcome back, {displayName}!</p>
	// 				</div>
	// 			</header>
				
	// 			{/* Content */}
	// 			<div className="max-w-7xl mx-auto px-8 py-8">

	// 				{/* Quick Actions */}
	// 				<div className="mb-8">
	// 					<h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
	// 					<div className="grid grid-cols-4 gap-4">
	// 						<CreateBoardButton />

	// 						<button className="p-6 bg-card border border-border rounded-xl hover:bg-card-hover transition-all">
	// 							<div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
	// 								<i className="fas fa-folder text-secondary text-2xl"></i>
	// 							</div>
	// 							<h3 className="font-semibold text-foreground text-center">Browse Templates</h3>
	// 						</button>

	// 						<button className="p-6 bg-card border border-border rounded-xl hover:bg-card-hover transition-all">
	// 							<div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-3">
	// 								<i className="fas fa-upload text-accent text-2xl"></i>
	// 							</div>
	// 							<h3 className="font-semibold text-foreground text-center">Import Board</h3>
	// 						</button>

	// 						<button className="p-6 bg-card border border-border rounded-xl hover:bg-card-hover transition-all">
	// 							<div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
	// 								<i className="fas fa-users text-primary text-2xl"></i>
	// 							</div>
	// 							<h3 className="font-semibold text-foreground text-center">Invite Team</h3>
	// 						</button>
	// 					</div>
	// 				</div>
					
	// 				{/* Recent Boards */}
	// 				<div className="mb-8">
	// 					<div className="flex items-center justify-between mb-4">
	// 						<h2 className="text-lg font-semibold text-foreground">Recent Boards</h2>
	// 						<a href="#" className="text-sm text-primary hover:text-primary/80 font-medium">View all</a>
	// 					</div>

	// 					<div className="grid grid-cols-4 gap-4">
	// 						{recentBoards && recentBoards.map((board) => (
	// 							<BoardCard
	// 								key={board.id}
	// 								board={board}
	// 							/>
	// 						))}
	// 					</div>
	// 				</div>

	// 				{/* Favorites */}
	// 				{favoriteBoards && favoriteBoards.length > 0 && (
	// 					<div className="mb-8">
	// 						<div className="flex items-center justify-between mb-4">
	// 							<h2 className="text-lg font-semibold text-foreground">Favorites</h2>
	// 							<a href="#" className="text-sm text-primary hover:text-primary/80 font-medium">View all</a>
	// 						</div>

	// 						<div className="grid grid-cols-4 gap-4">
	// 							{favoriteBoards.map((board) => (
	// 								<BoardCard
	// 									key={board.id}
	// 									board={board}
	// 									isFavorite={true}
	// 								/>
	// 							))}
	// 						</div>
	// 					</div>
	// 				)}

	// 				{/* Shared with me */}
	// 				{collaboratorBoards && collaboratorBoards.length > 0 && (
	// 					<div>
	// 						<div className="flex items-center justify-between mb-4">
	// 							<h2 className="text-lg font-semibold text-foreground">Shared with me</h2>
	// 							<a href="#" className="text-sm text-primary hover:text-primary/80 font-medium">View all</a>
	// 						</div>

	// 						<div className="grid grid-cols-4 gap-4">
	// 							{collaboratorBoards.map((board) => (
	// 								<BoardCard
	// 									key={board.id}
	// 									board={board}
	// 									isShared={true}
	// 									sharedBy="unknown"
	// 								/>
	// 							))}
	// 						</div>
	// 					</div>
	// 				)}
	// 			</div>
	// 		</main>
	// 	</div>
	// );

	return (
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
						<button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
							<Settings size={18} className="text-slate-400"/>
						</button>
						<Avatar>
							<AvatarImage src={avatarUrl} />
							<AvatarFallback>
								{user?.user_metadata?.display_name
									?.split(' ')
									?.map((word: string) => word[0])
									?.join('')
									?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</div>
				</div>

				{/* Sub-Navigation tools */}
				<div className="flex gap-1 px-6 pb-0">
					<TabButton active={true} icon={Grid}>My Boards</TabButton>
					<TabButton icon={Users}>Shared</TabButton>
					<TabButton icon={Star}>Favorites</TabButton>
					<TabButton icon={Clock}>Recent</TabButton>
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

				{/* Recent Boards Section */}
				<div className="mb-6 flex items-center justify-between">
					<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recent Boards</h3>
					<div className="flex items-center gap-2">
						<button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
							<Filter size={16} className="text-slate-400"/>
						</button>
						<button className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
							<Grid size={16}/>
						</button>
						<button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
							<List size={16} className="text-slate-400"/>
						</button>
					</div>
				</div>

				{/* Board rendering */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{recentBoards && recentBoards.map((board) => (
							<BoardCard
								key={board.id}
								board={board}
							/>
						))}
				</div>
			</div>
		</div>
	)
}

interface TabButtonProps {
	children: React.ReactNode;
	icon: LucideIcon;
	active?: boolean;
}

function TabButton({ children, icon: Icon, active }: TabButtonProps) {
	return (
		<button className={`flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium transition-all ${
			active
				? 'bg-gradient-to-t from-indigo-500/10 to-transparent text-white border-b-2 border-indigo-500'
				: 'text-slate-400 hover:text-white hover:bg-white/5'
		}`}>
			<Icon size={14} />
			{children}
		</button>
	)
}

