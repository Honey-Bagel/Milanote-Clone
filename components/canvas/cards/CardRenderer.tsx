/**
 * CardRenderer Component - With TipTap Support
 * 
 * Routes to the appropriate card type component based on your DB schema
 */

'use client';

import type { Card } from '@/lib/types';
import type { Editor } from '@tiptap/react';

// Import your card components
import { 
	NoteCardComponent,
	ImageCardComponent,
	TextCardComponent,
	TaskListCardComponent,
	LinkCardComponent,
	FileCardComponent,
	ColorPaletteCardComponent,
	BoardCardComponent
} from './CardComponents';
import { ColumnCard } from './ColumnCard';

interface CardRendererProps {
	card: Card;
	isEditing: boolean;
	onEditorReady?: (editor: Editor) => void;
}

/**
 * Main router component for rendering different card types
 * Routes based on your database card_type field
 */
export function CardRenderer({ card, isEditing, onEditorReady }: CardRendererProps) {
	switch (card.card_type) {
		case 'note':
			return <NoteCardComponent card={card} isEditing={isEditing} onEditorReady={onEditorReady} />;
		
		case 'image':
			return <ImageCardComponent card={card} isEditing={isEditing} />;
		
		case 'text':
			return <TextCardComponent card={card} isEditing={isEditing} />;
		
		case 'task_list':
			return <TaskListCardComponent card={card} isEditing={isEditing} />;
		
		case 'link':
			return <LinkCardComponent card={card} isEditing={isEditing} />;
		
		case 'file':
			return <FileCardComponent card={card} isEditing={isEditing} />;
		
		case 'color_palette':
			return <ColorPaletteCardComponent card={card} isEditing={isEditing} />;
		
		case 'column':
			return <ColumnCard card={card} isEditing={isEditing} dragOverIndex={1} />;
		
		case 'board':
			return <BoardCardComponent card={card} isEditing={isEditing} />;
		
		default:
			// TypeScript should prevent this, but just in case
			return (
				<div className="p-4 text-gray-500">
					Unknown card type: {(card as any).card_type}
				</div>
			);
	}
}