'use client';

import { useState, useCallback, useRef } from 'react';

const MAX_WIDTH = 800;
const MIN_WIDTH = 280; // Minimum usable width
const CLOSE_THRESHOLD = 100; // If resized below this width, close the drawer

export function useDrawerResize(
	initialWidth: number,
	onWidthChange: (width: number) => void,
	onShouldClose?: () => void
) {
	const [isResizing, setIsResizing] = useState(false);
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setIsResizing(true);
		startXRef.current = e.clientX;
		startWidthRef.current = initialWidth;

		const handleMouseMove = (e: MouseEvent) => {
			// Calculate delta from RIGHT side (inverted because drawer is on right)
			const deltaX = startXRef.current - e.clientX;
			const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + deltaX));

			onWidthChange(newWidth);
		};

		const handleMouseUp = () => {
			setIsResizing(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);

			// Check if drawer should close based on final width
			const deltaX = startXRef.current - e.clientX;
			const finalWidth = Math.min(MAX_WIDTH, startWidthRef.current + deltaX);

			if (finalWidth < CLOSE_THRESHOLD && onShouldClose) {
				onShouldClose();
			}
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, [initialWidth, onWidthChange, onShouldClose]);

	return { isResizing, handleMouseDown };
}
