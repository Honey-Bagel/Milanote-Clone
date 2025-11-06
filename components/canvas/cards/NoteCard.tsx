/**
 * NoteCard Component
 * 
 * Standard text note card
 */

'use client';

import { useRef, useEffect } from 'react';
import { type Card } from '@/lib/stores/canvas-store';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CardBase } from './CardBase';

interface NoteCardProps {
  card: Card;
  isEditing: boolean;
}

export function NoteCard({ card, isEditing }: NoteCardProps) {
  const { updateCard, setEditingCardId } = useCanvasStore();
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
      
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleInput = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerText;
      updateCard(card.id, {
        content: {
          ...card.content,
          text: newContent,
        },
      });
    }
  };

  const handleBlur = () => {
    setEditingCardId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Exit edit mode on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCardId(null);
      contentRef.current?.blur();
    }
    
    // Prevent triggering canvas shortcuts while editing
    e.stopPropagation();
  };

  return (
    <CardBase isEditing={isEditing}>
      <div className="note-card p-4">
        <div
          ref={contentRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
            min-h-[60px]
            text-gray-800
            text-sm
            leading-relaxed
            outline-none
            ${isEditing ? 'cursor-text' : 'cursor-pointer'}
          `}
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {card.content.text || 'Double-click to edit...'}
        </div>
      </div>
    </CardBase>
  );
}