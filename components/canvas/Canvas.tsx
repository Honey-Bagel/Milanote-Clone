'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { createViewportMatrix, screenToCanvas } from '@/lib/utils/transform';
import { useCanvasInteractions } from '@/lib/hooks/useCanvasInteractions';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSelectionBox } from '@/lib/hooks/useSelectionBox';
import { Grid } from './Grid';
import { CanvasElement } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import { ConnectionLayer } from './ConnectionLayer';
import type { Card, CardData, LineCard } from '@/lib/types';
import { type Editor } from '@tiptap/react';
import ElementToolbar from '@/app/ui/board/toolbars/element-toolbar';
import TextEditorToolbar from '@/app/ui/board/toolbars/text-editor-toolbar';
import LinePropertiesToolbar from '@/app/ui/board/toolbars/line-properties-toolbar';
import ContextMenu from '@/app/ui/board/context-menu';
import CanvasContextMenu from '@/app/ui/board/canvas-context-menu';
import { useCanvasDrop } from '@/lib/hooks/useCanvasDrop';
import { getCanvasCards } from "@/lib/utils/canvas-render-helper";
import { getDefaultCardDimensions } from '@/lib/utils';
import type { Point } from '@/lib/utils/connection-path';
import { useBoardCards } from '@/lib/hooks/cards';

interface CanvasProps {
	boardId: string | null;
	className?: string;
	enablePan?: boolean;
	enableZoom?: boolean;
	enableKeyboardShortcuts?: boolean;
	enableSelectionBox?: boolean;
	isPublicView?: boolean;
	onCardClick?: (cardId: string) => void;
	onCardDoubleClick?: (cardId: string) => void;
}

export function Canvas({
	boardId,
	className = '',
	enablePan = true,
	enableZoom = true,
	enableKeyboardShortcuts = true,
	isPublicView = false,
	enableSelectionBox = true,
	onCardClick,
	onCardDoubleClick,
}: CanvasProps) {
	const canvasRef = useRef<HTMLDivElement>(null);
	const canvasViewportRef = useRef<HTMLDivElement>(null);
	const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
	const [cardContextMenuVisible, setCardContextMenuVisible] = useState(false);
	const [cardContextMenuData, setCardContextMenuData] = useState<{
		card: null | Card;
		position: { x: number; y: number };
	}>({ card: null, position: { x: 0, y: 0 } });
	const [canvasContextMenuData, setCanvasContextMenuData] = useState({
		open: false,
		position: { x: 0, y: 0 }
	});

	const { cards: cardArray, isLoading } = useBoardCards(boardId);
	const cards: Map<string, CardData> = new Map(cardArray.map((card) => [card.id, card]));

	const {
		viewport,
		connections,
		clearSelection,
		setEditingCardId,
		editingCardId,
		selectedCardIds,
		selectCard,
		showGrid,
		dragPreview,
		pendingConnection,
		cancelConnection,
		deleteConnection,
		uploadingCards,
		setBoardId,
	} = useCanvasStore();

	if (boardId) setBoardId(boardId);

	const allCardsMap = new Map<string, CardData>();
	cards.forEach((card) => {
		allCardsMap.set(card.id, card);
	});

	// Mouse position tracking for connection preview
	const [mousePosition, setMousePosition] = useState<Point | null>(null);
	const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

	const { isDraggingOver, handleDragOver, handleDragLeave, handleDrop } = useCanvasDrop(boardId || '');

	// ============================================================================
	// EXISTING EVENT HANDLERS
	// ============================================================================

	const mouseDownHandler = (e: React.MouseEvent) => {
		if (e.button !== 0) return;
		if (e.target !== e.currentTarget) return;

		if (pendingConnection) {
			cancelConnection();
		}

		clearSelection();
		setSelectedConnectionId(null);
		setEditingCardId(null);
		setSelectedEditor(null);
	};

	const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
		if (pendingConnection && canvasViewportRef.current) {
			const rect = canvasViewportRef.current.getBoundingClientRect();
			const canvasPos = screenToCanvas(
				e.clientX - rect.left,
				e.clientY - rect.top,
				viewport
			);
			setMousePosition(canvasPos);
		}
	}, [pendingConnection, viewport]);

	const handleConnectionClick = useCallback((connectionId: string, event: React.MouseEvent) => {
		event.stopPropagation();
		setSelectedConnectionId(connectionId);
		clearSelection();
	}, [clearSelection]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (selectedConnectionId && (e.key === 'Delete' || e.key === 'Backspace')) {
				deleteConnection(selectedConnectionId);
				setSelectedConnectionId(null);
			}
			if (e.key === 'Escape' && pendingConnection) {
				cancelConnection();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selectedConnectionId, deleteConnection, pendingConnection, cancelConnection]);

	useEffect(() => {
		if (!editingCardId) {
			setSelectedEditor(null);
		}
	}, [editingCardId]);

	useCanvasInteractions(canvasRef, { enablePan, enableZoom });
	useKeyboardShortcuts(boardId, { enabled: enableKeyboardShortcuts });
	useSelectionBox(canvasRef, { enabled: enableSelectionBox });

	const handleCardClick = (cardId: string, isMultiSelect: boolean = false) => {
		selectCard(cardId, isMultiSelect);
		onCardClick?.(cardId);
	};

	const handleCardContextMenu = (e: React.MouseEvent, card: Card) => {
		setCardContextMenuVisible(true);
		selectCard(card.id);
		setEditingCardId(null);
		setCardContextMenuData({ card, position: { x: e.clientX, y: e.clientY } });
	};

	const handleCanvasContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		if (e.target !== canvasRef.current) return;
		setCanvasContextMenuData({ open: true, position: { x: e.clientX, y: e.clientY } });
	};

	const handleEditorReady = (cardId: string, editor: Editor) => {
		if (editingCardId === cardId) {
			setSelectedEditor(editor);
		}
	};

	const isCardInColumn = (cardId: string): boolean => {
		const allCardsArray = Array.from(allCardsMap.values());
		return allCardsArray.some(c =>
			c.card_type === 'column' &&
			(c as any).column_items?.some((item: any) => item.card_id === cardId)
		);
	};

	const allCards = getCanvasCards(allCardsMap);
	const columnCards = allCards.filter(c => c.card_type === 'column');
	const freeCards = allCards.filter(c =>
		c.card_type !== 'column' && !isCardInColumn(c.id)
	);

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

		// Create type-specific preview card using flat InstantDB structure
		switch (cardType) {
			case 'note':
				return {
					...baseCard,
					card_type: 'note',
					note_content: '<p>Type something...</p>',
					note_color: 'default' as const,
				} as Card;

			case 'text':
				return {
					...baseCard,
					card_type: 'text',
					text_title: 'New Text',
					text_content: 'Type your text here...',
				} as Card;

			case 'task_list':
				return {
					...baseCard,
					card_type: 'task_list',
					task_list_title: 'New Task List',
					tasks: [],
				} as Card;

			case 'image':
				return {
					...baseCard,
					card_type: 'image',
					image_url: '',
					image_caption: null,
					image_alt_text: null,
				} as Card;

			case 'link':
				return {
					...baseCard,
					card_type: 'link',
					link_title: 'New Link',
					link_url: 'https://example.com',
					link_favicon_url: null,
				} as Card;

			case 'file':
				return {
					...baseCard,
					card_type: 'file',
					file_name: 'document.pdf',
					file_url: '',
					file_size: null,
					file_type: 'pdf',
					file_mime_type: null,
				} as Card;

			case 'color_palette':
				return {
					...baseCard,
					card_type: 'color_palette',
					palette_title: 'New Palette',
					palette_description: null,
					palette_colors: ['#3B82F6', '#8B5CF6', '#EC4899'],
				} as Card;

			case 'column':
				return {
					...baseCard,
					card_type: 'column',
					column_title: 'New Column',
					column_background_color: '#f3f4f6',
					column_is_collapsed: false,
					column_items: [],
				} as Card;

			case 'board':
				return {
					...baseCard,
					card_type: 'board',
					linked_board_id: '',
					board_title: 'New Board',
					board_color: '#3B82F6',
					board_card_count: '0',
				} as Card;

			case 'line':
				return {
					...baseCard,
					card_type: 'line',
					line_start_x: 0,
					line_start_y: 50,
					line_end_x: 200,
					line_end_y: 50,
					line_color: '#6b7280',
					line_stroke_width: 2,
					line_style: 'solid' as const,
					line_start_cap: 'none' as const,
					line_end_cap: 'arrow' as const,
					line_curvature: 0,
					line_control_point_offset: 0,
					line_reroute_nodes: null,
					line_start_attached_card_id: null,
					line_start_attached_side: null,
					line_end_attached_card_id: null,
					line_end_attached_side: null,
				} as Card;

			default:
				return null;
		}
	};

	const selectedLineCard = selectedCardIds.size === 1
		? (() => {
			const cardId = Array.from(selectedCardIds)[0];
			const card = cards.get(cardId);
			return card?.card_type === 'line' ? card as LineCard : null;
		})()
		: null;

	return (
		<div className="flex flex-col h-screen bg-[#020617] text-slate-300">
			{/* Toolbar */}
			<div className="h-[56px] flex-shrink-0 z-40">
				{selectedEditor ? (
					<TextEditorToolbar editor={selectedEditor} />
				) : selectedLineCard ? (
					<LinePropertiesToolbar card={selectedLineCard} />
				) : (
					<ElementToolbar
						onCreateCard={() => {}}
						canvasRef={canvasViewportRef}
						isPublicView={isPublicView}
					/>
				)}
			</div>

			{/* Canvas */}
			<div
				className={`canvas-viewport relative w-full h-full overflow-hidden bg-[#020617] select-none ${className}`}
				ref={canvasViewportRef}
				data-scrollable="true"
				data-canvas-root="true"
				data-dragging-over={isDraggingOver}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onContextMenu={handleCanvasContextMenu}
				onMouseMove={handleCanvasMouseMove}
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
						>
							{showGrid && <Grid />}

							<ConnectionLayer
								connections={connections}
								cards={cards}
								pendingConnection={pendingConnection}
								mousePosition={mousePosition}
								selectedConnectionId={selectedConnectionId}
								onConnectionClick={handleConnectionClick}
							/>

							<div className="columns-layer">
								{columnCards.map((card) => (
									<CanvasElement
										key={card.id}
										card={card}
										boardId={boardId}
										allCards={allCardsMap}
										onCardClick={handleCardClick}
										onCardDoubleClick={onCardDoubleClick}
										onContextMenu={handleCardContextMenu}
										onEditorReady={handleEditorReady}
										isReadOnly={isPublicView}
									/>
								))}
							</div>

							<div className="cards-layer">
								{freeCards.map((card) => (
									<CanvasElement
										key={card.id}
										card={card}
										boardId={boardId}
										allCards={allCardsMap}
										onCardClick={handleCardClick}
										onCardDoubleClick={onCardDoubleClick}
										onContextMenu={handleCardContextMenu}
										onEditorReady={handleEditorReady}
										isReadOnly={isPublicView}
									/>
								))}
							</div>

							{/* Uploading placeholders, drag preview - same as before */}
						</div>
					</div>

				<SelectionBox />
				<ContextMenu isOpen={cardContextMenuVisible} data={cardContextMenuData} onClose={() => setCardContextMenuVisible(false)} />
				<CanvasContextMenu
					cards={allCardsMap}
					isOpen={canvasContextMenuData.open}
					position={canvasContextMenuData.position}
					onClose={() => setCanvasContextMenuData({ open: false, position: { x: 0, y: 0 } })}
				/>
			</div>
		</div>
	);
}