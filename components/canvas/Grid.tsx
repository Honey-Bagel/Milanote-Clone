/**
 * Grid Component
 * 
 * Renders the background grid pattern that moves with the canvas
 */

'use client';

interface GridProps {
	/**
	 * Grid cell size in pixels
	 * @default 20
	 */
	gridSize?: number;
	
	/**
	 * Grid color
	 * @default '#e5e7eb'
	 */
	gridColor?: string;
	
	/**
	 * Grid opacity
	 * @default 0.5
	 */
	opacity?: number;
}

export function Grid({
	gridSize = 20,
	gridColor = '#e5e7eb',
	opacity = 0.5,
}: GridProps) {

	const gridExtent = 10000


	return (
		<div
			className="grid pointer-events-none"
			style={{
				position: 'absolute',
				top: -gridExtent / 2,
				left: -gridExtent / 2,
				width: `${gridExtent}px`,
				height: `${gridExtent}px`,
				backgroundImage: `
					linear-gradient(${gridColor} 1px, transparent 1px),
					linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
				`,
				backgroundSize: `${gridSize}px ${gridSize}px`,
				opacity,
			}}
		/>
	);
}