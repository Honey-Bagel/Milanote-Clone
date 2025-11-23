'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { useCanvasStore } from '@/lib/stores/canvas-store';

interface CanvasContextMenuProps {
	isOpen: boolean;
	position: { x: number, y: number },
	onClose: () => void;
};

export default function CanvasContextMenu({ isOpen, position, onClose }: CanvasContextMenuProps) {
	const { selectAll } = useCanvasStore();
	const contextMenuRef = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		if (isOpen && contextMenuRef.current) {
			const menu = contextMenuRef.current;
			const rect = menu.getBoundingClientRect();
			const padding = 8;

			let x = position.x;
			let y = position.y;

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
	}, [isOpen, position.x, position.y]);

	useEffect(() => {
		const handleClickOutside = (ev: MouseEvent) => {
			if (contextMenuRef.current && !contextMenuRef.current.contains(ev.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [onClose]);

	const onSelectAll = (e: React.MouseEvent) => {
		e.preventDefault();
		selectAll();
	}

	if (!isOpen) return null;

	return (
		<div
			ref={contextMenuRef}
			className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]"
			style={{
				top: `${position.y}px`,
				left: `${position.x}px`
			}}
		>
			<button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<span>Add Note</span>
			</button>
			<Separator />
			<button onClick={onSelectAll} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<span>Select All</span>
			</button>
		</div>
	)
}