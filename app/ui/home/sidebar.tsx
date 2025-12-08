'use client';

import LoadingSkeleton from "@/app/ui/board/loading-skeleton";
import { useCreateBoard } from "@/lib/hooks/use-create-board";
import { Menu, ChevronDown, Plus, Search, Home, Star, Clock, Trash2, Settings } from 'lucide-react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Sidebar() {
	const { user, isLoaded } = useUser();
	const { createBoard, isLoading: createBoardIsLoading } = useCreateBoard();
	const pathname = usePathname();

	if (!isLoaded) {
		return <LoadingSkeleton />
	}

	// Helper function to determine if a link is active
	const isActive = (path: string) => pathname === path;

	// Helper function to get link classes
	const getLinkClasses = (path: string) => {
		const baseClasses = "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors";
		const activeClasses = "bg-[var(--primary)] text-[var(--foreground)] font-medium";
		const inactiveClasses = "text-[var(--foreground)] hover:bg-[var(--card-hover)]";

		return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
	};

	return (
		<aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col">
			{/* Logo & User */}
			<div className="p-4 border-b border-[var(--border)]">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-bold text-[var(--foreground)]">Milanote</h1>
					<button className="text-[var(--muted)] hover:text-[var(--foreground)]">
						<Menu className="w-5 h-5" />
					</button>
				</div>

				{/* User Profile */}
				<div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[var(--card-hover)] cursor-pointer">
					<div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{
						background: `linear-gradient(to bottom right, var(--primary), var(--accent))`
					}}>
						JD
					</div>
					<p className="text-sm font-semibold text-[var(--foreground)]">{user?.fullName || user?.firstName || 'User'}</p>
					<ChevronDown className="text-[var(--muted)] w-3 h-3 ml-auto" />
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto sidebar-scrollbar custom-scrollbar p-4">
				{/* Quick Actions */}
				<div className="mb-6">
					<button
						onClick={createBoard}
						disabled={createBoardIsLoading}
						className="w-full px-4 py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors hover:opacity-90 disabled:opacity-50"
						style={{
							background: `linear-gradient(to right, var(--primary), var(--accent))`,
							color: 'var(--foreground)'
						}}
					>
						<Plus className="w-4 h-4" />
						<span>{createBoardIsLoading ? "Creating..." : "New board"}</span>
					</button>
				</div>

				{/* Search */}
				<div className="mb-6">
					<div className="relative">
						<input
							type="text"
							placeholder="Search boards..."
							className="w-full pl-10 pr-4 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
							style={{
								'::placeholder': { color: 'var(--muted)' }
							} as React.CSSProperties}
						/>
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] w-4 h-4" />
					</div>
				</div>

				{/* Menu Items */}
				<div className="space-y-1 mb-6">
					<Link href="/dashboard" className={getLinkClasses('/dashboard')}>
						<Home className="w-5 h-5" />
						<span>Home</span>
					</Link>
					<Link href="/favorites" className={getLinkClasses('/favorites')}>
						<Star className="w-5 h-5" />
						<span>Favorites</span>
					</Link>
					<Link href="/recent" className={getLinkClasses('/recent')}>
						<Clock className="w-5 h-5" />
						<span>Recent</span>
					</Link>
					<Link href="/trash" className={getLinkClasses('/trash')}>
						<Trash2 className="w-5 h-5" />
						<span>Trash</span>
					</Link>
				</div>
			</nav>

			{/* Bottom Actions */}
			<div className="p-4 border-t border-[var(--border)]">
				<button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-lg transition-colors">
					<Settings className="w-4 h-4" />
					<span className="text-sm">Settings</span>
				</button>
			</div>
		</aside>
	);
}
