/**
 * Card Component Implementations - Integrated Version
 * 
 * These work with your database schema
 */

'use client';

import { useRef, useEffect } from 'react';
import type { NoteCard, ImageCard, TextCard, TaskListCard, LinkCard, FileCard, ColorPaletteCard, ColumnCard } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { updateCardContent } from '@/lib/data/cards-client';
import { CardBase } from './CardBase';
import Image from 'next/image';

// ============================================================================
// NOTE CARD
// ============================================================================

export function NoteCardComponent({ 
  card, 
  isEditing 
}: { 
  card: NoteCard; 
  isEditing: boolean;
}) {
  const { updateCard, setEditingCardId } = useCanvasStore();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
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
      
      // Update local state
      updateCard(card.id, {
        ...card,
        note_cards: {
          ...card.note_cards,
          content: newContent,
        },
      });
    }
  };

  const handleBlur = async () => {
    setEditingCardId(null);
    
    // Sync to Supabase
    if (contentRef.current) {
      try {
        await updateCardContent(card.id, 'note', {
          content: contentRef.current.innerText,
        });
      } catch (error) {
        console.error('Failed to update note:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCardId(null);
      contentRef.current?.blur();
    }
    e.stopPropagation();
  };

  const colorClasses = {
    yellow: 'bg-yellow-100 border-yellow-200',
    blue: 'bg-blue-100 border-blue-200',
    green: 'bg-green-100 border-green-200',
    pink: 'bg-pink-100 border-pink-200',
    purple: 'bg-purple-100 border-purple-200',
  };

  return (
    <CardBase 
      isEditing={isEditing}
      className={`${colorClasses[card.note_cards.color]} min-w-[220px] max-w-[460px]`}
    >
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
			w-[250px]
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
          {card.note_cards.content || 'Double-click to edit...'}
        </div>
      </div>
    </CardBase>
  );
}

// ============================================================================
// IMAGE CARD
// ============================================================================

export function ImageCardComponent({ 
  card, 
  isEditing 
}: { 
  card: ImageCard; 
  isEditing: boolean;
}) {
  return (
    <CardBase isEditing={isEditing} className="min-w-[220px] max-w-[560px]">
      <div className="image-card overflow-hidden">
        {card.image_cards.image_url ? (
          <>
            <Image
              src={card.image_cards.image_url}
              alt={card.image_cards.alt_text || 'Image'}
              className="w-full h-auto object-cover"
              style={{ maxHeight: '420px' }}
            />
            {card.image_cards.caption && (
              <div className="p-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
                {card.image_cards.caption}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-400">
            No image
          </div>
        )}
      </div>
    </CardBase>
  );
}

// ============================================================================
// TEXT CARD
// ============================================================================

export function TextCardComponent({ 
  card, 
  isEditing 
}: { 
  card: TextCard; 
  isEditing: boolean;
}) {
  return (
    <CardBase isEditing={isEditing} className="bg-transparent border-none shadow-none min-w-[280px] max-w-[640px]">
      <div className="text-card p-2">
        {card.text_cards.title && (
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {card.text_cards.title}
          </h3>
        )}
        <p className="text-base text-gray-800">
          {card.text_cards.content}
        </p>
      </div>
    </CardBase>
  );
}

// ============================================================================
// TASK LIST CARD
// ============================================================================

export function TaskListCardComponent({ 
  card, 
  isEditing 
}: { 
  card: TaskListCard; 
  isEditing: boolean;
}) {
  const { updateCard } = useCanvasStore();

  const handleToggleTask = async (taskId: string) => {
    const updatedTasks = card.task_list_cards.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    // Update local state
    updateCard(card.id, {
      ...card,
      task_list_cards: {
        ...card.task_list_cards,
        tasks: updatedTasks,
      },
    });

    // Sync to Supabase
    try {
      await updateCardContent(card.id, 'task_list', {
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <CardBase isEditing={isEditing} className="min-w-[300px] max-w-[520px]">
      <div className="task-list-card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          {card.task_list_cards.title}
        </h3>
        <div className="space-y-2">
          {card.task_list_cards.tasks
            ?.sort((a, b) => a.position - b.position)
            .map((task) => (
              <div key={task.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                />
                <span
                  className={`text-sm ${
                    task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                >
                  {task.text}
                </span>
              </div>
            ))}
        </div>
      </div>
    </CardBase>
  );
}

// ============================================================================
// LINK CARD
// ============================================================================

export function LinkCardComponent({ 
  card, 
  isEditing 
}: { 
  card: LinkCard; 
  isEditing: boolean;
}) {
  return (
    <CardBase isEditing={isEditing} className="min-w-[280px] max-w-[420px]">
      <a
        href={card.link_cards.url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-card block p-4 hover:bg-gray-50 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {card.link_cards.favicon_url && (
            <Image
              src={card.link_cards.favicon_url} 
              alt="" 
              className="w-5 h-5 mt-1 flex-shrink-0" 
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {card.link_cards.title}
            </h3>
            <p className="text-xs text-gray-400 truncate mt-1">
              {new URL(card.link_cards.url).hostname}
            </p>
          </div>
        </div>
      </a>
    </CardBase>
  );
}

// ============================================================================
// FILE CARD
// ============================================================================

export function FileCardComponent({ 
  card, 
  isEditing 
}: { 
  card: FileCard; 
  isEditing: boolean;
}) {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <CardBase isEditing={isEditing} className="min-w-[280px] max-w-[420px]">
      <a
        href={card.file_cards.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="file-card block p-4 hover:bg-gray-50 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-semibold text-xs">
            {card.file_cards.file_type?.toUpperCase() || 'FILE'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {card.file_cards.file_name}
            </h3>
            <p className="text-xs text-gray-400">
              {formatFileSize(card.file_cards.file_size)}
            </p>
          </div>
        </div>
      </a>
    </CardBase>
  );
}

// ============================================================================
// COLOR PALETTE CARD
// ============================================================================

export function ColorPaletteCardComponent({ 
  card, 
  isEditing 
}: { 
  card: ColorPaletteCard; 
  isEditing: boolean;
}) {
  return (
    <CardBase isEditing={isEditing} className="min-w-[320px] max-w-[600px]">
      <div className="color-palette-card p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          {card.color_palette_cards.title}
        </h3>
        {card.color_palette_cards.description && (
          <p className="text-xs text-gray-600 mb-3">
            {card.color_palette_cards.description}
          </p>
        )}
        <div className="flex gap-2">
          {card.color_palette_cards.colors.map((color, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded border border-gray-200"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </CardBase>
  );
}

// ============================================================================
// COLUMN CARD
// ============================================================================

export function ColumnCardComponent({ 
  card, 
  isEditing 
}: { 
  card: ColumnCard; 
  isEditing: boolean;
}) {
  return (
    <CardBase 
      isEditing={isEditing} 
      className="border-dashed min-w-[380px] max-w-[720px]"
      style={{ backgroundColor: card.column_cards.background_color }}
    >
      <div className="column-card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {card.column_cards.title}
        </h3>
        <div className="min-h-[200px] border-2 border-dashed border-gray-300 rounded p-2">
          <p className="text-xs text-gray-400 text-center mt-8">
            {card.column_cards.column_items.length} items
          </p>
        </div>
      </div>
    </CardBase>
  );
}