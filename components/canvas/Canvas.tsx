'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { createViewportMatrix, screenToCanvas } from '@/lib/utils/transform';
import { useCanvasInteractions } from '@/lib/hooks/useCanvasInteractions';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSelectionBox } from '@/lib/hooks/useSelectionBox';
import { Grid } from './Grid';
import { CanvasElement } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import { ConnectionLayer } from './ConnectionLayer';
import type { Card, CardData, LineCard, DrawingCard, DrawingStroke, PresentationNodeCard } from '@/lib/types';
import { type Editor } from '@tiptap/react';
import ElementToolbar from '@/app/ui/board/toolbars/element-toolbar';
import TextEditorToolbar from '@/app/ui/board/toolbars/text-editor-toolbar';
import LinePropertiesToolbar from '@/app/ui/board/toolbars/line-properties-toolbar';
import DrawingToolbar from '@/app/ui/board/toolbars/drawing-toolbar';
import ContextMenu from '@/app/ui/board/context-menu';
import CanvasContextMenu from '@/app/ui/board/canvas-context-menu';
import { useCanvasDrop } from '@/lib/hooks/useCanvasDrop';
import { getCanvasCards } from "@/lib/utils/canvas-render-helper";
import { getDefaultCardDimensions } from '@/lib/utils';
import type { Point } from '@/lib/utils/connection-path';
import { useBoardCards } from '@/lib/hooks/cards';
import { CardProvider, CardRenderer } from './cards';
import { DrawingLayer } from './drawing/DrawingLayer';
import { clusterStrokes, makeStrokesRelative, makeStrokesAbsolute, convertStrokesToViewport, calculateStrokeBounds, StrokeCluster } from '@/lib/utils/stroke-clustering';
import { CardService } from '@/lib/services/card-service';
import { cardsToOrderKeyList, getOrderKeyForNewCard } from '@/lib/utils/order-key-manager';
import { PresentationOverlay } from '@/components/presentation/PresentationOverlay';
import { CameraAnimator } from '@/lib/utils/presentation-animator';

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
	const animatorRef = useRef(new CameraAnimator());
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
	const cards: Map<string, CardData> = useMemo(
		() => new Map(cardArray.map((card) => [card.id, card])),
		[cardArray]
	)

	const {
		viewport,
		setViewport,
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
		interactionMode,
		setInteractionMode,
		presentationMode,
	} = useCanvasStore();

	useEffect(() => {
		if (boardId) {
			setBoardId(boardId);
		}
	}, [boardId, setBoardId]);

	const allCardsMap = new Map<string, CardData>();
	cards.forEach((card) => {
		allCardsMap.set(card.id, card);
	});

	// Mouse position tracking for connection preview
	const [mousePosition, setMousePosition] = useState<Point | null>(null);
	const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
	
	const getColorFromLocalStorage = () => {
		const savedColor = localStorage.getItem('drawing-color');
		if (savedColor && /^#[0-9A-Fa-f]{6}$/i.test(savedColor)) {
			return savedColor;
		}
		return '#ffffff';
	}

	// Drawing mode state
	const isDrawingMode = interactionMode.mode === 'drawing';
	const [drawingTool, setDrawingTool] = useState({
		type: 'pen' as 'pen' | 'eraser',
		color: getColorFromLocalStorage(),
		size: 4,
	});
	const [currentDrawingStrokes, setCurrentDrawingStrokes] = useState<DrawingStroke[]>([]);

	const { isDraggingOver, handleDragOver, handleDragLeave, handleDrop } = useCanvasDrop(boardId || '');

	useEffect(() => {
		try {
			localStorage.setItem('drawing-color', drawingTool.color);
		} catch (error) {
			console.warn('Failed to save color preference:', error);
		}
	}, [drawingTool.color]);

	// ============================================================================
	// PRESENTATION MODE ANIMATION
	// ============================================================================

	useEffect(() => {
		if (
			presentationMode.type === 'advanced' &&
			presentationMode.isTransitioning
		) {
			const nodeId =
				presentationMode.nodeSequence[presentationMode.currentNodeIndex];
			const node = cards.get(nodeId) as PresentationNodeCard | undefined;

			if (node) {
				animatorRef.current.animate(viewport, node, {
					duration: node.presentation_transition_duration,
					easingType: node.presentation_transition_type,
					curvePath: node.presentation_curve_path || undefined,
					onUpdate: (newViewport) => setViewport(newViewport),
					onComplete: () => {
						useCanvasStore.getState().onTransitionComplete(node);
					},
				});
			} else {
				console.warn('[Presentation] Node not found:', nodeId, 'Available nodes:', Array.from(cards.keys()));
				// Still mark transition as complete to avoid getting stuck
				useCanvasStore.getState().onTransitionComplete(null);
			}
		}

		return () => {
			animatorRef.current.cancel();
		};
	// Note: viewport, setViewport, and cards are intentionally excluded to prevent infinite animation loop
	// cards is excluded because we only need to read from it when the effect runs, not react to changes
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [presentationMode.currentNodeIndex, presentationMode.isTransitioning, presentationMode.type]);

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

	// ============================================================================
	// DRAWING MODE HANDLERS
	// ============================================================================

	const handleSaveDrawing = useCallback(async (strokes: DrawingStroke[]) => {
		if (!boardId || strokes.length === 0) {
			setInteractionMode({ mode: 'idle' });
			setCurrentDrawingStrokes([]);
			setDrawingTool(prev => ({ ...prev, type: 'pen' }));
			return;
		}

		// Check if we're editing an existing card
		const editingCardId = interactionMode.mode === 'drawing' ? interactionMode.editingCardId : undefined;

		// Exit drawing mode immediately to prevent overlap
		setInteractionMode({ mode: 'idle' });
		setCurrentDrawingStrokes([]);
		setDrawingTool(prev => ({ ...prev, type: 'pen' }));

		if (editingCardId) {
			const clusters = clusterStrokes(strokes, 50);

			// Find the primary cluster (closest to original card position)
			const card = (cards.get(editingCardId) as unknown) as DrawingCard;
			if (!card) return;

			let primaryCluster: StrokeCluster | null = null;
			let minDistance = Infinity;

			for (const cluster of clusters) {
				const distance = Math.sqrt(
					Math.pow(cluster.position.x - card.position_x, 2) +
					Math.pow(cluster.position.y - card.position_y, 2)
				);
				if (distance < minDistance) {
					minDistance = distance;
					primaryCluster = cluster;
				}
			}
			if (primaryCluster) {
				// Update original card with primary cluster
				const relativeStrokes = makeStrokesRelative(
					primaryCluster.strokes,
					primaryCluster.position.x,
					primaryCluster.position.y
				);

				CardService.updateDrawingCardComplete({
					cardId: editingCardId,
					boardId: card.board_id,
					position: { x: primaryCluster.position.x, y: primaryCluster.position.y },
					width: Math.max(20, primaryCluster.width),
					height: Math.max(20, primaryCluster.height),
					strokes: relativeStrokes,
					withUndo: true,
					previousState: {
						position_x: card.position_x,
						position_y: card.position_y,
						width: card.width,
						height: card.height,
						drawing_strokes: card.drawing_strokes,
					},
				});

				// Create new cards for additional clusters
				for (const cluster of clusters) {
					if (cluster !== primaryCluster) {
						const relativeStrokes = makeStrokesRelative(
							cluster.strokes,
							cluster.position.x,
							cluster.position.y,
						);

						const orderKey = getOrderKeyForNewCard(cardsToOrderKeyList(cardArray));

						CardService.createDrawingCard({
							boardId,
							orderKey,
							position: cluster.position,
							width: Math.max(20, cluster.width),
							height: Math.max(20, cluster.height),
							strokes: relativeStrokes,
						});
					}
				}
			}
		} else {
			const clusters = clusterStrokes(strokes, 50);

			for (const cluster of clusters) {
				const relativeStrokes = makeStrokesRelative(
					cluster.strokes,
					cluster.position.x,
					cluster.position.y
				);

				const orderKey = getOrderKeyForNewCard(cardsToOrderKeyList(cardArray));

				CardService.createDrawingCard({
					boardId,
					orderKey,
					position: cluster.position,
					width: Math.max(20, cluster.width),
					height: Math.max(20, cluster.height),
					strokes: relativeStrokes,
				});
			}
		}
	}, [boardId, interactionMode, setInteractionMode, setCurrentDrawingStrokes, cards, cardArray]);

	const handleCancelDrawing = useCallback(() => {
		setInteractionMode({ mode: 'idle' });
		setCurrentDrawingStrokes([]);
		setDrawingTool(prev => ({ ...prev, type: 'pen' }));
	}, [setInteractionMode, setCurrentDrawingStrokes]);

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
	useKeyboardShortcuts(boardId, { enabled: enableKeyboardShortcuts && !presentationMode.isActive });
	useSelectionBox(canvasRef, { enabled: enableSelectionBox && !presentationMode.isActive });

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
					line_directional_bias: 0,
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
		<div className="flex flex-col h-screen bg-[#020617] text-foreground">
			{/* Toolbar */}
			{!presentationMode.isActive && (
				<div className="h-[56px] flex-shrink-0 z-40">
					{isDrawingMode ? (
						<DrawingToolbar
							tool={drawingTool}
							onToolChange={(changes) => setDrawingTool({ ...drawingTool, ...changes })}
							onSave={() => handleSaveDrawing(currentDrawingStrokes)}
							onCancel={handleCancelDrawing}
						/>
					) : selectedEditor ? (
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
			)}

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

							{/* Uploading Cards Placeholders */}
							{Array.from(uploadingCards.values()).map((uploadingCard) => (
								<div
									key={uploadingCard.id}
									className="uploading-card-placeholder"
									style={{
										position: 'absolute',
										left: uploadingCard.x,
										top: uploadingCard.y,
										width: uploadingCard.type === 'image' ? 300 : 250,
										minHeight: 100,
										backgroundColor: '#1e293b',
										borderRadius: '12px',
										boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										padding: '16px',
										gap: '12px',
										border: '1px dashed #6366f1',
										zIndex: 9999,
									}}
								>
									<div
										className="loading-spinner"
										style={{
											width: 32,
											height: 32,
											border: '3px solid rgba(255,255,255,0.1)',
											borderTopColor: '#6366f1',
											borderRadius: '50%',
											animation: 'spin 1s linear infinite',
										}}
									/>
									<span style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', wordBreak: 'break-word' }}>
										Uploading {uploadingCard.filename}...
									</span>
								</div>
							))}

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
												dragPreview.cardType || 'note',
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
													<CardProvider
														card={previewCard}
														boardId={boardId || previewCard.board_id}
														isSelected={false}
														isReadOnly={true}
														isInsideColumn={false}
													>
														<CardRenderer
															card={previewCard}
															isEditing={false}
															isSelected={false}
															boardId={boardId}
														/>
													</CardProvider>
												</div>
											);
										})()}
									</div>
								</div>
							)}
						</div>
					</div>

				{/* Drawing Layer - shown when in drawing mode */}
				{isDrawingMode && (
					<DrawingLayer
						key={interactionMode.mode === 'drawing' ? interactionMode.editingCardId || 'new' : 'drawing'}
						onSave={handleSaveDrawing}
						onCancel={handleCancelDrawing}
						initialStrokes={
							interactionMode.mode === 'drawing' && interactionMode.editingCardId
								? (() => {
									const card = (cards.get(interactionMode.editingCardId) as unknown) as DrawingCard;
									if (!card?.drawing_strokes) return [];
									// Convert relative strokes to absolute coordinates for editing
									return makeStrokesAbsolute(card.drawing_strokes, card.position_x, card.position_y);
								})()
								: currentDrawingStrokes
						}
						editingCardId={interactionMode.mode === 'drawing' ? interactionMode.editingCardId : undefined}
						tool={drawingTool}
						onStrokesChange={setCurrentDrawingStrokes}
					/>
				)}

				<SelectionBox />
				<ContextMenu
					isOpen={cardContextMenuVisible}
					data={cardContextMenuData}
					allCards={allCardsMap}
					onClose={() => setCardContextMenuVisible(false)}
				/>
				<CanvasContextMenu
					cards={allCardsMap}
					isOpen={canvasContextMenuData.open}
					position={canvasContextMenuData.position}
					onClose={() => setCanvasContextMenuData({ open: false, position: { x: 0, y: 0 } })}
				/>

				<PresentationOverlay />
			</div>
		</div>
	);
}