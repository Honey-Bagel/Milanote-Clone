'use client';

import { BoardCard } from '../ui/dashboard/board-card';
import { Bell, Grid, Layers, Search, Users, LucideIcon, Star, Clock, List, X } from 'lucide-react';
import { QuickActionCardWrapper } from '../ui/dashboard/quick-action-card-wrapper';
import { CreateBoardQuickAction } from '../ui/dashboard/create-board-quick-action';
import UserMenu from '../ui/dashboard/profile-dropdown';
import { DashboardCreateBoardButton } from '../ui/dashboard/dashboard-create-board-button';
import { useBoardsWithCollaborators } from '@/lib/hooks/boards';
import { db } from '@/lib/instant/db';
import { useMemo, useState, useEffect } from 'react';
import { BoardListRow } from '../ui/dashboard/board-list-row';
import { Separator } from "radix-ui";
import { DateFilterDropdown, DateFilterField, BoardTypeFilter } from '../ui/dashboard/date-filter-dropdown';
import { useDebounce, DateFilterType, getDateRangeTimestamp, isWithinDateRange } from '@/lib/utils';
import TemplateBrowserModal from '@/components/templates/TemplateBrowserModal';
import { useRouter } from 'next/navigation';
import { MobileSearchModal } from '../ui/dashboard/mobile-search-modal';
import { useIsSmallScreen } from '@/lib/hooks/use-media-query';
import { NotificationBell } from '../ui/board/notifications/notification-bell';
import { Loader2 } from 'lucide-react';

type Tabtype = 'my-boards' | 'shared' | 'favorites';

export default function Dashboard() {
	const { user } = db.useAuth();

	// Board type filter state (root boards only by default)
	const [boardTypeFilter, setBoardTypeFilter] = useState<BoardTypeFilter>('root');

	const { boards: allBoards, isLoading } = useBoardsWithCollaborators(false);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [activeTab, setActiveTab] = useState<Tabtype>('my-boards');

	// Search state
	const [searchQuery, setSearchQuery] = useState<string>('');
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	// Date filter state
	const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all');
	const [dateFilterField, setDateFilterField] = useState<DateFilterField>('updated_at');

	// Template browser modal state
	const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);

	// Mobile search modal state
	const [showMobileSearch, setShowMobileSearch] = useState(false);
	const isSmallScreen = useIsSmallScreen();

	const router = useRouter();

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl+K or Cmd+K to focus search
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				if (isSmallScreen) {
					setShowMobileSearch(true);
				} else {
					const searchInput = document.querySelector<HTMLInputElement>('input[type="text"][placeholder="Search boards"]');
					searchInput?.focus();
				}
			}

			// ESC to clear search
			if (e.key === 'Escape') {
				setSearchQuery('');
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isSmallScreen]);

	// Filter boards based on active tab, search, date filters, and board type
	const filteredBoards = useMemo(() => {
		if (!allBoards || !user) return [];

		let result = allBoards;

		// First: Board type filtering (root boards only vs all boards)
		if (boardTypeFilter === 'root') {
			result = result.filter(board => !board.parent_board_id);
		}

		// Second: Tab filtering
		switch(activeTab) {
			case 'my-boards':
				result = result.filter(board => board?.owner?.id === user.id);
				break;
			case 'shared':
				// Boards NOT owned by the user (shared with them)
				result = result.filter(board => board.owner?.id !== user.id);
				break;
			case 'favorites':
				// Filter boards that are in the user's favorite_boards array
				result = result.filter(board => board.is_favorite);
				break;
		}

		// Third: Search filtering
		if (debouncedSearchQuery.trim()) {
			const query = debouncedSearchQuery.toLowerCase();
			result = result.filter(board =>
				board.title.toLowerCase().includes(query)
			);
		}

		// Fourth: Date filtering
		if (dateFilterType !== 'all') {
			const dateRange = getDateRangeTimestamp(dateFilterType);
			result = result.filter(board => {
				const timestamp = dateFilterField === 'created_at'
					? board.created_at
					: board.updated_at;
				return isWithinDateRange(timestamp, dateRange);
			});
		}

		return result;
	}, [allBoards, activeTab, user, debouncedSearchQuery, dateFilterType, dateFilterField, boardTypeFilter]);

	return (
		<db.SignedIn>
			<div className="h-[100dvh] bg-[#020617] text-foreground font-sans flex flex-col overflow-hidden">

				{/* Full-Width Navigation Bar */}
				<div className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
					<div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
						<div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
							<button onClick={() => router.push('/')} className="flex-shrink-0">
								<div className="flex items-center gap-2 sm:gap-3">
									<div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
										<Layers size={16} className="sm:w-[18px] sm:h-[18px] text-white"/>
									</div>
									<span className="font-bold text-white text-base sm:text-lg hidden xs:inline">Notera</span>
								</div>
							</button>

							{/* Desktop Search Bar */}
							<div className="hidden md:flex items-center gap-2 bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 min-w-[320px] relative">
								<Search size={16} className="text-muted-foreground"/>
								<input
									type="text"
									placeholder="Search boards"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full"
								/>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery('')}
										className="p-1 hover:bg-white/5 rounded transition-colors"
									>
										<X size={14} className="text-secondary-foreground" />
									</button>
								)}
								{!searchQuery && (
									<kbd className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-muted-foreground font-mono">CtrlK</kbd>
								)}
							</div>
						</div>

						<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
							{/* Mobile Search Button */}
							<button
								onClick={() => setShowMobileSearch(true)}
								className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
								aria-label="Search"
							>
								<Search size={18} className="text-secondary-foreground"/>
							</button>

							<NotificationBell />
							<UserMenu />
						</div>
					</div>

					{/* Sub-Navigation tabs */}
					<div className="flex gap-1 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
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
				<div className="flex-1 min-h-0 overflow-y-auto">
					<div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[2000px] mx-auto w-full">

						{/* Quick actions Section */}
						<div className="mb-8 sm:mb-12">
							<div className="flex items-center justify-between mb-4 sm:mb-6">
								<h3 className="text-xs sm:text-sm font-bold text-secondary-foreground uppercase tracking-wider">Quick Start</h3>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
								<CreateBoardQuickAction />
								<QuickActionCardWrapper
									iconName="Layout"
									title="Browse Templates"
									subtitle="Find the perfect template"
									color="cyan"
									onClick={() => setShowTemplateBrowser(true)}
								/>
								<QuickActionCardWrapper iconName="Palette" title="Import Board" subtitle="Use a board from somewhere else	" color="purple"/>
							</div>
						</div>

						<Separator.Root className="bg-secondary h-px w-full my-4" decorative={true}/>

						{/* Boards Section */}
						<div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="flex items-center gap-2 flex-wrap">
								<div className="text-xs sm:text-sm text-secondary-foreground">
									{filteredBoards.length} {filteredBoards.length === 1 ? 'board' : 'boards'}
									{(debouncedSearchQuery || dateFilterType !== 'all' || boardTypeFilter !== 'root') && allBoards && ` (filtered from ${allBoards.length})`}
								</div>
								{/* Active Filter Indicators */}
								{debouncedSearchQuery && (
									<span className="px-2 py-1 bg-primary/20 text-primary rounded flex items-center gap-1 text-xs">
										Search: &quot;{debouncedSearchQuery}&quot;
										<button
											onClick={() => setSearchQuery('')}
											className="ml-1 hover:bg-primary/30 rounded p-0.5"
										>
											<X size={12} />
										</button>
									</span>
								)}
								{dateFilterType !== 'all' && (
									<span className="px-2 py-1 bg-primary/20 text-primary rounded flex items-center gap-1 text-xs">
										{dateFilterField === 'created_at' ? 'Created' : 'Updated'}: {
											dateFilterType === 'today' ? 'Today' :
											dateFilterType === 'week' ? 'Last 7 Days' :
											dateFilterType === 'month' ? 'Last 30 Days' :
											'Last Year'
										}
										<button
											onClick={() => setDateFilterType('all')}
											className="ml-1 hover:bg-primary/30 rounded p-0.5"
										>
											<X size={12} />
										</button>
									</span>
								)}
								{boardTypeFilter === 'all' && (
									<span className="px-2 py-1 bg-primary/20 text-primary rounded flex items-center gap-1 text-xs">
										All Boards
										<button
											onClick={() => setBoardTypeFilter('root')}
											className="ml-1 hover:bg-primary/30 rounded p-0.5"
										>
											<X size={12} />
										</button>
									</span>
								)}
							</div>
							<div className="flex items-center gap-2 flex-shrink-0">
								<DateFilterDropdown
									filterType={dateFilterType}
									filterField={dateFilterField}
									boardTypeFilter={boardTypeFilter}
									onFilterChange={(type, field) => {
										setDateFilterType(type);
										setDateFilterField(field);
									}}
									onBoardTypeChange={setBoardTypeFilter}
								/>
								<button
									onClick={() => setViewMode('grid')}
									className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-secondary-foreground hover:text-white'}`}>
									<Grid size={16}/>
								</button>
								<button
									onClick={() => setViewMode('list')}
									className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-secondary-foreground hover:text-white'}`}>
									<List size={16} className="text-secondary-foreground"/>
								</button>
							</div>
						</div>

						{/* Board rendering with empty state */}
						{filteredBoards && filteredBoards.length > 0 ? (
							<>
								{viewMode === 'grid' ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
								{isLoading ? (
									<div className="flex flex-col items-center justify-center py-24 px-4">
										<h3 className="text-xl font-semibold text-white mb-2">Loading boards...</h3>
										<Loader2 className="animate-spin" />
									</div>
								) : (
									<>
										{/* Check if empty due to filters */}
										{(debouncedSearchQuery || dateFilterType !== 'all' || boardTypeFilter !== 'root') && allBoards && allBoards.length > 0 ? (
											<div className="flex flex-col items-center justify-center py-24 px-4">
												<Search size={48} className="text-slate-600 mb-4" />
												<h3 className="text-xl font-semibold text-white mb-2">No boards found</h3>
												<p className="text-secondary-foreground text-center mb-8 max-w-md">
													Try adjusting your search or filters
												</p>
												<button
													onClick={() => {
														setSearchQuery('');
														setDateFilterType('all');
													}}
													className="px-4 py-2 bg-primary hover:bg-indigo-700 rounded-lg transition-colors"
												>
													Clear all filters
												</button>
											</div>
										) : activeTab === 'shared' ? (
											<div className="flex flex-col items-center justify-center py-24 px-4">
												<h3 className="text-xl font-semibold text-white mb-2">No boards have been shared with you yet</h3>
											</div>
										) : activeTab === 'favorites' ? (
											<div className="flex flex-col items-center justify-center py-24 px-4">
												<h3 className="text-xl font-semibold text-white mb-2">No favorite boards yet</h3>
												<p className="text-secondary-foreground text-center mb-8 max-w-md">
													Star boards to add them to your favorites.
												</p>
											</div>
										) : (
											<div className="flex flex-col items-center justify-center py-24 px-4">
												<h3 className="text-xl font-semibold text-white mb-2">No boards yet</h3>
												<p className="text-secondary-foreground text-center mb-8 max-w-md">
													Get started by creating your first board.
												</p>
												<DashboardCreateBoardButton />
											</div>
										)}
									</>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Template Browser Modal */}
			<TemplateBrowserModal
				isOpen={showTemplateBrowser}
				onClose={() => setShowTemplateBrowser(false)}
			/>

			{/* Mobile Search Modal */}
			<MobileSearchModal
				isOpen={showMobileSearch}
				onClose={() => setShowMobileSearch(false)}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
			/>
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
		<button onClick={onClick} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-lg text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
			active
				? 'bg-gradient-to-t from-primary/10 to-transparent text-white border-primary'
				: 'text-secondary-foreground border-transparent hover:text-white hover:bg-white/5'
		}`}>
			<Icon size={14} className="flex-shrink-0" />
			<span className="hidden sm:inline">{children}</span>
		</button>
	)
}