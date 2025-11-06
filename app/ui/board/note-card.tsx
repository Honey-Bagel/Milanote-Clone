import React, { useRef, useEffect, useState } from 'react';
import { Html } from 'react-konva-utils';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import BaseCard, { BaseCardProps } from './base-card';
import { updateCardContent, updateCardTransform } from '@/lib/data/cards-client';
import { useDebouncedCallback } from 'use-debounce';

interface NoteCardProps extends Omit<BaseCardProps, 'children' | 'height'> {
	initialContent?: string;
	onContentChange?: (content: string) => void;
	onResize?: (width: number, height: number) => void;
	onEditorReady?: (editor: Editor) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
	id,
	x,
	y,
	width = 250,
	initialContent = '',
	isSelected = false,
	onDragEnd,
	onClick,
	onDoubleClick,
	onContentChange,
	onResize,
	onEditorReady,
	backgroundColor = '#FFFEF0',
	...baseCardProps
}) => {
	const MIN_WIDTH = 150;
	const MIN_HEIGHT = 40;
	const PADDING = 12;
	
	const [cardWidth, setCardWidth] = useState(Math.max(width, MIN_WIDTH));
	const [cardHeight, setCardHeight] = useState(MIN_HEIGHT);
	const [isEditing, setIsEditing] = useState(false);
	const editorRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const debouncedSaved = useDebouncedCallback(
		async (content: string) => {
			try {
				await updateCardContent(id, 'note', { content });
			} catch (error) {
				console.error("Error updating card content:", error);
			}
		},
		1000 // Save 1 second after user stops typing
	);

	const debouncedTransformUpdate = useDebouncedCallback(
		(width: number, height: number) => {
			updateCardTransform(id, { width, height });
		},
		1000
	);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
				link: false, // Disable link in StarterKit since we're adding it separately
			}),
			Underline,
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			Highlight.configure({
				multicolor: true,
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-blue-600 underline cursor-pointer',
				},
			}),
			Placeholder.configure({
				placeholder: 'Type something...',
			}),
		],
		content: initialContent,
		editorProps: {
			attributes: {
				class: 'prose prose-sm max-w-none focus:outline-none',
			},
		},
		onCreate: () => {
			updateCardSize()
		},
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();

			onContentChange?.(html);

			debouncedSaved(html);

			updateCardSize();
		},
		immediatelyRender: false,
	});

	// Expose editor to parent component
	useEffect(() => {
		if (editor) {
			onEditorReady?.(editor);
		}
	}, [editor, onEditorReady]);

	useEffect(() => {
		if (editor && initialContent && editor.getHTML() !== initialContent) {
			editor.commands.setContent(initialContent);
		}
	}, [initialContent, editor]);

	// Clear text selection when card is deselected
	useEffect(() => {
		if (!isSelected && editor) {
			editor.commands.blur();
			
			if (window.getSelection) {
				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
				}
			}
			
			// Exit editing mode when deselected
			setIsEditing(false);
		}
	}, [isSelected, editor]);

	// Update card size based on content
	const updateCardSize = () => {
		if (contentRef.current) {
			const contentHeight = contentRef.current.scrollHeight;
			const contentWidth = contentRef.current.scrollWidth;
			
			const newHeight = Math.max(MIN_HEIGHT, contentHeight + PADDING * 2);
			const newWidth = Math.max(MIN_WIDTH, Math.min(contentWidth + PADDING * 2, 400));
			
			if (newHeight !== cardHeight || newWidth !== cardWidth) {
				setCardHeight(newHeight);
				setCardWidth(newWidth);
				onResize?.(newWidth, newHeight);
			}

			debouncedTransformUpdate(cardWidth, cardHeight);
		}
	};

	useEffect(() => {
		updateCardSize();
	}, [editor?.getHTML()]);

	// Handle double-click to enter edit mode
	const handleDoubleClick = (cardId: string) => {
		setIsEditing(true);
		setTimeout(() => {
			editor?.commands.focus();
		}, 50);
		
		// Call parent's double-click handler if provided
		onDoubleClick?.(cardId);
	};

	// Handle single click
	const handleClick = (cardId: string) => {
		if (!isEditing) {
			onClick?.(cardId);
		}
	};

	// Handle drag end
	const handleDragEnd = (cardId: string, newX: number, newY: number) => {
		onDragEnd?.(cardId, newX, newY);
	};

	const handleBlur = () => {
		setIsEditing(false);
		
		if (window.getSelection) {
			const selection = window.getSelection();
			if (selection) {
				selection.removeAllRanges();
			}
		}
	};

	return (
		<BaseCard
			id={id}
			x={x}
			y={y}
			width={cardWidth}
			height={cardHeight}
			backgroundColor={backgroundColor}
			isSelected={isSelected}
			onDragEnd={handleDragEnd}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			cornerRadius={0}
			borderWidth={0}
			draggable={!isEditing} // Disable drag when editing
			{...baseCardProps}
		>
			{/* TipTap Editor as HTML overlay */}
			<Html
				groupProps={{ x: 0, y: 0 }}
				divProps={{
					style: {
						width: `${cardWidth}px`,
						height: `${cardHeight}px`,
						pointerEvents: isEditing ? 'auto' : 'none',
						position: 'absolute',
					},
				}}
			>
				<div
					ref={editorRef}
					className="w-full h-full overflow-hidden"
					style={{
						backgroundColor: 'transparent',
						cursor: isEditing ? 'text' : 'move',
						padding: `${PADDING}px`,
					}}
					onMouseDown={(e) => {
						if (isEditing) {
							e.stopPropagation();
						}
					}}
					onBlur={handleBlur}
				>
					{/* Editor content */}
					<div ref={contentRef} className="note-card-content">
						<EditorContent editor={editor} />
					</div>
				</div>
			</Html>
		</BaseCard>
	);
};