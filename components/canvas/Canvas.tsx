'use client';

import { useRef, useEffect, useState } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { createViewportMatrix } from '@/lib/utils/transform';
import { useCanvasInteractions } from '@/lib/hooks/useCanvasInteractions';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSelectionBox } from '@/lib/hooks/useSelectionBox';
import { Grid } from './Grid';
import { CanvasElement } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import type { Card } from '@/lib/types';
import { forEach, type Editor } from '@tiptap/react';
import ElementToolbar from '@/app/ui/board/element-toolbar';
import TextEditorToolbar from '@/app/ui/board/text-editor-toolbar';
import ContextMenu from '@/app/ui/board/context-menu';
import CanvasContextMenu from '@/app/ui/board/canvas-context-menu';
import { useCanvasDrop } from '@/lib/hooks/useCanvasDrop';
import { getCanvasCards } from "@/lib/utils/canvas-render-helper";

interface CanvasProps {
	initialCards?: Card[];
	boardId: string | null;
	className?: string;
	enablePan?: boolean;
	enableZoom?: boolean;
	enableKeyboardShortcuts?: boolean;
	enableSelectionBox?: boolean;
	onCardClick?: (cardId: string) => void;
	onCardDoubleClick?: (cardId: string) => void;
}

export function Canvas({
	initialCards = [],
	boardId,
	className = '',
	enablePan = true,
	enableZoom = true,
	enableKeyboardShortcuts = true,
	enableSelectionBox = true,
	onCardClick,
	onCardDoubleClick,
}: CanvasProps) {
	const canvasRef = useRef<HTMLDivElement>(null);
	const canvasViewportRef = useRef<HTMLDivElement>(null);
	const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
	const [cardContextMenuVisible, setCardContextMenuVisible] = useState(false);
	const [cardContextMenuData, setCardContextMenuData] = useState<{ card: null | Card, position: { x: number, y: number }}>({card: null, position: { x: 0, y: 0}});
	const [canvasContextMenuData, setCanvasContextMenuData] = useState({ open: false, position: { x: 0, y: 0 } });
	
	const { viewport, cards, loadCards, clearSelection, setEditingCardId, editingCardId, selectedCardIds, selectCard, showGrid } = useCanvasStore();

	const { isDraggingOver, handleDragOver, handleDragLeave, handleDrop } = useCanvasDrop({
		boardId,
		viewport
	});

	const mouseDownHandler = (e: React.MouseEvent) => {
		if (e.button !== 0) return;
		if (e.target !== e.currentTarget) return;

		clearSelection();
		setEditingCardId(null);
		setSelectedEditor(null);
	}

	useEffect(() => {
		if (initialCards.length > 0) {
			loadCards(initialCards);
		} else {
			loadCards([]);
		}
	}, [initialCards, loadCards]);

	useEffect(() => {
		if (!editingCardId) {
			setSelectedEditor(null);
		}
	}, [editingCardId]);

	useCanvasInteractions(canvasRef, {
		enablePan,
		enableZoom,
	});
	
	useKeyboardShortcuts({
		enabled: enableKeyboardShortcuts,
	});
	
	useSelectionBox(canvasRef, {
		enabled: enableSelectionBox,
	});

	const handleCardClick = (cardId: string) => {
		selectCard(cardId);
		onCardClick?.(cardId);
	};

	const handleCardContextMenu = (e: React.MouseEvent, card: Card) => {
		setCardContextMenuVisible(true);
		setCardContextMenuData({ card, position: { x: e.clientX, y: e.clientY } });
	};

	const handleCanvasContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();

		if (e.target !== canvasRef.current) {
			return;
		}

		setCanvasContextMenuData({ open: true, position: {x: e.clientX, y: e.clientY } });
	}

	const handleEditorReady = (cardId: string, editor: Editor) => {
		if (editingCardId === cardId) {
			setSelectedEditor(editor);
		}
	};

	/**
	 * Helper to check if a card is inside any column
	 */
	const isCardInColumn = (cardId: string): boolean => {
		const allCards = Array.from(cards.values());
		return allCards.some(c => 
			c.card_type === 'column' && 
			c.column_cards?.column_items?.some(item => item.card_id === cardId)
		);
	};

	/**
	 * Separate cards into:
	 * - Column cards (will render their own children)
	 * - Free cards (not in any column)
	 */
	const allCards = getCanvasCards(cards);
	const columnCards = allCards.filter(c => c.card_type === 'column');
	const freeCards = allCards.filter(c => 
		c.card_type !== 'column' && !isCardInColumn(c.id)
	);

	return (
		<div className="flex flex-col h-screen">
			{/* Toolbar */}
			<div className="h-[56px] flex-shrink-0">
				{selectedEditor ? (
					<TextEditorToolbar editor={selectedEditor} />
				) : (
					<ElementToolbar onCreateCard={() => {}} />
				)}
			</div>
			
			{/* Canvas */}
			<div
				className={`canvas-viewport relative w-full h-full overflow-hidden bg-gray-50 select-none ${className}`}
				ref={canvasViewportRef}
				data-scrollable="true"
				data-canvas-root="true"
				data-dragging-over={isDraggingOver}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onContextMenu={handleCanvasContextMenu}
			>
				<div ref={canvasRef} className="canvas-scroll-area w-full h-full">
					<div
						className="canvas-document"
						id="canvas-root"
						data-allow-double-click-creates="true"
						style={{
							position: 'relative',
							transform: createViewportMatrix(viewport.x, viewport.y, viewport.zoom),
							transformOrigin: '0 0',
							willChange: 'transform',
						}}
						onMouseDown={mouseDownHandler}
					>
						{/* Background Grid */}
						{showGrid && <Grid />}
						
						{/* Column Cards Layer (renders first, includes their child cards) */}
						<div className="columns-layer">
							{columnCards.map((card) => (
								<CanvasElement
									key={card.id}
									card={card}
									boardId={boardId}
									onCardClick={handleCardClick}
									onCardDoubleClick={onCardDoubleClick}
									onContextMenu={handleCardContextMenu}
									onEditorReady={handleEditorReady}
								/>
							))}
						</div>
						
						{/* Free Cards Layer (only cards NOT in columns) */}
						<div className="cards-layer">
							{freeCards.map((card) => (
								<CanvasElement
									key={card.id}
									card={card}
									boardId={boardId}
									onCardClick={handleCardClick}
									onCardDoubleClick={onCardDoubleClick}
									onContextMenu={handleCardContextMenu}
									onEditorReady={handleEditorReady}
								/>
							))}
						</div>
					</div>
				</div>
				
				{/* Selection Box */}
				<SelectionBox />

				{/* Card context menu */}
				<ContextMenu isOpen={cardContextMenuVisible} data={cardContextMenuData} onClose={() => setCardContextMenuVisible(false)}/>
				
				{/* Canvas Context Menu */}
				<CanvasContextMenu
					isOpen={canvasContextMenuData.open}
					position={canvasContextMenuData.position}
					onClose={() => setCanvasContextMenuData({open: false, position: { x: 0, y: 0 } } )}
				/>
			</div>
		</div>
	);
}