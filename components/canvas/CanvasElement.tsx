/**
 * CanvasElement Component
 * 
 * Wrapper for each card, adapted to your database schema
 */

'use client';

import type { Card } from '@/lib/types';
import type { Editor } from '@tiptap/react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useDraggable } from '@/lib/hooks/useDraggable';
import { CardRenderer } from './cards/CardRenderer';
import { useResizable } from '@/lib/hooks/useResizable';
import { getDefaultCardDimensions } from '@/lib/utils';

interface CanvasElementProps {
	card: Card;
	boardId?: string;
	onCardClick?: (cardId: string) => void;
	onCardDoubleClick?: (cardId: string) => void;
	onContextMenu?: (e: React.MouseEvent, card: Card) => void;
	onEditorReady?: (cardId: string, editor: Editor) => void;
}

export function CanvasElement({ 
	card, 
	boardId,
	onCardClick, 
	onCardDoubleClick,
	onContextMenu,
	onEditorReady 
}: CanvasElementProps) {
	const { selectedCardIds, setEditingCardId, editingCardId } = useCanvasStore();
	
	const isSelected = selectedCardIds.has(card.id);
	const isEditing = editingCardId === card.id;

	const { canResize } = getDefaultCardDimensions(card.card_type);

	const { handleMouseDown, isDragging } = useDraggable({
		cardId: card.id,
		snapToGrid: false,
	});

	const { handleMouseDown: handleMouseDownResizable, isResizing } = useResizable({
		cardId: card.id,
		maxWidth: 1200,
		maxHeight: 1200,
	});

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

		if (isMultiSelect) return;

		onCardClick?.(card.id);
	};

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setEditingCardId(card.id);
		onCardDoubleClick?.(card.id);
	};

	const handleCardMouseDown = (e: React.MouseEvent) => {
		// If editing, don't interfere with text selection
		if (isEditing) {
			e.stopPropagation();
			return;
		}
		
		// Otherwise, handle dragging
		handleMouseDown(e);
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		
		onContextMenu?.(e, card);
	}

	const handleEditorReady = (editor: Editor) => {
		if (onEditorReady) {
			onEditorReady(card.id, editor);
		}
	};

	return (
		<div
			data-element-id={card.id}
			data-card="true"
			className="canvas-element select-none"
			style={{
				position: 'absolute',
				top: card.position_y,
				left: card.position_x,
				zIndex: card.z_index,
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
						card drag-handle
						${isSelected ? 'selected' : ''}
						${isEditing ? 'editing' : ''}
						${selectedCardIds.size === 1 && isSelected ? 'selected-single' : ''}
					`}
					onMouseDown={handleCardMouseDown}
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
					onContextMenu={handleContextMenu}
					style={{
						display: 'inline-block',
						width: card.width,
						height: card.height || 'auto',
						minHeight: card.height ? card.height : 'auto',
						userSelect: isEditing ? 'auto' : 'none',
						WebkitUserSelect: isEditing ? 'auto' : 'none',
						cursor: isEditing ? 'auto' : 'move',
						pointerEvents: isEditing || !isDragging ? 'auto' : 'none',
						position: 'relative'
					}}
				>
					{/* Render the actual card content based on type */}
					<CardRenderer 
						card={card} 
						isEditing={isEditing}
						onEditorReady={handleEditorReady}
					/>
					
					{/* Selection indicator */}
					{isSelected && (
						<div className="selection-outline" />
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
								zIndex: card.z_index + 1,
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