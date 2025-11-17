'use client';

import { LucideIcon } from 'lucide-react';
import { Card } from '@/lib/types';

interface DraggableToolbarButtonProps {
	icon: LucideIcon;
	title: string;
	cardType: Card['card_type'];
	onDragStart: (cardType: Card['card_type'], e: React.DragEvent) => void;
	onDragEnd: () => void;
	onClick: () => void;
}

export function DraggableToolbarButton({
	icon: Icon,
	title,
	cardType,
	onDragStart,
	onDragEnd,
	onClick,
}: DraggableToolbarButtonProps) {
	const handleDragStart = (e: React.DragEvent) => {
		onDragStart(cardType, e);
	};

	const handleDragEnd = () => {
		onDragEnd();
	};

	return (
		<button
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onClick={onClick}
			className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200 transition-colors cursor-grab active:cursor-grabbing"
		style={{
		outline: "none"
		}}
			title={title}
		>
			<Icon className="w-4 h-4" />
		</button>
	);
}