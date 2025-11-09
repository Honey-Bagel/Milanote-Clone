/**
 * CardBase Component
 * 
 * Base wrapper component for all card types
 * Provides common functionality like borders, shadows, hover states
 */

'use client';

import { type ReactNode } from 'react';

interface CardBaseProps {
  /**
   * Card content
   */
  children: ReactNode;
  
  /**
   * Whether the card is being edited
   */
  isEditing?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Custom styles
   */
  style?: React.CSSProperties;
}

/**
 * Base card component that all card types should wrap with
 * Provides consistent styling, shadows, borders, etc.
 */
export function CardBase({
  children,
  isEditing = false,
  className = '',
  style = {},
}: CardBaseProps) {
  return (
    <div
      className={`
        card-base
        relative
        border
        border-gray-200
        bg-white
        shadow-sm
        transition-shadow
        hover:shadow-md
		text-black
        ${isEditing ? 'ring-2 ring-blue-500 editing-active' : ''}
        ${className}
      `}
      style={{
        ...style,
        userSelect: isEditing ? 'text' : 'none',
        WebkitUserSelect: isEditing ? 'text' : 'none',
        MozUserSelect: isEditing ? 'text' : 'none',
        msUserSelect: isEditing ? 'text' : 'none',
      }}
    >
      {children}
    </div>
  );
}