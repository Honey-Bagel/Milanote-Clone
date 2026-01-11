/**
 * Barrel export file for card components
 */

// Card Components
export { NoteCardComponent } from './NoteCardComponent';
export { ImageCardComponent } from './ImageCardComponent';
export { TaskListCardComponent } from './TaskListCardComponent';
export { LinkCardComponent } from './LinkCardComponent';
export { FileCardComponent } from './FileCardComponent';
export { ColorPaletteCardComponent } from './ColorPaletteCardComponent';
export { ColumnCardComponent } from './ColumnCardComponent';
export { BoardCardComponent } from './BoardCardComponent';
export { LineCardComponent } from './LineCardComponent';
export { DrawingCardComponent } from './DrawingCardComponent';
export { PresentationNodeComponent } from './PresentationNodeComponent';

// Core Architecture
export { CardRenderer } from './CardRenderer';
export { CardFrame, SelectionOutline, ResizeHandles } from './CardFrame';
export { CardProvider, useCardContext, useOptionalCardContext } from './CardContext';
export type { CardContextValue, CardProviderProps } from './CardContext';

// Hooks
export { useCardPersistence } from './useCardPersistence';
export type { UseCardPersistenceOptions, UseCardPersistenceReturn, CardContentUpdates } from './useCardPersistence';
export { useCardDimensions, useContentHeightMeasurement } from './useCardDimensions';
export type { CardDimensions, HeightMode, ResizeMode, DimensionConfig } from './useCardDimensions';

// Note: CardBase.tsx is deprecated and will be removed.
// All card components now use CardContext and CardFrame instead.
