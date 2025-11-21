/**
 * ConnectionHandle Component
 *
 * Displays anchor points on card edges for creating connections.
 * Shows on hover or when in connection mode.
 */

'use client';

import { memo, useCallback } from 'react';
import type { ConnectionSide } from '@/lib/types';

interface ConnectionHandleProps {
  cardId: string;
  side: ConnectionSide;
  offset?: number;
  isConnectionMode: boolean;
  hasPendingConnection: boolean;
  isPendingSource?: boolean;
  onStartConnection: (cardId: string, side: ConnectionSide, offset: number) => void;
  onCompleteConnection: (cardId: string, side: ConnectionSide, offset: number) => void;
}

export const ConnectionHandle = memo(function ConnectionHandle({
  cardId,
  side,
  offset = 0.5,
  isConnectionMode,
  hasPendingConnection,
  isPendingSource,
  onStartConnection,
  onCompleteConnection,
}: ConnectionHandleProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (isPendingSource) {
        return;
      }

      if (hasPendingConnection) {
        onCompleteConnection(cardId, side, offset);
      } else {
        onStartConnection(cardId, side, offset);
      }
    },
    [cardId, side, offset, hasPendingConnection, isPendingSource, onStartConnection, onCompleteConnection]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Position styles based on side
  const positionStyle = getPositionStyle(side, offset);

  return (
    <div
      className={`
        connection-handle absolute z-50
        w-3 h-3 rounded-full
        border-2 border-white
        transition-all duration-150
        cursor-crosshair
        ${isPendingSource
          ? 'bg-blue-500 scale-125 shadow-lg'
          : isConnectionMode
            ? 'bg-green-500 hover:bg-green-400 hover:scale-125'
            : 'bg-gray-400 hover:bg-blue-500 hover:scale-125'
        }
        ${isConnectionMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        shadow-md
      `}
      style={positionStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      title={isConnectionMode ? 'Click to connect' : 'Click to start connection'}
    />
  );
});

/**
 * Get CSS position style for handle based on side and offset
 */
function getPositionStyle(
  side: ConnectionSide,
  offset: number
): React.CSSProperties {
  const handleSize = 12; // 3 * 4px (w-3)
  const halfSize = handleSize / 2;

  switch (side) {
    case 'top':
      return {
        top: -halfSize,
        left: `calc(${offset * 100}% - ${halfSize}px)`,
      };
    case 'right':
      return {
        right: -halfSize,
        top: `calc(${offset * 100}% - ${halfSize}px)`,
      };
    case 'bottom':
      return {
        bottom: -halfSize,
        left: `calc(${offset * 100}% - ${halfSize}px)`,
      };
    case 'left':
      return {
        left: -halfSize,
        top: `calc(${offset * 100}% - ${halfSize}px)`,
      };
  }
}

/**
 * Container component that renders all 4 connection handles for a card
 */
interface ConnectionHandlesProps {
  cardId: string;
  isConnectionMode: boolean;
  hasPendingConnection: boolean;
  pendingSourceCardId?: string | null;
  pendingSourceSide?: ConnectionSide | null;
  onStartConnection: (cardId: string, side: ConnectionSide, offset: number) => void;
  onCompleteConnection: (cardId: string, side: ConnectionSide, offset: number) => void;
}

export const ConnectionHandles = memo(function ConnectionHandles({
  cardId,
  isConnectionMode,
  hasPendingConnection,
  pendingSourceCardId,
  pendingSourceSide,
  onStartConnection,
  onCompleteConnection,
}: ConnectionHandlesProps) {
  const sides: ConnectionSide[] = ['top', 'right', 'bottom', 'left'];

  return (
    <>
      {sides.map((side) => (
        <ConnectionHandle
          key={side}
          cardId={cardId}
          side={side}
          isConnectionMode={isConnectionMode}
          hasPendingConnection={hasPendingConnection}
          isPendingSource={pendingSourceCardId === cardId && pendingSourceSide === side}
          onStartConnection={onStartConnection}
          onCompleteConnection={onCompleteConnection}
        />
      ))}
    </>
  );
});
