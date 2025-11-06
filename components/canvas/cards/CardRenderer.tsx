/**
 * CardRenderer Component - Integrated Version
 * 
 * Routes to the appropriate card type component based on your DB schema
 */

'use client';

import type { Card } from '@/lib/types';

// Import your existing card components (you'll need to create these or adapt them)
// For now, I'll create placeholder imports - replace these with your actual card components
import { NoteCardComponent } from './CardComponents';
import { ImageCardComponent } from './CardComponents';
import { TextCardComponent } from './CardComponents';
import { TaskListCardComponent } from './CardComponents';
import { LinkCardComponent } from './CardComponents';
import { FileCardComponent } from './CardComponents';
import { ColorPaletteCardComponent } from './CardComponents';
import { ColumnCardComponent } from './CardComponents';

interface CardRendererProps {
  card: Card;
  isEditing: boolean;
}

/**
 * Main router component for rendering different card types
 * Routes based on your database card_type field
 */
export function CardRenderer({ card, isEditing }: CardRendererProps) {
  switch (card.card_type) {
    case 'note':
      return <NoteCardComponent card={card} isEditing={isEditing} />;
    
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
      return <ColumnCardComponent card={card} isEditing={isEditing} />;
    
    default:
      // TypeScript should prevent this, but just in case
      return (
        <div className="p-4 text-gray-500">
          Unknown card type: {(card as any).card_type}
        </div>
      );
  }
}