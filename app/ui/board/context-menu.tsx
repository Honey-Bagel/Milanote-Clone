'use client';

import { ContextMenuProps } from '@/lib/types';
import { Copy, Edit, Palette, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';

export default function ContextMenu({ isOpen, data, onClose }: ContextMenuProps) {
	const contextMenuRef = useRef<HTMLDivElement | null>(null);
	const { setEditingCardId, deleteCard } = useCanvasStore();

	useEffect(() => {
		const handleClickOutside = (ev: MouseEvent) => {
			if (contextMenuRef.current && !contextMenuRef.current.contains(ev.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	const handleEditButton = () => {
		setEditingCardId(data?.card?.id);
		onClose();
	};

	const handleDeleteButton = () => {
		deleteCard(data?.card?.id);
		onClose();
	}

	if (!isOpen) return null;

	return (
		<div
			ref={contextMenuRef}
			className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]"
			style={{ 
				top: `${data.position.y}px`, 
				left: `${data.position.x}px` 
			}}
		>
			<button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<Copy className="w-4 h-4" />
				<span>Duplicate</span>
			</button>
			<button onClick={handleEditButton} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<Edit className="w-4 h-4" />
				<span>Edit</span>
			</button>
			<button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<Palette className="w-4 h-4" />
				<span>Change Color</span>
			</button>
			<div className="border-t border-gray-200 my-2"></div>
			<button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<ArrowUp className="w-4 h-4" />
				<span>Bring Forward</span>
			</button>
			<button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<ArrowDown className="w-4 h-4" />
				<span>Send Backward</span>
			</button>
			<div className="border-t border-gray-200 my-2"></div>
			<button onClick={handleDeleteButton} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3">
				<Trash2 className="w-4 h-4" />
				<span>Delete</span>
			</button>
		</div>
	);
}