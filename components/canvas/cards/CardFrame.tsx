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
import { useDirectDimensionMeasurement, type DirectDimensions } from '@/lib/hooks/useDirectDimensionMeasurement';
import { ConnectionHandles } from '../ConnectionHandle';
import { type CardDimensions, type HeightMode } from './useCardDimensions';
import { useCardContext } from './CardContext';
import { useCardBehavior } from '@/lib/hooks/useCardBehavior';
import { Lock } from 'lucide-react';

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
	dimensions: DirectDimensions;
	viewport: { zoom: number };
	isEditing: boolean;
	heightMode: HeightMode;
}

interface ResizeHandlesProps {
	card: Card;
	dimensions: CardDimensions;
	cssZIndex: number;
	handleMouseDown: () => void;
}

// ============================================================================
// LOCK INDICATOR
// ============================================================================

interface LockIndicatorProps {
	viewport: { zoom: number };
}

const LockIndicator = memo(function LockIndicator({ viewport }: LockIndicatorProps) {
	const iconSize = Math.max(12, 14 / viewport.zoom);

	return (
		<div
			className="lock-indicator"
			style={{
				position: 'absolute',
				top: 6,
				right: 6,
				pointerEvents: 'none',
				zIndex: 10,
			}}
		>
			<Lock
				size={iconSize}
				className="text-secondary-foreground/60"
				strokeWidth={2}
			/>
		</div>
	);
});

// ============================================================================
// SELECTION OUTLINE (Direct DOM Measurement)
// ============================================================================

const SelectionOutline = memo(function SelectionOutline({
	dimensions,
	viewport,
	isEditing,
	heightMode
}: SelectionOutlineProps) {
	// Fixed 1px border width at all zoom levels
	const borderWidth = 1 / viewport.zoom;

	// State-dependent selection behavior:
	// - Editing mode: Always track content bounds (all height modes)
	// - Viewing + dynamic/hybrid: Track content bounds
	// - Viewing + fixed: Use frame bounds (handled by contentRef placement)
	// The contentRef is attached to .card-frame-content, which naturally wraps
	// the right boundary based on frame styling

	return (
		<div
			className="selection-outline"
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: dimensions.width,
				height: dimensions.height,
				pointerEvents: 'none',
				border: `${borderWidth}px solid var(--primary)`,
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
				onPointerDown={(e) => {
					e.stopPropagation();
				}}
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
			onPointerDown={(e) => {
				e.stopPropagation();
			}}
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
	// Get connection state and viewport from canvas store
	const {
		isConnectionMode,
		isDraggingLineEndpoint,
		pendingConnection,
		startConnection,
		completeConnection,
		viewport,
	} = useCanvasStore();

	const { dimensions } = useCardContext();

	// Get behavior configuration for this card type
	const behavior = useCardBehavior(card.card_type, card.id);

	// Direct measurement for selection outline (bypasses state lag)
	const { ref: contentRef, dimensions: directDimensions } = useDirectDimensionMeasurement(
		isSelected, // Only measure when selected for performance
		viewport.zoom
	);

	const { handleMouseDown, currentDimensions } = useResizable({
		card,
		maxWidth: 1200,
		maxHeight: 1200,
		measuredHeight: dimensions.measuredHeight, // For snap-to-content during resize
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
	const frameWidth = isInsideColumn ? '100%' : currentDimensions.width;
	const isAutoHeight = dimensions.height === 'auto' || card.card_type === "image"; // TODO: Fix this bandaid image fix

	const frameStyle: React.CSSProperties = {
		width: frameWidth,
		position: 'relative',
		boxSizing: 'border-box',
	};

	if (isAutoHeight) {
		frameStyle.height = 'auto';
		if (dimensions.minHeight != null && card.card_type !== "image") { // TODO: Part of bandaid image height fix
			frameStyle.minHeight = dimensions.minHeight;
		}
	} else {
		// Use effectiveHeight during editing to account for temporary expansion
		frameStyle.height = isEditing ? dimensions.effectiveHeight : currentDimensions.height;
	}

	// Show connection handles when:
	// - Card supports connections (from behavior config)
	// - In connection mode OR pending connection OR dragging line endpoint
	// - Not read-only
	const showConnectionHandles = !isReadOnly &&
		behavior.canConnectFrom &&
		(isConnectionMode || !!pendingConnection || isDraggingLineEndpoint);

	// Show resize handles when:
	// - Card supports resizing (from behavior config)
	// - Card is selected
	// - Card is not inside a column
	// - Not read-only
	// - In idle mode OR currently resizing this card (from behavior permissions)
	const showResizeHandles = !isReadOnly &&
		!isInsideColumn &&
		isSelected &&
		behavior.canResizeNow;

	return (
		<div
			className="card-frame"
			style={frameStyle}
		>
			{/* Card content with ref for direct measurement */}
			<div
				ref={contentRef}
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

			{/* Lock indicator */}
			{card.is_position_locked && (
				<LockIndicator viewport={viewport} />
			)}

			{/* Selection outline - uses direct DOM measurement */}
			{isSelected && directDimensions && (
				<SelectionOutline
					dimensions={directDimensions}
					viewport={viewport}
					isEditing={isEditing}
					heightMode={dimensions.heightMode}
				/>
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
