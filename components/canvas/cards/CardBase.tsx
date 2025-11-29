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
        ${isEditing ? 'ring-2 ring-cyan-500 editing-active' : ''}
        ${className}
      `}
      style={{
		width: '100%',
		height: '100%',
		overflow: 'hidden',
		boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}