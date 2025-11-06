/**
 * ConnectionLayer Component
 * 
 * Renders connection lines between cards using SVG
 */

'use client';

import { type Connection, type Card } from '@/lib/stores/canvas-store';
import { getConnectionPoint } from '@/lib/utils/transform';

interface ConnectionLayerProps {
  connections: Map<string, Connection>;
  cards: Map<string, Card>;
}

export function ConnectionLayer({ connections, cards }: ConnectionLayerProps) {
  if (connections.size === 0) return null;

  return (
    <svg
      className="connection-layer absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Arrow marker for arrow-style connections */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
        </marker>
      </defs>

      {Array.from(connections.values()).map((connection) => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          cards={cards}
        />
      ))}
    </svg>
  );
}

/**
 * Individual connection line
 */
function ConnectionLine({
  connection,
  cards,
}: {
  connection: Connection;
  cards: Map<string, Card>;
}) {
  const fromCard = cards.get(connection.fromCardId);
  const toCard = cards.get(connection.toCardId);

  // Don't render if either card is missing
  if (!fromCard || !toCard) return null;

  // Get connection points
  const fromPoint = connection.fromSide
    ? getConnectionPoint(fromCard, connection.fromSide)
    : {
        x: fromCard.position.x + fromCard.size.width / 2,
        y: fromCard.position.y + fromCard.size.height / 2,
      };

  const toPoint = connection.toSide
    ? getConnectionPoint(toCard, connection.toSide)
    : {
        x: toCard.position.x + toCard.size.width / 2,
        y: toCard.position.y + toCard.size.height / 2,
      };

  // Calculate control points for curved line (Bezier curve)
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const offset = Math.abs(dx) * 0.5;

  const controlPoint1 = {
    x: fromPoint.x + offset,
    y: fromPoint.y,
  };

  const controlPoint2 = {
    x: toPoint.x - offset,
    y: toPoint.y,
  };

  // Create path
  const pathData = `M ${fromPoint.x} ${fromPoint.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${toPoint.x} ${toPoint.y}`;

  return (
    <path
      d={pathData}
      stroke={connection.color}
      strokeWidth={2}
      fill="none"
      strokeDasharray={connection.style === 'dashed' ? '5,5' : undefined}
      markerEnd={connection.style === 'arrow' ? 'url(#arrowhead)' : undefined}
      className="connection-line"
      style={{
        pointerEvents: 'stroke', // Allow clicking on the line
      }}
    />
  );
}