/**
 * ImageCard Component
 * 
 * Card for displaying images
 */

'use client';

import { type Card } from '@/lib/stores/canvas-store';
import { CardBase } from './CardBase';

interface ImageCardProps {
  card: Card;
  isEditing: boolean;
}

export function ImageCard({ card, isEditing }: ImageCardProps) {
  const imageUrl = card.content.imageUrl as string | undefined;
  const caption = card.content.caption as string | undefined;

  return (
    <CardBase isEditing={isEditing}>
      <div className="image-card overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={caption || 'Image'}
              className="w-full h-auto object-cover"
              style={{
                maxHeight: '400px',
              }}
            />
            {caption && (
              <div className="p-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
                {caption}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
    </CardBase>
  );
}