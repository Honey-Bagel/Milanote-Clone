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
import { type Editor } from '@tiptap/react';
import ElementToolbar from '@/app/ui/board/element-toolbar';
import TextEditorToolbar from '@/app/ui/board/text-editor-toolbar';
import ContextMenu from '@/app/ui/board/context-menu';
import CanvasContextMenu from '@/app/ui/board/canvas-context-menu';
import { useCanvasDrop } from '@/lib/hooks/useCanvasDrop';
import { getCanvasCards } from "@/lib/utils/canvas-render-helper";
import { CardRenderer } from './cards/CardRenderer';
import { getDefaultCardDimensions } from '@/lib/utils';

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

export interface DragPreviewState {
	cardType: Card['card_type'];
	canvasX: number;
	canvasY: number;
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
	
	// Drag preview state - managed by toolbar, displayed by canvas
	const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
	
	const { viewport, cards, loadCards, clearSelection, setEditingCardId, editingCardId, selectedCardIds, selectCard, showGrid } = useCanvasStore();

	const { isDraggingOver, handleDragOver, handleDragLeave, handleDrop } = useCanvasDrop(boardId || '');

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

	/**
	 * Create a preview card mock object
	 */
	const createPreviewCard = (cardType: Card['card_type'], x: number, y: number): Card | null => {
		const dimensions = getDefaultCardDimensions(cardType);
		const baseCard = {
			id: 'preview-card',
			board_id: boardId || '',
			position_x: x - dimensions.defaultWidth / 2,
			position_y: y - dimensions.defaultHeight / 2,
			width: dimensions.defaultWidth,
			height: dimensions.defaultHeight,
			z_index: 9999,
			order_key: 'preview',
			created_by: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		// Create type-specific preview card
		switch (cardType) {
			case 'note':
				return {
					...baseCard,
					card_type: 'note',
					note_cards: {
						content: '<p>New note...</p>',
						color: 'yellow' as const,
					},
				} as Card;
			
			case 'text':
				return {
					...baseCard,
					card_type: 'text',
					text_cards: {
						title: 'New Text',
						content: 'Type your text here...',
					},
				} as Card;
			
			case 'task_list':
				return {
					...baseCard,
					card_type: 'task_list',
					task_list_cards: {
						title: 'New Task List',
						tasks: [],
					},
				} as Card;
			
			case 'image':
				return {
					...baseCard,
					card_type: 'image',
					image_cards: {
						image_url: '',
						caption: null,
						alt_text: null,
					},
				} as Card;
			
			case 'link':
				return {
					...baseCard,
					card_type: 'link',
					link_cards: {
						title: 'New Link',
						url: 'https://example.com',
						favicon_url: null,
					},
				} as Card;
			
			case 'file':
				return {
					...baseCard,
					card_type: 'file',
					file_cards: {
						file_name: 'document.pdf',
						file_url: '',
						file_size: null,
						file_type: 'pdf',
						mime_type: null,
					},
				} as Card;
			
			case 'color_palette':
				return {
					...baseCard,
					card_type: 'color_palette',
					color_palette_cards: {
						title: 'New Palette',
						description: null,
						colors: ['#3B82F6', '#8B5CF6', '#EC4899'],
					},
				} as Card;
			
			case 'column':
				return {
					...baseCard,
					card_type: 'column',
					column_cards: {
						title: 'New Column',
						background_color: '#f3f4f6',
						is_collapsed: false,
						column_items: [],
					},
				} as Card;
			
			case 'board':
				return {
					...baseCard,
					card_type: 'board',
					board_cards: {
						linked_board_id: '',
						board_title: 'New Board',
						board_color: '#3B82F6',
						card_count: 0,
					},
				} as Card;
			
			default:
				return null;
		}
	};

	return (
		<div className="flex flex-col h-screen">
			{/* Toolbar */}
			<div className="h-[56px] flex-shrink-0">
				{selectedEditor ? (
					<TextEditorToolbar editor={selectedEditor} />
				) : (
					<ElementToolbar 
						onCreateCard={() => {}} 
						canvasRef={canvasViewportRef}
						setDragPreview={setDragPreview}
					/>
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

						{/* Drag Preview Ghost Layer */}
						{dragPreview && (
							<div
								className="preview-ghost-layer pointer-events-none"
								style={{
									position: 'absolute',
									left: dragPreview.canvasX,
									top: dragPreview.canvasY,
									transform: 'translate(-50%, -50%)',
									opacity: 0.6,
									transition: 'none',
									zIndex: 10000,
								}}
							>
								<div 
									className="preview-card-wrapper"
									style={{
										filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
									}}
								>
									{(() => {
										const previewCard = createPreviewCard(
											dragPreview.cardType,
											dragPreview.canvasX,
											dragPreview.canvasY
										);
										
										if (!previewCard) return null;

										return (
											<div 
												style={{
													width: `${previewCard.width}px`,
													overflow: 'hidden',
												}}
											>
												<CardRenderer
													card={previewCard}
													isEditing={false}
													isSelected={false}
												/>
											</div>
										);
									})()}
								</div>
							</div>
						)}
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