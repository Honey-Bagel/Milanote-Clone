/**
 * LineCardComponent
 *
 * A draggable line element with movable endpoints, adjustable curvature,
 * and configurable end caps.
 */

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { LineCard, Card, ConnectionSide, RerouteNode } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useDebouncedCallback } from 'use-debounce';
import { getAnchorPosition } from '@/lib/utils/connection-path';
import { CardService } from '@/lib/services';
import { useBoardCards } from '@/lib/hooks/cards';


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
  boardId: string;
  isEditing: boolean;
  isSelected: boolean;
}

type DragTarget = 'start' | 'end' | 'control' | { type: 'reroute'; index: number } | { type: 'segment_control'; index: number } | null;

export function LineCardComponent({ card, boardId, isEditing, isSelected }: LineCardComponentProps) {
  const { viewport, setDraggingLineEndpoint, dragPositions } = useCanvasStore();
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoveredEndpoint, setHoveredEndpoint] = useState<DragTarget>(null);
  const [hoveredReroute, setHoveredReroute] = useState<number | null>(null);
  const [snapPreview, setSnapPreview] = useState<SnapTarget | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Local state for drag operations (provides immediate visual feedback)
  const [localStartX, setLocalStartX] = useState<number | null>(null);
  const [localStartY, setLocalStartY] = useState<number | null>(null);
  const [localEndX, setLocalEndX] = useState<number | null>(null);
  const [localEndY, setLocalEndY] = useState<number | null>(null);
  const [localControlOffset, setLocalControlOffset] = useState<number | null>(null);
  const [localRerouteNodes, setLocalRerouteNodes] = useState<RerouteNode[] | null>(null);

  // Fetch board cards with real-time updates via InstantDB subscription
  const { cards: cardsArray } = useBoardCards(boardId);
  const cards = useMemo(
    () => new Map(cardsArray.map(c => [c.id, c])),
    [cardsArray]
  );

  const lineData = card;

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
        // Check if the attached card is being dragged
        const dragPosition = dragPositions.get(attachedCardId);

        // Use drag position if available, otherwise use card's position
        const posX = dragPosition ? dragPosition.x : attachedCard.position_x;
        const posY = dragPosition ? dragPosition.y : attachedCard.position_y;

        // Calculate anchor position manually using the potentially updated position
        const width = attachedCard.width;
        const height = attachedCard.height || 150;

        let anchorX = posX;
        let anchorY = posY;

        switch (attachedSide) {
          case 'top':
            anchorX = posX + width / 2;
            anchorY = posY;
            break;
          case 'right':
            anchorX = posX + width;
            anchorY = posY + height / 2;
            break;
          case 'bottom':
            anchorX = posX + width / 2;
            anchorY = posY + height;
            break;
          case 'left':
            anchorX = posX;
            anchorY = posY + height / 2;
            break;
        }

        return { x: anchorX - card.position_x, y: anchorY - card.position_y };
      }
    }
    return { x: fallbackX, y: fallbackY };
  }, [cards, card.position_x, card.position_y, dragPositions]);

  const startPos = getEndpointPosition(
    lineData.line_start_attached_card_id,
    lineData.line_start_attached_side as ConnectionSide | null,
    lineData.line_start_x,
    lineData.line_start_y
  );
  const endPos = getEndpointPosition(
    lineData.line_end_attached_card_id,
    lineData.line_end_attached_side as ConnectionSide | null,
    lineData.line_end_x,
    lineData.line_end_y
  );

  // Use local state during drag for immediate visual feedback, otherwise use DB values
  const startX = localStartX !== null ? localStartX : startPos.x;
  const startY = localStartY !== null ? localStartY : startPos.y;
  const endX = localEndX !== null ? localEndX : endPos.x;
  const endY = localEndY !== null ? localEndY : endPos.y;

  // Debounced save
  const debouncedSave = useDebouncedCallback(
    async (updates: Record<string, any>) => {
      try {
        if (card.id === 'preview-card') return;

        await CardService.updateCardContent(
          card.id,
          boardId,
          'line',
          updates
        );
      } catch (error) {
        console.error('Failed to update line:', error);
      }
    },
    1000
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
    // Use local state during drag, otherwise use DB value
    const offset = localControlOffset !== null ? localControlOffset : (lineData.line_control_point_offset || 0);

    return {
      x: midX + nx * offset,
      y: midY + ny * offset,
    };
  }, [startX, startY, endX, endY, lineData.line_control_point_offset, localControlOffset]);

  const controlPoint = getControlPoint();

  // Get reroute nodes (filter out any null values)
  // Use local state during drag, otherwise use DB value
  const rerouteNodes: RerouteNode[] = (localRerouteNodes !== null ? localRerouteNodes : (lineData.line_reroute_nodes || [])).filter((n): n is RerouteNode => n != null);

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
      const offset = lineData.line_control_point_offset || 0;
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
  }, [startX, startY, endX, endY, controlPoint, lineData.line_control_point_offset, rerouteNodes]);

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

    debouncedSave({ line_reroute_nodes: newNodes });
  }, [rerouteNodes, startX, startY, debouncedSave, viewport.zoom]);

  // Delete reroute node
  const handleDeleteReroute = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const newNodes = rerouteNodes.filter((_, i) => i !== index);

    debouncedSave({
      line_reroute_nodes: newNodes.length > 0 ? newNodes : null
    });
  }, [rerouteNodes, debouncedSave]);

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

        const newNodes = [...(localRerouteNodes || lineData.line_reroute_nodes || [])];
        newNodes[dragTarget.index] = {
          ...newNodes[dragTarget.index],
          x: relX,
          y: relY,
        };
        setLocalRerouteNodes(newNodes);
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

          // Visual updates happen via InstantDB subscriptions
          // Persistence happens on mouse up
        }
        return;
      }

      if (dragTarget === 'control') {
		console.log("control")
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

          setLocalControlOffset(offset);
        }
        return;
      }

      // Check for snap targets (only for start/end endpoints)
      const snap = findSnapTarget(canvasX, canvasY, cards, card.id);
      setSnapPreview(snap);

      // Use snap position if available, otherwise use mouse position
      const finalX = snap ? snap.x : canvasX;
      const finalY = snap ? snap.y : canvasY;

      // Update relative position for immediate visual feedback
      const relX = finalX - card.position_x;
      const relY = finalY - card.position_y;

      if (dragTarget === 'start') {
		console.log("start");
        setLocalStartX(relX);
        setLocalStartY(relY);
      } else if (dragTarget === 'end') {
		console.log("end");
        setLocalEndX(relX);
        setLocalEndY(relY);
      }
    };

    const handleMouseUp = () => {
      // Save on mouse up with snap attachment info
      const snap = snapPreview;

      if (typeof dragTarget === 'object' && 'type' in dragTarget && dragTarget.type === 'reroute') {
        debouncedSave({
          line_reroute_nodes: localRerouteNodes || lineData.line_reroute_nodes,
        });
      } else if (typeof dragTarget === 'object' && 'type' in dragTarget && dragTarget.type === 'segment_control') {
        debouncedSave({
          line_reroute_nodes: localRerouteNodes || lineData.line_reroute_nodes,
          line_control_point_offset: localControlOffset ?? lineData.line_control_point_offset,
        });
      } else if (dragTarget === 'control') {
        debouncedSave({
          line_control_point_offset: localControlOffset ?? lineData.line_control_point_offset,
        });
      } else if (dragTarget === 'start') {
        debouncedSave({
          line_start_x: localStartX ?? lineData.line_start_x,
          line_start_y: localStartY ?? lineData.line_start_y,
          line_start_attached_card_id: snap?.cardId || null,
          line_start_attached_side: snap?.side || null,
        });
      } else if (dragTarget === 'end') {
        debouncedSave({
          line_end_x: localEndX ?? lineData.line_end_x,
          line_end_y: localEndY ?? lineData.line_end_y,
          line_end_attached_card_id: snap?.cardId || null,
          line_end_attached_side: snap?.side || null,
        });
      }

      // Clear local state after a short delay to allow DB to update
      // This prevents the "snap back" effect
      setTimeout(() => {
        setLocalStartX(null);
        setLocalStartY(null);
        setLocalEndX(null);
        setLocalEndY(null);
        setLocalControlOffset(null);
        setLocalRerouteNodes(null);
      }, 1500); // Wait 1.5 seconds (longer than debounce) for DB to update

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
  }, [dragTarget, card, lineData, debouncedSave, viewport, cards, snapPreview, rerouteNodes, startX, startY, endX, endY, setDraggingLineEndpoint, localStartX, localStartY, localEndX, localEndY, localControlOffset, localRerouteNodes]);

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
          const scale = Math.max(lineData.line_stroke_width / 2, 1);
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
                <path d={`M 0 0 L ${arrowSize} ${arrowSize/2} L 0 ${arrowSize} L ${3*scale} ${arrowSize/2} Z`} fill={lineData.line_color} />
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
                <path d={`M ${arrowSize} 0 L 0 ${arrowSize/2} L ${arrowSize} ${arrowSize} L ${arrowSize - 3*scale} ${arrowSize/2} Z`} fill={lineData.line_color} />
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
                <circle cx={dotSize/2} cy={dotSize/2} r={dotSize/2 - scale} fill={lineData.line_color} />
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
                <path d={`M ${diamondSize/2} 0 L ${diamondSize} ${diamondSize/2} L ${diamondSize/2} ${diamondSize} L 0 ${diamondSize/2} Z`} fill={lineData.line_color} />
              </marker>
            </>
          );
        })()}
      </defs>

      {/* Invisible hit area for selection - double-click to add reroute node */}
      <path
        d={generatePath()}
        stroke="transparent"
        strokeWidth={Math.max(lineData.line_stroke_width * 4, 16)}
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onDoubleClick={isSelected ? handleDoubleClick : undefined}
      />

      {/* Selection highlight */}
      {isSelected && (
        <path
          d={generatePath()}
          stroke="#3b82f6"
          strokeWidth={lineData.line_stroke_width + 4}
          fill="none"
          strokeLinecap="round"
          opacity={0.4}
        />
      )}

      {/* Main line */}
      <path
        d={generatePath()}
        stroke={lineData.line_color}
        strokeWidth={lineData.line_stroke_width}
        fill="none"
        strokeDasharray={getStrokeDashArray()}
        strokeLinecap="round"
        markerStart={getMarkerUrl(lineData.line_start_cap, true)}
        markerEnd={getMarkerUrl(lineData.line_end_cap, false)}
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
				onPointerDown={(e) => {
					e.stopPropagation();
				}}
                onMouseDown={(e) => handleEndpointMouseDown(e, 'control')}
                onMouseEnter={() => setHoveredEndpoint('control')}
                onMouseLeave={() => setHoveredEndpoint(null)}
              />
              {/* Control point guide lines */}
              {((lineData.line_control_point_offset || 0) !== 0 || dragTarget === 'control') && (
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
            fill={lineData.line_start_attached_card_id ? '#22c55e' : (dragTarget === 'start' ? '#3b82f6' : '#ffffff')}
            stroke={lineData.line_start_attached_card_id ? '#22c55e' : '#3b82f6'}
            strokeWidth={2}
            style={{ pointerEvents: 'auto', cursor: 'move' }}
			onPointerDown={(e) => {
				e.stopPropagation();
			}}
            onMouseDown={(e) => handleEndpointMouseDown(e, 'start')}
            onMouseEnter={() => setHoveredEndpoint('start')}
            onMouseLeave={() => setHoveredEndpoint(null)}
          />
          {/* End endpoint */}
          <circle
            cx={endX}
            cy={endY}
            r={hoveredEndpoint === 'end' || dragTarget === 'end' ? 8 : 6}
            fill={lineData.line_end_attached_card_id ? '#22c55e' : (dragTarget === 'end' ? '#3b82f6' : '#ffffff')}
            stroke={lineData.line_end_attached_card_id ? '#22c55e' : '#3b82f6'}
            strokeWidth={2}
            style={{ pointerEvents: 'auto', cursor: 'move' }}
			onPointerDown={(e) => {
				e.stopPropagation();
			}}
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
				onPointerDown={(e) => {
					e.stopPropagation();
				}}
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
