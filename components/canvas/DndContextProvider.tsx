'use client';

import { ReactNode } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useDndCanvas } from '@/lib/hooks/useDndCanvas';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CardProvider } from './cards/CardContext';
import { CardFrame } from './cards';
import { CardRenderer } from './cards/CardRenderer';
import type { CardData } from '@/lib/types';

interface DndContextProviderProps {
	boardId: string | null;
	allCardsMap: Map<string, CardData>;
	children: ReactNode;
}

export function DndContextProvider({ boardId, allCardsMap, children }: DndContextProviderProps) {
	const { viewport, selectedCardIds, selectCard } = useCanvasStore();

	const {
		sensors,
		handleDragStart,
		handleDragMove,
		handleDragEnd,
		handleDragOver: dragOverDND,
		modifiers,
		activeDragCard,
		activeDragType,
	} = useDndCanvas({
		boardId,
		allCardsMap,
		viewport,
		selectCard,
	});

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragMove={handleDragMove}
			onDragEnd={handleDragEnd}
			onDragOver={dragOverDND}
			modifiers={modifiers}
		>
			{children}

			<DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
				{activeDragCard && activeDragType === 'column-card' ? (
					<div
						style={{
							opacity: 0.85,
							cursor: 'grabbing',
							pointerEvents: 'none',
							width: activeDragCard.width,
							height: activeDragCard.height || 'auto',
							position: 'relative',
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
									isInsideColumn={activeDragType === 'column-card'}
									isReadOnly={true}
									cssZIndex={9999}
								>
									<CardRenderer
										card={activeDragCard}
										boardId={activeDragCard.board_id}
										isEditing={false}
										isSelected={false}
										isPublicView={true}
										allCards={allCardsMap}
									/>
								</CardFrame>
							</CardProvider>
						</div>

						{/* Multi-select indicator badge */}
						{selectedCardIds.size > 1 && (
							<div className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg ring-2 ring-cyan-400/50">
								{selectedCardIds.size}
							</div>
						)}
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
