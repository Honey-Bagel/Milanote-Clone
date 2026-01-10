/**
 * Line Curvature Constraints
 * 
 * Validates and constrains curve parameters to prevent visual artifacts
 */

import { calculateLocalFrame, controlVectorToCubicBezier, type CurveControl, type Point } from "./bezier-curve";

/**
 * Constrains curvature to prevent visual artifacts
 * 
 * Prevents:
 * - Flips
 * - Kinks
 * - Loops
 * 
 * @param start - Start point of the line
 * @param end - End point of the line
 * @param control - Curve control parameters
 * @returns Constrained curve control parameters
 */
export function constrainCurveControl(
	start: Point,
	end: Point,
	control: CurveControl
): CurveControl {
	const frame = calculateLocalFrame(start, end);

	// If line has zero length, no constraints needed
	if (frame.length === 0) {
		return { curvature: 0, directionalBias: 0 };
	}

	// Loop prevention
	const maxCurvature = frame.length * 2.0;
	let curvature = Math.max(-maxCurvature, Math.min(maxCurvature, control.curvature));

	// Flip prevention
	const { cp1, cp2 } = controlVectorToCubicBezier(start, end, {
		curvature,
		directionalBias: control.directionalBias
	});

	// Use cross product to check if control points are on opposite sides of the line
	const lineVec = { x: end.x - start.x, y: end.y - start.y };
	const cp1Vec = { x: cp1.x - start.x, y: cp1.y - start.y };
	const cp2Vec = { x: cp2.x - end.x, y: cp2.y - end.y };

	const cross1 = lineVec.x * cp1Vec.y - lineVec.y * cp1Vec.x;
	const cross2 = lineVec.x * cp2Vec.y - lineVec.y * cp2Vec.x;

	if (cross1 * cross2 < 0 && Math.abs(curvature) > 0.1) {
		curvature *= 0.7;
	}

	// Kink prevention
	let directionalBias = control.directionalBias;

	const { cp1: finalCp1, cp2: finalCp2 } = controlVectorToCubicBezier(start, end, {
		curvature,
		directionalBias
	});

	const t1Angle = Math.atan2(finalCp1.y - start.y, finalCp1.x - start.x);
	const t2Angle = Math.atan2(end.y - finalCp2.y, end.x - finalCp2.x);
	const lineAngle = Math.atan2(end.y - start.y, end.x - start.x);

	const maxDeviation = Math.PI * 0.7;

	// Normalize angles to [-PI, PI]
	const normalizeDiff = (angle: number) => {
		while (angle > Math.PI) angle -= 2 * Math.PI;
		while (angle < -Math.PI) angle += 2 * Math.PI;
		return Math.abs(angle);
	};
	
	const dev1 = normalizeDiff(t1Angle - lineAngle);
	const dev2 = normalizeDiff(t2Angle - lineAngle);

	if (dev1 > maxDeviation || dev2 > maxDeviation) {
		directionalBias *= 0.8;
	}

	return { curvature, directionalBias };
}

/**
 * Detects if a curve has visual problems
 * Useful for debugging and testing
 *
 * @returns Object indicating which problems are present
 */
export function detectCurveProblems(
	start: Point,
	end: Point,
	control: CurveControl
): { hasKink: boolean; hasFlip: boolean; hasLoop: boolean } {
   const frame = calculateLocalFrame(start, end);

   if (frame.length === 0) {
     return { hasKink: false, hasFlip: false, hasLoop: false };
   }

   const { cp1, cp2 } = controlVectorToCubicBezier(start, end, control);

   // Check flip
   const lineVec = { x: end.x - start.x, y: end.y - start.y };
   const cp1Vec = { x: cp1.x - start.x, y: cp1.y - start.y };
   const cp2Vec = { x: cp2.x - end.x, y: cp2.y - end.y };

   const cross1 = lineVec.x * cp1Vec.y - lineVec.y * cp1Vec.x;
   const cross2 = lineVec.x * cp2Vec.y - lineVec.y * cp2Vec.x;
   const hasFlip = cross1 * cross2 < 0 && Math.abs(control.curvature) > 0.1;

   // Check loop
   const maxCurvature = frame.length * 2.0;
   const hasLoop = Math.abs(control.curvature) > maxCurvature;

   // Check kink
   const t1Angle = Math.atan2(cp1.y - start.y, cp1.x - start.x);
   const t2Angle = Math.atan2(end.y - cp2.y, end.x - cp2.x);
   const lineAngle = Math.atan2(end.y - start.y, end.x - start.x);
   const maxDeviation = Math.PI * 0.7;

   const normalizeDiff = (angle: number) => {
     while (angle > Math.PI) angle -= 2 * Math.PI;
     while (angle < -Math.PI) angle += 2 * Math.PI;
     return Math.abs(angle);
   };

   const hasKink = normalizeDiff(t1Angle - lineAngle) > maxDeviation ||
                   normalizeDiff(t2Angle - lineAngle) > maxDeviation;

   return { hasKink, hasFlip, hasLoop };
 }