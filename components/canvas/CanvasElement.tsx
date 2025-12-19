/**
 * CanvasElement Component - Simplified Positioning Layer
 *
 * This component handles ONLY:
 * - Absolute positioning on canvas (position_x, position_y)
 * - Z-index calculation from order_key
 * - Drag handling via useDraggable
 * - Click/double-click/context menu event delegation
 *
 * All other concerns (selection outline, resize handles, connection handles)
 * are delegated to CardFrame.
 */

'use client';

import { useCallback, memo, useState } from 'react';
import type { Card, CardData, LineCard } from '@/lib/types';
import type { Editor } from '@tiptap/react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CardRenderer } from './cards/CardRenderer';
import { CardProvider } from './cards/CardContext';
import { CardFrame } from './cards/CardFrame';
import { useDraggable } from '@dnd-kit/core';

// ============================================================================
// TYPES
// ============================================================================

interface CanvasElementProps {
	card: Card;
	boardId?: string | null;
	allCards: Map<string, Card | CardData>;
	onCardClick?: (cardId: string, isMultiSelect?: boolean) => void;
	onCardDoubleClick?: (cardId: string) => void;
	onContextMenu?: (e: React.MouseEvent, card: Card) => void;
	onEditorReady?: (cardId: string, editor: Editor) => void;
	isInsideColumn?: boolean;
	isReadOnly?: boolean;
}

interface CardOptions {
	lastDoubleClick?: {
		clientX: number;
		clientY: number;
	};
};

// ============================================================================
// Z-INDEX CALCULATION
// ============================================================================

export function useCardZIndex(card: Card, allCards: Map<string, Card | CardData>): number {
	const sortedCards = Array.from(allCards.values())
		.sort((a, b) => a.order_key < b.order_key ? -1 : a.order_key > b.order_key ? 1 : 0);

	const index = sortedCards.findIndex(c => c.id === card.id);
	return index >= 0 ? index : 0;
}

// ============================================================================
// CANVAS ELEMENT
// ============================================================================

export const CanvasElement = memo(function CanvasElement({
	card,
	boardId,
	allCards,
	onCardClick,
	onCardDoubleClick,
	onContextMenu,
	onEditorReady,
	isInsideColumn = false,
	isReadOnly = false,
}: CanvasElementProps) {
	// Canvas store state
	const {
		selectedCardIds,
		setEditingCardId,
		editingCardId,
		snapToGrid,
		dragPositions,
	} = useCanvasStore();
	const [cardOptions, setCardOptions] = useState<CardOptions | null>(null);

	const isSelected = selectedCardIds.has(card.id);
	const isEditing = editingCardId === card.id;

	// Z-index calculation
	const cssZIndex = useCardZIndex(card, allCards);

	const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform} = useDraggable({
		id: card.id,
		data: {
			type: 'canvas-card',
		},
		disabled: isInsideColumn || isReadOnly || isEditing,
	});


	// Event handlers
	const handleClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (isReadOnly) return;

		const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

		// Call parent click handler with multi-select info
		onCardClick?.(card.id, isMultiSelect);
	}, [card.id, isReadOnly, onCardClick]);

	const handleDoubleClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (isReadOnly) return;

		setEditingCardId(card.id);
		onCardDoubleClick?.(card.id);
		setCardOptions({
			lastDoubleClick: {
				clientX: e.clientX,
				clientY: e.clientY,
			}
		});
	}, [card.id, isReadOnly, setEditingCardId, onCardDoubleClick]);

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		if (isReadOnly) return;

		onContextMenu?.(e, card);
	}, [card, isReadOnly, onContextMenu]);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		if (isReadOnly) {
			e.stopPropagation();
			return;
		}

		// If editing, don't interfere with text selection
		if (isEditing) {
			e.stopPropagation();
			return;
		}

		// For line cards, disable dragging if either endpoint is attached to a card
		if (card.card_type === 'line') {
			const lineCard = card as LineCard;
			if (lineCard.line_start_attached_card_id || lineCard.line_end_attached_card_id) {
				e.stopPropagation();
				return;
			}
		}

		// Allow dragging (even from inside column - useDraggable handles extraction)
	}, [card, isReadOnly, isEditing]);

	const handleEditorReady = useCallback((editor: Editor) => {
		onEditorReady?.(card.id, editor);
	}, [card.id, onEditorReady]);

	// ========================================================================
	// IN-COLUMN RENDERING
	// ========================================================================

	if (isInsideColumn) {
		return (
			<div
				data-element-id={card.id}
				data-card="true"
				data-in-column="true"
				className="canvas-element-in-column"
				style={{
					position: 'relative',
					width: '100%',
					userSelect: isEditing ? 'auto' : 'none',
					WebkitUserSelect: isEditing ? 'auto' : 'none',
				}}
			>
				<div
					className={`
						card
						${isSelected ? 'selected' : ''}
						${isEditing ? 'editing' : ''}
						${selectedCardIds.size === 1 && isSelected ? 'selected-single' : ''}
					`}
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					onContextMenu={handleContextMenu}
					style={{
						width: '100%',
						height: 'auto',
						userSelect: isEditing ? 'auto' : 'none',
						cursor: isEditing ? 'auto' : 'pointer',
						position: 'relative',
					}}
				>
					<CardProvider
						card={card}
						boardId={boardId || card.board_id}
						isSelected={isSelected}
						isReadOnly={isReadOnly}
						isInsideColumn={true}
						allCards={allCards}
					>
						<CardFrame
							card={card}
							isSelected={isSelected}
							isEditing={isEditing}
							isInsideColumn={true}
							isReadOnly={isReadOnly}
							cssZIndex={cssZIndex}
						>
							<CardRenderer
								card={card}
								boardId={boardId ?? null}
								isEditing={isEditing}
								isSelected={isSelected}
								isPublicView={isReadOnly}
								allCards={allCards}
								onEditorReady={handleEditorReady}
							/>
						</CardFrame>
					</CardProvider>
				</div>
			</div>
		);
	}

	// ========================================================================
	// CANVAS RENDERING (Absolute positioning)
	// ========================================================================

	// Check if this card has a drag position override (for multi-select)
	const dragPos = dragPositions.get(card.id);
	let displayX = card.position_x;
	let displayY = card.position_y;

	if (!isInsideColumn) {
		if (dragPos) {
			// Card is being dragged as part of multi-select
			displayX = dragPos.x;
			displayY = dragPos.y;
		} else if (transform) {
			// This is the active dragged card
			displayX = card.position_x + (transform.x ?? 0);
			displayY = card.position_y + (transform.y ?? 0);
		}
	}

	return (
		<div
			ref={setNodeRef}
			data-element-id={card.id}
			data-card="true"
			className="canvas-element select-none"
			style={{
				position: 'absolute',
				top: displayY,
				left: displayX,
				zIndex: cssZIndex,
				userSelect: isEditing ? 'auto' : 'none',
				WebkitUserSelect: isEditing ? 'auto' : 'none',
			}}
		>
			<div
				className="element"
				data-element-id={card.id}
				draggable={false}
			>
				<div
					ref={setActivatorNodeRef}
					className={`
						card drag-handle group
						${isSelected ? 'selected' : ''}
						${isEditing ? 'editing' : ''}
						${selectedCardIds.size === 1 && isSelected ? 'selected-single' : ''}
					`}
					{...listeners}
					{...attributes}
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					onContextMenu={handleContextMenu}
					style={{
						display: 'block',
						userSelect: isEditing ? 'auto' : 'none',
						cursor: isEditing ? 'auto' : 'pointer',
						pointerEvents: 'auto',
						position: 'relative',
					}}
				>
					<CardProvider
						card={card}
						boardId={boardId || card.board_id}
						isSelected={isSelected}
						isReadOnly={isReadOnly}
						isInsideColumn={false}
						allCards={allCards}
					>
						<CardFrame
							card={card}
							isSelected={isSelected}
							isEditing={isEditing}
							isInsideColumn={false}
							isReadOnly={isReadOnly}
							cssZIndex={cssZIndex}
						>
							<CardRenderer
								card={card}
								boardId={boardId ?? null}
								isEditing={isEditing}
								isSelected={isSelected}
								isPublicView={isReadOnly}
								allCards={allCards}
								onEditorReady={handleEditorReady}
								options={cardOptions}
							/>
						</CardFrame>
					</CardProvider>
				</div>
			</div>
		</div>
	);
});