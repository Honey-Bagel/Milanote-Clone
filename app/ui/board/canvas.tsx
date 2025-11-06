'use client';

import { CanvasProps, Card } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { NoteCard } from './note-card';
import TextEditorToolbar from './text-editor-toolbar';
import { Editor } from '@tiptap/react';
import ElementToolbar from './element-toolbar';
import { createClient } from '@/lib/supabase/client';
import { createCard, updateCardContent, deleteCard } from '@/lib/data/cards-client';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';

interface SelectionBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export default function Canvas({ boardId, initialCards }: CanvasProps) {
	const [cards, setCards] = useState(initialCards);
	const [size, setSize] = useState({ width: 0, height: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
	const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
	const supabase = createClient();

	// Selection box state
	const [isSelecting, setIsSelecting] = useState(false);
	const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
	const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
	const stageRef = useRef<Konva.Stage>(null);

	// Handle canvas resize
	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				setSize({
					width: containerRef.current.offsetWidth,
					height: containerRef.current.offsetHeight,
				});
			}
		};

		updateSize();
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	}, []);

	// Create a new card
	const handleCreateCard = async (cardType: Card['card_type']) => {
		try {
			const centerX = size.width / 2 - 125;
			const centerY = size.height / 2 - 100;

			const maxZIndex = cards.reduce((max, card) => 
				Math.max(max, card.z_index || 0), 0
			);

			const typeSpecificData = getDefaultCardData(cardType);

			// Create card in database
			const cardId = await createCard(
				boardId,
				cardType,
				{
					position_x: centerX,
					position_y: centerY,
					width: 250,
					height: undefined,
					z_index: maxZIndex + 1,
				},
				typeSpecificData
			);

			const newCard: Card = {
				id: cardId,
				board_id: boardId,
				card_type: cardType,
				position_x: centerX,
				position_y: centerY,
				width: 250,
				height: null,
				z_index: maxZIndex + 1,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				created_by: '',
				[`${cardType}_cards`]: typeSpecificData,
			} as Card;

			setCards(prev => [...prev, newCard]);

			// Select new card
			setSelectedCardId(cardId);
		} catch (error) {
			console.error('Error creating card:', error);
		}
	}

	const getDefaultCardData = (cardType: Card['card_type']) => {
			switch (cardType) {
				case 'note':
					return { content: '<p></p>' };
				case 'text':
					return { content: 'New text block' };
				case 'image':
					return { url: '', alt_text: '' };
				case 'link':
					return { url: '', title: '', description: '' };
				case 'task_list':
					return { title: 'New Task List' };
				case 'file':
					return { url: '', filename: '', file_size: 0, mime_type: '' };
				case 'color_palette':
					return { colors: [] };
				case 'column':
					return { title: 'New Column' };
				default:
					return {};
			}
		}


	const handleSelect = (id: string) => {
		setSelectedCardId(id);
	}

	const handleEditorReady = (id: string, editor: Editor) => {
		if (selectedCardId === id) {
			setSelectedEditor(editor);
		}
	}

	useEffect(() => {
		if (!selectedCardId) {
			setSelectedEditor(null);
		}
	}, [selectedCardId]);

	const handleStageClick = (e: any) => {
		// Deselect when click empty space
		if (e.target === e.target.getStage()) {
			setSelectedCardId(null);
			setSelectedEditor(null);
		}
	};

	const handleContentChange = async (id: string, content: string) => {
		
	}

	return (
		<div className="flex flex-col h-screen">
			<div className="h-[56px] flex-shrink-0">
				{selectedEditor ? (
					<TextEditorToolbar editor={selectedEditor} />
				) : (
					<div>
						<ElementToolbar onCreateCard={handleCreateCard}/>
					</div>
				)}
			</div>
			<div ref={containerRef} className="flex-1 overflow-hidden">
				<Stage
					width={size.width}
					height={size.height}
					onMouseDown={handleStageClick}
					onTouchStart={handleStageClick}
				>
					<Layer>
						{
						cards
						.filter(card => card.card_type === 'note')
						.map(card => (
							<NoteCard
								key={card.id}
								id={card.id}
								x={card.position_x}
								y={card.position_y}
								width={card.width}
								initialContent={card.note_cards?.content || ''}
								onClick={() => handleSelect(card.id)}
								isSelected={selectedCardId === card.id}
								onEditorReady={(editor) => handleEditorReady(card.id, editor)}
							/>
						))
						}
					</Layer>
				</Stage>
			</div>
		</div>
	);
}