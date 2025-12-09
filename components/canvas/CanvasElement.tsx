'use client';

import type { Card, ConnectionSide, LineCard } from '@/lib/types';
import type { Editor } from '@tiptap/react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useDraggable } from '@/lib/hooks/useDraggable';
import { CardRenderer } from './cards/CardRenderer';
import { useResizable } from '@/lib/hooks/useResizable';
import { getDefaultCardDimensions } from '@/lib/utils';
import { ConnectionHandles } from './ConnectionHandle';
import { useCallback } from 'react';
import { useBoardCards } from '@/lib/hooks/cards';

interface CanvasElementProps {
	card: Card;
	boardId?: string | null;
	onCardClick?: (cardId: string) => void;
	onCardDoubleClick?: (cardId: string) => void;
	onContextMenu?: (e: React.MouseEvent, card: Card) => void;
	onEditorReady?: (cardId: string, editor: Editor) => void;
	isInsideColumn?: boolean; // NEW: indicates if rendered inside a column
	isReadOnly?: boolean; // NEW: indicates if this is read-only (public view)
}

function orderKeyToZIndex(orderKey: string): number {
	let hash = 0;
	for (let i = 0; i < orderKey.length; i++) {
		const char = orderKey.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32 bit int
	}

	return Math.abs(hash) % 100000;
}

export function useCardZIndex(card: Card, allCards: Map<string, Card>): number {
	const sortedCards = Array.from(allCards.values())
		.sort((a, b) => a.order_key < b.order_key ? -1 : a.order_key > b.order_key ? 1 : 0);

	const index = sortedCards.findIndex(c => c.id === card.id);

	return index >= 0 ? index : 0;
}

export function CanvasElement({
	card,
	boardId,
	onCardClick,
	onCardDoubleClick,
	onContextMenu,
	onEditorReady,
	isInsideColumn = false, // Default to false for backwards compatibility
	isReadOnly = false // Default to false for backwards compatibility
}: CanvasElementProps) {
	const {
		selectedCardIds,
		setEditingCardId,
		editingCardId,
		snapToGrid,
		isConnectionMode,
		isDraggingLineEndpoint,
		pendingConnection,
		startConnection,
		completeConnection,
	} = useCanvasStore();
	const { cards: allCards } = useBoardCards(boardId);
	
	const isSelected = selectedCardIds.has(card.id);
	const isEditing = editingCardId === card.id;
	const { canResize } = getDefaultCardDimensions(card.card_type);

	const cssZIndex = useCardZIndex(card, allCards);

	// Only enable dragging/resizing if NOT inside a column
	const { handleMouseDown, isDragging, currentPosition } = useDraggable({
		card: card,
		snapToGrid: snapToGrid,
		dragThreshold: 3
	});

	const { handleMouseDown: handleMouseDownResizable, isResizing, currentDimensions } = useResizable({
		card: card,
		maxWidth: 1200,
		maxHeight: 1200,
	});

	// Combine current position from drag with current dimensions from resize
	const finalPosition = {
		x: currentPosition.x,
		y: currentPosition.y,
	};
	const finalDimensions = {
		width: currentDimensions.width,
		height: currentDimensions.height,
	};

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		// Disable interactions in read-only mode
		if (isReadOnly) return;

		const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

		if (isMultiSelect) return;

		onCardClick?.(card.id);
	};

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		// Disable editing in read-only mode
		if (isReadOnly) return;

		setEditingCardId(card.id);
		onCardDoubleClick?.(card.id);
	};

	const handleCardMouseDown = (e: React.MouseEvent) => {
		// Disable dragging in read-only mode
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

		// Allow dragging even from inside column
		// The useDraggable hook will handle extracting it from the column
		handleMouseDown(e);
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();

		// Disable context menu in read-only mode
		if (isReadOnly) return;

		onContextMenu?.(e, card);
	}

	const handleEditorReady = (editor: Editor) => {
		if (onEditorReady) {
			onEditorReady(card.id, editor);
		}
	};

	// Connection handling
	const handleStartConnection = useCallback((cardId: string, side: ConnectionSide, offset: number) => {
		startConnection(cardId, side, offset);
	}, [startConnection]);

	const handleCompleteConnection = useCallback((cardId: string, side: ConnectionSide, offset: number) => {
		if (pendingConnection) {
			completeConnection(cardId, side, offset);
		} else {
			startConnection(cardId, side, offset);
		}
	}, [pendingConnection, completeConnection, startConnection]);

	// Different styling for in-column vs canvas rendering
	if (isInsideColumn) {
		// In-column: use relative positioning, no absolute positioning
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
					MozUserSelect: isEditing ? 'auto' : 'none',
					msUserSelect: isEditing ? 'auto' : 'none',
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
					onMouseDown={handleMouseDown}
					style={{
						width: '100%',
						height: card.height || 'auto',
						minHeight: card.height ? card.height : 'auto',
						userSelect: isEditing ? 'auto' : 'none',
						WebkitUserSelect: isEditing ? 'auto' : 'none',
						cursor: isEditing ? 'auto' : 'pointer',
						position: 'relative'
					}}
				>
					{/* Render the actual card content */}
					<CardRenderer
						card={card}
						isEditing={isEditing}
						isPublicView={isReadOnly}
						onEditorReady={handleEditorReady}
					/>
					
					{/* Selection indicator */}
					{isSelected && (
						<div className="selection-outline" />
					)}

					{/* No resize handle for cards in columns */}
				</div>
			</div>
		);
	}

	// Normal canvas rendering: absolute positioning
	return (
		<div
			data-element-id={card.id}
			data-card="true"
			className="canvas-element select-none"
			style={{
				position: 'absolute',
				top: finalPosition.y,
				left: finalPosition.x,
				zIndex: cssZIndex,
				userSelect: isEditing ? 'auto' : 'none',
				WebkitUserSelect: isEditing ? 'auto' : 'none',
				MozUserSelect: isEditing ? 'auto' : 'none',
				msUserSelect: isEditing ? 'auto' : 'none',
			}}
		>
			<div
				className="element"
				data-element-id={card.id}
				draggable={false}
			>
				<div
					className={`
						card drag-handle group
						${isSelected ? 'selected' : ''}
						${isEditing ? 'editing' : ''}
						${selectedCardIds.size === 1 && isSelected ? 'selected-single' : ''}
					`}
					onMouseDown={handleCardMouseDown}
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					onContextMenu={handleContextMenu}
					style={{
						display: 'block',
						// Line cards need no width/height constraint - they render their own SVG
						width: card.card_type === 'line' ? 0 : finalDimensions.width,
						height: card.card_type === 'line' ? 0 : (finalDimensions.height || 'auto'),
						minHeight: card.card_type === 'line' ? 0 : (finalDimensions.height ? finalDimensions.height : 'auto'),
						overflow: card.card_type === 'line' ? 'visible' : undefined,
						userSelect: isEditing ? 'auto' : 'none',
						WebkitUserSelect: isEditing ? 'auto' : 'none',
						cursor: isEditing ? 'auto' : (isConnectionMode ? 'crosshair' : 'pointer'),
						pointerEvents: isEditing || !isDragging ? 'auto' : 'none',
						position: 'relative'
					}}
				>
					{/* Render the actual card content based on type */}
					<CardRenderer
						card={card}
						isEditing={isEditing}
						isSelected={isSelected}
						isPublicView={isReadOnly}
						onEditorReady={handleEditorReady}
						boardId={boardId}
					/>

					{/* Selection indicator - not for line cards (they have their own) */}
					{isSelected && card.card_type !== 'line' && (
						<div className="selection-outline" />
					)}

					{/* Connection Handles - Show in connection mode or when dragging line endpoint (not for lines) */}
					{card.card_type !== 'line' && (
						<ConnectionHandles
							cardId={card.id}
							isConnectionMode={isConnectionMode || !!pendingConnection || isDraggingLineEndpoint}
							hasPendingConnection={!!pendingConnection}
							pendingSourceCardId={pendingConnection?.fromCardId}
							pendingSourceSide={pendingConnection?.fromSide}
							onStartConnection={handleStartConnection}
							onCompleteConnection={handleCompleteConnection}
						/>
					)}

					{/* Resize Handle - Only show when selected and editing */}
					{canResize && isSelected && !isEditing && (
						<div
							aria-label="Resize South-East"
							onMouseDown={(e) => handleMouseDownResizable(e, 'se')}
							className="resize-handle resize-handle-se"
							style={{
								position: 'absolute',
								right: -4,
								bottom: -4,
								width: 8,
								height: 8,
								cursor: 'se-resize',
								zIndex: cssZIndex + 1,
								backgroundColor: '#3B82F6',
								border: '1px solid white',
								borderRadius: '50%',
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}