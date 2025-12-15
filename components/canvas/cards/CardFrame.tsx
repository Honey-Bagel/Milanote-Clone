/**
 * CardFrame Component - Selection, Resize, Connection Handles
 *
 * This component wraps card content and provides:
 * - Selection outline when selected
 * - Resize handles when selected and not editing
 * - Connection handles for line connections
 * - Consistent dimension handling via CardContext
 *
 * Line cards bypass this component entirely (they have special rendering).
 */

'use client';

import { memo, useCallback } from 'react';
import type { Card, ConnectionSide } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useResizable } from '@/lib/hooks/useResizable';
import { ConnectionHandles } from '../ConnectionHandle';
import { type CardDimensions } from './useCardDimensions';
import { useCardContext } from './CardContext';

// ============================================================================
// TYPES
// ============================================================================

interface CardFrameProps {
	children: React.ReactNode;
	card: Card;
	isSelected: boolean;
	isEditing: boolean;
	isInsideColumn: boolean;
	isReadOnly: boolean;
	cssZIndex: number;
}

interface SelectionOutlineProps {
	dimensions: CardDimensions;
}

interface ResizeHandlesProps {
	card: Card;
	dimensions: CardDimensions;
	cssZIndex: number;
	handleMouseDown: () => void;
}

// ============================================================================
// SELECTION OUTLINE (Simplified - receives dimensions as props)
// ============================================================================

const SelectionOutline = memo(function SelectionOutline({ dimensions }: SelectionOutlineProps) {
	// Use dimensions from the centralized hook instead of measuring
	const width = dimensions.width;
	const height = dimensions.height === 'auto'
		? dimensions.measuredHeight || '100%'
		: dimensions.effectiveHeight;

	return (
		<div
			className="selection-outline"
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				border: '1px solid var(--primary)',
				borderRadius: 'inherit',
				boxSizing: 'border-box',
				zIndex: 1,
			}}
		/>
	);
});

// ============================================================================
// RESIZE HANDLES
// ============================================================================

const ResizeHandles = memo(function ResizeHandles({
	card,
	dimensions,
	cssZIndex,
	handleMouseDown
}: ResizeHandlesProps) {

	if (dimensions.resizeMode === 'none') {
		return null;
	}

	if (dimensions.resizeMode === 'width-only') {
		// Width-only resize handle (East edge) for dynamic height cards
		return (
			<div
				aria-label="Resize Width"
				onMouseDown={(e) => handleMouseDown(e, 'e')}
				className="resize-handle resize-handle-e"
				style={{
					position: 'absolute',
					right: -3,
					top: '50%',
					transform: 'translateY(-50%)',
					width: 6,
					height: 24,
					cursor: 'e-resize',
					zIndex: cssZIndex + 1,
					backgroundColor: '#3B82F6',
					border: '1px solid white',
					borderRadius: 3,
				}}
			/>
		);
	}

	// Standard SE resize handle for cards with fixed height
	return (
		<div
			aria-label="Resize South-East"
			onMouseDown={(e) => handleMouseDown(e, 'se')}
			className="resize-handle resize-handle-se"
			style={{
				position: 'absolute',
				right: -4,
				bottom: -4,
				width: 8,
				height: 8,
				cursor: 'se-resize',
				zIndex: cssZIndex + 1,
				backgroundColor: '#3B82F6',
				border: '1px solid white',
				borderRadius: '50%',
			}}
		/>
	);
});

// ============================================================================
// CARD FRAME
// ============================================================================

export const CardFrame = memo(function CardFrame({
	children,
	card,
	isSelected,
	isEditing,
	isInsideColumn,
	isReadOnly,
	cssZIndex,
}: CardFrameProps) {
	// Get connection state from canvas store
	const {
		isConnectionMode,
		isDraggingLineEndpoint,
		pendingConnection,
		startConnection,
		completeConnection,
	} = useCanvasStore();

	const { dimensions } = useCardContext();

	const { handleMouseDown, currentDimensions } = useResizable({
		card,
		maxWidth: 1200,
		maxHeight: 1200,
	});

	// Connection handling
	const handleStartConnection = useCallback((cardId: string, side: ConnectionSide, offset: number) => {
		startConnection(cardId, side, offset);
	}, [startConnection]);

	const handleCompleteConnection = useCallback((cardId: string, side: ConnectionSide, offset: number) => {
		if (pendingConnection) {
			completeConnection(cardId, side, offset);
		} else {
			startConnection(cardId, side, offset);
		}
	}, [pendingConnection, completeConnection, startConnection]);

	// Line cards bypass CardFrame entirely - they render their own SVG
	if (card.card_type === 'line') {
		return <>{children}</>;
	}

	// Calculate frame dimensions
	const frameWidth = currentDimensions.width;
	const isAutoHeight = dimensions.height === 'auto';

	const frameStyle: React.CSSProperties = {
		width: frameWidth,
		position: 'relative',
		boxSizing: 'border-box',
	};

	if (isAutoHeight) {
		frameStyle.height = 'auto';
		if (dimensions.minHeight != null) {
			frameStyle.minHeight = dimensions.minHeight;
		}
	} else {
		frameStyle.height = currentDimensions.height;
	}

	// Show connection handles when:
	// - In connection mode OR
	// - There's a pending connection OR
	// - Dragging a line endpoint
	// - AND not inside a column
	// - AND not read-only
	const showConnectionHandles = !isReadOnly && !isInsideColumn && (
		isConnectionMode || !!pendingConnection || isDraggingLineEndpoint
	);

	// Show resize handles when:
	// - Card can resize
	// - Card is selected
	// - Card is not being edited
	// - Card is not inside a column
	// - Not read-only
	const showResizeHandles = !isReadOnly && !isInsideColumn &&
		dimensions.canResize && isSelected;

	return (
		<div
			className="card-frame"
			style={frameStyle}
		>
			{/* Card content */}
			<div
				className="card-frame-content"
				style={{
					width: '100%',
					height: '100%',
					overflow: isEditing ? 'visible' : 'hidden',
					boxSizing: 'border-box',
				}}
			>
				{children}
			</div>

			{/* Selection outline - always rendered when selected */}
			{isSelected && (
				<SelectionOutline dimensions={{ ...dimensions, ...currentDimensions}} />
			)}

			{/* Connection handles */}
			{showConnectionHandles && (
				<ConnectionHandles
					cardId={card.id}
					isConnectionMode={isConnectionMode || !!pendingConnection || isDraggingLineEndpoint}
					hasPendingConnection={!!pendingConnection}
					pendingSourceCardId={pendingConnection?.fromCardId}
					pendingSourceSide={pendingConnection?.fromSide}
					onStartConnection={handleStartConnection}
					onCompleteConnection={handleCompleteConnection}
				/>
			)}

			{/* Resize handles */}
			{showResizeHandles && (
				<ResizeHandles
					card={card}
					dimensions={dimensions}
					cssZIndex={cssZIndex}
					handleMouseDown={handleMouseDown}
				/>
			)}
		</div>
	);
});

// ============================================================================
// EXPORTS
// ============================================================================

export { SelectionOutline, ResizeHandles };
