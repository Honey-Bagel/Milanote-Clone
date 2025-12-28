/**
 * CardRenderer Component - With TipTap Support
 * 
 * Routes to the appropriate card type component based on your DB schema
 */

'use client';

import type { Card, CardData } from '@/lib/types';
import type { Editor } from '@tiptap/react';

// Import your card components
import {
	NoteCardComponent,
	ImageCardComponent,
	TaskListCardComponent,
	LinkCardComponent,
	FileCardComponent,
	ColorPaletteCardComponent,
	ColumnCardComponent,
	BoardCardComponent,
	LineCardComponent
} from '.';

interface CardRendererProps {
	card: Card;
	boardId: string | null;
	isEditing: boolean;
	isSelected?: boolean;
	isPublicView?: boolean;
	allCards?: Map<string, Card | CardData>;
	onEditorReady?: (editor: Editor) => void;
	onHeightChange?: (newHeight: number) => void;
	onContextMenu?: (e: React.MouseEvent, card: Card) => void;
	options: any;
}

/**
 * Main router component for rendering different card types
 * Routes based on your database card_type field
 */
export function CardRenderer({ card, boardId, isEditing, isSelected, isPublicView, allCards, onEditorReady, onHeightChange, onContextMenu, options }: CardRendererProps) {
	switch (card.card_type) {
		case 'note':
			return <NoteCardComponent onEditorReady={onEditorReady} options={options} />

		case 'image':
			return <ImageCardComponent card={card} isEditing={isEditing} />;

		case 'task_list':
			return <TaskListCardComponent card={card} isEditing={isEditing} />;

		case 'link':
			return <LinkCardComponent card={card} isEditing={isEditing} />;

		case 'file':
			return <FileCardComponent card={card} isEditing={isEditing} />;

		case 'color_palette':
			return <ColorPaletteCardComponent card={card} isEditing={isEditing} />;

		case 'column':
			return <ColumnCardComponent card={card} isEditing={isEditing} isSelected={isSelected} allCards={allCards} onContextMenu={onContextMenu} />;

		case 'board':
			return <BoardCardComponent card={card} isEditing={isEditing} isPublicView={isPublicView} />;

		case 'line':
			return <LineCardComponent card={card} boardId={boardId ?? card.board_id} isEditing={isEditing} isSelected={isSelected ?? false} />;

		default:
			// TypeScript should prevent this, but just in case
			return (
				<div className="p-4 text-gray-500">
					Unknown card type: {(card as any).card_type}
				</div>
			);
	}
}