/**
 * Canvas Component - With TipTap Toolbar Integration
 * 
 * Loads cards from your Supabase database and renders them with toolbar support
 */

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
import type { Editor } from '@tiptap/react';
import ElementToolbar from '@/app/ui/board/element-toolbar';
import TextEditorToolbar from '@/app/ui/board/text-editor-toolbar';
import ContextMenu from '@/app/ui/board/context-menu';
import CanvasContextMenu from '@/app/ui/board/canvas-context-menu';
import { useCanvasDrop } from '@/lib/hooks/useCanvasDrop';
import { getCanvasCards } from "@/lib/utils/canvas-render-helper";

interface CanvasProps {
	/**
	 * Initial cards loaded from database
	 */
	initialCards?: Card[];
	
	/**
	 * Board ID for saving updates
	 */
	boardId: string | null;
	
	className?: string;
	enablePan?: boolean;
	enableZoom?: boolean;
	enableKeyboardShortcuts?: boolean;
	enableSelectionBox?: boolean;
	showGrid?: boolean;
	
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
	showGrid = true,
	onCardClick,
	onCardDoubleClick,
}: CanvasProps) {
	const canvasRef = useRef<HTMLDivElement>(null);
	const canvasViewportRef = useRef<HTMLDivElement>(null);
	const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
	const [cardContextMenuVisible, setCardContextMenuVisible] = useState(false);
	const [cardContextMenuData, setCardContextMenuData] = useState({card: null, position: { x: 0, y: 0}});
	const [canvasContextMenuData, setCanvasContextMenuData] = useState({ open: false, position: { x: 0, y: 0 } });
	
	const { viewport, cards, loadCards, clearSelection, setEditingCardId, editingCardId, selectedCardIds, selectCard } = useCanvasStore();

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

	// Load initial cards on mount
	useEffect(() => {
		if (initialCards.length > 0) {
			loadCards(initialCards);
		}
	}, [initialCards, loadCards]);

	// Clear editor when editing is done
	useEffect(() => {
		if (!editingCardId) {
			setSelectedEditor(null);
		}
	}, [editingCardId]);

	// Attach interaction hooks
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
		// Only set editor if this card is being edited
		if (editingCardId === cardId) {
			setSelectedEditor(editor);
		}
	};

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
						
						{/* Cards Layer */}
						<div className="cards-layer">
							{getCanvasCards(cards)
								.map((card) => (
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