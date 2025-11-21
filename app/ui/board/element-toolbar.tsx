'use client';

import { useState, useCallback, useRef, RefObject, useEffect } from 'react';
import { Plus, StickyNote, Book, Link, CheckSquare, Columns, Palette, Minus, ArrowRight, Grid3x3, ChevronDown, Magnet, Spline } from 'lucide-react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import type { Card } from '@/lib/types';
import AddElementModal from './add-element-modal';
import { DraggableToolbarButton } from '@/components/ui/draggable-toolbar-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from "@/components/ui/button";

interface ElementToolbarProps {
	onCreateCard: (cardType: Card['card_type']) => void;
	canvasRef: RefObject<HTMLDivElement | null>;
}

export default function ElementToolbar({ 
	onCreateCard,
	canvasRef,
}: ElementToolbarProps) {
	const { showGrid, setShowGrid, viewport, snapToGrid, setSnapToGrid, setDragPreview, isConnectionMode, setConnectionMode } = useCanvasStore();
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
		<TooltipProvider>
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

					{/* Line Tool */}
					<DraggableToolbarButton
						icon={Spline}
						title="Add Line"
						cardType="line"
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
						onClick={() => {}}
					/>

					<div className="w-px h-6 bg-gray-700"></div>

					{/* Connection Tools */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={() => setConnectionMode(!isConnectionMode)}
								className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${isConnectionMode ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
								title="Connection Mode"
								variant={"ghost"}
								size={"sm"}
							>
								<ArrowRight className="w-4 h-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{isConnectionMode ? "Exit Connection Mode" : "Enter Connection Mode"}</p>
							<p className="text-xs text-gray-400">Click card anchors to connect</p>
						</TooltipContent>
					</Tooltip>

					<div className="flex-1"></div>

					{/* View Options */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button 
								onClick={() => setShowGrid(!showGrid)} 
								className={`p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors ${showGrid ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
								title="Toggle Grid"
								variant={"ghost"}
								size={"sm"}
							>
								<Grid3x3 className="w-4 h-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{showGrid ? "Hide Grid" : "Show Grid"}</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={() => setSnapToGrid(!snapToGrid)}
								className={`p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors ${snapToGrid ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
								title="Snap to Grid"
								variant={"ghost"}
								size={"sm"}
							>
								<Magnet className="w-4 h-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{snapToGrid ? "Free Place" : "Snap to Grid"}</p>
						</TooltipContent>
					</Tooltip>
				</div>

				<AddElementModal isOpen={isElementModalOpen} onClose={() => setIsElementModalOpen(false)} />
			</div>
		</TooltipProvider>
	);
}