/**
 * SelectionOutline Component
 *
 * A versatile selection outline that automatically sizes itself to match
 * the actual rendered content of a card, regardless of overflow.
 *
 * Uses ResizeObserver only (no MutationObserver) to avoid interfering with text selection.
 */

'use client';

import { useLayoutEffect, useRef, useState, memo } from 'react';

interface SelectionOutlineProps {
	/**
	 * Optional className for custom styling
	 */
	className?: string;
}

export const SelectionOutline = memo(function SelectionOutline({ className = '' }: SelectionOutlineProps) {
	const outlineRef = useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

	useLayoutEffect(() => {
		const outline = outlineRef.current;
		if (!outline) return;

		const parent = outline.parentElement;
		if (!parent) return;

		const updateDimensions = () => {
			// Find the CardBase or content wrapper that contains the actual content
			const cardBase = parent.querySelector('.card-base');

			if (cardBase) {
				// Get the first child of card-base which is the actual content
				const content = cardBase.firstElementChild as HTMLElement;
				if (content) {
					// Use offsetWidth/offsetHeight which includes padding and border
					const contentWidth = content.offsetWidth;
					const contentHeight = content.offsetHeight;

					// Also check parent's dimensions
					const parentWidth = parent.offsetWidth;
					const parentHeight = parent.offsetHeight;

					setDimensions(prev => {
						const newWidth = Math.max(contentWidth, parentWidth);
						const newHeight = Math.max(contentHeight, parentHeight);
						// Only update if dimensions actually changed
						if (prev?.width === newWidth && prev?.height === newHeight) {
							return prev;
						}
						return { width: newWidth, height: newHeight };
					});
					return;
				}
			}

			// Fallback: use parent's scroll dimensions (includes overflow)
			setDimensions(prev => {
				const newWidth = Math.max(parent.scrollWidth, parent.offsetWidth);
				const newHeight = Math.max(parent.scrollHeight, parent.offsetHeight);
				if (prev?.width === newWidth && prev?.height === newHeight) {
					return prev;
				}
				return { width: newWidth, height: newHeight };
			});
		};

		// Initial measurement
		updateDimensions();

		// Set up ResizeObserver - only observe the parent and card-base
		const resizeObserver = new ResizeObserver(() => {
			updateDimensions();
		});

		resizeObserver.observe(parent);

		// Also observe the card-base element if it exists
		const cardBase = parent.querySelector('.card-base');
		if (cardBase) {
			resizeObserver.observe(cardBase);
			// And its first child (the actual content)
			if (cardBase.firstElementChild) {
				resizeObserver.observe(cardBase.firstElementChild);
			}
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<div
			ref={outlineRef}
			className={`selection-outline-dynamic ${className}`}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: dimensions?.width ?? '100%',
				height: dimensions?.height ?? '100%',
				pointerEvents: 'none',
				border: '1px solid var(--primary)',
				borderRadius: 'inherit',
				boxSizing: 'border-box',
			}}
		/>
	);
});
