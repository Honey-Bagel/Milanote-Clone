'use client';

import { useOptionalCardContext } from './CardContext';
import type { PresentationNodeCard } from '@/lib/types';
import { Camera } from 'lucide-react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useBoardStore } from '@/lib/stores/board-store';

export function PresentationNodeComponent() {
	const context = useOptionalCardContext();
	const card = context?.card as PresentationNodeCard;
	const isSelected = context?.isSelected ?? false;
	const { presentationMode } = useCanvasStore();
	const { presentationSidebarOpen, setSelectedPresentationNodeId } = useBoardStore();

	// Hide if sidebar closed OR in presentation playback mode
	if (!presentationSidebarOpen || presentationMode.isActive) {
		return null;
	}

	const isCurrentNode =
		presentationMode.nodeSequence[presentationMode.currentNodeIndex] === card.id;

	const handleDoubleClick = () => {
		// Snap viewport to center on this node
		// Node is 40x40px, so we center the node's center point (position + 20)
		const nodeCenterX = card.position_x + 20;
		const nodeCenterY = card.position_y + 20;
		const targetViewport = {
			x: -nodeCenterX * card.presentation_target.zoom + window.innerWidth / 2,
			y: -nodeCenterY * card.presentation_target.zoom + window.innerHeight / 2,
			zoom: card.presentation_target.zoom,
		};
		useCanvasStore.getState().setViewport(targetViewport);

		// Select this node in sidebar
		setSelectedPresentationNodeId(card.id);
	};

	return (
		<div
			onDoubleClick={handleDoubleClick}
			className={`
				group relative w-10 h-10 rounded-full flex items-center justify-center
				bg-gradient-to-br from-indigo-500 to-purple-600
				border-2 ${isSelected ? 'border-yellow-400' : 'border-white/30'}
				shadow-lg cursor-pointer transition-all
				${isCurrentNode ? 'ring-4 ring-yellow-400/50' : ''}
			`}
		>
			{/* Order number badge */}
			<div
				className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full
							flex items-center justify-center text-xs font-bold text-indigo-600
							shadow-md"
			>
				{card.presentation_order + 1}
			</div>

			{/* Camera icon */}
			<Camera size={20} className="text-white" />

			{/* Title tooltip on hover */}
			{card.presentation_title && (
				<div
					className="absolute top-12 left-1/2 -translate-x-1/2
								bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap
								opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
								z-50 shadow-lg"
				>
					{card.presentation_title}
				</div>
			)}
		</div>
	);
}
