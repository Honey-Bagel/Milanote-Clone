/**
 * CanvasElement Component - With TipTap Support
 * 
 * Wrapper for each card, adapted to your database schema
 */

'use client';

import type { Card } from '@/lib/types';
import type { Editor } from '@tiptap/react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useDraggable } from '@/lib/hooks/useDraggable';
import { CardRenderer } from './cards/CardRenderer';

interface CanvasElementProps {
	card: Card;
	boardId?: string;
	onCardClick?: (cardId: string) => void;
	onCardDoubleClick?: (cardId: string) => void;
	onEditorReady?: (cardId: string, editor: Editor) => void;
}

export function CanvasElement({ 
	card, 
	boardId,
	onCardClick, 
	onCardDoubleClick,
	onEditorReady 
}: CanvasElementProps) {
	const { selectedCardIds, setEditingCardId, editingCardId } = useCanvasStore();
	
	const isSelected = selectedCardIds.has(card.id);
	const isEditing = editingCardId === card.id;

	const { handleMouseDown, isDragging } = useDraggable({
		cardId: card.id,
		snapToGrid: false,
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
					style={{
						display: 'inline-block',
						width: 'auto',
						minHeight: 'auto',
						userSelect: isEditing ? 'auto' : 'none',
						WebkitUserSelect: isEditing ? 'auto' : 'none',
						cursor: isEditing ? 'auto' : 'move',
						pointerEvents: isEditing || !isDragging ? 'auto' : 'none'
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
				</div>
			</div>
		</div>
	);
}