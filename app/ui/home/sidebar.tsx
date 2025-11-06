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
		const activeClasses = "bg-blue-600 text-white font-medium";
		const inactiveClasses = "text-gray-300 hover:bg-gray-700";
		
		return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
	};

	return (
		<aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
			{/* Logo & User */}
			<div className="p-4 border-b border-gray-700">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-bold text-white">Milanote</h1>
					<button className="text-gray-400 hover:text-gray-200">
						<Menu className="w-5 h-5" />
					</button>
				</div>

				{/* User Profile */}
				<div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
					<div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
						JD
					</div>
					<p className="text-sm font-semibold text-white">{user?.user_metadata?.display_name}</p>
					<ChevronDown className="text-gray-400 w-3 h-3 ml-auto" />
				</div>
			</div>
			
			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto sidebar-scrollbar custom-scrollbar p-4">
				{/* Quick Actions */}
				<div className="mb-6">
					<button onClick={createBoard} disabled={createBoardIsLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors">
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
							className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
						<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Boards</h3>
						<button className="text-gray-400 hover:text-gray-300">
							<Plus className="w-3 h-3" />
						</button>
					</div>
					
					<div className="space-y-1">
						<a href="/board" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 group">
							<div className="w-5 h-5 bg-red-500 rounded flex-shrink-0"></div>
							<span className="flex-1 truncate">Design System</span>
							<MoreHorizontal className="text-gray-400 opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 group">
							<div className="w-5 h-5 bg-blue-500 rounded flex-shrink-0"></div>
							<span className="flex-1 truncate">Marketing Campaign</span>
							<MoreHorizontal className="text-gray-400 opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 group">
							<div className="w-5 h-5 bg-green-500 rounded flex-shrink-0"></div>
							<span className="flex-1 truncate">Product Roadmap</span>
							<MoreHorizontal className="text-gray-400 opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 group">
							<div className="w-5 h-5 bg-purple-500 rounded flex-shrink-0"></div>
							<span className="flex-1 truncate">UX Research</span>
							<MoreHorizontal className="text-gray-400 opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 group">
							<div className="w-5 h-5 bg-yellow-500 rounded flex-shrink-0"></div>
							<span className="flex-1 truncate">Brand Guidelines</span>
							<MoreHorizontal className="text-gray-400 opacity-0 group-hover:opacity-100 w-4 h-4" />
						</a>
					</div>
				</div>
				
				{/* Shared Section */}
				<div className="mt-6">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shared with me</h3>
					</div>
					
					<div className="space-y-1">
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 group">
							<div className="w-5 h-5 bg-pink-500 rounded flex-shrink-0"></div>
							<span className="flex-1 truncate">Team Workshop</span>
							<Users className="text-gray-400 w-4 h-4" />
						</a>
						<a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 group">
							<div className="w-5 h-5 bg-indigo-500 rounded flex-shrink-0"></div>
							<span className="flex-1 truncate">Client Projects</span>
							<Users className="text-gray-400 w-4 h-4" />
						</a>
					</div>
				</div>
			</nav>
			
			{/* Bottom Actions */}
			<div className="p-4 border-t border-gray-700">
				<button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
					<Settings className="w-4 h-4" />
					<span className="text-sm">Settings</span>
				</button>
			</div>
		</aside>
	);
}