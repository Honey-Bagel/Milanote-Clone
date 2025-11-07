'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/lib/types';
import { createCard } from '@/lib/data/cards-client';
import { createClient } from '@/lib/supabase/client';
import { useCanvasStore } from '@/lib/stores/canvas-store';

interface UseCanvasDropParams {
	boardId: string | null;
	viewport: { x: number; y: number; zoom: number };
}

export function useCanvasDrop({ boardId, viewport }: UseCanvasDropParams) {
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const { addCard, cards } = useCanvasStore();
	const supabase = createClient();

	const getDefaultCardData = (cardType: Card['card_type']) => {
		switch (cardType) {
			case 'note':
				return { content: '<p>New note</p>', color: 'yellow' as const };
			case 'text':
				return { content: '<p>New text</p>', title: 'Text' };
			case 'image':
				return { image_url: '', caption: '' };
			case 'task_list':
				return { title: 'Task List', tasks: [] };
			case 'link':
				return { title: 'New Link', url: 'https://example.com', description: '' };
			case 'file':
				return { file_name: 'file.pdf', file_url: '', file_type: 'pdf', file_size: 0 };
			case 'color_palette':
				return { title: 'Palette', colors: ['#FF0000', '#00FF00', '#0000FF'] };
			case 'column':
				return { title: 'Column', background_color: '#f3f4f6' };
			case 'board':
				return { linked_board_id: boardId, board_title: 'New Board', board_color: '#3B82F6', card_count: 0 };
			default:
				return {};
		}
	};

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
		setIsDraggingOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		// Only set to false if we're leaving the canvas entirely
		if (e.currentTarget === e.target) {
			setIsDraggingOver(false);
		}
	}, []);

	const handleDrop = useCallback(async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDraggingOver(false);

		const cardType = e.dataTransfer.getData('cardType') as Card['card_type'];
		if (!cardType) return;

		// Get the canvas element to calculate relative position
		const canvasElement = e.currentTarget as HTMLElement;
		const rect = canvasElement.getBoundingClientRect();
		
		// Calculate position relative to canvas, accounting for viewport transform
		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;
		
		// Transform client coordinates to canvas coordinates
		const canvasX = (clientX - viewport.x) / viewport.zoom;
		const canvasY = (clientY - viewport.y) / viewport.zoom;

		try {
			// Calculate max z-index
			const maxZIndex = Array.from(cards.values()).reduce(
				(max, card) => Math.max(max, card.z_index || 0),
				0
			);

			const defaultData = getDefaultCardData(cardType);

			// Create card in database
			const cardId = await createCard(
				boardId,
				cardType,
				{
					position_x: canvasX,
					position_y: canvasY,
					width: 250,
					height: cardType === 'note' ? 200 : undefined,
					z_index: maxZIndex + 1,
				},
				defaultData
			);

			// Fetch the created card with all related data
			const { data } = await supabase
				.from('cards')
				.select(`
					*,
					${cardType}_cards(*)
				`)
				.eq('id', cardId)
				.single();

			if (data) {
				addCard(data as Card);
			}
		} catch (error) {
			console.error('Failed to create card on drop:', error);
		}
	}, [boardId, viewport, cards, addCard, supabase, getDefaultCardData]);

	return {
		isDraggingOver,
		handleDragOver,
		handleDragLeave,
		handleDrop,
	};
}