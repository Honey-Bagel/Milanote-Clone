'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { StickyNote, CheckSquare } from 'lucide-react';
import { getDefaultCardData, getDefaultCardDimensions } from '@/lib/utils';
import { cardsToOrderKeyList, getOrderKeyForNewCard } from '@/lib/utils/order-key-manager';
import { CardData } from '@/lib/types';

interface CanvasContextMenuProps {
	cards: Map<string, CardData>;
	isOpen: boolean;
	position: { x: number, y: number },
	onClose: () => void;
};

export default function CanvasContextMenu({ cards, isOpen, position, onClose }: CanvasContextMenuProps) {
	// const { selectAll } = useCanvasStore(); // TODO: Implement selectAll
	const contextMenuRef = useRef<HTMLDivElement | null>(null);
	const { selectAll } = useCanvasStore();

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
		const allCards = new Set(cards.keys());
		selectAll(allCards);
		console.log(allCards);
		onClose();
	}

	if (!isOpen) return null;

	return (
		<div
			ref={contextMenuRef}
			className="fixed bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 min-w-[220px] backdrop-blur-xl"
			style={{
				top: `${position.y}px`,
				left: `${position.x}px`
			}}
		>
			<button className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				<StickyNote className="w-4 h-4 text-slate-400" />
				<span>Add Note</span>
			</button>
			<div className="h-px bg-white/10 my-1.5"></div>
			<button onClick={onSelectAll} className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				<CheckSquare className="w-4 h-4 text-slate-400" />
				<span>Select All</span>
			</button>
		</div>
	)
}