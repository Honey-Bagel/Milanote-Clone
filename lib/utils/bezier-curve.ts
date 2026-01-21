/**
 * Constrained Cubic Bézier Curve Utilities
 *
 * This module implements a 2-DOF (two degrees of freedom) control system for cubic Bézier curves.
 * Instead of directly manipulating control points, users manipulate curvature and directional bias
 * in the line's local tangent/normal frame, producing smooth, elastic Milanote-style curves.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * 2-DOF Control Vector in the line's local tangent/normal frame
 *
 * @param curvature - Controls how much the curve bends (magnitude in pixels)
 *                    Unrestricted range where 0 = straight line
 *                    The curve will bend to follow the control handle position
 *
 * @param directionalBias - Controls asymmetry of the curve (where the bend occurs)
 *                          Unrestricted, where 0 = symmetric curve
 *                          Positive = bias toward end point
 *                          Negative = bias toward start point
 */
export interface CurveControl {
  curvature: number;
  directionalBias: number;
}

/**
 * Local coordinate frame for the line
 * Tangent points from start to end
 * Normal is perpendicular (90° counterclockwise from tangent)
 */
interface LocalFrame {
  tangent: Point;      // Unit vector along the line
  normal: Point;       // Unit vector perpendicular to the line
  length: number;      // Distance between start and end
}

/**
 * Calculate the local tangent/normal frame for a line segment
 */
export function calculateLocalFrame(start: Point, end: Point): LocalFrame {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return {
      tangent: { x: 1, y: 0 },
      normal: { x: 0, y: 1 },
      length: 0
    };
  }

  // Tangent unit vector (direction from start to end)
  const tangent = {
    x: dx / length,
    y: dy / length
  };

  // Normal unit vector (90° counterclockwise rotation)
  const normal = {
    x: -tangent.y,
    y: tangent.x
  };

  return { tangent, normal, length };
}

/**
 * Convert 2-DOF control vector to cubic Bézier control points
 *
 * This is the core algorithm that generates smooth, predictable curves.
 * The control points are derived from:
 * - The local tangent/normal frame
 * - Curvature (how much to bend)
 * - Directional bias (where to bend)
 *
 * The curve maintains C1 continuity (smooth tangent) at endpoints.
 */
export function controlVectorToCubicBezier(
  start: Point,
  end: Point,
  control: CurveControl,
  startTangentDist?: number,  // Optional override for start tangent distance
  endTangentDist?: number      // Optional override for end tangent distance
): { cp1: Point; cp2: Point } {
  const frame = calculateLocalFrame(start, end);

  if (frame.length === 0) {
    return { cp1: start, cp2: end };
  }

  // Don't clamp control values - allow unrestricted movement
  const curvature = control.curvature;
  const bias = control.directionalBias;

  // Calculate the desired handle position
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };

  const handlePos = {
    x: midpoint.x + frame.normal.x * curvature + frame.tangent.x * bias * frame.length * 0.25,
    y: midpoint.y + frame.normal.y * curvature + frame.tangent.y * bias * frame.length * 0.25
  };

  // Milanote approach: Smoother, more rounded curves that pass through the handle
  //
  // For a cubic Bézier with symmetric control points placed as:
  // CP1 = start + tangent_offset + perpendicular_offset
  // CP2 = end - tangent_offset + perpendicular_offset
  //
  // The curve at t=0.5 is: B(0.5) = (start + 3*CP1 + 3*CP2 + end) / 8
  //
  // For the curve to pass through handlePos at t=0.5, we need:
  // (start + 3*(start + t_offset + p_offset) + 3*(end - t_offset + p_offset) + end) / 8 = handlePos
  // (4*start + 4*end + 6*p_offset) / 8 = handlePos
  // 6*p_offset / 8 = handlePos - (start + end) / 2
  // p_offset = (4/3) * (handlePos - midpoint)

  // Use dynamic distances if provided, otherwise default to 1/3
  const tangentDistanceStart = startTangentDist ?? frame.length / 3;
  const tangentDistanceEnd = endTangentDist ?? frame.length / 3;

  // Scale the offset vector so the curve passes exactly through the handle
  const offsetVector = {
    x: (4/3) * (handlePos.x - midpoint.x),
    y: (4/3) * (handlePos.y - midpoint.y)
  };

  const cp1 = {
    x: start.x + frame.tangent.x * tangentDistanceStart + offsetVector.x,
    y: start.y + frame.tangent.y * tangentDistanceStart + offsetVector.y
  };

  const cp2 = {
    x: end.x - frame.tangent.x * tangentDistanceEnd + offsetVector.x,
    y: end.y - frame.tangent.y * tangentDistanceEnd + offsetVector.y
  };

  return { cp1, cp2 };
}

/**
 * Convert legacy control point offset to new 2-DOF model
 *
 * For backward compatibility with existing quadratic curves.
 * Maps the single perpendicular offset to curvature.
 */
export function offsetToCurveControl(
  offset: number,
  lineLength: number
): CurveControl {
  if (lineLength === 0) {
    return { curvature: 0, directionalBias: 0 };
  }

  // For quadratic curves, the offset was perpendicular from midpoint
  // We need to scale it to match the new cubic model
  // Quadratic curve height ≈ 2x cubic curve height for same visual effect
  const curvature = offset * 2;

  // Legacy offset creates symmetric curves (no bias)
  return {
    curvature,
    directionalBias: 0
  };
}

/**
 * Convert a drag position on the control handle to a 2-DOF control vector
 *
 * This is used during interactive editing. The user drags a handle, and we
 * need to convert that screen position to curvature and bias parameters.
 *
 * @param start - Start point of the line
 * @param end - End point of the line
 * @param handlePosition - Current position of the dragged handle
 * @returns The corresponding CurveControl
 */
export function handlePositionToCurveControl(
  start: Point,
  end: Point,
  handlePosition: Point
): CurveControl {
  const frame = calculateLocalFrame(start, end);

  if (frame.length === 0) {
    return { curvature: 0, directionalBias: 0 };
  }

  // Get midpoint of the line
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };

  // Vector from midpoint to handle
  const dx = handlePosition.x - midpoint.x;
  const dy = handlePosition.y - midpoint.y;

  // Project onto normal to get curvature (no clamping, no scaling)
  const normalProjection = dx * frame.normal.x + dy * frame.normal.y;
  const curvature = normalProjection;

  // Project onto tangent to get bias (no clamping)
  const tangentProjection = dx * frame.tangent.x + dy * frame.tangent.y;
  const directionalBias = tangentProjection / (frame.length * 0.25);

  return { curvature, directionalBias };
}

/**
 * Convert 2-DOF control vector to handle position for UI
 *
 * Inverse of handlePositionToCurveControl - used to position the control handle
 * when rendering based on stored curvature/bias values.
 */
export function curveControlToHandlePosition(
  start: Point,
  end: Point,
  control: CurveControl
): Point {
  const frame = calculateLocalFrame(start, end);

  if (frame.length === 0) {
    return start;
  }

  // Start at midpoint
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };

  // Offset by curvature (normal direction, no scaling)
  const normalOffset = control.curvature;

  // Offset by bias (tangent direction)
  const tangentOffset = control.directionalBias * frame.length * 0.25;

  return {
    x: midpoint.x + frame.normal.x * normalOffset + frame.tangent.x * tangentOffset,
    y: midpoint.y + frame.normal.y * normalOffset + frame.tangent.y * tangentOffset
  };
}

/**
 * Generate SVG path for a cubic Bézier curve
 */
export function generateCubicBezierPath(
  start: Point,
  end: Point,
  control: CurveControl
): string {
  // Handle straight line case
  if (Math.abs(control.curvature) < 0.001) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const { cp1, cp2 } = controlVectorToCubicBezier(start, end, control);

  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}
