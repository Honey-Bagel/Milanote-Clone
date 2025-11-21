/**
 * LineCardComponent
 *
 * A draggable line element with movable endpoints, adjustable curvature,
 * and configurable end caps.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { LineCard, Card, ConnectionSide, RerouteNode } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { updateCardContent } from '@/lib/data/cards-client';
import { useDebouncedCallback } from 'use-debounce';
import { getAnchorPosition } from '@/lib/utils/connection-path';

const SNAP_DISTANCE = 20; // pixels

interface SnapTarget {
  cardId: string;
  side: ConnectionSide;
  x: number;
  y: number;
  distance: number;
}

/**
 * Find the closest snap target (card edge) within snap distance
 */
function findSnapTarget(
  canvasX: number,
  canvasY: number,
  cards: Map<string, Card>,
  excludeCardId: string
): SnapTarget | null {
  let closest: SnapTarget | null = null;

  for (const [cardId, card] of cards) {
    // Don't snap to self or other line cards
    if (cardId === excludeCardId || card.card_type === 'line') continue;

    const sides: ConnectionSide[] = ['top', 'right', 'bottom', 'left'];

    for (const side of sides) {
      const anchor = getAnchorPosition(card, side, 0.5);
      const dx = canvasX - anchor.x;
      const dy = canvasY - anchor.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < SNAP_DISTANCE && (!closest || distance < closest.distance)) {
        closest = {
          cardId,
          side,
          x: anchor.x,
          y: anchor.y,
          distance,
        };
      }
    }
  }

  return closest;
}

interface LineCardComponentProps {
  card: LineCard;
  isEditing: boolean;
  isSelected: boolean;
}

type DragTarget = 'start' | 'end' | 'control' | { type: 'reroute'; index: number } | { type: 'segment_control'; index: number } | null;

export function LineCardComponent({ card, isEditing, isSelected }: LineCardComponentProps) {
  const { updateCard, viewport, cards, setDraggingLineEndpoint } = useCanvasStore();
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoveredEndpoint, setHoveredEndpoint] = useState<DragTarget>(null);
  const [hoveredReroute, setHoveredReroute] = useState<number | null>(null);
  const [snapPreview, setSnapPreview] = useState<SnapTarget | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const lineData = card.line_cards;

  // Guard against missing data (can happen if DB fetch fails)
  if (!lineData) {
    console.error('LineCardComponent: line_cards data is missing for card:', card.id);
    return (
      <div className="p-2 text-red-500 text-xs">
        Line data missing
      </div>
    );
  }

  // Calculate line positions - if attached to a card, follow that card's position
  const getEndpointPosition = useCallback((
    attachedCardId: string | null,
    attachedSide: ConnectionSide | null,
    fallbackX: number,
    fallbackY: number
  ) => {
    if (attachedCardId && attachedSide) {
      const attachedCard = cards.get(attachedCardId);
      if (attachedCard && attachedCard.card_type !== 'line') {
        const anchor = getAnchorPosition(attachedCard, attachedSide, 0.5);
        return { x: anchor.x - card.position_x, y: anchor.y - card.position_y };
      }
    }
    return { x: fallbackX, y: fallbackY };
  }, [cards, card.position_x, card.position_y]);

  const startPos = getEndpointPosition(
    lineData.start_attached_card_id,
    lineData.start_attached_side as ConnectionSide | null,
    lineData.start_x,
    lineData.start_y
  );
  const endPos = getEndpointPosition(
    lineData.end_attached_card_id,
    lineData.end_attached_side as ConnectionSide | null,
    lineData.end_x,
    lineData.end_y
  );

  const startX = startPos.x;
  const startY = startPos.y;
  const endX = endPos.x;
  const endY = endPos.y;

  // Debounced save
  const debouncedSave = useDebouncedCallback(
    async (updates: Partial<LineCard['line_cards']>) => {
      try {
        await updateCardContent(card.id, 'line', updates);
      } catch (error) {
        console.error('Failed to update line:', error);
      }
    },
    500
  );

  // Calculate control point position
  const getControlPoint = useCallback(() => {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { x: startX, y: startY };

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Perpendicular unit vector
    const nx = -dy / distance;
    const ny = dx / distance;

    // Use control_point_offset directly (can be positive or negative)
    const offset = lineData.control_point_offset || 0;

    return {
      x: midX + nx * offset,
      y: midY + ny * offset,
    };
  }, [startX, startY, endX, endY, lineData.control_point_offset]);

  const controlPoint = getControlPoint();

  // Get reroute nodes (filter out any null values)
  const rerouteNodes: RerouteNode[] = (lineData.reroute_nodes || []).filter((n): n is RerouteNode => n != null);

  // Helper to calculate control point for a segment
  const getSegmentControlPoint = useCallback((
    fromX: number, fromY: number,
    toX: number, toY: number,
    offset: number
  ) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return { x: fromX, y: fromY };
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const nx = -dy / distance;
    const ny = dx / distance;
    return { x: midX + nx * offset, y: midY + ny * offset };
  }, []);

  // Generate SVG path - with reroute nodes, use smooth Catmull-Rom style curves
  const generatePath = useCallback(() => {
    if (rerouteNodes.length === 0) {
      // No reroute nodes - use original curve logic
      const offset = lineData.control_point_offset || 0;
      if (offset === 0) {
        return `M ${startX} ${startY} L ${endX} ${endY}`;
      }
      return `M ${startX} ${startY} Q ${controlPoint.x} ${controlPoint.y} ${endX} ${endY}`;
    }

    // Build array of all points: start -> reroute nodes -> end
    const allPoints = [
      { x: startX, y: startY },
      ...rerouteNodes.map(n => ({ x: n.x, y: n.y })),
      { x: endX, y: endY }
    ];

    // Use smooth cubic bezier curves through all points
    let path = `M ${allPoints[0].x} ${allPoints[0].y}`;

    // For only 2 points (1 reroute node), use quadratic curve through the middle
    if (allPoints.length === 2) {
      path += ` L ${allPoints[1].x} ${allPoints[1].y}`;
      return path;
    }

    // Calculate smooth control points for each segment
    for (let i = 0; i < allPoints.length - 1; i++) {
      const p0 = allPoints[i];
      const p1 = allPoints[i + 1];

      if (i === 0) {
        // First segment: use next point to determine curve direction
        const p2 = allPoints[Math.min(i + 2, allPoints.length - 1)];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;

        // Control point pulls toward the direction of the next segment
        const cp1x = midX;
        const cp1y = midY;
        const cp2x = p1.x - (p2.x - p0.x) * 0.15;
        const cp2y = p1.y - (p2.y - p0.y) * 0.15;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      } else if (i === allPoints.length - 2) {
        // Last segment: use previous point to determine curve direction
        const pPrev = allPoints[i - 1];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;

        const cp1x = p0.x + (p1.x - pPrev.x) * 0.15;
        const cp1y = p0.y + (p1.y - pPrev.y) * 0.15;
        const cp2x = midX;
        const cp2y = midY;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      } else {
        // Middle segments: smooth curve using neighboring points
        const pPrev = allPoints[i - 1];
        const pNext = allPoints[i + 2];

        // Calculate tangent directions at each point
        const cp1x = p0.x + (p1.x - pPrev.x) * 0.2;
        const cp1y = p0.y + (p1.y - pPrev.y) * 0.2;
        const cp2x = p1.x - (pNext.x - p0.x) * 0.2;
        const cp2y = p1.y - (pNext.y - p0.y) * 0.2;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
    }

    return path;
  }, [startX, startY, endX, endY, controlPoint, lineData.control_point_offset, rerouteNodes]);

  // Add reroute node on double-click
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / viewport.zoom + parseFloat(svg.style.left || '0');
    const y = (e.clientY - rect.top) / viewport.zoom + parseFloat(svg.style.top || '0');

    const newNode: RerouteNode = {
      id: `reroute-${Date.now()}`,
      x,
      y,
    };

    // Insert node at appropriate position based on distance along line
    const newNodes = [...rerouteNodes, newNode];

    // Sort nodes by distance from start
    newNodes.sort((a, b) => {
      const distA = Math.sqrt((a.x - startX) ** 2 + (a.y - startY) ** 2);
      const distB = Math.sqrt((b.x - startX) ** 2 + (b.y - startY) ** 2);
      return distA - distB;
    });

    updateCard(card.id, {
      ...card,
      line_cards: {
        ...lineData,
        reroute_nodes: newNodes,
      },
    });

    debouncedSave({ reroute_nodes: newNodes });
  }, [card, lineData, rerouteNodes, startX, startY, updateCard, debouncedSave, viewport.zoom]);

  // Delete reroute node
  const handleDeleteReroute = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const newNodes = rerouteNodes.filter((_, i) => i !== index);

    updateCard(card.id, {
      ...card,
      line_cards: {
        ...lineData,
        reroute_nodes: newNodes.length > 0 ? newNodes : null,
      },
    });

    debouncedSave({ reroute_nodes: newNodes.length > 0 ? newNodes : null });
  }, [card, lineData, rerouteNodes, updateCard, debouncedSave]);

  // Handle endpoint drag
  const handleEndpointMouseDown = useCallback((e: React.MouseEvent, target: DragTarget) => {
    e.stopPropagation();
    e.preventDefault();
    setDragTarget(target);
    // Signal that we're dragging a line endpoint (for start/end only)
    if (target === 'start' || target === 'end') {
      setDraggingLineEndpoint(true);
    }
  }, [setDraggingLineEndpoint]);

  // Global mouse move/up for dragging
  useEffect(() => {
    if (!dragTarget) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.querySelector('.canvas-document');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) / viewport.zoom;
      const canvasY = (e.clientY - rect.top) / viewport.zoom;

      // Handle reroute node drag
      if (typeof dragTarget === 'object' && 'type' in dragTarget && dragTarget.type === 'reroute') {
        const relX = canvasX - card.position_x;
        const relY = canvasY - card.position_y;

        const newNodes = [...rerouteNodes];
        newNodes[dragTarget.index] = {
          ...newNodes[dragTarget.index],
          x: relX,
          y: relY,
        };

        updateCard(card.id, {
          ...card,
          line_cards: {
            ...lineData,
            reroute_nodes: newNodes,
          },
        });
        return;
      }

      // Handle segment control point drag (curvature per segment)
      if (typeof dragTarget === 'object' && 'type' in dragTarget && dragTarget.type === 'segment_control') {
        const segIndex = dragTarget.index;

        // Build all points array
        const allPoints = [
          { x: startX + card.position_x, y: startY + card.position_y },
          ...rerouteNodes.map(n => ({ x: n.x + card.position_x, y: n.y + card.position_y })),
          { x: endX + card.position_x, y: endY + card.position_y }
        ];

        const from = allPoints[segIndex];
        const to = allPoints[segIndex + 1];

        // Calculate perpendicular offset
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const nx = -dy / distance;
          const ny = dx / distance;
          const mouseOffsetX = canvasX - midX;
          const mouseOffsetY = canvasY - midY;
          const offset = mouseOffsetX * nx + mouseOffsetY * ny;

          if (segIndex === 0 && rerouteNodes.length === 0) {
            // No reroute nodes - update main control_point_offset
            updateCard(card.id, {
              ...card,
              line_cards: { ...lineData, control_point_offset: offset },
            });
          } else if (segIndex < rerouteNodes.length) {
            // Update the reroute node's control_offset (for segment leading TO this node)
            const newNodes = [...rerouteNodes];
            newNodes[segIndex] = { ...newNodes[segIndex], control_offset: offset };
            updateCard(card.id, {
              ...card,
              line_cards: { ...lineData, reroute_nodes: newNodes },
            });
          } else {
            // Last segment - update main control_point_offset
            updateCard(card.id, {
              ...card,
              line_cards: { ...lineData, control_point_offset: offset },
            });
          }
        }
        return;
      }

      if (dragTarget === 'control') {
        // Calculate perpendicular distance from mouse to line midpoint
        const midX = (startX + endX) / 2 + card.position_x;
        const midY = (startY + endY) / 2 + card.position_y;

        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          // Perpendicular unit vector
          const nx = -dy / distance;
          const ny = dx / distance;

          // Project mouse position onto perpendicular
          const mouseOffsetX = canvasX - midX;
          const mouseOffsetY = canvasY - midY;
          const offset = mouseOffsetX * nx + mouseOffsetY * ny;

          updateCard(card.id, {
            ...card,
            line_cards: {
              ...lineData,
              control_point_offset: offset,
            },
          });
        }
        return;
      }

      // Check for snap targets (only for start/end endpoints)
      const snap = findSnapTarget(canvasX, canvasY, cards, card.id);
      setSnapPreview(snap);

      // Use snap position if available, otherwise use mouse position
      const finalX = snap ? snap.x : canvasX;
      const finalY = snap ? snap.y : canvasY;

      // Update relative position
      const relX = finalX - card.position_x;
      const relY = finalY - card.position_y;

      if (dragTarget === 'start') {
        updateCard(card.id, {
          ...card,
          line_cards: {
            ...lineData,
            start_x: relX,
            start_y: relY,
            start_attached_card_id: snap?.cardId || null,
            start_attached_side: snap?.side || null,
          },
        });
      } else if (dragTarget === 'end') {
        updateCard(card.id, {
          ...card,
          line_cards: {
            ...lineData,
            end_x: relX,
            end_y: relY,
            end_attached_card_id: snap?.cardId || null,
            end_attached_side: snap?.side || null,
          },
        });
      }
    };

    const handleMouseUp = () => {
      // Save on mouse up with snap attachment info
      const snap = snapPreview;

      if (typeof dragTarget === 'object' && 'type' in dragTarget && dragTarget.type === 'reroute') {
        debouncedSave({
          reroute_nodes: lineData.reroute_nodes,
        });
      } else if (typeof dragTarget === 'object' && 'type' in dragTarget && dragTarget.type === 'segment_control') {
        debouncedSave({
          reroute_nodes: lineData.reroute_nodes,
          control_point_offset: lineData.control_point_offset,
        });
      } else if (dragTarget === 'control') {
        debouncedSave({
          control_point_offset: lineData.control_point_offset,
        });
      } else if (dragTarget === 'start') {
        debouncedSave({
          start_x: lineData.start_x,
          start_y: lineData.start_y,
          start_attached_card_id: snap?.cardId || null,
          start_attached_side: snap?.side || null,
        });
      } else if (dragTarget === 'end') {
        debouncedSave({
          end_x: lineData.end_x,
          end_y: lineData.end_y,
          end_attached_card_id: snap?.cardId || null,
          end_attached_side: snap?.side || null,
        });
      }
      setDragTarget(null);
      setSnapPreview(null);
      setDraggingLineEndpoint(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragTarget, card, lineData, updateCard, debouncedSave, viewport, cards, snapPreview, rerouteNodes, startX, startY, endX, endY, setDraggingLineEndpoint]);

  // Get stroke dash array
  const getStrokeDashArray = () => {
    switch (lineData.line_style) {
      case 'dashed': return '8,4';
      case 'dotted': return '2,4';
      default: return undefined;
    }
  };

  // Get marker URL (using card-specific IDs for proper scaling)
  const getMarkerUrl = (cap: string, isStart: boolean) => {
    switch (cap) {
      case 'arrow': return isStart ? `url(#line-arrow-start-${card.id})` : `url(#line-arrow-end-${card.id})`;
      case 'dot': return `url(#line-dot-${card.id})`;
      case 'diamond': return `url(#line-diamond-${card.id})`;
      default: return undefined;
    }
  };

  // Calculate bounding box for the SVG viewBox (include control point and reroute nodes)
  const padding = 25;
  const allXPoints = [startX, endX, controlPoint.x, ...rerouteNodes.map(n => n.x)];
  const allYPoints = [startY, endY, controlPoint.y, ...rerouteNodes.map(n => n.y)];
  const minX = Math.min(...allXPoints) - padding;
  const minY = Math.min(...allYPoints) - padding;
  const maxX = Math.max(...allXPoints) + padding;
  const maxY = Math.max(...allYPoints) + padding;
  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;

  return (
    <svg
      ref={svgRef}
      className="line-card"
      style={{
        position: 'absolute',
        top: minY,
        left: minX,
        width: svgWidth,
        height: svgHeight,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      viewBox={`${minX} ${minY} ${svgWidth} ${svgHeight}`}
    >
      <defs>
        {/* Scale markers based on stroke width */}
        {(() => {
          const scale = Math.max(lineData.stroke_width / 2, 1);
          const arrowSize = 12 * scale;
          const dotSize = 8 * scale;
          const diamondSize = 12 * scale;

          return (
            <>
              {/* Arrow markers */}
              <marker
                id={`line-arrow-end-${card.id}`}
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={arrowSize - 2 * scale}
                refY={arrowSize / 2}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d={`M 0 0 L ${arrowSize} ${arrowSize/2} L 0 ${arrowSize} L ${3*scale} ${arrowSize/2} Z`} fill={lineData.color} />
              </marker>
              <marker
                id={`line-arrow-start-${card.id}`}
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={2 * scale}
                refY={arrowSize / 2}
                orient="auto-start-reverse"
                markerUnits="userSpaceOnUse"
              >
                <path d={`M ${arrowSize} 0 L 0 ${arrowSize/2} L ${arrowSize} ${arrowSize} L ${arrowSize - 3*scale} ${arrowSize/2} Z`} fill={lineData.color} />
              </marker>
              {/* Dot marker */}
              <marker
                id={`line-dot-${card.id}`}
                markerWidth={dotSize}
                markerHeight={dotSize}
                refX={dotSize / 2}
                refY={dotSize / 2}
                markerUnits="userSpaceOnUse"
              >
                <circle cx={dotSize/2} cy={dotSize/2} r={dotSize/2 - scale} fill={lineData.color} />
              </marker>
              {/* Diamond marker */}
              <marker
                id={`line-diamond-${card.id}`}
                markerWidth={diamondSize}
                markerHeight={diamondSize}
                refX={diamondSize / 2}
                refY={diamondSize / 2}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d={`M ${diamondSize/2} 0 L ${diamondSize} ${diamondSize/2} L ${diamondSize/2} ${diamondSize} L 0 ${diamondSize/2} Z`} fill={lineData.color} />
              </marker>
            </>
          );
        })()}
      </defs>

      {/* Invisible hit area for selection - double-click to add reroute node */}
      <path
        d={generatePath()}
        stroke="transparent"
        strokeWidth={Math.max(lineData.stroke_width * 4, 16)}
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onDoubleClick={isSelected ? handleDoubleClick : undefined}
      />

      {/* Selection highlight */}
      {isSelected && (
        <path
          d={generatePath()}
          stroke="#3b82f6"
          strokeWidth={lineData.stroke_width + 4}
          fill="none"
          strokeLinecap="round"
          opacity={0.4}
        />
      )}

      {/* Main line */}
      <path
        d={generatePath()}
        stroke={lineData.color}
        strokeWidth={lineData.stroke_width}
        fill="none"
        strokeDasharray={getStrokeDashArray()}
        strokeLinecap="round"
        markerStart={getMarkerUrl(lineData.start_cap, true)}
        markerEnd={getMarkerUrl(lineData.end_cap, false)}
      />

      {/* Snap preview indicator - convert from canvas coords to local coords */}
      {snapPreview && (
        <circle
          cx={snapPreview.x - card.position_x}
          cy={snapPreview.y - card.position_y}
          r={12}
          fill="rgba(34, 197, 94, 0.3)"
          stroke="#22c55e"
          strokeWidth={2}
          strokeDasharray="4,2"
        />
      )}

      {/* Endpoint handles (only when selected) */}
      {isSelected && (
        <>
          {/* Control point handle (for curve editing) - only show when no reroute nodes */}
          {rerouteNodes.length === 0 && (
            <>
              <circle
                cx={controlPoint.x}
                cy={controlPoint.y}
                r={hoveredEndpoint === 'control' || dragTarget === 'control' ? 7 : 5}
                fill={dragTarget === 'control' ? '#f97316' : '#ffffff'}
                stroke="#f97316"
                strokeWidth={2}
                style={{ pointerEvents: 'auto', cursor: 'move' }}
                onMouseDown={(e) => handleEndpointMouseDown(e, 'control')}
                onMouseEnter={() => setHoveredEndpoint('control')}
                onMouseLeave={() => setHoveredEndpoint(null)}
              />
              {/* Control point guide lines */}
              {(lineData.control_point_offset !== 0 || dragTarget === 'control') && (
                <line
                  x1={(startX + endX) / 2}
                  y1={(startY + endY) / 2}
                  x2={controlPoint.x}
                  y2={controlPoint.y}
                  stroke="#f97316"
                  strokeWidth={1}
                  strokeDasharray="4,2"
                  opacity={0.5}
                />
              )}
            </>
          )}
          {/* Start endpoint */}
          <circle
            cx={startX}
            cy={startY}
            r={hoveredEndpoint === 'start' || dragTarget === 'start' ? 8 : 6}
            fill={lineData.start_attached_card_id ? '#22c55e' : (dragTarget === 'start' ? '#3b82f6' : '#ffffff')}
            stroke={lineData.start_attached_card_id ? '#22c55e' : '#3b82f6'}
            strokeWidth={2}
            style={{ pointerEvents: 'auto', cursor: 'move' }}
            onMouseDown={(e) => handleEndpointMouseDown(e, 'start')}
            onMouseEnter={() => setHoveredEndpoint('start')}
            onMouseLeave={() => setHoveredEndpoint(null)}
          />
          {/* End endpoint */}
          <circle
            cx={endX}
            cy={endY}
            r={hoveredEndpoint === 'end' || dragTarget === 'end' ? 8 : 6}
            fill={lineData.end_attached_card_id ? '#22c55e' : (dragTarget === 'end' ? '#3b82f6' : '#ffffff')}
            stroke={lineData.end_attached_card_id ? '#22c55e' : '#3b82f6'}
            strokeWidth={2}
            style={{ pointerEvents: 'auto', cursor: 'move' }}
            onMouseDown={(e) => handleEndpointMouseDown(e, 'end')}
            onMouseEnter={() => setHoveredEndpoint('end')}
            onMouseLeave={() => setHoveredEndpoint(null)}
          />
          {/* Reroute nodes - diamond shaped */}
          {rerouteNodes.map((node, index) => {
            if (!node) return null;
            const isHovered = hoveredReroute === index;
            const isDragging = dragTarget !== null && typeof dragTarget === 'object' && 'type' in dragTarget && dragTarget.type === 'reroute' && dragTarget.index === index;
            const size = isHovered || isDragging ? 10 : 8;
            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredReroute(index)}
                onMouseLeave={() => setHoveredReroute(null)}
              >
                {/* Invisible hit area to keep hover active */}
                <rect
                  x={node.x - size - 4}
                  y={node.y - size - 16}
                  width={size * 2 + 24}
                  height={size * 2 + 20}
                  fill="transparent"
                  style={{ pointerEvents: 'auto' }}
                />
                {/* Diamond shape */}
                <path
                  d={`M ${node.x} ${node.y - size} L ${node.x + size} ${node.y} L ${node.x} ${node.y + size} L ${node.x - size} ${node.y} Z`}
                  fill={isDragging ? '#8b5cf6' : '#ffffff'}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  style={{ pointerEvents: 'auto', cursor: 'move' }}
                  onMouseDown={(e) => handleEndpointMouseDown(e, { type: 'reroute', index })}
                  onContextMenu={(e) => handleDeleteReroute(index, e)}
                />
                {/* X button on hover */}
                {isHovered && !isDragging && (
                  <g
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={(e) => handleDeleteReroute(index, e)}
                  >
                    <circle
                      cx={node.x + size + 6}
                      cy={node.y - size - 6}
                      r={8}
                      fill="#ef4444"
                    />
                    <text
                      x={node.x + size + 6}
                      y={node.y - size - 2}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      ×
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}
