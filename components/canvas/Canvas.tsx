/**
 * Canvas Component - Integrated Version
 * 
 * Loads cards from your Supabase database and renders them
 */

'use client';

import { useRef, useEffect } from 'react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { createViewportMatrix } from '@/lib/utils/transform';
import { useCanvasInteractions } from '@/lib/hooks/useCanvasInteractions';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSelectionBox } from '@/lib/hooks/useSelectionBox';
import { Grid } from './Grid';
import { CanvasElement } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import type { Card } from '@/lib/types';
import ElementToolbar from '@/app/ui/board/element-toolbar';

interface CanvasProps {
	/**
	 * Initial cards loaded from database
	 */
	initialCards?: Card[];
	
	/**
	 * Board ID for saving updates
	 */
	boardId?: string;
	
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
	
	const { viewport, cards, loadCards, clearSelection, setEditingCardId } = useCanvasStore();

	const mouseDownHandler = (e: React.MouseEvent) => {
		if (e.button !== 0) return;

		clearSelection();
		setEditingCardId(null);
	}

	// Load initial cards on mount
	useEffect(() => {
		if (initialCards.length > 0) {
			loadCards(initialCards);
		}
	}, [initialCards, loadCards]);

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

	return (
		<div className="flex flex-col h-screen">
			<div className="h-[56px] flex-shrink-0">
				<ElementToolbar onCreateCard={() => {}}/>
			</div>
			<div
				ref={canvasRef}
				className={`canvas-viewport relative w-full h-full overflow-hidden bg-gray-50 select-none ${className}`}
				data-scrollable="true"
				data-canvas-root="true"
			>
				<div className="canvas-scroll-area w-full h-full">
					<div
						className="canvas-document"
						id="canvas-root"
						data-allow-double-click-creates="true"
						style={{
							width: '100%',
							height: '100%',
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
							{Array.from(cards.values())
								.sort((a, b) => a.z_index - b.z_index)
								.map((card) => (
									<CanvasElement
										key={card.id}
										card={card}
										boardId={boardId}
										onCardClick={onCardClick}
										onCardDoubleClick={onCardDoubleClick}
									/>
								))}
						</div>
					</div>
				</div>
				
				{/* Selection Box */}
				<SelectionBox />
			</div>
		</div>
	);
}