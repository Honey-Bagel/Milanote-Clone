/**
 * Compact Board Card Component - Minimal board card display
 *
 * A smaller, icon-centric version of the board card for compact view preference.
 * Features:
 * - 65x65 pixel card with folder icon
 * - Title below that expands horizontally (center-aligned)
 * - Auto-generated subtitle showing board/card counts
 * - Double-click to navigate, double-click title to edit
 * - Same right-click and interaction behavior as regular board card
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { BoardCard } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';
import { db } from '@/lib/instant/db';
import { syncBoardTitle } from '@/lib/instant/board-title-sync';
import { useBoardWithCards } from '@/lib/hooks/boards';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface CompactBoardCardComponentProps {
	card: BoardCard;
	isEditing: boolean;
	isPublicView?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompactBoardCardComponent({
	card: propCard,
	isEditing: propIsEditing,
	isPublicView = false
}: CompactBoardCardComponentProps) {
	const context = useOptionalCardContext();

	const card = (context?.card as BoardCard) ?? propCard;
	const isEditing = context?.isEditing ?? propIsEditing;
	const { saveContent, saveContentImmediate } = context ?? {
		saveContent: () => {},
		saveContentImmediate: async () => {},
	};

	const { cards, isLoading } = useBoardWithCards(card.linked_board_id);

	const [localTitle, setLocalTitle] = useState(card.board_title || 'New Board');
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const titleInputRef = useRef<HTMLInputElement>(null);

	// Update local title when card prop changes
	useEffect(() => {
		if (!isEditingTitle) {
			setLocalTitle(card.board_title || 'New Board');
		}
	}, [card.board_title, isEditingTitle]);

	// Focus input when editing title
	useEffect(() => {
		if (isEditingTitle && titleInputRef.current) {
			titleInputRef.current.focus();
			titleInputRef.current.select();
		}
	}, [isEditingTitle]);

	// Count nested boards
	const nestedBoardCount = cards.filter(c => c.card_type === 'board').length;
	const otherCardCount = cards.filter(c => c.card_type !== 'board').length;

	// Build subtitle text
	const getSubtitle = () => {
		if (isLoading) return '';
		const parts: string[] = [];
		if (nestedBoardCount > 0) {
			parts.push(`${nestedBoardCount} ${nestedBoardCount === 1 ? 'board' : 'boards'}`);
		}
		if (otherCardCount > 0) {
			parts.push(`${otherCardCount} ${otherCardCount === 1 ? 'card' : 'cards'}`);
		}
		return parts.length > 0 ? parts.join(', ') : 'Empty';
	};

	// ========================================================================
	// EVENT HANDLERS
	// ========================================================================

	const handleNavigateToBoard = useCallback(async (e: React.MouseEvent) => {
		if (!isEditing && card.linked_board_id && !isEditingTitle) {
			e.stopPropagation();

			if (isPublicView) {
				try {
					const { data } = await db.queryOnce({
						boards: {
							$: {
								where: {
									id: card.linked_board_id,
									is_public: true,
								},
								limit: 1,
							},
						},
					});

					const childBoard = data?.boards?.[0];

					if (childBoard && childBoard.is_public && childBoard.share_token) {
						window.location.href = `/board/public/${childBoard.share_token}`;
					} else {
						console.warn('Child board is not publicly accessible');
					}
				} catch (error) {
					console.error('Failed to fetch child board info:', error);
				}
			} else {
				window.location.href = `/board/${card.linked_board_id}`;
			}
		}
	}, [isEditing, card.linked_board_id, isPublicView, isEditingTitle]);

	const handleTitleDoubleClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (!isPublicView) {
			setIsEditingTitle(true);
		}
	}, [isPublicView]);

	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		setLocalTitle(newTitle);
	}, []);

	const handleTitleSubmit = useCallback(async () => {
		setIsEditingTitle(false);

		// Save to card
		saveContent({ board_title: localTitle });

		// Sync with linked board
		if (card.linked_board_id) {
			try {
				await syncBoardTitle(card.linked_board_id, localTitle);
			} catch (error) {
				console.error('Failed to sync board title:', error);
			}
		}
	}, [localTitle, card.linked_board_id, saveContent]);

	const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleTitleSubmit();
		} else if (e.key === 'Escape') {
			setIsEditingTitle(false);
			setLocalTitle(card.board_title || 'New Board');
		}
	}, [handleTitleSubmit, card.board_title]);

	const handleTitleBlur = useCallback(() => {
		handleTitleSubmit();
	}, [handleTitleSubmit]);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="compact-board-card flex flex-col items-center gap-1.5 select-none">
			{/* Card Icon Box */}
			<div
				className="w-[65px] h-[65px] rounded-xl flex items-center justify-center cursor-pointer shadow-lg border border-white/10 relative"
				style={{
					background: `linear-gradient(135deg, ${card.board_color || '#6366f1'} 0%, ${card.board_color || '#6366f1'}dd 100%)`,
				}}
				onDoubleClick={handleNavigateToBoard}
			>
				{/* Subtle overlay */}
				<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

				{/* Folder Icon */}
				<svg
					className="w-7 h-7 text-white/90 relative z-10"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
				</svg>
			</div>

			{/* Title - Editable on double-click */}
			<div className="w-full text-center">
				{isEditingTitle ? (
					<input
						ref={titleInputRef}
						type="text"
						value={localTitle}
						onChange={handleTitleChange}
						onBlur={handleTitleBlur}
						onKeyDown={handleTitleKeyDown}
						onClick={(e) => e.stopPropagation()}
						className="w-full max-w-[150px] px-2 py-0.5 text-xs font-semibold text-white bg-slate-700/80 border border-white/20 rounded text-center outline-none focus:ring-1 focus:ring-primary"
						style={{ minWidth: '65px' }}
					/>
				) : (
					<h4
						className="text-xs font-semibold text-white truncate cursor-text hover:text-primary transition-colors px-1"
						style={{
							maxWidth: '150px',
							margin: '0 auto',
						}}
						onDoubleClick={handleTitleDoubleClick}
						title={localTitle}
					>
						{localTitle}
					</h4>
				)}
			</div>

			{/* Subtitle - Auto-generated counts */}
			<p className="text-[10px] text-muted-foreground/70 text-center">
				{getSubtitle()}
			</p>
		</div>
	);
}
