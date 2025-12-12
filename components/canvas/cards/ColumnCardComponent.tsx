/**
 * Column Card Component
 *
 * Uses CardContext for shared state and persistence.
 * Column cards contain other cards and support drag-and-drop reordering.
 */

'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import type { ColumnCard, Card, CardData } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useOptionalCardContext } from './CardContext';
import { CanvasElement } from '../CanvasElement';
import { useBoardCards } from '@/lib/hooks/cards';

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
	const { saveContent } = context ?? {
		saveContent: () => {},
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

	const [isCollapsed, setIsCollapsed] = useState(card.column_is_collapsed || false);
	const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [cardHoverId, setCardHoverId] = useState<string | null>(null);

	const draggedCardRef = useRef<Card | null>(null);
	const dragStartIndexRef = useRef<number | null>(null);
	const columnListRef = useRef<HTMLDivElement>(null);
	const dragOverIndexRef = useRef<number | null>(null);

	const isDropTarget = potentialColumnTarget === card.id;

	// Event handlers
	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ column_title: e.target.value });
	}, [saveContent]);

	const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ column_background_color: e.target.value });
	}, [saveContent]);

	const handleToggleCollapse = useCallback(() => {
		const newCollapsed = !isCollapsed;
		setIsCollapsed(newCollapsed);
		saveContent({ column_is_collapsed: newCollapsed });
	}, [isCollapsed, saveContent]);

	const handleRemoveCard = useCallback(async (cardId: string) => {
		const updatedItems = (card.column_items || [])
			.filter(item => item.card_id !== cardId)
			.map((item, index) => ({ ...item, position: index }));

		saveContent({ column_items: updatedItems });
	}, [card.column_items, saveContent]);

	const handleCardClick = useCallback((cardId: string) => {
		if (!draggedCardId) {
			selectCard(cardId);
		}
	}, [draggedCardId, selectCard]);

	const handleCardDoubleClick = useCallback((cardId: string) => {
		if (!draggedCardId) {
			setEditingCardId(cardId);
		}
	}, [draggedCardId, setEditingCardId]);

	const handleCardContextMenu = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
	}, []);

	/**
	 * Handle card drag start - for REORDERING within column
	 */
	const handleCardDragStart = useCallback((e: React.MouseEvent, itemCard: Card, index: number) => {
		e.preventDefault();
		e.stopPropagation();

		dragStartIndexRef.current = index;
		draggedCardRef.current = itemCard;
		setDraggedCardId(itemCard.id);

		const handleMouseMove = (me: MouseEvent) => {
			if (columnListRef.current) {
				const columnRect = columnListRef.current.getBoundingClientRect();
				const isOverColumn =
					me.clientX >= columnRect.left &&
					me.clientX <= columnRect.right &&
					me.clientY >= columnRect.top &&
					me.clientY <= columnRect.bottom;

				if (isOverColumn) {
					const items = Array.from(columnListRef.current.querySelectorAll('.column-card-wrapper'));
					let newDragOverIndex: number | null = null;

					for (let i = 0; i < items.length; i++) {
						const item = items[i] as HTMLElement;
						const rect = item.getBoundingClientRect();
						const midpoint = rect.top + rect.height / 2;

						if (me.clientY < midpoint) {
							newDragOverIndex = i;
							break;
						}
					}

					if (newDragOverIndex === null) {
						newDragOverIndex = items.length;
					}

					setDragOverIndex(newDragOverIndex);
					dragOverIndexRef.current = newDragOverIndex;

					const canvas = document.querySelector("div.canvas-viewport");
					if (!canvas) return;

					const rect = canvas.getBoundingClientRect();
					const clientX = me.clientX - rect.left;
					const clientY = me.clientY - rect.top;
					const canvasX = (clientX - viewport.x) / viewport.zoom;
					const canvasY = (clientY - viewport.y) / viewport.zoom;

					setDragPreview({
						cardType: itemCard.card_type,
						canvasX,
						canvasY
					});
				} else {
					setDragOverIndex(null);
					dragOverIndexRef.current = null;
				}
			}
		};

		const handleMouseUp = () => {
			setDragPreview(null);
			const endIndex = dragOverIndexRef.current;

			if (endIndex !== null && dragStartIndexRef.current !== null && draggedCardRef.current) {
				const startIndex = dragStartIndexRef.current;

				if (startIndex !== endIndex) {
					const items = [...(card.column_items || [])];
					const [movedItem] = items.splice(startIndex, 1);
					const insertIndex = endIndex > startIndex ? endIndex - 1 : endIndex;
					items.splice(insertIndex, 0, movedItem);

					const updatedItems = items.map((item, index) => ({
						...item,
						position: index
					}));

					saveContent({ column_items: updatedItems });
				}
			}

			setDraggedCardId(null);
			setDragOverIndex(null);
			draggedCardRef.current = null;
			dragStartIndexRef.current = null;
			dragOverIndexRef.current = null;

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, [card.column_items, saveContent, setDragPreview, viewport]);

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
				border
				overflow-hidden
				transition-all duration-200
				w-full h-full
				bg-[#1e293b]/90 backdrop-blur-xl shadow-xl
				rounded-lg
				${isDropTarget
					? 'border-cyan-400 ring-4 ring-cyan-200 ring-opacity-50'
					: isEditing
						? 'border-cyan-400 hover:border-cyan-500/50'
						: 'border-white/10 hover:border-cyan-500/50'
				}
			`}
		>
			{/* Header */}
			<div className={`
				column-header
				flex items-center gap-2
				px-3 py-2.5
				border-b
				flex-shrink-0
				${isDropTarget ? 'border-cyan-300/50 bg-cyan-100/10' : 'border-white/5 bg-white/5'}
			`}>
				{/* Collapse Button */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						handleToggleCollapse();
					}}
					className={`
						w-6 h-6 flex items-center justify-center
						rounded transition-all flex-shrink-0
						${isDropTarget
							? 'text-cyan-400 hover:bg-cyan-200/20'
							: 'text-slate-400 hover:bg-white/10 hover:text-white'
						}
					`}
					title={isCollapsed ? "Expand column" : "Collapse column"}
				>
					<svg
						className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
					</svg>
				</button>

				{/* Color indicator dot */}
				<div
					className="w-2 h-2 rounded-full flex-shrink-0"
					style={{ backgroundColor: card.column_background_color }}
				/>

				{/* Title */}
				<div className="flex-1 min-w-0">
					{isEditing ? (
						<input
							type="text"
							value={card.column_title}
							onChange={handleTitleChange}
							className="w-full px-2 py-1 text-sm font-medium bg-slate-700/50 text-white border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
							placeholder="Column title"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<h3 className="text-sm font-bold text-white truncate">
							{card.column_title}
						</h3>
					)}
				</div>

				{/* Card count badge */}
				<div className={`
					px-2 py-0.5 rounded-full text-[10px] font-mono flex-shrink-0
					${isDropTarget
						? 'bg-cyan-500/20 text-cyan-300'
						: 'bg-slate-700/50 text-slate-400'
					}
				`}>
					{itemCount}
				</div>

				{/* Color picker (only in edit mode) */}
				{isEditing && (
					<input
						type="color"
						value={card.column_background_color}
						onChange={handleColorChange}
						className="w-6 h-6 rounded cursor-pointer flex-shrink-0"
						title="Change column color"
						onClick={(e) => e.stopPropagation()}
					/>
				)}
			</div>

			{/* Body */}
			{!isCollapsed && (
				<div
					ref={columnListRef}
					className="column-body flex-1 overflow-y-auto p-3 relative"
				>
					{columnItems.length === 0 ? (
						/* Empty state */
						<div className={`
							flex flex-col items-center justify-center
							min-h-[200px]
							border-2 border-dashed rounded-lg
							transition-all duration-200
							${isDropTarget
								? 'border-cyan-400 bg-cyan-500/10'
								: 'border-slate-700 bg-slate-800/30'
							}
						`}>
							<div className={`
								w-12 h-12 rounded-full flex items-center justify-center mb-3
								transition-all duration-200
								${isDropTarget
									? 'bg-cyan-500/20 text-cyan-400 scale-110'
									: 'bg-slate-700/50 text-slate-500'
								}
							`}>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<p className={`
								text-sm font-medium transition-all duration-200
								${isDropTarget
									? 'text-cyan-400'
									: 'text-slate-500'
								}
							`}>
								{isDropTarget ? 'Drop cards here' : 'Drag cards here'}
							</p>
						</div>
					) : (
						/* Render cards inside column */
						<div className="column-cards-list space-y-2">
							{columnItems.map((itemCard, index) => (
								<div key={itemCard.id}>
									{/* Insertion line indicator */}
									{dragOverIndex === index && draggedCardId !== itemCard.id && (
										<div className="h-0.5 bg-cyan-500 rounded mb-2 shadow-lg animate-pulse" />
									)}

									<div
										className={`
											column-card-wrapper relative
											transition-opacity duration-150
											${draggedCardId === itemCard.id ? 'opacity-30' : 'opacity-100'}
										`}
										style={{ width: '100%' }}
										onMouseDown={(e) => {
											if (!isEditing) {
												handleCardDragStart(e, itemCard as unknown as Card, index);
											}
										}}
										onMouseEnter={() => setCardHoverId(itemCard.id)}
										onMouseLeave={() => {
											if (cardHoverId === itemCard.id) {
												setCardHoverId(null);
											}
										}}
									>
										{/* Drag handle indicator */}
										{!isEditing && (
											<div className={`absolute left-1 top-1/2 -translate-y-1/2 ${cardHoverId === itemCard.id ? "hover:opacity-60" : "opacity-0"} transition-opacity cursor-move z-10`}>
												<svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
													<path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
												</svg>
											</div>
										)}

										{/* Remove button (only in edit mode) */}
										{isEditing && (
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveCard(itemCard.id);
												}}
												className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md transition-colors"
												title="Remove from column"
											>
												×
											</button>
										)}

										{/* Render the actual card */}
										<CanvasElement
											card={itemCard as unknown as Card}
											boardId={card.board_id}
											allCards={cards}
											onCardClick={handleCardClick}
											onCardDoubleClick={handleCardDoubleClick}
											onContextMenu={handleCardContextMenu}
											onEditorReady={onEditorReady}
											isInsideColumn={true}
										/>
									</div>
								</div>
							))}

							{/* Drop at end indicator */}
							{dragOverIndex === columnItems.length && (
								<div className="h-0.5 bg-cyan-500 rounded shadow-lg animate-pulse" />
							)}
						</div>
					)}
				</div>
			)}

			{/* Collapsed State */}
			{isCollapsed && (
				<div className="px-3 py-2 text-center border-t border-white/5 bg-white/5">
					<p className="text-xs text-slate-400">
						{itemCount} {itemCount === 1 ? 'card' : 'cards'}
					</p>
				</div>
			)}
		</div>
	);
}
