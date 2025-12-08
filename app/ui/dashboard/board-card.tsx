"use client";

import Link from 'next/link';
import { useState } from 'react';
import { getTimeAgo } from '@/lib/utils';
import { BoardSettingsModal } from './board-settings-modal';
import { Star, Layers, Clock, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/lib/instant/db';
import { toggleBoardFavorite } from '@/lib/hooks/boards/use-favorite-board';

interface BoardCardProps {
	board: {
		id: string;
		owner_id: string;
		title: string;
		color?: string;
		updated_at: string;
		description?: string;
		is_favorite?: boolean;
		collaborators: [];
	};
}

export function BoardCard({
	board
}: BoardCardProps) {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isFavorited, setIsFavorited] = useState(board.is_favorite || false);
	const [isUpdating, setIsUpdating] = useState(false);
	const router = useRouter();
	const { user } = db.useAuth();

	const handleSettingsClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsSettingsOpen(true);
	};

	const handleFavoriteClick = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isUpdating) return; // Prevent double clicks

		const newFavoriteState = !isFavorited;

		// Optimistically update UI
		setIsFavorited(newFavoriteState);
		setIsUpdating(true);

		try {
			await toggleBoardFavorite(user.id, board.id);

			// Refresh the page to update the favorites list
			router.refresh();
		} catch (error) {
			console.error('Error updating favorite status:', error);
			// Revert on error
			setIsFavorited(!newFavoriteState);
		} finally {
			setIsUpdating(false);
		}
	};

	const gradientStyle = board.color
		? { background: `linear-gradient(135deg, color-mix(in srgb, ${board.color} 15%, transparent), color-mix(in srgb, ${board.color} 35%, transparent))` }
		: { background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--primary) 35%, transparent))' };

	return (
		<>
			<Link
				href={`/board/${board.id}`}
				className="block group"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div className="bg-[#0f172a]/40 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
					<div className={`h-48 relative`} style={gradientStyle}>
						<div className="absolute inset-0 flex items-center justify-center text-slate-600/50 group-hover:text-white/20 transition-colors">
							<Layers size={48} />
						</div>
						<div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 to-transparent"></div>

						<div className="absolute top-3 right-3 flex -space-x-2">
							{board.collaborators?.map((collaborator, i) => (
								<Avatar className="w-7 h-7" key={i}>
									<AvatarImage src={collaborator?.user.avatar_url} />
									<AvatarFallback>
										{collaborator.user?.display_name
											?.split(' ')
											?.map((word: string) => word[0])
											?.join('')
											?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
							))}
						</div>
					</div>
					<div className="p-5">
						<h4 className="font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors text-lg">{board.title}</h4>
						<div className="flex items-center justify-between">
							<div className="text-xs text-slate-500 font-medium flex items-center gap-1">
								<Clock size={12}/>
								{getTimeAgo(board.updated_at)}
							</div>
							<div>
								<button onClick={handleFavoriteClick} className={`p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors`}>
									<Star className={`${isFavorited ? 'fill-slate-500' : ''}`} size={20}/>
								</button>
								<button onClick={handleSettingsClick} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
									<MoreVertical size={20}/>
								</button>
							</div>
						</div>
					</div>
				</div>
			</Link>

			<BoardSettingsModal
				board={board}
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
			/>
		</>
	);
}
