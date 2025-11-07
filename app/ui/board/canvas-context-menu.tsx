'use client';

import { useEffect, useRef } from 'react';
import { Separator } from '@radix-ui/react-dropdown-menu';

interface CanvasContextMenuProps {
	isOpen: boolean;
	position: { x: number, y: number },
	onClose: () => void;
};

export default function CanvasContextMenu({ isOpen, position, onClose }: CanvasContextMenuProps) {
	const contextMenuRef = useRef<HTMLDivElement | null>(null);

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
				<span>Select All</span>
			</button>
			<Separator />
			<button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
				<span>Add Note</span>
			</button>
		</div>
	)
}