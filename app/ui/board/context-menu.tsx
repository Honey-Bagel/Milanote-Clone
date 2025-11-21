'use client';

import { ContextMenuProps } from '@/lib/types';
import { Copy, Edit, Palette, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { GetCardTypeContextMenu } from '@/components/canvas/cards/CardComponentContextMenus';

export default function ContextMenu({ isOpen, data, onClose }: ContextMenuProps) {
	const contextMenuRef = useRef<HTMLDivElement | null>(null);
	const { setEditingCardId, deleteCard, bringToFront, sendToBack } = useCanvasStore();

	useLayoutEffect(() => {
		if (isOpen && contextMenuRef.current) {
			const menu = contextMenuRef.current;
			const rect = menu.getBoundingClientRect();
			const padding = 8;

			let x = data.position.x;
			let y = data.position.y;

			if (x + rect.width > window.innerWidth - padding) {
				x = window.innerWidth - rect.width - padding;
			}
			if (y + rect.height > window.innerHeight - padding) {
				y = window.innerHeight - rect.height - padding;
			}
			if (x < padding) x = padding;
			if (y < padding) y = padding;

			menu.style.top = `${y}px`;
			menu.style.left = `${x}px`;
		}
	}, [isOpen, data.position.x, data.position.y]);

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
		setEditingCardId(data?.card?.id || null);
		onClose();
	};

	const handleDeleteButton = () => {
		deleteCard(data?.card?.id);
		onClose();
	};

	const handleBringToFront = () => {
		bringToFront(data?.card?.id);
		onClose();
	};

	const handleSendToBack = () => {
		sendToBack(data?.card?.id);
		onClose();
	};

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
			{data.card && (
				GetCardTypeContextMenu(data.card, onClose)
			)}
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
			<button onClick={handleBringToFront} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<ArrowUp className="w-4 h-4" />
				<span>Bring Forward</span>
			</button>
			<button onClick={handleSendToBack} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
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