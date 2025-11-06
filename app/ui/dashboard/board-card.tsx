"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTimeAgo } from '@/lib/utils';
import { BoardSettingsModal } from './board-settings-modal';
import { Settings, Star, Users, Palette, Book, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface BoardCardProps {
	board: {
		id: string;
		title: string;
		color?: string;
		updated_at: string;
		description?: string;
		is_favorite?: boolean;
	};
	isFavorite?: boolean;
	isShared?: boolean;
	sharedBy?: string;
	iconType?: 'palette' | 'book' | 'briefcase';
}

export function BoardCard({ 
	board, 
	isFavorite = false, 
	isShared = false,
	sharedBy,
	iconType = 'palette'
}: BoardCardProps) {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isFavorited, setIsFavorited] = useState(board.is_favorite || isFavorite);
	const [isUpdating, setIsUpdating] = useState(false);
	const router = useRouter();

	// Sync local state with server state when board.is_favorite changes
	useEffect(() => {
		setIsFavorited(board.is_favorite || isFavorite);
	}, [board.is_favorite, isFavorite]);

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
			const supabase = createClient();
			const { error } = await supabase
				.from('boards')
				.update({ is_favorite: newFavoriteState })
				.eq('id', board.id);

			if (error) throw error;
			
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
		? { background: `linear-gradient(135deg, ${board.color}15, ${board.color}35)` }
		: { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.35))' };

	const iconColor = board.color || '#6366f1';

	const IconComponent = iconType === 'book' ? Book : iconType === 'briefcase' ? Briefcase : Palette;

	return (
		<>
			<Link 
				href={`/board/${board.id}`} 
				className="block group"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all relative">
					{/* Action Buttons */}
					<div className={`absolute top-2 right-2 z-10 flex gap-1 transition-all ${
						isHovered ? 'opacity-100' : 'opacity-0'
					}`}>
						{/* Favorite Button */}
						<button
							onClick={handleFavoriteClick}
							disabled={isUpdating}
							className={`w-8 h-8 bg-gray-900/80 hover:bg-gray-900 rounded-lg flex items-center justify-center transition-all ${
								isFavorited ? 'text-yellow-400' : 'text-gray-300'
							} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
							aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
						>
							<Star 
								className={`w-4 h-4 ${isUpdating ? 'animate-pulse' : ''}`}
								fill={isFavorited ? "currentColor" : "none"}
							/>
						</button>
						
						{/* Settings Button */}
						<button
							onClick={handleSettingsClick}
							className="w-8 h-8 bg-gray-900/80 hover:bg-gray-900 rounded-lg flex items-center justify-center transition-all"
							aria-label="Board settings"
						>
							<Settings className="text-gray-300 w-4 h-4" />
						</button>
					</div>

					<div className="aspect-video flex items-center justify-center" style={gradientStyle}>
						<IconComponent className="w-10 h-10" style={{ color: iconColor }} />
					</div>
					<div className="p-4">
						<div className="flex items-start justify-between mb-1">
							<h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors flex-1">
								{board.title}
							</h3>
							{isFavorite && <Star className="text-yellow-400 w-4 h-4 fill-yellow-400" />}
							{isShared && <Users className="text-gray-400 w-4 h-4" />}
						</div>
						<p className="text-xs text-gray-400">
							{isShared && sharedBy ? `Shared by ${sharedBy}` : getTimeAgo(board.updated_at)}
						</p>
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