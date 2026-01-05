'use client';

import { useState, useCallback } from 'react';
import { Card, CardData } from '@/lib/types';
import { CardService, FileService, BoardService } from '@/lib/services';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { getDefaultCardDimensions, getDefaultCardData } from '../utils';
import { getCardRect } from '@/lib/utils/collision-detection';
import { useBoardCards } from './cards';
import { db } from '../instant/db';
import { generateId } from '@/lib/db/client';
import { useBoard } from './boards';
import { getOrderKeyForNewCard, cardsToOrderKeyList } from '@/lib/utils/order-key-manager';

/**
 * Find a column card at a given canvas position
 */
function findColumnAtPoint(
	canvasX: number,
	canvasY: number,
	cards: CardData[]
): CardData | null {
	const columns: CardData[] = [];

	cards.forEach((card) => {
		if (card.card_type === 'column') {
			const rect = getCardRect(card as unknown as Card);
			// Check if point is inside the column bounds
			if (
				canvasX >= rect.x &&
				canvasX <= rect.x + rect.width &&
				canvasY >= rect.y &&
				canvasY <= rect.y + rect.height
			) {
				columns.push(card);
			}
		}
	});

	// Return the topmost column (highest order_key) if multiple overlap
	if (columns.length === 0) return null;
	return columns.sort((a, b) => a.order_key > b.order_key ? -1 : 1)[0];
}

export function useCanvasDrop(boardId: string) {
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const {
		viewport,
		addUploadingCard,
		removeUploadingCard,
		setPotentialColumnTarget,
	} = useCanvasStore();
	const { cards } = useBoardCards(boardId);
	const { board } = useBoard(boardId);

	/**
	 * Determine card type based on file mime type
	 */
	const getCardTypeFromFile = (file: File): 'image' | 'file' => {
		if (file.type.startsWith('image/')) {
			return 'image';
		}
		return 'file';
	};

	/**
	 * Load an image and get its natural dimensions
	 */
	const loadImageDimensions = useCallback((url: string): Promise<{ width: number; height: number }> => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				resolve({ width: img.naturalWidth, height: img.naturalHeight });
			};
			img.onerror = () => {
				reject(new Error('Failed to load image'));
			};
			img.src = url;
		});
	}, []);

	/**
	 * Handle file drop from computer
	 */
	const handleFileDrop = useCallback(async (e: React.DragEvent, files: FileList) => {
		if (!boardId) return;

		// Get the canvas element to calculate relative position
		const canvasElement = e.currentTarget as HTMLElement;
		const rect = canvasElement.getBoundingClientRect();

		// Calculate position relative to canvas, accounting for viewport transform
		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;

		// Transform client coordinates to canvas coordinates
		const canvasX = (clientX - viewport.x) / viewport.zoom;
		const canvasY = (clientY - viewport.y) / viewport.zoom;

		// Process each dropped file
		let yOffset = 0;
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const cardType = getCardTypeFromFile(file);
			const { defaultWidth, defaultHeight } = getDefaultCardDimensions(cardType);

			// Generate a temporary ID for the uploading card
			const tempId = `uploading-${Date.now()}-${i}`;
			const posX = canvasX - defaultWidth / 2;
			const posY = (canvasY + yOffset) - (defaultHeight || 150) / 2;

			// Add uploading placeholder immediately
			addUploadingCard({
				id: tempId,
				filename: file.name,
				x: posX,
				y: posY,
				type: cardType,
			});

			try {
				// Upload file to storage (using FileService with placeholder)
				const fileUrl = cardType === 'image'
					? await FileService.uploadImage(file, boardId)
					: await FileService.uploadFile(file, boardId);

				// For image cards, calculate proper height based on aspect ratio
				let cardHeight = defaultHeight;
				if (cardType === 'image') {
					try {
						const imageDimensions = await loadImageDimensions(fileUrl);
						const aspectRatio = imageDimensions.height / imageDimensions.width;
						cardHeight = Math.round(defaultWidth * aspectRatio);
					} catch (error) {
						console.warn('Failed to load image dimensions, using default height:', error);
						// Fallback to a reasonable default aspect ratio (4:3)
						cardHeight = Math.round(defaultWidth * 0.75);
					}
				}

				// Pre-calculate order key from already-loaded cards
				const orderKey = getOrderKeyForNewCard(cardsToOrderKeyList(cards));

				// Create card in database with stacked positioning (no await for instant UI update)
				CardService.createCard({
					boardId: boardId,
					cardType: cardType,
					position: { x: posX, y: posY },
					dimensions: { width: defaultWidth, height: cardHeight ?? undefined },
					data: cardType === 'image' ? {
						image_url: fileUrl,
						image_caption: file.name,
					} : {
						file_url: fileUrl,
						file_name: file.name,
						file_mime_type: file.type,
						file_size: file.size,
					},
					orderKey: orderKey,
					withUndo: true,
				});

				// Remove uploading placeholder - card will appear via InstantDB subscription
				removeUploadingCard(tempId);

				// Offset next file drop positioning
				yOffset += 50;
			} catch (error) {
				console.error(`Failed to upload and create card for ${file.name}:`, error);
				// Remove uploading placeholder on error
				removeUploadingCard(tempId);
			}
		}
	}, [boardId, viewport, addUploadingCard, removeUploadingCard, cards, loadImageDimensions]);

	const handleImportDrop = useCallback(async (e: React.DragEvent, importData: any) => {
		const { provider, fileId, fileName, mimeType, boardId } = importData;
		
		// Calculate drop position
		const canvasElement = e.currentTarget as HTMLElement;
		const rect = canvasElement.getBoundingClientRect();
		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;
		const canvasX = (clientX - viewport.x) / viewport.zoom;
		const canvasY = (clientY - viewport.y) / viewport.zoom;

		// Show loading placeholder
		const tempId =`importing-${Date.now()}`;
		addUploadingCard({
			id: tempId,
			filename: fileName,
			x: canvasX,
			y: canvasY,
			type: mimeType.startsWith('image/') ? 'image' : 'link',
		});

		try {
			// Call import API
			const response = await fetch(`/api/import/${provider}/fetch`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fileId, boardId }),
			});
			if (!response.ok) return;
			const result = await response.json();

			const orderKey = getOrderKeyForNewCard(cardsToOrderKeyList(cards));
			
			// Create appropriate card
			if (result.type === 'image') {
				await CardService.createCard({
					boardId,
					cardType: 'image',
					position: { x: canvasX - 150, y: canvasY - 150 },
					dimensions: { width: 300 },
					data: { image_url: result.url, image_caption: fileName },
					orderKey,
					withUndo: true,
				});
			} else {
				await CardService.createCard({
					boardId,
					cardType: 'link',
					position: { x: canvasX - 150, y: canvasY - 50 },
					dimensions: { width: 300, height: 100 },
					data: { link_title: fileName, link_url: result.url },
					orderKey,
					withUndo: true,
				});
			}

			removeUploadingCard(tempId);
		} catch (error) {
			console.error('Import failed:', error);
			removeUploadingCard(tempId);
		}
	}, [boardId, viewport, addUploadingCard, removeUploadingCard, cards]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
		setIsDraggingOver(true);

		// Check if dragging over a column for visual feedback
		const cardType = e.dataTransfer.types.includes('cardtype')
			? e.dataTransfer.getData('cardType')
			: null;

		// Only highlight columns for droppable card types
		if (cardType !== 'column' && cardType !== 'line') {
			const canvasElement = e.currentTarget as HTMLElement;
			const rect = canvasElement.getBoundingClientRect();
			const clientX = e.clientX - rect.left;
			const clientY = e.clientY - rect.top;
			const canvasX = (clientX - viewport.x) / viewport.zoom;
			const canvasY = (clientY - viewport.y) / viewport.zoom;

			const targetColumn = findColumnAtPoint(canvasX, canvasY, cards);
			setPotentialColumnTarget(targetColumn?.id || null);
		}
	}, [viewport, cards, setPotentialColumnTarget]);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		// Only set to false if we're leaving the canvas entirely
		if (e.currentTarget === e.target) {
			setIsDraggingOver(false);
			setPotentialColumnTarget(null);
		}
	}, [setPotentialColumnTarget]);

	const handleDrop = useCallback(async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDraggingOver(false);
		setPotentialColumnTarget(null);

		// Check for import data
		const importData = e.dataTransfer.getData('application/json');
		if (importData) {
			try {
				const parsedData = JSON.parse(importData);
				if (parsedData.type === 'import') {
					await handleImportDrop(e, parsedData);
					return;
				}
			} catch (err) {
				console.error('Failed to parse import data:', err);
			}
		}

		// Check if the files are being dropped from computer
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			// Handle file drop from computer
			await handleFileDrop(e, files);
			return;
		}

		const cardType = e.dataTransfer.getData('cardType') as Card['card_type'];
		if (!cardType) return;

		// Don't allow dropping columns into columns
		if (cardType === 'column' || cardType === 'line') {
			// These card types should not be dropped into columns, handle normally
		}

		const { defaultWidth, defaultHeight, minHeight } = getDefaultCardDimensions(cardType);

		// Get the canvas element to calculate relative position
		const canvasElement = e.currentTarget as HTMLElement;
		const rect = canvasElement.getBoundingClientRect();

		// Calculate position relative to canvas, accounting for viewport transform
		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;

		// Transform client coordinates to canvas coordinates
		const canvasX = (clientX - viewport.x) / viewport.zoom;
		const canvasY = (clientY - viewport.y) / viewport.zoom;

		// Check if dropping over a column (only for non-column, non-line card types)
		const targetColumn = (cardType !== 'column' && cardType !== 'line')
			? findColumnAtPoint(canvasX, canvasY, cards)
			: null;

		// Get default data for card type
		const defaultData = getDefaultCardData(cardType);

		// Calculate position centered on drop point
		const posX = canvasX - defaultWidth / 2;
		const posY = canvasY - (defaultHeight || minHeight || 100) / 2;

		// Pre-calculate order key from already-loaded cards
		const orderKey = getOrderKeyForNewCard(cardsToOrderKeyList(cards));

		// If creating a board card, pre-generate IDs for true parallel execution
		if (cardType === 'board') {
			if (!board?.owner) return;

			// Pre-generate the board ID so both operations can start immediately
			const newBoardId = generateId();
			defaultData.linked_board_id = newBoardId;

			// Create both board and card in TRUE parallel (no await, no dependency chain)
			BoardService.createBoard({
				boardId: newBoardId, // Pass pre-generated ID
				ownerId: board?.owner?.id,
				title: defaultData.board_title,
				parentId: boardId,
				color: defaultData.board_color,
			}).catch(error => {
				console.error('Failed to create linked board:', error);
			});

			// Card creation can start immediately without waiting for board
			CardService.createCard({
				boardId: boardId,
				cardType: cardType,
				position: { x: posX, y: posY },
				dimensions: { width: defaultWidth, height: defaultHeight ?? undefined },
				data: defaultData,
				orderKey: orderKey,
				withUndo: true,
			}).then(cardId => {
				// If dropping into column, update column items
				if (targetColumn) {
					const columnItems = targetColumn.column_items || [];
					const newPosition = columnItems.length;
					const updatedColumnItems = [
						...columnItems,
						{ card_id: cardId, position: newPosition }
					];

					// Update column in database
					CardService.updateColumnItems(targetColumn.id, boardId, updatedColumnItems);
				}
			}).catch(error => {
				console.error('Failed to create board card:', error);
			});
		} else {
			// Create card in database (no await for instant UI update)
			CardService.createCard({
				boardId: boardId,
				cardType: cardType,
				position: { x: posX, y: posY },
				dimensions: { width: defaultWidth, height: defaultHeight ?? undefined },
				data: defaultData,
				orderKey: orderKey,
				withUndo: true,
			}).then(cardId => {
				// If dropping into column, update column items
				if (targetColumn) {
					const columnItems = targetColumn.column_items || [];
					const newPosition = columnItems.length;
					const updatedColumnItems = [
						...columnItems,
						{ card_id: cardId, position: newPosition }
					];

					// Update column in database
					CardService.updateColumnItems(targetColumn.id, boardId, updatedColumnItems);
				}
			}).catch(error => {
				console.error('Failed to create card on drop:', error);
			});
		}
	}, [boardId, viewport, handleFileDrop, cards, setPotentialColumnTarget, board, handleImportDrop]);

	return {
		isDraggingOver,
		handleDragOver,
		handleDragLeave,
		handleDrop,
	};
}