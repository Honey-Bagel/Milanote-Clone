/**
 * Board Card Component - For nested boards
 *
 * Uses CardContext for shared state and persistence.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BoardCard } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';
import { BoardService } from '@/lib/services';
import { db } from '@/lib/instant/db';
import { useBoardWithCards } from '@/lib/hooks/boards';

// ============================================================================
// PROPS INTERFACE (for legacy compatibility with CardRenderer)
// ============================================================================

interface BoardCardComponentProps {
	card: BoardCard;
	isEditing: boolean;
	isPublicView?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BoardCardComponent({
	card: propCard,
	isEditing: propIsEditing,
	isPublicView = false
}: BoardCardComponentProps) {
	// Try to use context, fall back to props for backwards compatibility
	const context = useOptionalCardContext();

	// Use context values if available, otherwise use props
	const card = (context?.card as BoardCard) ?? propCard;
	const isEditing = context?.isEditing ?? propIsEditing;
	const { saveContent, saveContentImmediate } = context ?? {
		saveContent: () => {},
		saveContentImmediate: async () => {},
	};

	const { cards, isLoading } = useBoardWithCards(card.linked_board_id);

	const [availableBoards, setAvailableBoards] = useState<Array<{id: string, title: string, color: string}>>([]);
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [newBoardTitle, setNewBoardTitle] = useState('New Board');
	const [newBoardColor, setNewBoardColor] = useState('#3B82F6');
	const [localTitle, setLocalTitle] = useState(card.board_title || '');

	// Update local title when card prop changes (from DB) and not editing
	useEffect(() => {
		if (!isEditing) {
			setLocalTitle(card.board_title || '');
		}
	}, [card.board_title, isEditing]);

	// Fetch available boards using InstantDB
	const instantUser = db.useAuth();
	const { data: boardsData } = db.useQuery(
		instantUser.user?.id ? {
			$users: {
				$: { where: { id: instantUser.user.id } },
				owned_boards: {
					$: {
						order: { updated_at: 'desc' as const },
					},
				},
			},
		} : null
	);

	useEffect(() => {
		if (isEditing && boardsData) {
			const userBoards = boardsData.$users?.[0]?.owned_boards || [];
			setAvailableBoards(userBoards.map((b: any) => ({
				id: b.id,
				title: b.title,
				color: b.color,
			})));
		}
	}, [isEditing, boardsData]);

	// Event handlers
	const handleCreateNewBoard = useCallback(async () => {
		try {
			if (!instantUser.user?.id) throw new Error('Not authenticated');

			// Create new board using BoardService with parent link
			const newBoardId = await BoardService.createBoard({
				ownerId: instantUser.user.id,
				title: newBoardTitle,
				color: newBoardColor,
				parentId: card.board_id,
			});

			// Update card to link to new board using immediate save
			await saveContentImmediate({
				linked_board_id: newBoardId,
				board_title: newBoardTitle,
				board_color: newBoardColor,
			});

			setIsCreatingNew(false);
		} catch (error) {
			console.error('Failed to create board:', error);
		}
	}, [instantUser.user?.id, newBoardTitle, newBoardColor, card.board_id, saveContentImmediate]);

	const handleSelectBoard = useCallback(async (boardId: string, boardTitle: string, boardColor: string) => {
		await saveContentImmediate({
			board_linked_board_id: boardId,
			board_title: boardTitle,
			board_color: boardColor,
		});
	}, [saveContentImmediate]);

	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		setLocalTitle(newTitle);
		saveContent({
			board_title: newTitle,
		});
	}, [saveContent]);

	const handleNavigateToBoard = useCallback(async (e: React.MouseEvent) => {
		if (!isEditing && card.linked_board_id) {
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
	}, [isEditing, card.linked_board_id, isPublicView]);

	// ========================================================================
	// EDITING MODE
	// ========================================================================

	if (isEditing) {
		return (
			<div className="board-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border border-white/10 w-full h-full">
				<div className="p-4 space-y-3">
					<div>
						<label className="text-xs text-slate-400 block mb-1">Board Title</label>
						<input
							type="text"
							value={localTitle}
							onChange={handleTitleChange}
							className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
							placeholder="Board name"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>

					{isCreatingNew ? (
						<div className="space-y-3 p-3 bg-slate-800/50 rounded border border-white/10">
							<div>
								<label className="text-xs text-slate-400 block mb-1">New Board Name</label>
								<input
									type="text"
									value={newBoardTitle}
									onChange={(e) => setNewBoardTitle(e.target.value)}
									className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
							<div>
								<label className="text-xs text-slate-400 block mb-1">Color</label>
								<input
									type="color"
									value={newBoardColor}
									onChange={(e) => setNewBoardColor(e.target.value)}
									className="w-12 h-8 rounded border border-white/10 cursor-pointer"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
							<div className="flex gap-2">
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleCreateNewBoard();
									}}
									className="px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700"
									style={{ cursor: 'pointer' }}
								>
									Create
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setIsCreatingNew(false);
									}}
									className="px-3 py-1 text-sm border border-white/10 text-slate-300 rounded hover:bg-white/5"
									style={{ cursor: 'pointer' }}
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<button
								onClick={(e) => {
									e.stopPropagation();
									setIsCreatingNew(true);
								}}
								className="w-full px-3 py-2 text-sm text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/10"
								style={{ cursor: 'pointer' }}
							>
								+ Create New Board
							</button>

							{availableBoards.length > 0 && (
								<div>
									<label className="text-xs text-slate-400 block mb-1">Or Link to Existing</label>
									<select
										value={card.linked_board_id || ''}
										onChange={(e) => {
											const selectedBoard = availableBoards.find(b => b.id === e.target.value);
											if (selectedBoard) {
												handleSelectBoard(selectedBoard.id, selectedBoard.title, selectedBoard.color);
											}
										}}
										className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
										onClick={(e) => e.stopPropagation()}
									>
										<option value="">Select a board...</option>
										{availableBoards.map(board => (
											<option key={board.id} value={board.id}>
												{board.title}
											</option>
										))}
									</select>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		);
	}

	// ========================================================================
	// VIEW MODE
	// ========================================================================

	return (
		<div className="board-card group/board-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border border-white/10 cursor-pointer group w-full h-full overflow-hidden">
			<div
				className="h-full"
				onDoubleClick={handleNavigateToBoard}
			>
				<div
					className="h-32 flex items-center justify-center relative bg-gradient-to-br from-indigo-600 to-indigo-800"
					style={{ background: `linear-gradient(to bottom right, ${card.board_color}, ${card.board_color}dd)` }}
				>
					<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
					<svg
						className="w-12 h-12 text-white/80 relative z-10 group-hover/board-card:scale-110 transition-transform"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
						/>
					</svg>
				</div>
				<div className="p-4 border-t border-white/5">
					<h3 className="font-semibold text-white truncate mb-1 group-hover/board-card:text-cyan-400 transition-colors">
						{card.board_title}
					</h3>
					<p className="text-xs text-slate-500 flex items-center gap-1">
						<svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
						</svg>
						{!isLoading && (
							<>
								{cards.length}{' '}
								{parseInt(cards.length, 10) !== 1 ? 'cards' : 'card'}
							</>
						)}
					</p>
				</div>
			</div>
		</div>
	);
}
