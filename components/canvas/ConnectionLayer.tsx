/**
 * ConnectionLayer Component
 *
 * Renders connection lines between cards using SVG
 * Supports Blueprint-style bezier curves, multiple end styles, and line styles
 */

'use client';

import { memo } from 'react';
import type { Connection, Card, ConnectionEndStyle } from '@/lib/types';
import {
  generateCardConnectionPath,
  getAnchorPosition,
  generateConnectionPath,
  type Point,
} from '@/lib/utils/connection-path';
import type { ConnectionSide } from '@/lib/types';

interface ConnectionLayerProps {
  connections: Map<string, Connection>;
  cards: Map<string, Card>;
  pendingConnection?: {
    fromCardId: string;
    fromSide: ConnectionSide;
    fromOffset: number;
  } | null;
  mousePosition?: Point | null;
  selectedConnectionId?: string | null;
  onConnectionClick?: (connectionId: string, event: React.MouseEvent) => void;
}

export const ConnectionLayer = memo(function ConnectionLayer({
  connections,
  cards,
  pendingConnection,
  mousePosition,
  selectedConnectionId,
  onConnectionClick,
}: ConnectionLayerProps) {
  return (
    <svg
      className="connection-layer pointer-events-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        // Make SVG cover entire canvas space by removing size constraints
        minWidth: '10000px',
        minHeight: '10000px',
      }}
    >
      <defs>
        {/* Arrow marker */}
        <marker
          id="connection-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="currentColor" />
        </marker>

        {/* Reverse arrow for start caps */}
        <marker
          id="connection-arrow-start"
          markerWidth="12"
          markerHeight="12"
          refX="2"
          refY="6"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="currentColor" />
        </marker>

        {/* Dot marker */}
        <marker
          id="connection-dot"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          markerUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="4" r="3" fill="currentColor" />
        </marker>

        {/* Diamond marker */}
        <marker
          id="connection-diamond"
          markerWidth="12"
          markerHeight="12"
          refX="6"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 6 0 L 12 6 L 6 12 L 0 6 Z" fill="currentColor" />
        </marker>
      </defs>

      {/* Render existing connections */}
      {Array.from(connections.values()).map((connection) => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          cards={cards}
          isSelected={selectedConnectionId === connection.id}
          onClick={onConnectionClick}
        />
      ))}

      {/* Render pending connection preview */}
      {pendingConnection && mousePosition && (
        <PendingConnectionLine
          pendingConnection={pendingConnection}
          mousePosition={mousePosition}
          cards={cards}
        />
      )}
    </svg>
  );
});

/**
 * Get marker URL for end style
 */
function getMarkerUrl(
  endStyle: ConnectionEndStyle,
  isStart: boolean
): string | undefined {
  switch (endStyle) {
    case 'arrow':
      return isStart ? 'url(#connection-arrow-start)' : 'url(#connection-arrow)';
    case 'dot':
      return 'url(#connection-dot)';
    case 'diamond':
      return 'url(#connection-diamond)';
    case 'none':
    default:
      return undefined;
  }
}

/**
 * Get stroke dash array for line style
 */
function getStrokeDashArray(
  lineStyle: Connection['lineStyle']
): string | undefined {
  switch (lineStyle) {
    case 'dashed':
      return '8,4';
    case 'dotted':
      return '2,4';
    case 'solid':
    default:
      return undefined;
  }
}

/**
 * Individual connection line
 */
const ConnectionLine = memo(function ConnectionLine({
  connection,
  cards,
  isSelected,
  onClick,
}: {
  connection: Connection;
  cards: Map<string, Card>;
  isSelected?: boolean;
  onClick?: (connectionId: string, event: React.MouseEvent) => void;
}) {
  const pathData = generateCardConnectionPath(connection, cards);

  if (!pathData) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(connection.id, e);
  };

  return (
    <g className="connection-group" style={{ color: connection.color }}>
      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth={Math.max(connection.strokeWidth * 4, 12)}
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onClick={handleClick}
      />
      {/* Selection highlight */}
      {isSelected && (
        <path
          d={pathData}
          stroke="#3b82f6"
          strokeWidth={connection.strokeWidth + 4}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />
      )}
      {/* Actual visible line */}
      <path
        d={pathData}
        stroke="currentColor"
        strokeWidth={connection.strokeWidth}
        fill="none"
        strokeDasharray={getStrokeDashArray(connection.lineStyle)}
        strokeLinecap="round"
        markerStart={getMarkerUrl(connection.startEndStyle, true)}
        markerEnd={getMarkerUrl(connection.endEndStyle, false)}
        className="connection-line"
      />
    </g>
  );
});

/**
 * Pending connection preview line
 */
function PendingConnectionLine({
  pendingConnection,
  mousePosition,
  cards,
}: {
  pendingConnection: {
    fromCardId: string;
    fromSide: ConnectionSide;
    fromOffset: number;
  };
  mousePosition: Point;
  cards: Map<string, Card>;
}) {
  const fromCard = cards.get(pendingConnection.fromCardId);
  if (!fromCard) return null;

  const fromPoint = getAnchorPosition(
    fromCard,
    pendingConnection.fromSide,
    pendingConnection.fromOffset
  );

  // Calculate curved line preview (matching what will be created)
  const dx = mousePosition.x - fromPoint.x;
  const dy = mousePosition.y - fromPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate control point offset (20% of distance, direction based on source side)
  let controlOffset = distance * 0.2;
  if (pendingConnection.fromSide === 'left' || pendingConnection.fromSide === 'top') {
    controlOffset = -controlOffset;
  }

  // Calculate perpendicular control point
  const midX = (fromPoint.x + mousePosition.x) / 2;
  const midY = (fromPoint.y + mousePosition.y) / 2;
  const nx = distance > 0 ? -dy / distance : 0;
  const ny = distance > 0 ? dx / distance : 0;
  const cpX = midX + nx * controlOffset;
  const cpY = midY + ny * controlOffset;

  // Use quadratic bezier curve
  const pathData = `M ${fromPoint.x} ${fromPoint.y} Q ${cpX} ${cpY} ${mousePosition.x} ${mousePosition.y}`;

  return (
    <path
      d={pathData}
      stroke="#6b7280"
      strokeWidth={2}
      fill="none"
      strokeDasharray="4,4"
      strokeLinecap="round"
      opacity={0.7}
      className="pending-connection"
    />
  );
}
