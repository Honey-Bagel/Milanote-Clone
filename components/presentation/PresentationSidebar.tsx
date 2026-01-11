'use client';

import { useMemo } from 'react';
import { X, Plus, Play } from 'lucide-react';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoardCards } from '@/lib/hooks/cards/use-board-cards';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useBoardStore } from '@/lib/stores/board-store';
import type { PresentationNodeCard } from '@/lib/types';
import { PresentationNodeItem } from './PresentationNodeItem';
import { NodePropertyEditor } from './NodePropertyEditor';
import { sortPresentationNodes, getNextOrderNumber } from '@/lib/utils/presentation-helpers';
import { createPresentationNode, updatePresentationNode, updatePresentationNodesOrder } from '@/lib/services/card-service';
import { deleteCard } from '@/lib/instant/card-mutations';

interface PresentationSidebarProps {
	boardId: string;
	onClose: () => void;
}

export function PresentationSidebar({ boardId, onClose }: PresentationSidebarProps) {
	const { cards } = useBoardCards(boardId);
	const { viewport, enterPresentationMode, updateNodeSequence, clearSelection } = useCanvasStore();
	const { selectedPresentationNodeId, setSelectedPresentationNodeId } = useBoardStore();
	const selectedNodeId = selectedPresentationNodeId;
	const setSelectedNodeId = setSelectedPresentationNodeId;

	// Filter and sort presentation nodes
	const presentationNodes = useMemo(() => {
		const nodes = cards.filter(
			(card): card is PresentationNodeCard => card.card_type === 'presentation_node'
		);
		return sortPresentationNodes(nodes);
	}, [cards]);

	const selectedNode = presentationNodes.find(n => n.id === selectedNodeId);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = presentationNodes.findIndex(n => n.id === active.id);
			const newIndex = presentationNodes.findIndex(n => n.id === over.id);

			const reordered = arrayMove(presentationNodes, oldIndex, newIndex);

			// Update the order in the database
			const nodeIds = reordered.map(n => n.id);
			updateNodeSequence(nodeIds);

			// Update presentation_order for each node
			const updates = reordered
				.map((node, index) => ({ id: node.id, order: index }))
				.filter((update, index) => reordered[index].presentation_order !== update.order);

			if (updates.length > 0) {
				updatePresentationNodesOrder(boardId, updates).catch(error => {
					console.error('Failed to update node order:', error);
				});
			}
		}
	};

	const handleCreateNode = async () => {
		const nextOrder = getNextOrderNumber(presentationNodes);

		// Convert viewport coordinates to world coordinates
		const centerX = -viewport.x / viewport.zoom + window.innerWidth / 2 / viewport.zoom;
		const centerY = -viewport.y / viewport.zoom + window.innerHeight / 2 / viewport.zoom;

		try {
			await createPresentationNode({
				boardId,
				position: { x: centerX - 20, y: centerY - 20 }, // Center the 40x40 node
				targetViewport: {
					x: centerX,
					y: centerY,
					zoom: viewport.zoom,
				},
				title: `Slide ${presentationNodes.length + 1}`,
				order: nextOrder,
			});
		} catch (error) {
			console.error('Failed to create presentation node:', error);
		}
	};

	const handleDeleteNode = async (nodeId: string) => {
		const node = presentationNodes.find(n => n.id === nodeId);
		if (!node) return;

		try {
			await deleteCard(nodeId, boardId, node);
			// Clear selection if deleted node was selected
			if (selectedNodeId === nodeId) {
				setSelectedNodeId(null);
			}
		} catch (error) {
			console.error('Failed to delete node:', error);
		}
	};

	const handleUpdateNode = async (nodeId: string, updates: Partial<PresentationNodeCard>) => {
		try {
			await updatePresentationNode(nodeId, boardId, updates);
		} catch (error) {
			console.error('Failed to update node:', error);
		}
	};

	const handleStartPresentation = () => {
		clearSelection();
		if (presentationNodes.length > 0) {
			const nodeIds = presentationNodes.map(n => n.id);
			updateNodeSequence(nodeIds);
			enterPresentationMode('advanced');
		}
	};

	const handleStartBasicPresentation = () => {
		clearSelection();
		enterPresentationMode('basic');
	};

	return (
		<div className="fixed right-0 top-14 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col z-50">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
				<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Presentation
				</h2>
				<button
					onClick={onClose}
					className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
				>
					<X size={20} className="text-gray-500" />
				</button>
			</div>

			{/* Action buttons */}
			<div className="p-4 space-y-2 border-b border-gray-200 dark:border-gray-700">
				<button
					onClick={handleCreateNode}
					className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
						bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
						border border-gray-300 dark:border-gray-600 rounded-lg
						hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
				>
					<Plus size={16} />
					Add Node at Current View
				</button>
				<button
					onClick={handleStartPresentation}
					disabled={presentationNodes.length === 0}
					className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
						bg-indigo-600 text-white rounded-lg
						hover:bg-indigo-700 transition-colors
						disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Play size={16} />
					Start Presentation
				</button>
				<button
					onClick={handleStartBasicPresentation}
					className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
						bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
						border border-gray-300 dark:border-gray-600 rounded-lg
						hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
					title="Fullscreen presentation mode with pan & zoom (Shift + F5)"
				>
					<Play size={16} />
					Basic Mode
				</button>
			</div>

			{/* Node list */}
			<div className="flex-1 overflow-y-auto p-4">
				{presentationNodes.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center px-4">
						<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
							<Play size={24} className="text-gray-400" />
						</div>
						<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
							No presentation nodes yet
						</h3>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
							Add nodes to create a guided presentation with smooth camera transitions
						</p>
					</div>
				) : (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={presentationNodes.map(n => n.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-2">
								{presentationNodes.map((node, index) => (
									<PresentationNodeItem
										key={node.id}
										node={node}
										index={index}
										isSelected={node.id === selectedNodeId}
										onSelect={() => setSelectedNodeId(node.id)}
										onDelete={() => handleDeleteNode(node.id)}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>
				)}
			</div>

			{/* Property editor (shown when a node is selected) */}
			{selectedNode && (
				<NodePropertyEditor
					node={selectedNode}
					onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
				/>
			)}
		</div>
	);
}
