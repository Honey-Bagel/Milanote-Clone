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
import { useBoardStore } from '@/lib/stores/board-store';
import { CardRenderer } from './cards/CardRenderer';
import { CardProvider } from './cards/CardContext';
import { CardFrame } from './cards/CardFrame';
import { useDraggable } from '@dnd-kit/core';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a card is inside a column
 */
function isCardInAnyColumn(cardId: string, allCards: Map<string, Card | CardData>): boolean {
	for (const c of allCards.values()) {
		if (c.card_type === 'column') {
			const items = (c as any).column_items as any[] | undefined;
			if (items?.some(item => item.card_id === cardId)) return true;
		}
	}
	return false;
}

function hasBlockedAttachments(lineCard: LineCard, allCards: Map<string, Card | CardData>): boolean {
	const attachedIds = [
		lineCard.line_start_attached_card_id,
		lineCard.line_end_attached_card_id,
	].filter(Boolean) as string[];

	for (const attachedId of attachedIds) {
		const attachedCard = allCards.get(attachedId);
		if (!attachedCard) continue;

		const cannotMove = attachedCard.is_position_locked || isCardInAnyColumn(attachedId, allCards);
		if (cannotMove) {
			return true;
		}
	}
	return false;
}

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
	compactBoardCards?: boolean;
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
		.sort((a, b) => a.order_key < b.order_key ? -1 : a.order_key > b.order_key ? 1
			: 0);

	const index = sortedCards.findIndex(c => c.id === card.id);
	const baseZIndex = index >= 0 ? index : 0;

	if (card.card_type === 'line') {
		return baseZIndex + 10000;
	}

	return baseZIndex;
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
	compactBoardCards = false,
}: CanvasElementProps) {
	// Canvas store state
	const {
		selectedCardIds,
		setEditingCardId,
		editingCardId,
		snapToGrid,
		dragPositions,
		isDraggingLineEndpoint,
		interactionMode,
		setInteractionMode,
		presentationMode,
		activeDragCardId,
	} = useCanvasStore();
	const { presentationSidebarOpen } = useBoardStore();
	const [cardOptions, setCardOptions] = useState<CardOptions | null>(null);

	const isSelected = selectedCardIds.has(card.id);
	const isEditing = editingCardId === card.id;

	// Check if presentation node should be non-interactive (when hidden)
	const isPresentationNodeHidden =
		card.card_type === 'presentation_node' &&
		(!presentationSidebarOpen || presentationMode.isActive);

	// Check if this drawing card is being edited in drawing mode
	const isBeingEditedInDrawingMode =
		card.card_type === 'drawing' &&
		interactionMode.mode === 'drawing' &&
		interactionMode.editingCardId === card.id;

	// Z-index calculation
	const cssZIndex = useCardZIndex(card, allCards);

	const isLineWithBlockedAttachments =
		card.card_type === "line" && hasBlockedAttachments(card as LineCard, allCards);

	const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform } = useDraggable({
		id: card.id,
		data: {
			type: 'canvas-card',
			card_type: card.card_type
		},
		disabled: isInsideColumn || isReadOnly || isEditing || isDraggingLineEndpoint || card.is_position_locked || isLineWithBlockedAttachments || isPresentationNodeHidden,
	});

	// Event handlers
	const handleClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (isReadOnly || isPresentationNodeHidden) return;

		const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

		// Call parent click handler with multi-select info
		onCardClick?.(card.id, isMultiSelect);
	}, [card.id, isReadOnly, isPresentationNodeHidden, onCardClick]);

	const handleDoubleClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (isReadOnly || isPresentationNodeHidden) return;

		// If this is a drawing card, enter drawing mode instead of text editing
		if (card.card_type === 'drawing') {
			setInteractionMode({
				mode: 'drawing',
				editingCardId: card.id,
			});
			return;
		}

		setEditingCardId(card.id);
		onCardDoubleClick?.(card.id);
		setCardOptions({
			lastDoubleClick: {
				clientX: e.clientX,
				clientY: e.clientY,
			}
		});
	}, [card.id, card.card_type, isReadOnly, setEditingCardId, setInteractionMode, onCardDoubleClick, isPresentationNodeHidden]);

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		if (isReadOnly || isPresentationNodeHidden) return;

		onContextMenu?.(e, card);
	}, [card, isReadOnly, isPresentationNodeHidden, onContextMenu]);

	const handleEditorReady = useCallback((editor: Editor) => {
		onEditorReady?.(card.id, editor);
	}, [card.id, onEditorReady]);

	// Hide drawing cards when being edited in drawing mode
	if (isBeingEditedInDrawingMode) {
		return null;
	}

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
							compactBoardCards={compactBoardCards}
						>
							<CardRenderer
								card={card}
								boardId={boardId ?? null}
								isEditing={isEditing}
								isSelected={isSelected}
								isPublicView={isReadOnly}
								allCards={allCards}
								onEditorReady={handleEditorReady}
								onContextMenu={onContextMenu}
								options={{}}
								compactBoardCards={compactBoardCards}
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

	// Hide only the actively dragged card (DragOverlay shows the preview above toolbars)
	// Multi-select companion cards (in dragPositions but not actively dragged) remain visible
	// We use the store's activeDragCardId as the single source of truth instead of dnd-kit's isDragging
	// This prevents race conditions when rapidly dragging cards in succession
	const shouldHideForDragOverlay = activeDragCardId === card.id;

	return (
		<div
			ref={setNodeRef}
			data-element-id={card.id}
			data-card="true"
			className="canvas-element card-appear select-none"
			style={{
				position: 'absolute',
				top: displayY,
				left: displayX,
				zIndex: cssZIndex,
				userSelect: isEditing ? 'auto' : 'none',
				WebkitUserSelect: isEditing ? 'auto' : 'none',
				visibility: shouldHideForDragOverlay ? 'hidden' : 'visible',
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
						pointerEvents: isPresentationNodeHidden ? 'none' : 'auto',
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
							compactBoardCards={compactBoardCards}
						>
							<CardRenderer
								card={card}
								boardId={boardId ?? null}
								isEditing={isEditing}
								isSelected={isSelected}
								isPublicView={isReadOnly}
								allCards={allCards}
								onEditorReady={handleEditorReady}
								onContextMenu={onContextMenu}
								options={cardOptions}
								compactBoardCards={compactBoardCards}
							/>
						</CardFrame>
					</CardProvider>
				</div>
			</div>
		</div>
	);
});