/**
 * Column Card Component
 *
 * Uses CardContext for shared state and persistence.
 * Column cards contain other cards and support drag-and-drop reordering.
 */

'use client';

import { useMemo, useCallback } from 'react';
import type { ColumnCard, Card, CardData } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useOptionalCardContext } from './CardContext';
import { CanvasElement } from '../CanvasElement';
import { useBoardCards } from '@/lib/hooks/cards';
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableColumnItem } from './SortableColumnItem';

// ============================================================================
// PROPS INTERFACE (for legacy compatibility with CardRenderer)
// ============================================================================

interface ColumnCardComponentProps {
	card: ColumnCard;
	isEditing: boolean;
	isSelected?: boolean;
	allCards?: Map<string, Card | CardData>;
	onEditorReady?: (cardId: string, editor: any) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ColumnCardComponent({
	card: propCard,
	isEditing: propIsEditing,
	isSelected: propIsSelected,
	allCards: allCardsProp,
	onEditorReady
}: ColumnCardComponentProps) {
	// Try to use context, fall back to props for backwards compatibility
	const context = useOptionalCardContext();

	// Use context values if available, otherwise use props
	const card = (context?.card as ColumnCard) ?? propCard;
	const isEditing = context?.isEditing ?? propIsEditing;
	const isSelected = context?.isSelected ?? propIsSelected;
	const { saveContent, saveContentImmediate } = context ?? {
		saveContent: () => {},
		saveContentImmediate: async () => {},
	};

	// Canvas store
	const {
		potentialColumnTarget,
		selectCard,
		setEditingCardId,
		setDragPreview,
		viewport
	} = useCanvasStore();

	// Use cards passed from parent, or fallback to fetching
	const { cards: cardsArray } = useBoardCards(allCardsProp ? null : card.board_id);
	const cards = useMemo(
		() => allCardsProp || new Map(cardsArray.map(c => [c.id, c])),
		[allCardsProp, cardsArray]
	);

	const isDropTarget = potentialColumnTarget === card.id;

	// Event handlers
	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ column_title: e.target.value });
	}, [saveContent]);

	const handleRemoveCard = useCallback(async (cardId: string) => {
		const updatedItems = (card.column_items || [])
			.filter(item => item.card_id !== cardId)
			.map((item, index) => ({ ...item, position: index }));

		saveContentImmediate({ column_items: updatedItems });
	}, [card.column_items, saveContentImmediate]);

	const handleCardClick = useCallback((cardId: string) => {
		selectCard(cardId);
	}, [selectCard]);

	const handleCardDoubleClick = useCallback((cardId: string) => {
		setEditingCardId(cardId);
	}, [setEditingCardId]);

	const handleCardContextMenu = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
	}, []);

	// Get cards that belong to this column
	const columnItems = ([...card.column_items || []])
		.sort((a, b) => a.position - b.position)
		.map(item => cards.get(item.card_id))
		.filter(c => c !== undefined);

	const itemCount = columnItems.length;

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div
			className={`
				column-card-container
				flex flex-col
				overflow-hidden
				transition-all duration-200
				w-full h-full
				bg-[#1a1f2e]/95 backdrop-blur-sm shadow-lg
				rounded-xl
				${isDropTarget
					? 'ring-2 ring-cyan-400/40 ring-offset-0 shadow-2xl shadow-cyan-500/10'
					: isEditing
						? 'ring-1 ring-cyan-400/30'
						: 'ring-1 ring-white/5 hover:ring-white/10 hover:shadow-xl'
				}
			`}
		>
			{/* Header */}
			<div className={`
				column-header relative
				flex flex-col items-center
				px-6 py-4
				border-b
				flex-shrink-0
				${isDropTarget
					? 'border-cyan-400/20 bg-gradient-to-b from-cyan-500/5 to-transparent'
					: 'border-white/5'
				}
			`}>
				{/* Center content */}
				<div className="flex flex-col items-center gap-1.5 w-full px-12">
					{/* Title */}
					{isEditing ? (
						<input
							type="text"
							value={card.column_title}
							onChange={handleTitleChange}
							className="w-full px-3 py-1.5 text-sm font-semibold text-center bg-white/5 text-white border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent outline-none transition-all"
							placeholder="Column title"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<h3 className="text-sm font-semibold text-white text-center truncate w-full">
							{card.column_title}
						</h3>
					)}

					{/* Card count badge */}
					<div className={`
						px-2.5 py-0.5 rounded-full text-[11px] font-medium
						transition-all
						${isDropTarget
							? 'bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30'
							: 'bg-white/5 text-slate-400'
						}
					`}>
						{itemCount} {itemCount === 1 ? 'card' : 'cards'}
					</div>
				</div>
			</div>

			{/* Body */}
			<div
				className="column-body flex-1 overflow-y-auto p-4 relative"
			>
					{columnItems.length === 0 ? (
						/* Empty state */
						<div className={`
							flex flex-col items-center justify-center
							min-h-[240px]
							border-2 border-dashed rounded-xl
							transition-all duration-300
							${isDropTarget
								? 'border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5'
								: 'border-white/10 bg-transparent'
							}
						`}>
							<div className={`
								w-14 h-14 rounded-2xl flex items-center justify-center mb-3
								transition-all duration-300
								${isDropTarget
									? 'bg-cyan-500/15 text-cyan-300 scale-110 shadow-lg shadow-cyan-500/20'
									: 'bg-white/5 text-slate-500'
								}
							`}>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<p className={`
								text-sm font-medium transition-all duration-300
								${isDropTarget
									? 'text-cyan-300'
									: 'text-slate-500'
								}
							`}>
								{isDropTarget ? 'Drop cards here' : 'Drag cards here'}
							</p>
						</div>
					) : (
						/* Render cards inside column */
						<SortableContext
							id={card.id}
							items={columnItems.map(c => c.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="column-cards-list space-y-3">
								{columnItems.map((itemCard, index) => (
									<SortableColumnItem
										key={itemCard.id}
										card={itemCard as unknown as Card}
										columnId={card.id}
										index={index}
										boardId={card.board_id}
										allCards={cards}
										onCardClick={handleCardClick}
										onCardDoubleClick={handleCardDoubleClick}
										onContextMenu={handleCardContextMenu}
										onEditorReady={onEditorReady}
									/>
								))}
							</div>
						</SortableContext>
					)}
				</div>
			</div>
	);
}
