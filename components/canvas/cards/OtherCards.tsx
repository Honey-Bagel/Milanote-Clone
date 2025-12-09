/**
 * Additional Card Type Components
 * 
 * Placeholder implementations for other card types
 * Customize these based on your needs!
 */

'use client';

import { type Card } from '@/lib/stores/canvas-store';
import { CardBase } from './CardBase';

// ============================================================================
// TEXT CARD - Large text block
// ============================================================================

export function TextCard({ card, isEditing }: { card: Card; isEditing: boolean }) {
  return (
    <CardBase isEditing={isEditing} className="bg-transparent border-none shadow-none">
      <div className="text-card p-2">
        <p className="text-2xl font-bold text-gray-900">
          {card.content.text || 'Text'}
        </p>
      </div>
    </CardBase>
  );
}

// ============================================================================
// LINK CARD - URL preview card
// ============================================================================

export function LinkCard({ card, isEditing }: { card: Card; isEditing: boolean }) {
  const url = card.content.url as string | undefined;
  const title = card.content.title as string | undefined;
  const description = card.content.description as string | undefined;
  const favicon = card.content.favicon as string | undefined;

  return (
    <CardBase isEditing={isEditing}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-card block p-4 hover:bg-gray-50 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {/* Always reserve space for favicon to prevent layout shift */}
          <div className="w-5 h-5 mt-1 flex-shrink-0">
            {favicon && (
              <img
                src={favicon}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {title || url || 'Untitled Link'}
            </h3>
            {description && (
              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                {description}
              </p>
            )}
            {url && (
              <p className="text-xs text-gray-400 truncate mt-1">
                {new URL(url).hostname}
              </p>
            )}
          </div>
        </div>
      </a>
    </CardBase>
  );
}

// ============================================================================
// COLUMN CARD - Container for organizing other cards
// ============================================================================

export function ColumnCard({ card, isEditing }: { card: Card; isEditing: boolean }) {
  const title = card.content.title as string | undefined;

  return (
    <CardBase isEditing={isEditing} className="bg-gray-50 border-dashed">
      <div className="column-card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {title || 'Column'}
        </h3>
        <div className="min-h-[200px] border-2 border-dashed border-gray-300 rounded p-2">
          {/* Children cards would go here */}
          <p className="text-xs text-gray-400 text-center mt-8">
            Drop cards here
          </p>
        </div>
      </div>
    </CardBase>
  );
}

// ============================================================================
// TASK CARD - Checklist item
// ============================================================================

export function TaskCard({ card, isEditing }: { card: Card; isEditing: boolean }) {
  const text = card.content.text as string | undefined;
  const completed = card.content.completed as boolean | undefined;

  return (
    <CardBase isEditing={isEditing}>
      <div className="task-card p-3 flex items-start gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => {
            // Update task completion
            e.stopPropagation();
          }}
          className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <p className={`text-sm ${completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {text || 'Task'}
          </p>
        </div>
      </div>
    </CardBase>
  );
}