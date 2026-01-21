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

interface BoardListRowProps {
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

export function BoardListRow({ board }: BoardListRowProps) {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
		if (isUpdating) return;

		const newFavoriteState = !isFavorited;
		setIsFavorited(newFavoriteState);
		setIsUpdating(true);

		try {
			await toggleBoardFavorite(user.id, board.id);
			router.refresh();
		} catch (error) {
			console.error('Error updating favorite status:', error);
			setIsFavorited(!newFavoriteState);
		} finally {
			setIsUpdating(false);
		}
	};

	// Mini gradient for the list icon
	const iconGradient = board.color
		? { background: `linear-gradient(135deg, ${board.color}, color-mix(in srgb, ${board.color} 50%, black))` }
		: { background: 'linear-gradient(135deg, var(--primary), var(--accent))' };

	return (
		<>
			<Link href={`/board/${board.id}`} className="block group mb-3">
				<div className="flex items-center justify-between bg-[#0f172a]/40 border border-white/10 rounded-xl p-4 hover:border-primary/50 hover:bg-[#0f172a]/60 transition-all duration-200 group hover:shadow-lg hover:shadow-indigo-500/5">
					
					{/* Left: Icon & Title */}
					<div className="flex items-center gap-4 flex-1 min-w-0">
						<div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg text-white/90" style={iconGradient}>
							<Layers size={20} />
						</div>
						<div className="min-w-0">
							<h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors truncate">
								{board.title}
							</h4>
							<p className="text-xs text-muted-foreground truncate max-w-[300px]">
								{board.description || "No description"}
							</p>
						</div>
					</div>

					{/* Middle: Collaborators */}
					<div className="hidden md:flex items-center -space-x-2 px-4">
						{board.collaborators?.slice(0, 3).map((collaborator: any, i: number) => (
							<Avatar className="w-6 h-6 border border-[#0f172a]" key={i}>
								<AvatarImage src={collaborator?.user.avatar_url} />
								<AvatarFallback className="text-[9px]">
									{collaborator.user?.display_name?.[0]}
								</AvatarFallback>
							</Avatar>
						))}
					</div>

					{/* Right: Meta & Actions */}
					<div className="flex items-center gap-6">
						<div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 w-24 justify-end">
							<Clock size={12}/>
							{getTimeAgo(board.updated_at)}
						</div>
						
						<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<button 
								onClick={handleFavoriteClick} 
								className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${isFavorited ? 'text-yellow-400 opacity-100' : 'text-secondary-foreground hover:text-white'}`}
							>
								<Star className={isFavorited ? 'fill-yellow-400' : ''} size={16}/>
							</button>
							<button 
								onClick={handleSettingsClick} 
								className="p-1.5 rounded-lg text-secondary-foreground hover:text-white hover:bg-white/10 transition-colors"
							>
								<MoreVertical size={16}/>
							</button>
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