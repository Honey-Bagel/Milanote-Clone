/**
 * Column Card Component
 *
 * Uses CardContext for shared state and persistence.
 * Column cards contain other cards and support drag-and-drop reordering.
 */

'use client';

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import type { ColumnCard, Card, CardData } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useOptionalCardContext } from './CardContext';
import { CanvasElement } from '../CanvasElement';
import { useBoardCards } from '@/lib/hooks/cards';
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableColumnItem } from './SortableColumnItem';
import { useDroppable } from '@dnd-kit/core';

// ============================================================================
// PROPS INTERFACE (for legacy compatibility with CardRenderer)
// ============================================================================

interface ColumnCardComponentProps {
	card: ColumnCard;
	isEditing: boolean;
	isSelected?: boolean;
	allCards?: Map<string, Card | CardData>;
	onEditorReady?: (cardId: string, editor: any) => void;
	onContextMenu?: (e: React.MouseEvent, card: Card) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ColumnCardComponent({
	card: propCard,
	isEditing: propIsEditing,
	isSelected: propIsSelected,
	allCards: allCardsProp,
	onEditorReady,
	onContextMenu: onContextMenuProp
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
	const [localTitle, setLocalTitle] = useState(card.column_title || '');

	const { setNodeRef, over, active } = useDroppable({
		id: card.id,
		data: {
			type: 'column',
			columnId: card.id,
			accepts: ['canvas-card', 'column-card'],
		},
	});

	// Canvas store
	const {
		potentialColumnTarget,
		selectCard,
		setEditingCardId,
		setDragPreview,
		viewport,
		columnInsertionIndexTarget
	} = useCanvasStore();

	// Use cards passed from parent, or fallback to fetching
	const { cards: cardsArray } = useBoardCards(allCardsProp ? null : card.board_id);
	const cards = useMemo(
		() => allCardsProp || new Map(cardsArray.map(c => [c.id, c])),
		[allCardsProp, cardsArray]
	);

	const isOverThisColumn = useMemo(() => {
		if (!over) return false;

		const meta = over.data?.current;

		if (meta?.type === 'column') {
			const overColumnId = meta.columnId ?? String(over.id);
			return overColumnId === card.id;
		}

		if (meta?.type === 'column-card') {
			const overColumnId = meta.columnId ?? String(meta.parentColumnId);
			return overColumnId === card.id;
		}

		return false;
	}, [over, card.id]);

	const isActiveFromThisColumn = useMemo(() => {
		if (!active) return false;

		const meta = active.data?.current;

		if (meta?.type === 'column-card') {
			return active.data?.current?.columnId === card.id;
		}

		return false;
	}, [active, card.id]);

	const isAllowedInColumn = useMemo(() => {
		if (!active) return false;

		const meta = active.data?.current;

		const cardType = meta?.card?.card_type;

		if (!cardType) return false;
		const NOT_ALLOWED_TYPES = ["column", "line"];

		return !NOT_ALLOWED_TYPES.includes(cardType);
	}, [active]);

	// Event handlers
	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		setLocalTitle(newTitle);

		saveContent({ column_title: newTitle });
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

	const handleCardContextMenu = useCallback((e: React.MouseEvent, card: Card) => {
		e.stopPropagation();
		onContextMenuProp?.(e, card);
	}, [onContextMenuProp]);

	// Get cards that belong to this column
	const columnItems = ([...card.column_items || []])
		.sort((a, b) => a.position - b.position)
		.map(item => cards.get(item.card_id))
		.filter(c => c !== undefined);

	const itemCount = columnItems.length;

	const showInsertionLines = isOverThisColumn && !isActiveFromThisColumn && isAllowedInColumn;

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className={`
				column-card-container
				flex flex-col
				overflow-hidden
				transition-all duration-200
				w-auto h-auto
				bg-[#1a1f2e]/95 backdrop-blur-sm shadow-lg
			`}
		>
			{/* Header */}
			<div className={`
					column-header relative
					flex flex-col items-center
					px-6 py-4
					flex-shrink-0
				`}>
					<div className="flex flex-col items-center w-full px-12">
						{/* Title */}
						{isEditing ? (
							<input
								type="text"
								value={localTitle}
								onChange={handleTitleChange}
								className="w-full px-3 py-1.5 text-sm font-semibold text-center bg-white/5 text-white border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent outline-none transition-all"
								placeholder="Column Title"
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
							transition-all bg-white/5 text-secondary-foreground
						`}>
							{itemCount} {itemCount === 1 ? 'card' : 'cards'}
						</div>
					</div>
			</div>

			{/* Body */}
			<div ref={setNodeRef} className="column-body flex flex-col p-2 relative justify-center">
				{columnItems.length === 0 ? (
					/* Empty State */
					<div className={`
							flex flex-col items-center justify-center
							min-h-[75px]
							border-0.5 border
							transition-all duration-300
							bg-white/5
						`}
					>
					</div>
				) : (
					/* Render cards inside column */
					<SortableContext
						id={card.id}
						items={columnItems.map(c => c.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="column-cards-list space-y-3 w-full relative">
							{columnItems.map((itemCard, index) => (
								<div key={itemCard.id} className="relative">
									{showInsertionLines && columnInsertionIndexTarget === index ? <DropLineOverlay /> : null}
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
								</div>
							))}
						</div>
					</SortableContext>
				)}
				{showInsertionLines && columnInsertionIndexTarget === columnItems.length ? (
					<div className="pointer-events-none absolute left-2 right-2 -bottom-1.75 h-3">
						<div className="drop-line-overlay h-[1px] bg-white/60" />
					</div>
				) : null}
			</div>
		</div>
	)
}

function DropLineOverlay() {
	return (
		<div className="pointer-events-none absolute left-0 right-0 -top-3 h-3">
			<div className="drop-line-overlay absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/60" />
		</div>
	)
}
