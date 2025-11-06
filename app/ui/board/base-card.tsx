'use client';

import { Group, Rect } from 'react-konva';
import { useState, useRef } from 'react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { updateCardTransform } from '@/lib/data/cards-client';

export interface BaseCardProps {
	id: string;
	x: number;
	y: number;
	width?: number;
	height?: number;
	backgroundColor?: string;
	borderColor?: string;
	borderWidth?: number;
	cornerRadius?: number;
	children?: React.ReactNode;
	onDragEnd?: (id: string, x: number, y: number) => void;
	onClick?: (id: string) => void;
	onDoubleClick?: (id: string) => void;
	onContextMenu?: (id: string, x: number, y: number) => void;
	isSelected?: boolean;
	isDeletable?: boolean;
	draggable?: boolean; // Allow parent to control draggability
}

export default function BaseCard({
	id,
	x,
	y,
	width = 250,
	height = 200,
	backgroundColor = 'rgba(31, 41, 55, 1)', // gray-800
	borderColor = 'rgba(55, 65, 81, 1)', // gray-700
	borderWidth = 1,
	cornerRadius = 12,
	children,
	onDragEnd,
	onClick,
	onDoubleClick,
	onContextMenu,
	isSelected = false,
	isDeletable = true,
	draggable = true
}: BaseCardProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const groupRef = useRef<Konva.Group>(null);

	const handleDragStart = () => {
		setIsDragging(true);
	};

	const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
		setIsDragging(false);
		if (onDragEnd) {
			e.currentTarget.width()
			onDragEnd(id, e.target.x(), e.target.y());
		}

		const group = e.target as Konva.Group
		
		updateCardTransform(id, {
			position_x: e.target.x(),
			position_y: e.target.y(),
			width: width,
			height: height,
			z_index: group.zIndex()
		});
	};

	const handleClick = (e: KonvaEventObject<MouseEvent>) => {
		// Prevent click when dragging
		if (isDragging) return;

		if (onClick) {
			onClick(id);
		}
	};

	const handleDoubleClick = (e: KonvaEventObject<MouseEvent>) => {
		if (onDoubleClick) {
			onDoubleClick(id);
		}
	};

	const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
		e.evt.preventDefault();
		if (onContextMenu) {
			const stage = e.target.getStage();
			const pointerPosition = stage?.getPointerPosition();
			if (pointerPosition) {
				onContextMenu(id, pointerPosition.x, pointerPosition.y);
			}
		}
	};

	const handleMouseEnter = () => {
		setIsHovered(true);
		// Change cursor based on draggability
		const stage = groupRef.current?.getStage();
		if (stage) {
			stage.container().style.cursor = draggable ? 'move' : 'default';
		}
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
		// Reset cursor
		const stage = groupRef.current?.getStage();
		if (stage) {
			stage.container().style.cursor = 'default';
		}
	};

	// Calculate shadow based on state
	const shadowConfig = {
		shadowColor: 'black',
		shadowBlur: isDragging ? 20 : isHovered ? 10 : 5,
		shadowOpacity: isDragging ? 0.3 : isHovered ? 0.2 : 0.1,
		shadowOffsetY: isDragging ? 8 : isHovered ? 4 : 2
	};

	// Selection border color
	const displayBorderColor = isSelected ? '#3b82f6' : borderColor;
	const displayBorderWidth = isSelected ? 2 : borderWidth;

	return (
		<Group
			ref={groupRef}
			id={id}
			x={x}
			y={y}
			draggable={draggable}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onClick={handleClick}
			onTap={handleClick}
			onDblClick={handleDoubleClick}
			onDblTap={handleDoubleClick}
			onContextMenu={handleContextMenu}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Card background */}
			<Rect
				width={width}
				height={height}
				fill={backgroundColor}
				stroke={displayBorderColor}
				strokeWidth={displayBorderWidth}
				cornerRadius={cornerRadius}
				{...shadowConfig}
			/>

			{/* Hover overlay */}
			{isHovered && !isDragging && (
				<Rect
					width={width}
					height={height}
					fill="rgba(255, 255, 255, 0.03)"
					cornerRadius={cornerRadius}
					listening={false} // Don't capture events
				/>
			)}

			{/* Dragging Overlay */}
			{isDragging && (
				<Rect
					width={width}
					height={height}
					fill="rgba(255, 255, 255, 0.05)"
					cornerRadius={cornerRadius}
					listening={false}
				/>
			)}

			{/* Children content */}
			{children}
		</Group>
	);
}

// Export a custom hook for managing card state
export function useCard(initialX: number, initialY: number) {
	const [position, setPosition] = useState({ x: initialX, y: initialY });
	const [isSelected, setIsSelected] = useState(false);

	const handleDragEnd = (id: string, x: number, y: number) => {
		setPosition({ x, y });
		// TODO: save to db
	};

	const handleClick = (id: string) => {
		setIsSelected(!isSelected);
	};

	return {
		position,
		isSelected,
		setPosition,
		setIsSelected,
		handleDragEnd,
		handleClick
	};
}