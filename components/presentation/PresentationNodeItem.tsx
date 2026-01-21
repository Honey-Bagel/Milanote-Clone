'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { PresentationNodeCard } from '@/lib/types';

interface PresentationNodeItemProps {
	node: PresentationNodeCard;
	index: number;
	isSelected: boolean;
	onSelect: () => void;
	onDelete: () => void;
}

export function PresentationNodeItem({
	node,
	index,
	isSelected,
	onSelect,
	onDelete,
}: PresentationNodeItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: node.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`
				group relative flex items-center gap-3 p-3 rounded-lg
				border transition-all cursor-pointer
				${isSelected
					? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-700'
					: 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
				}
				${isDragging ? 'opacity-50 shadow-lg' : ''}
			`}
			onClick={onSelect}
		>
			{/* Drag handle */}
			<button
				{...attributes}
				{...listeners}
				className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
				onClick={(e) => e.stopPropagation()}
			>
				<GripVertical size={16} className="text-gray-400" />
			</button>

			{/* Order number */}
			<div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
				{index + 1}
			</div>

			{/* Title */}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
					{node.presentation_title || `Slide ${index + 1}`}
				</p>
				<p className="text-xs text-gray-500 dark:text-gray-400">
					{node.presentation_transition_type} • {node.presentation_transition_duration}ms
				</p>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				{/* Delete */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
					title="Delete node"
				>
					<Trash2 size={14} className="text-red-600 dark:text-red-400" />
				</button>
			</div>
		</div>
	);
}
