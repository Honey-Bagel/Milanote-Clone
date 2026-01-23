'use client';

import { ReactNode } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { useDndCanvas } from '@/lib/hooks/use-dnd-canvas';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CardProvider } from './cards/CardContext';
import { CardFrame } from './cards';
import { CardRenderer } from './cards/CardRenderer';
import type { CardData } from '@/lib/types';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';

interface DndContextProviderProps {
	boardId: string | null;
	allCardsMap: Map<string, CardData>;
	children: ReactNode;
}

export function DndContextProvider({ boardId, allCardsMap, children }: DndContextProviderProps) {
	const { viewport, selectedCardIds, selectCard } = useCanvasStore();
	const { preferences } = useUserPreferences();

	const {
		sensors,
		handleDragStart,
		handleDragMove,
		handleDragEnd,
		handleDragOver: dragOverDND,
		modifiers,
		activeDragCard,
		activeDragType,
		customCollisionDetection
	} = useDndCanvas({
		boardId,
		allCardsMap,
		viewport,
		selectCard,
	});

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={customCollisionDetection}
			onDragStart={handleDragStart}
			onDragMove={handleDragMove}
			onDragEnd={handleDragEnd}
			onDragOver={dragOverDND}
			modifiers={modifiers}
		>
			{children}

			<DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
				{activeDragCard && activeDragType === 'column-card' ? (
					(() => {
						// Check if this is a compact board card
						const isCompactBoard = activeDragCard.card_type === 'board' && preferences.compactBoardCards;
						const compactWidth = 100;
						const overlayWidth = isCompactBoard ? compactWidth : activeDragCard.width;
						const overlayHeight = isCompactBoard ? 110 : (activeDragCard.height || 'auto');

						// Calculate offset to center the compact card under cursor
						// When inside a column, compact cards are centered, so we need to offset
						// by half the difference between column width and compact width
						const offsetX = isCompactBoard ? (activeDragCard.width - compactWidth) / 2 : 0;

						return (
							<div
								style={{
									opacity: 0.85,
									cursor: 'grabbing',
									pointerEvents: 'none',
									width: overlayWidth,
									height: overlayHeight,
									position: 'relative',
									transform: offsetX ? `translateX(${offsetX}px)` : undefined,
								}}
							>
								<div className="card">
									<CardProvider
										card={activeDragCard}
										boardId={activeDragCard.board_id}
										isSelected={false}
										isReadOnly={true}
										isInsideColumn={activeDragType === 'column-card'}
										allCards={allCardsMap}
									>
										<CardFrame
											card={activeDragCard}
											isSelected={false}
											isEditing={false}
											isInsideColumn={false}
											isReadOnly={true}
											cssZIndex={9999}
											compactBoardCards={preferences.compactBoardCards}
										>
											<CardRenderer
												card={activeDragCard}
												boardId={activeDragCard.board_id}
												isEditing={false}
												isSelected={false}
												isPublicView={true}
												allCards={allCardsMap}
												compactBoardCards={preferences.compactBoardCards}
											/>
										</CardFrame>
									</CardProvider>
								</div>

								{/* Multi-select indicator badge */}
								{selectedCardIds.size > 1 && (
									<div className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg ring-2 ring-cyan-400/50">
										{selectedCardIds.size}
									</div>
								)}
							</div>
						);
					})()
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
