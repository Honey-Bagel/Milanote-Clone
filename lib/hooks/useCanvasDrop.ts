'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/lib/types';
import { createCard } from '@/lib/data/cards-client';
import { createClient } from '@/lib/supabase/client';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { getDefaultCardDimensions } from '../utils';

// Maximum file size before compression (1MB)
const MAX_IMAGE_SIZE = 1024 * 1024;
// Target quality for JPEG compression
const COMPRESSION_QUALITY = 0.8;
// Maximum dimension for images
const MAX_IMAGE_DIMENSION = 2000;

/**
 * Compress an image file using canvas
 */
async function compressImage(file: File): Promise<File> {
	// Skip non-images or small images
	if (!file.type.startsWith('image/') || file.size <= MAX_IMAGE_SIZE) {
		return file;
	}

	// Skip GIFs (to preserve animation)
	if (file.type === 'image/gif') {
		return file;
	}

	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);

			// Calculate new dimensions while maintaining aspect ratio
			let { width, height } = img;
			if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
				const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}

			// Create canvas and draw scaled image
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(file);
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);

			// Convert to blob
			canvas.toBlob(
				(blob) => {
					if (blob && blob.size < file.size) {
						// Create new file with compressed data
						const compressedFile = new File([blob], file.name, {
							type: 'image/jpeg',
							lastModified: Date.now(),
						});
						resolve(compressedFile);
					} else {
						// Compression didn't help, use original
						resolve(file);
					}
				},
				'image/jpeg',
				COMPRESSION_QUALITY
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(file);
		};

		img.src = url;
	});
}

export function useCanvasDrop(boardId: string) {
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const { addCard, viewport, getNewCardOrderKey, addUploadingCard, removeUploadingCard } = useCanvasStore();
	const supabase = createClient();

	const getDefaultCardData = (cardType: Card['card_type']) => {
		switch (cardType) {
			case 'note':
				return { content: '<p>New note</p>', color: 'yellow' as const };
			case 'image':
				return { image_url: '', caption: '' };
			case 'task_list':
				return { title: 'Task List', tasks: [{ id: `task-${Date.now()}`, text: 'test', completed: false, position: 0 }] };
			case 'link':
				return { title: 'New Link', url: 'https://example.com' };
			case 'file':
				return { file_name: 'file.pdf', file_url: '', file_type: 'pdf', file_size: 0 };
			case 'color_palette':
				return { title: 'Palette', colors: ['#FF0000', '#00FF00', '#0000FF'] };
			case 'column':
				return { title: 'Column', background_color: '#f3f4f6' };
			case 'board':
				return { linked_board_id: boardId, board_title: 'New Board', board_color: '#3B82F6', card_count: 0 };
			case 'line':
				return {
					start_x: 0,
					start_y: 50,
					end_x: 200,
					end_y: 50,
					color: '#6b7280',
					stroke_width: 2,
					line_style: 'solid',
					start_cap: 'none',
					end_cap: 'arrow',
					curvature: 0,
					control_point_offset: 0,
					reroute_nodes: null,
					start_attached_card_id: null,
					start_attached_side: null,
					end_attached_card_id: null,
					end_attached_side: null,
				};
			default:
				return {};
		}
	};
	
	/**
	 * Upload file to Supabase Storage
	 * Images go to 'board-images' bucket, others to 'board-files' bucket
	 */
	const uploadFileToStorage = useCallback(async (file: File, boardId: string): Promise<string> => {
		// Determine which bucket to use based on file type
		const isImage = file.type.startsWith('image/');
		const bucketName = isImage ? 'board-images' : 'board-files';

		// Generate unique filename with timestamp
		const timestamp = Date.now();
		const fileExt = file.name.split('.').pop();
		const fileName = `${boardId}/${timestamp}-${file.name}`;
		
		// Upload to appropriate Supabase storage bucket
		const { data, error } = await supabase.storage
			.from(bucketName)
			.upload(fileName, file, {
				cacheControl: '3600',
				upsert: false
			});

		if (error) {
			console.error(`Error uploading file to ${bucketName}:`, error);
			throw error;
		}

		// Get public URL
		const { data: urlData, } = supabase.storage
			.from(bucketName)
			.getPublicUrl(fileName);

		return urlData.publicUrl;
	}, [supabase]);

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
	 * Get file type extension for display
	 */
	const getFileTypeExtension = (file: File): string => {
		const ext = file.name.split('.').pop()?.toLowerCase();
		return ext || 'file'
	}

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
				// Get order key
				const orderKey = getNewCardOrderKey();

				// Compress image if needed
				const processedFile = await compressImage(file);

				// Upload file to supabase
				const fileUrl = await uploadFileToStorage(processedFile, boardId);

				// Prepare card data based on type
				let cardData: any;
				if (cardType === 'image') {
					cardData = {
						image_url: fileUrl,
						caption: file.name
					};
				} else {
					cardData = {
						file_name: file.name,
						file_url: fileUrl,
						file_type: getFileTypeExtension(file),
						file_size: processedFile.size
					};
				}

				// Create card in database with stacked positioning
				const cardId = await createCard(
					boardId,
					cardType,
					{
						position_x: posX,
						position_y: posY,
						width: defaultWidth,
						height: defaultHeight,
						order_key: orderKey,
						z_index: parseInt(orderKey.replace(/\D/g, '')) || (i * 10),
					},
					cardData
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

				// Remove uploading placeholder and add the real card
				removeUploadingCard(tempId);
				if (data) {
					addCard(data as Card);
				}

				// Offset next file drop positioning
				yOffset += 50;
			} catch (error) {
				console.error(`Failed to upload and create card for ${file.name}:`, error);
				// Remove uploading placeholder on error
				removeUploadingCard(tempId);
			}
		}
	}, [boardId, viewport, addCard, supabase, getNewCardOrderKey, uploadFileToStorage, addUploadingCard, removeUploadingCard]);

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

		// Check if the files are being dropped from computer
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			// Handle file drop from computer
			await handleFileDrop(e, files);
			return;
		}

		const cardType = e.dataTransfer.getData('cardType') as Card['card_type'];
		if (!cardType) return;

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

		try {
			// Get order-key for new card
			const orderKey = getNewCardOrderKey();

			const defaultData = getDefaultCardData(cardType);

			// Create card in database
			const cardId = await createCard(
				boardId,
				cardType,
				{
					position_x: canvasX - defaultWidth / 2,
					position_y: canvasY - (defaultHeight || minHeight || 100) / 2,
					width: defaultWidth,
					height: defaultHeight,
					order_key: orderKey,
					z_index: parseInt(orderKey.replace(/\D/g, '')) || 0,
				},
				defaultData
			);

			// Fetch the created card with all related data
			// Use FK hint for line_cards to avoid ambiguous relationship error
			const selectQuery = cardType === 'line'
				? `*, line_cards!line_cards_id_fkey(*)`
				: `*, ${cardType}_cards(*)`;

			const { data } = await supabase
				.from('cards')
				.select(selectQuery)
				.eq('id', cardId)
				.single();

			if (data) {
				addCard(data as Card);
			}
		} catch (error) {
			console.error('Failed to create card on drop:', error);
		}
	}, [boardId, viewport, addCard, supabase, handleFileDrop, getNewCardOrderKey]);

	return {
		isDraggingOver,
		handleDragOver,
		handleDragLeave,
		handleDrop,
	};
}