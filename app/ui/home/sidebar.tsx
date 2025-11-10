'use client';

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import LoadingSkeleton from "@/app/ui/board/loading-skeleton";
import { useCreateBoard } from "@/lib/hooks/use-create-board";
import { Menu, ChevronDown, Plus, Search, Home, Star, Clock, Trash2, MoreHorizontal, Users, Settings } from 'lucide-react';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const { createBoard, isLoading: createBoardIsLoading } = useCreateBoard();
	const pathname = usePathname();
	const supabase = createClient();

	useEffect(() => {
		// Get initial user
		async function loadUser() {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user);
			setLoading(false);
		}
		loadUser();

		// Listen for auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				setUser(session?.user ?? null);
			}
		);

		// Cleanup subscription
		return () => subscription.unsubscribe();
	}, [supabase]);

	if (loading) {
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
					<p className="text-sm font-semibold text-[var(--foreground)]">{user?.user_metadata?.display_name}</p>
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

				{/* Boards Section */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">My Boards</h3>
						<button className="text-[var(--muted)] hover:text-[var(--foreground)]">
							<Plus className="w-3 h-3" />
						</button>
					</div>

					<div className="space-y-1">
						<a href="/board" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--card-hover)] group">
							<div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: '#ef4444' }}></div>
							<span className="flex-1 truncate">Design System</span>
							<MoreHorizontal className="text-[var(--muted)] opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--card-hover)] group">
							<div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}></div>
							<span className="flex-1 truncate">Marketing Campaign</span>
							<MoreHorizontal className="text-[var(--muted)] opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--card-hover)] group">
							<div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: '#10b981' }}></div>
							<span className="flex-1 truncate">Product Roadmap</span>
							<MoreHorizontal className="text-[var(--muted)] opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--card-hover)] group">
							<div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }}></div>
							<span className="flex-1 truncate">UX Research</span>
							<MoreHorizontal className="text-[var(--muted)] opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--card-hover)] group">
							<div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: '#f59e0b' }}></div>
							<span className="flex-1 truncate">Brand Guidelines</span>
							<MoreHorizontal className="text-[var(--muted)] opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
					</div>
				</div>

				{/* Shared Section */}
				<div className="mt-6">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Shared with me</h3>
					</div>

					<div className="space-y-1">
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--card-hover)] group">
							<div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: '#ec4899' }}></div>
							<span className="flex-1 truncate">Team Workshop</span>
							<Users className="text-[var(--muted)] w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--card-hover)] group">
							<div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: '#6366f1' }}></div>
							<span className="flex-1 truncate">Client Projects</span>
							<Users className="text-[var(--muted)] w-4 h-4" />
						</a>
					</div>
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
