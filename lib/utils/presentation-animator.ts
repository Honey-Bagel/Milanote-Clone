import type { Viewport } from '@/lib/stores/canvas-store';
import type { PresentationNodeCard } from '@/lib/types';

// Easing functions
export const EASING_FUNCTIONS = {
	linear: (t: number) => t,
	'ease-in-out': (t: number) =>
		t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
	'ease-in': (t: number) => t * t,
	'ease-out': (t: number) => 1 - (1 - t) * (1 - t),
};

export interface AnimationOptions {
	duration: number; // milliseconds
	easingType: keyof typeof EASING_FUNCTIONS;
	curvePath?: {
		controlPoint1X: number;
		controlPoint1Y: number;
		controlPoint2X: number;
		controlPoint2Y: number;
	};
	onUpdate: (viewport: Viewport) => void;
	onComplete: () => void;
}

export class CameraAnimator {
	private animationFrame: number | null = null;
	private startTime: number = 0;

	/**
	 * Animate camera from current viewport to target node position
	 */
	animate(
		fromViewport: Viewport,
		toNode: PresentationNodeCard,
		options: AnimationOptions
	): void {
		this.cancel(); // Cancel any existing animation

		const startViewport = { ...fromViewport };
		// Use node's canvas position (position_x/y) as the center target
		// Node is 40x40px, so we center the node's center point (position + 20)
		const nodeCenterX = toNode.position_x + 20;
		const nodeCenterY = toNode.position_y + 20;
		const targetViewport: Viewport = {
			x: -nodeCenterX * toNode.presentation_target.zoom + window.innerWidth / 2,
			y: -nodeCenterY * toNode.presentation_target.zoom + window.innerHeight / 2,
			zoom: toNode.presentation_target.zoom,
		};

		this.startTime = performance.now();

		const tick = (currentTime: number) => {
			const elapsed = currentTime - this.startTime;
			const progress = Math.min(elapsed / options.duration, 1);

			// Apply easing
			const easedProgress = EASING_FUNCTIONS[options.easingType](progress);

			// Interpolate viewport
			let interpolatedViewport: Viewport;

			if (options.curvePath) {
				// Use Bezier curve for camera path
				interpolatedViewport = this.interpolateAlongCurve(
					startViewport,
					targetViewport,
					options.curvePath,
					easedProgress
				);
			} else {
				// Linear interpolation
				interpolatedViewport = {
					x: this.lerp(startViewport.x, targetViewport.x, easedProgress),
					y: this.lerp(startViewport.y, targetViewport.y, easedProgress),
					zoom: this.lerp(startViewport.zoom, targetViewport.zoom, easedProgress),
				};
			}

			options.onUpdate(interpolatedViewport);

			if (progress < 1) {
				this.animationFrame = requestAnimationFrame(tick);
			} else {
				options.onComplete();
				this.animationFrame = null;
			}
		};

		this.animationFrame = requestAnimationFrame(tick);
	}

	/**
	 * Cancel ongoing animation
	 */
	cancel(): void {
		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
	}

	/**
	 * Linear interpolation
	 */
	private lerp(start: number, end: number, t: number): number {
		return start + (end - start) * t;
	}

	/**
	 * Interpolate camera position along a Bezier curve
	 */
	private interpolateAlongCurve(
		start: Viewport,
		end: Viewport,
		curve: {
			controlPoint1X: number;
			controlPoint1Y: number;
			controlPoint2X: number;
			controlPoint2Y: number;
		},
		t: number
	): Viewport {
		// Cubic Bezier interpolation for X and Y
		// P(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3

		const t2 = t * t;
		const t3 = t2 * t;
		const mt = 1 - t;
		const mt2 = mt * mt;
		const mt3 = mt2 * mt;

		const x =
			mt3 * start.x +
			3 * mt2 * t * curve.controlPoint1X +
			3 * mt * t2 * curve.controlPoint2X +
			t3 * end.x;

		const y =
			mt3 * start.y +
			3 * mt2 * t * curve.controlPoint1Y +
			3 * mt * t2 * curve.controlPoint2Y +
			t3 * end.y;

		// Zoom interpolates linearly
		const zoom = this.lerp(start.zoom, end.zoom, t);

		return { x, y, zoom };
	}
}
