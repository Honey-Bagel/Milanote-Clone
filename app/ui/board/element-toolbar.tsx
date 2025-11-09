'use client';

import { Plus, Book, ChevronDown, StickyNote, Type, Image, Link, CheckSquare, Columns, Paperclip, Minus, ArrowRight, Grid3x3, Filter } from 'lucide-react';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { createCard } from '@/lib/data/cards-client';
import { createClient } from '@/lib/supabase/client';
import { useParams } from "next/navigation";
import type { Card } from "@/lib/types";
import AddElementModal from './add-element-modal';
import { useState } from 'react';
import { DraggableToolbarButton } from '@/components/ui/draggable-toolbar-button';

export default function ElementToolbar({ 
	onCreateCard 
}: {
	onCreateCard: (cardType: Card["card_type"]) => void;
}
) {
	const [isElementModalOpen, setIsElementModalOpen] = useState(false);
	const { addCard } = useCanvasStore();
	const params = useParams();
	const boardId = params.id as string;
	const supabase = createClient();

	const handleCreateCard = async (cardType: Card["card_type"]) => {
		try {
			// Default data for each type
			const defaultData = {
				note: { content: 'New note', color: 'yellow' as const },
				text: { content: 'New text', title: 'Text' },
				image: { image_url: '', caption: '' },
				task_list: { title: 'Task List' },
				link: { title: 'New Link', url: 'https://example.com' },
				file: { file_name: 'file.pdf', file_url: '', file_type: 'pdf' },
				color_palette: { title: 'Palette', colors: ['#FF0000', '#00FF00', '#0000FF'] },
				column: { title: 'Column', background_color: '#f3f4f6' },
				board: { linked_board_id: boardId, board_title: 'New Board', board_color: '#3B82F6', card_count: 0 }
			};

			// Create card in db
			const cardId = await createCard(
				boardId,
				cardType,
				{
					position_x: 100,
					position_y: 100,
					width: 250,
					height: 100,
					z_index: 0,
				},
				defaultData[cardType]
			);

			// Fetch the created card with all data
			const { data } = await supabase
				.from('cards')
				.select(`
					*,
					${cardType}_cards(*)
				`)
				.eq('id', cardId)
				.single();

			if (data) {
				// Add to local state
				addCard(data as Card);
			}

			onCreateCard(cardType);
		} catch(error) {
			console.error("Failed to create card:", error);
		}
	}

	const handleDragStart = (cardType: Card["card_type"], e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = 'copy';
	}
	
	return (
		<div className="bg-gray-800 border-b border-gray-700 px-6 py-3 h-full flex items-center">
			<div className="flex items-center space-x-2">
				{/* Add Elements */}
				<button onClick={() => {setIsElementModalOpen(true)}} className="px-4 py-2 bg-gray-900 hover:bg-gray-700 rounded-lg text-gray-300 font-medium text-sm flex items-center space-x-2 transition-colors">
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
					onClick={() => {}}
				/>

				<DraggableToolbarButton 
					icon={Book}
					title="Add Board"
					cardType="board"
					onDragStart={handleDragStart}
					onClick={() => {}}
				/>
				
				<DraggableToolbarButton 
					icon={Link}
					title="Add Link"
					cardType="link"
					onDragStart={handleDragStart}
					onClick={() => {}}
				/>
				
				<DraggableToolbarButton 
					icon={CheckSquare}
					title="Add Task List"
					cardType="task_list"
					onDragStart={handleDragStart}
					onClick={() => {}}
				/>
				
				<DraggableToolbarButton 
					icon={Columns}
					title="Add Column"
					cardType="column"
					onDragStart={handleDragStart}
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
				<button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Grid View">
					<Grid3x3 className="w-4 h-4" />
				</button>
				<button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Filter">
					<Filter className="w-4 h-4" />
				</button>
			</div>

			<AddElementModal isOpen={isElementModalOpen} onClose={() => setIsElementModalOpen(false)} />
		</div>
	);
}