/**
 * useDirectDimensionMeasurement Hook
 *
 * Directly measures an element's bounding box without state intermediaries.
 * This provides immediate dimension updates for visual feedback (like selection outlines)
 * without waiting for React state propagation.
 *
 * Usage:
 * const { ref, dimensions } = useDirectDimensionMeasurement(isSelected);
 * <div ref={ref}>content</div>
 * {dimensions && <SelectionOutline dimensions={dimensions} />}
 */

'use client';

import { useRef, useState, useLayoutEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DirectDimensions {
	width: number;
	height: number;
	x: number;
	y: number;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Directly measures an element's dimensions using ResizeObserver and getBoundingClientRect.
 * Updates immediately when the element's size changes, bypassing React state propagation delays.
 *
 * @param enabled - Whether measurement is active (set to false to disable for performance)
 * @returns Object containing ref to attach to element and current dimensions
 */
export function useDirectDimensionMeasurement(
	enabled: boolean = true,
	zoom: number = 1
): {
	ref: React.RefObject<HTMLDivElement>;
	dimensions: DirectDimensions | null;
} {
	const ref = useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = useState<DirectDimensions | null>(null);

	useLayoutEffect(() => {
		if (!enabled || !ref.current) {
			return;
		}

		const element = ref.current;

		// Measurement function
		const measure = () => {
			const rect = element.getBoundingClientRect();
			const parentRect = element.offsetParent?.getBoundingClientRect();

			const newDimensions = {
				width: rect.width / zoom,
				height: rect.height / zoom,
				x: parentRect ? rect.left - parentRect.left : 0,
				y: parentRect ? rect.top - parentRect.top : 0,
			};

			// Only update if dimensions actually changed (avoid unnecessary re-renders)
			setDimensions(prev => {
				if (!prev ||
					prev.width !== newDimensions.width ||
					prev.height !== newDimensions.height ||
					prev.x !== newDimensions.x ||
					prev.y !== newDimensions.y
				) {
					return newDimensions;
				}
				return prev;
			});
		};

		// Initial measurement (synchronous)
		measure();

		// Set up ResizeObserver for subsequent changes
		const observer = new ResizeObserver((entries) => {
			// Use requestAnimationFrame to ensure smooth updates
			requestAnimationFrame(() => {
				measure();
			});
		});

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [enabled, zoom]);

	// Clear dimensions when disabled
	useLayoutEffect(() => {
		if (!enabled) {
			setDimensions(null);
		}
	}, [enabled]);

	return { ref, dimensions };
}
