'use client';

import { ContextMenuProps } from '@/lib/types';
import { Copy, Edit, Palette, ArrowUp, ArrowDown, Trash2, Lock, Unlock } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { GetCardTypeContextMenu } from '@/components/canvas/cards/CardComponentContextMenus';
import { deleteCard as deleteCardDB, duplicateCard } from '@/lib/instant/card-mutations';
import { useUndoStore } from '@/lib/stores/undo-store';
import { CardService } from '@/lib/services/card-service';

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
		const cardId = data?.card?.id;
		const boardId = data?.card?.board_id;

		if (!cardId || !boardId) return;

		// Store card data for undo and cascade delete
		const cardToDelete = data.card;

		// Delete from database (no await for instant UI update)
		deleteCardDB(cardId, boardId, cardToDelete);

		// Update UI state (remove from selection, etc.)
		deleteCard(cardId);

		// Add undo action (skip redo for deletes - complex)
		useUndoStore.getState().addAction({
			type: 'card_delete',
			timestamp: Date.now(),
			description: `Delete card ${cardId}`,
			do: () => deleteCardDB(cardId, boardId, cardToDelete),
			undo: async () => {
				// Restore would require re-creating with same ID
				// Can implement in later phase or skip
				console.warn('Undo delete not yet implemented');
			},
		});

		onClose();
	};

	const handleDuplicateButton = async () => {
		const card = data?.card;

		if (!card) return;

		// Duplicate card with a 20px offset
		await duplicateCard(card, { x: 20, y: 20 });

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

	const handleToggleLock = async () => {
		const card = data?.card;
		const boardId = data?.card?.board_id;

		if (!card || !boardId) return;

		const newLockedState = !card.is_position_locked;

		CardService.toggleCardPositionLock(
			card.id,
			boardId,
			newLockedState
		);

		onClose();
	};

	if (!isOpen) return null;

	return (
		<div
			ref={contextMenuRef}
			className="fixed bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 min-w-[220px] backdrop-blur-xl"
			style={{
				top: `${data.position.y}px`,
				left: `${data.position.x}px`
			}}
		>
			{data.card && (
				GetCardTypeContextMenu(data.card, onClose)
			)}
			<button onClick={handleDuplicateButton} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				<Copy className="w-4 h-4 text-secondary-foreground" />
				<span>Duplicate</span>
			</button>
			<button onClick={handleEditButton} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				<Edit className="w-4 h-4 text-secondary-foreground" />
				<span>Edit</span>
			</button>
			<button className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				<Palette className="w-4 h-4 text-secondary-foreground" />
				<span>Change Color</span>
			</button>
			<div className="h-px bg-white/10 my-1.5"></div>
			<button onClick={handleBringToFront} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				<ArrowUp className="w-4 h-4 text-secondary-foreground" />
				<span>Bring Forward</span>
			</button>
			<button onClick={handleSendToBack} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				<ArrowDown className="w-4 h-4 text-secondary-foreground" />
				<span>Send Backward</span>
			</button>
			<div className="h-px bg-white/10 my-1.5"></div>
			<button onClick={handleToggleLock} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors">
				{data.card?.is_position_locked ? (
					<>
						<Unlock className="w-4 h-4 text-secondary-foreground" />
						<span>Unlock Position</span>
					</>
				) : (
					<>
						<Lock className="w-4 h-4 text-secondary-foreground" />
						<span>Lock Position</span>
					</>
				)}
			</button>
			<div className="h-px bg-white/10 my-1.5"></div>
			<button onClick={handleDeleteButton} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-colors">
				<Trash2 className="w-4 h-4" />
				<span>Delete</span>
			</button>
		</div>
	);
}