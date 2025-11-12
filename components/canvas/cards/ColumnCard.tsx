/**
 * ColumnCard Component
 * 
 * Renders a column that can contain other cards
 */

'use client';

import React, { useState, useRef } from 'react';
import { GripVertical, Plus, X } from 'lucide-react';
import type { ColumnCard as ColumnCardType, Card } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CardRenderer } from './CardRenderer';
import type { Editor } from '@tiptap/react';

interface ColumnCardProps {
	card: ColumnCardType;
	isEditing: boolean;
	onEditorReady?: (editor: Editor) => void;
	onDragOverColumn?: (e: React.DragEvent, index: number) => void;
	onDropInColumn?: (e: React.DragEvent, index: number) => void;
	dragOverIndex: number | null;
}

export function ColumnCard({
	card,
	isEditing,
	onEditorReady,
	onDragOverColumn,
	onDropInColumn,
	dragOverIndex,
}: ColumnCardProps) {
	const { cards, updateCard, removeCardFromColumn, selectCard } = useCanvasStore();
	const [title, setTitle] = useState(card.column_cards?.title || 'Untitled Column');
	const columnRef = useRef<HTMLDivElement>(null);

	// Get the actual card objects for cards in this column
	const columnCards = (card.column_cards?.column_items || [])
		.sort((a, b) => a.position - b.position)
		.map(item => cards.get(item.card_id))
		.filter((c): c is Card => c !== undefined);

	const handleTitleChange = (newTitle: string) => {
		setTitle(newTitle);
		updateCard(card.id, {
			column_cards: {
				...card.column_cards,
				title: newTitle,
			},
		});
	};

	const handleRemoveCard = (cardId: string) => {
		removeCardFromColumn(card.id, cardId);
	};

	const handleDragStart = (e: React.DragEvent, columnCard: Card, index: number) => {
		e.stopPropagation();
		e.dataTransfer.setData('application/json', JSON.stringify(columnCard));
		e.dataTransfer.setData('fromColumnId', card.id);
		e.dataTransfer.setData('fromColumnIndex', index.toString());
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.stopPropagation();
		onDragOverColumn?.(e, index);
	};

	const handleDrop = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.stopPropagation();
		onDropInColumn?.(e, index);
	};

	const handleColumnAreaDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleColumnAreaDrop = (e: React.DragEvent) => {
		// Drop at the end
		handleDrop(e, columnCards.length);
	};

	return (
		<div
			ref={columnRef}
			className="bg-white rounded-lg shadow-md border-2 border-gray-200 overflow-hidden"
			style={{
				width: '100%',
				height: '100%',
				minHeight: 200,
				display: 'flex',
				flexDirection: 'column',
			}}
			onClick={(e) => e.stopPropagation()}
		>
			{/* Column Header */}
			<div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
				<input
					type="text"
					value={title}
					onChange={(e) => handleTitleChange(e.target.value)}
					className="bg-transparent border-none outline-none font-semibold text-sm flex-1 text-gray-800"
					placeholder="Column title..."
					disabled={!isEditing}
					style={{
						cursor: isEditing ? 'text' : 'default',
					}}
				/>
				<button className="text-gray-400 hover:text-gray-600 p-1">
					<Plus size={14} />
				</button>
			</div>

			{/* Column Content - Scrollable */}
			<div
				className="flex-1 overflow-y-auto p-2 space-y-2"
				onDragOver={handleColumnAreaDragOver}
				onDrop={handleColumnAreaDrop}
			>
				{columnCards.length === 0 && (
					<div className="text-center py-8 text-gray-400 text-sm">
						Drop cards here
					</div>
				)}

				{columnCards.map((columnCard, index) => (
					<div key={columnCard.id}>
						{/* Insert line indicator */}
						{dragOverIndex === index && (
							<div className="h-0.5 bg-blue-500 mx-2 mb-2 transition-all" />
						)}

						<div
							draggable
							onDragStart={(e) => handleDragStart(e, columnCard, index)}
							onDragOver={(e) => handleDragOver(e, index)}
							onDrop={(e) => handleDrop(e, index)}
							className="group relative"
						>
							{/* Card Content */}
							<div
								className="rounded border border-gray-200 hover:border-blue-300 transition-colors cursor-move"
								style={{
									width: '100%',
								}}
							>
								{/* Drag handle */}
								<div className="absolute left-1 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
									<GripVertical size={14} className="text-gray-400" />
								</div>

								{/* Remove button */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleRemoveCard(columnCard.id);
									}}
									className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white rounded z-10"
								>
									<X size={12} className="text-gray-500" />
								</button>

								{/* Render the actual card */}
								<div className="pointer-events-none pl-4">
									<CardRenderer
										card={columnCard}
										isEditing={false}
										onEditorReady={onEditorReady}
									/>
								</div>
							</div>
						</div>
					</div>
				))}

				{/* Insert line at end */}
				{dragOverIndex === columnCards.length && (
					<div className="h-0.5 bg-blue-500 mx-2 transition-all" />
				)}
			</div>
		</div>
	);
}