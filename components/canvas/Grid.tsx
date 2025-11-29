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


	// {/* Normal Grid */}
	// return (
	// 	<div
	// 		className="grid opacity-20 pointer-events-none"
	// 		style={{
	// 			position: 'absolute',
	// 			top: -gridExtent / 2,
	// 			left: -gridExtent / 2,
	// 			width: `${gridExtent}px`,
	// 			height: `${gridExtent}px`,
	// 			backgroundImage: `
	// 				linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)
	// 			`,
	// 			backgroundSize: `${gridSize}px ${gridSize}px`,
	// 			opacity,
	// 		}}
	// 	/>
	// );

	{/* Dot Grid */}
	// Shift background by half gridSize so dots align with snap points
	// If cards are snapping to the center of squares, we need to shift dots by -gridSize/2
	const backgroundOffset = -gridSize / 2;

	return (
		<div
			className="grid opacity-20 pointer-events-none"
			style={{
			position: 'absolute',
			top: -gridExtent / 2,
			left: -gridExtent / 2,
			width: `${gridExtent}px`,
			height: `${gridExtent}px`,
			backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
			backgroundSize: `${gridSize}px ${gridSize}px`,
			backgroundPosition: `${backgroundOffset}px ${backgroundOffset}px`,
			}}
		/>
	);
}

// backgroundImage: `radial-gradient(circle, ${gridColor} 1px, transparent 1px)
// Change the grid color if I do radial