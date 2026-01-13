'use client';

import { Bell, Grid, Layers, Search, Users, Star, Clock, Filter, List } from 'lucide-react';

export function DashboardLoadingSkeleton() {
	return (
		<div className="min-h-screen bg-[#020617] text-foreground font-sans flex flex-col">
			{/* Full-Width Navigation Bar */}
			<div className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
				<div className="flex items-center justify-between px-6 py-4">
					<div className="flex items-center gap-6">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
								<Layers size={18} className="text-white"/>
							</div>
							<span className="font-bold text-white text-lg">Notera</span>
						</div>
						<div className="hidden md:flex items-center gap-2 bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 min-w-[320px]">
							<Search size={16} className="text-muted-foreground"/>
							<div className="skeleton h-4 w-24 rounded bg-white/5"></div>
							<kbd className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-muted-foreground font-mono">CtrlK</kbd>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<button className="p-2 hover:bg-white/5 rounded-lg transition-colors relative">
							<Bell size={18} className="text-secondary-foreground"/>
						</button>
						<div className="skeleton h-8 w-8 rounded-full bg-white/5"></div>
					</div>
				</div>

				{/* Sub-Navigation tools */}
				<div className="flex gap-1 px-6 pb-0">
					<div className="flex items-center gap-2 px-4 py-3 rounded-t-lg bg-gradient-to-t from-primary/10 to-transparent border-b-2 border-primary">
						<Grid size={14} className="text-white"/>
						<span className="text-sm font-medium text-white">My Boards</span>
					</div>
					<div className="flex items-center gap-2 px-4 py-3">
						<Users size={14} className="text-secondary-foreground"/>
						<span className="text-sm font-medium text-secondary-foreground">Shared</span>
					</div>
					<div className="flex items-center gap-2 px-4 py-3">
						<Star size={14} className="text-secondary-foreground"/>
						<span className="text-sm font-medium text-secondary-foreground">Favorites</span>
					</div>
					<div className="flex items-center gap-2 px-4 py-3">
						<Clock size={14} className="text-secondary-foreground"/>
						<span className="text-sm font-medium text-secondary-foreground">Recent</span>
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 p-8 max-w-[2000px] mx-auto w-full">
				{/* Quick actions Section */}
				<div className="mb-12">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-sm font-bold text-secondary-foreground uppercase tracking-wider">Quick Start</h3>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
						{[1, 2, 3, 4].map((i) => (
							<div key={i} className="skeleton h-32 rounded-2xl bg-white/5 animate-pulse"></div>
						))}
					</div>
				</div>

				{/* Recent Boards Section */}
				<div className="mb-6 flex items-center justify-between">
					<h3 className="text-sm font-bold text-secondary-foreground uppercase tracking-wider">Recent Boards</h3>
					<div className="flex items-center gap-2">
						<button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
							<Filter size={16} className="text-secondary-foreground"/>
						</button>
						<button className="p-2 bg-primary/20 rounded-lg text-primary">
							<Grid size={16}/>
						</button>
						<button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
							<List size={16} className="text-secondary-foreground"/>
						</button>
					</div>
				</div>

				{/* Board Grid Skeleton */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
						<div key={i} className="group">
							<div className="skeleton h-48 rounded-2xl bg-white/5 animate-pulse mb-3"></div>
							<div className="skeleton h-4 w-3/4 rounded bg-white/5 animate-pulse mb-2"></div>
							<div className="skeleton h-3 w-1/2 rounded bg-white/5 animate-pulse"></div>
						</div>
					))}
				</div>
			</div>

			<style jsx>{`
				@keyframes pulse {
					0%, 100% {
						opacity: 1;
					}
					50% {
						opacity: 0.5;
					}
				}
				.animate-pulse {
					animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
				}
			`}</style>
		</div>
	);
}
