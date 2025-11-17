'use client';

import { useState, useCallback, useRef, RefObject, useEffect } from 'react';
import { Plus, StickyNote, Book, Link, CheckSquare, Columns, Palette, Minus, ArrowRight, Grid3x3, ChevronDown, Magnet } from 'lucide-react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import type { Card } from '@/lib/types';
import AddElementModal from './add-element-modal';
import { DraggableToolbarButton } from '@/components/ui/draggable-toolbar-button';
import type { DragPreviewState } from '@/components/canvas/Canvas';

interface ElementToolbarProps {
	onCreateCard: (cardType: Card['card_type']) => void;
	canvasRef: RefObject<HTMLDivElement | null>;
	setDragPreview: (preview: DragPreviewState | null) => void;
}

export default function ElementToolbar({ 
	onCreateCard,
	canvasRef,
	setDragPreview,
}: ElementToolbarProps) {
	const { showGrid, setShowGrid, viewport, snapToGrid, setSnapToGrid } = useCanvasStore();
	const [isElementModalOpen, setIsElementModalOpen] = useState(false);
	
	// Track dragging state
	const draggedCardTypeRef = useRef<Card['card_type'] | null>(null);

	/**
	 * Handle drag start from toolbar buttons
	 */
	const handleDragStart = useCallback((cardType: Card["card_type"], e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('cardType', cardType);
		
		// Track what we're dragging
		draggedCardTypeRef.current = cardType;

		// Hide the default drag image - we'll show our custom preview in Canvas
		const dragImage = document.createElement('div');
		dragImage.style.opacity = '0';
		dragImage.style.position = 'absolute';
		dragImage.style.top = '-1000px';
		document.body.appendChild(dragImage);
		e.dataTransfer.setDragImage(dragImage, 0, 0);
		
		// Clean up the invisible drag image
		setTimeout(() => {
			if (document.body.contains(dragImage)) {
				document.body.removeChild(dragImage);
			}
		}, 0);
	}, []);

	/**
	 * Handle drag event - this fires continuously during drag
	 * This is the key! We use 'drag' event, not 'mousemove'
	 */
	const handleDrag = useCallback((e: React.DragEvent) => {
		if (!draggedCardTypeRef.current || !canvasRef.current) return;
		
		// Note: e.clientX and e.clientY can be 0 on the last drag event (when dropping)
		// We filter those out
		if (e.clientX === 0 && e.clientY === 0) return;

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		
		// Check if cursor is over the canvas
		const isOverCanvas = 
			e.clientX >= rect.left &&
			e.clientX <= rect.right &&
			e.clientY >= rect.top &&
			e.clientY <= rect.bottom;

		if (!isOverCanvas) {
			// Mouse is outside canvas - hide preview
			setDragPreview(null);
			return;
		}

		// Calculate position relative to canvas
		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;
		
		// Transform to canvas coordinates (accounting for zoom/pan)
		const canvasX = (clientX - viewport.x) / viewport.zoom;
		const canvasY = (clientY - viewport.y) / viewport.zoom;

		// Update preview
		setDragPreview({
			cardType: draggedCardTypeRef.current,
			canvasX,
			canvasY,
		});
	}, [canvasRef, viewport, setDragPreview]);

	/**
	 * Handle drag end - cleanup
	 */
	const handleDragEnd = useCallback(() => {
		draggedCardTypeRef.current = null;
		setDragPreview(null);
	}, [setDragPreview]);

	return (
		<div 
			className="bg-gray-800 border-b border-gray-700 px-6 py-3 h-full flex items-center"
			onDrag={handleDrag}
		>
			<div className="flex items-center space-x-2">
				{/* Add Elements */}
				<button 
					onClick={() => {setIsElementModalOpen(true)}} 
					className="px-4 py-2 bg-gray-900 hover:bg-gray-700 rounded-lg text-gray-300 font-medium text-sm flex items-center space-x-2 transition-colors"
				>
					<Plus className="w-4 h-4" />
					<span>Add</span>
					<ChevronDown className="w-3 h-3" />
				</button>

				<div className="w-px h-6 bg-gray-700"></div>

				{/* Element Types */}
				<DraggableToolbarButton 
					icon={StickyNote}
					title="Add Note"
					cardType="note"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onClick={() => {}}
				/>

				<DraggableToolbarButton 
					icon={Book}
					title="Add Board"
					cardType="board"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onClick={() => {}}
				/>
				
				<DraggableToolbarButton 
					icon={Link}
					title="Add Link"
					cardType="link"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onClick={() => {}}
				/>
				
				<DraggableToolbarButton 
					icon={CheckSquare}
					title="Add Task List"
					cardType="task_list"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onClick={() => {}}
				/>
				
				<DraggableToolbarButton 
					icon={Columns}
					title="Add Column"
					cardType="column"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onClick={() => {}}
				/>

				<DraggableToolbarButton
					icon={Palette}
					title="Add Color Palette"
					cardType="color_palette"
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onClick={() => {}}
				/>

				<div className="w-px h-6 bg-gray-700"></div>

				{/* Drawing Tools */}
				<button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Draw Line">
					<Minus className="w-4 h-4 rotate-45" />
				</button>
				<button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Draw Arrow">
					<ArrowRight className="w-4 h-4" />
				</button>

				<div className="flex-1"></div>

				{/* View Options */}
				<button 
					onClick={() => setShowGrid(!showGrid)} 
					className={`p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors ${showGrid ? 'bg-gray-200' : ''}`}
					title="Toggle Grid"
				>
					<Grid3x3 className="w-4 h-4" />
				</button>

				<button
					onClick={() => setSnapToGrid(!snapToGrid)}
					className={`p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors ${snapToGrid ? 'bg-gray-200' : ''}`}
					title="Snap to Grid"
				>
					<Magnet className="w-4 h-4" />
				</button>
			</div>

			<AddElementModal isOpen={isElementModalOpen} onClose={() => setIsElementModalOpen(false)} />
		</div>
	);
}