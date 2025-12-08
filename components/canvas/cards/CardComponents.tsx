/**
 * Card Component Implementations - With TipTap Integration
 * 
 * These work with your database schema
 */

'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { NoteCard, ImageCard, TextCard, TaskListCard, LinkCard, FileCard, ColorPaletteCard, ColumnCard, Card } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { CardService, BoardService } from '@/lib/services';
import { useUndoStore } from '@/lib/stores/undo-store';
import { CardBase } from './CardBase';
import Image from 'next/image';
import { useEditor, EditorContent, Editor as TipTapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useDebouncedCallback } from 'use-debounce';
import { CanvasElement } from '../CanvasElement';
import { useResizable } from '@/lib/hooks/useResizable';
import { CardRenderer } from './CardRenderer';
import { db } from '@/lib/instant/db';
import { useBoardCards } from '@/lib/hooks/cards';

// ============================================================================
// NOTE CARD - WITH TIPTAP
// ============================================================================

export function NoteCardComponent({
	card,
	isEditing,
	onEditorReady
}: {
	card: NoteCard;
	isEditing: boolean;
	onEditorReady?: (editor: TipTapEditor) => void;
}) {
	const { setEditingCardId, isDragging  } = useCanvasStore();

	const previousContentRef = useRef(card.note_content);

	const debouncedSave = useDebouncedCallback(
		async (content: string) => {
			try {
				if (card.id === 'preview-card') return;

				const oldContent = previousContentRef.current;

				await CardService.updateCardContent(card.id, card.board_id, 'note', {
					note_content: content,
				});

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit note content',
					do: () => CardService.updateCardContent(card.id, card.board_id, 'note', { note_content: content }),
					undo: () => CardService.updateCardContent(card.id, card.board_id, 'note', { note_content: oldContent }),
				});

				previousContentRef.current = content;
			} catch (error) {
				console.error('Failed to update note:', error);
			}
		},
		1000
	);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
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
				showOnlyWhenEditable: false,
				showOnlyCurrent: false,
			}),
		],
		content: card.note_content || '',
		editorProps: {
			attributes: {
				class: 'prose prose-sm max-w-none focus:outline-none p-4 min-h-[60px] text-slate-300 text-sm leading-relaxed',
			},
		},
		onUpdate: ({ editor }) => {
			// Don't update during drag to prevent interference with undo/redo
			if (isDragging) {
				return;
			}

			const html = editor.getHTML();

			// Local state updates happen via InstantDB subscription

			// Debounced save to database
			debouncedSave(html);
		},
		onCreate: ({ editor }) => {
			// Expose editor to parent
			onEditorReady?.(editor);
		},
		editable: isEditing,
		immediatelyRender: false,
	});

	// Update editor content when card content changes externally
	useEffect(() => {
		if (editor && card.note_content !== editor.getHTML()) {
			editor.commands.setContent(card.note_content || '');
		}
	}, [card.note_content, editor]);

	// Update editor editable state when isEditing changes
	useEffect(() => {
		if (editor) {
			editor.setEditable(isEditing);
			
			if (isEditing) {
				// Focus editor when entering edit mode
				setTimeout(() => {
					editor.commands.focus('end');
				}, 50);
			} else {
				// Blur editor when exiting edit mode
				editor.commands.blur();
			}
		}
	}, [isEditing, editor]);

	// Expose editor to parent when it becomes ready or editing state changes
	useEffect(() => {
		if (editor && isEditing) {
			onEditorReady?.(editor);
		}
	}, [editor, isEditing, onEditorReady]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			e.preventDefault();
			setEditingCardId(null);
			editor?.commands.blur();
		}
		// Stop propagation only if we're editing to allow text input
		if (isEditing) {
			e.stopPropagation();
		}
	};

	const colorClasses = {
		yellow: 'bg-yellow-100/70 border-yellow-200/30',
		blue: 'bg-blue-100 border-blue-200/30',
		green: 'bg-green-100 border-green-200/30',
		pink: 'bg-pink-100 border-pink-200/30',
		purple: 'bg-purple-100 border-purple-200/30',
	};

	return (
		<CardBase
			isEditing={isEditing}
			className={`bg-[#1e293b]/90 shadow-xl hover:border-cyan-500/50`}
			style={{
				userSelect: isEditing ? 'text' : 'none',
				WebkitUserSelect: isEditing ? 'text' : 'none',
				height: 'auto',
			}}
		>
			<div 
				className="note-card h-full flex flex-col" 
				onKeyDown={handleKeyDown}
				onClick={(e) => {
					if (isEditing) {
						e.stopPropagation();
					}
				}}
				onMouseDown={(e) => {
					// Allow text selection when editing
					if (isEditing) {
						e.stopPropagation();
					}
				}}
				style={{
					userSelect: isEditing ? 'text' : 'none',
					WebkitUserSelect: isEditing ? 'text' : 'none',
					MozUserSelect: isEditing ? 'text' : 'none',
					cursor: isEditing ? 'text' : 'pointer',
					overflow: 'auto',
				}}
			>
				<EditorContent 
					editor={editor}
					style={{
						userSelect: isEditing ? 'text' : 'none',
						WebkitUserSelect: isEditing ? 'text' : 'none',
						flex: 1,
						overflow: 'auto',
					}}
				/>
			</div>
		</CardBase>
	);
}

// ============================================================================
// IMAGE CARD
// ============================================================================

export function ImageCardComponent({ 
	card, 
	isEditing 
}: { 
	card: ImageCard; 
	isEditing: boolean;
}) {
	const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; } | null>(null);
	const previousDataRef = useRef({
		image_url: card.image_url,
		caption: card.image_caption,
		alt_text: card.image_alt_text,
	});

	const debouncedSave = useDebouncedCallback(
		async (image_url: string, caption: string | null, alt_text: string | null) => {
			try {
				const oldData = previousDataRef.current;

				await CardService.updateCardContent(card.id, card.board_id, 'image', {
					image_url,
					image_caption: caption,
					image_alt_text: alt_text,
				});

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit image card',
					do: () => CardService.updateCardContent(card.id, card.board_id, 'image', {
						image_url,
						image_caption: caption,
						image_alt_text: alt_text,
					}),
					undo: () => CardService.updateCardContent(card.id, card.board_id, 'image', {
						image_url: oldData.image_url,
						image_caption: oldData.caption,
						image_alt_text: oldData.alt_text,
					}),
				});

				previousDataRef.current = { image_url, caption, alt_text };
			} catch (error) {
				console.error('Failed to update image card:', error);
			}
		},
		1000
	);

	// Update card height when image loads
	useEffect(() => {
		if (imageDimensions && card.width) {
			const aspectRatio = imageDimensions.height / imageDimensions.width;
			const newHeight = Math.round(card.width * aspectRatio);

			if (card.height !== newHeight) {
				// Removed: updateCard - using InstantDB subscription

				updateCardTransform(card.id, { height: newHeight }).catch(err => {
					console.error('Failed to update card height:', err);
				});
			}
		}
	}, [imageDimensions, card, card.width, card.height, card.id]);

	const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newUrl = e.target.value;

		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSave(newUrl, card.image_caption, card.image_alt_text);
	};

	const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newCaption = e.target.value;

		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSave(card.image_url, newCaption, card.image_alt_text);
	};

	const handleAltTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newAltText = e.target.value;

		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSave(card.image_url, card.image_caption, newAltText);
	};

	return (
		<CardBase isEditing={isEditing} className="backdrop-blur-xl shadow-xl hover:border-cyan-500/50 bg-[#1e293b]/90 border-white/10">
			<div className="image-card flex flex-col" style={{ height: '100%' }}>
				{card.image_url ? (
					<>
						<div className="flex-shrink-0 relative" style={{ width: '100%', height: 'auto' }}>
							<Image
								src={card.image_url}
								alt={card.image_alt_text || 'Image'}
								width={card.width || 300}
								height={card.height || 300}
								className="w-full h-auto"
								sizes="(max-width: 1200px) 100vw, 1200px"
								onLoad={(e) => {
									const img = e.currentTarget as HTMLImageElement;
									setImageDimensions({
										width: img.naturalWidth,
										height: img.naturalHeight
									});
								}}
							/>
						</div>
						{isEditing ? (
							<div className="p-3 space-y-2 bg-slate-800/50 border-t border-white/10">
								<input
									type="text"
									value={card.image_caption || ''}
									onChange={handleCaptionChange}
									className="w-full px-2 py-1 text-xs bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
									placeholder="Caption (optional)"
									onClick={(e) => e.stopPropagation()}
								/>
								<input
									type="text"
									value={card.image_alt_text || ''}
									onChange={handleAltTextChange}
									className="w-full px-2 py-1 text-xs bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
									placeholder="Alt text (optional)"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						) : null }
					</>
				) : (
					<div className="p-4">
						{isEditing ? (
							<div className="space-y-2">
								<label className="text-xs text-slate-400 block">Image URL</label>
								<input
									type="url"
									value={card.image_url}
									onChange={handleImageUrlChange}
									className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
									placeholder="https://example.com/image.jpg"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						) : (
							<div className="flex items-center justify-center h-full bg-slate-800/50 text-slate-400">
								No image
							</div>
						)}
					</div>
				)}
			</div>
		</CardBase>
	);
}

// ============================================================================
// TEXT CARD
// ============================================================================

export function TextCardComponent({ 
	card, 
	isEditing 
}: { 
	card: TextCard; 
	isEditing: boolean;
}) {
	const { setEditingCardId  } = useCanvasStore();
	const previousDataRef = useRef({
		title: card.text_title,
		content: card.text_content,
	});

	const debouncedSave = useDebouncedCallback(
		async (title: string, content: string) => {
			try {
				const oldData = previousDataRef.current;

				await CardService.updateCardContent(card.id, card.board_id, 'text', {
					text_title: title,
					text_content: content,
				});

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit text card',
					do: () => CardService.updateCardContent(card.id, card.board_id, 'text', {
						text_title: title,
						text_content: content,
					}),
					undo: () => CardService.updateCardContent(card.id, card.board_id, 'text', {
						text_title: oldData.title,
						text_content: oldData.content,
					}),
				});

				previousDataRef.current = { title, content };
			} catch (error) {
				console.error('Failed to update text card:', error);
			}
		},
		1000
	);

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		
		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSave(newTitle, card.text_content);
	};

	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newContent = e.target.value;
		
		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSave(card.text_title || '', newContent);
	};

	return (
		<CardBase isEditing={isEditing} className="bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border-white/10">
			<div className="text-card p-4 h-full flex flex-col overflow-auto">
				{card.text_title && (
					isEditing ? (
						<input
							type="text"
							value={card.text_title}
							onChange={handleTitleChange}
							className="text-xl font-bold text-white mb-1 w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1"
							placeholder="Title"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<h3 className="text-xl font-bold text-white mb-1 flex-shrink-0">
							{card.text_title}
						</h3>
					)
				)}
				{isEditing ? (
					<textarea
						value={card.text_content}
						onChange={handleContentChange}
						className="text-base text-slate-300 w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1 flex-1 resize-none"
						placeholder="Type your text..."
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<p className="text-base text-slate-300 whitespace-pre-wrap flex-1 overflow-auto">
						{card.text_content}
					</p>
				)}
			</div>
		</CardBase>
	);
}

// ============================================================================
// TASK LIST CARD
// ============================================================================

export function TaskListCardComponent({ 
	card, 
	isEditing 
}: { 
	card: TaskListCard; 
	isEditing: boolean;
}) {
	const { setEditingCardId  } = useCanvasStore();
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [taskText, setTaskText] = useState('');
	const previousTitleRef = useRef(card.task_list_title);
	const previousTasksRef = useRef(card.tasks);

	const debouncedSaveTitle = useDebouncedCallback(
		async (title: string) => {
			try {
				const oldTitle = previousTitleRef.current;

				await CardService.updateCardContent(card.id, card.board_id, 'task_list', {
					task_list_title: title,
				});

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit task list title',
					do: () => CardService.updateCardContent(card.id, card.board_id, 'task_list', { task_list_title: title }),
					undo: () => CardService.updateCardContent(card.id, card.board_id, 'task_list', { task_list_title: oldTitle }),
				});

				previousTitleRef.current = title;
			} catch (error) {
				console.error('Failed to update task list title:', error);
			}
		},
		1000
	);

	const debouncedSaveTasks = useDebouncedCallback(
		async (tasks: TaskListCard['tasks']) => {
			try {
				const oldTasks = previousTasksRef.current;

				await CardService.updateCardContent(card.id, card.board_id, 'task_list', {
					tasks: tasks,
				});

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit task list',
					do: () => CardService.updateCardContent(card.id, card.board_id, 'task_list', { tasks: tasks }),
					undo: () => CardService.updateCardContent(card.id, card.board_id, 'task_list', { tasks: oldTasks }),
				});

				previousTasksRef.current = tasks;
			} catch (error) {
				console.error('Failed to update tasks:', error);
			}
		},
		1000
	);

	const handleToggleTask = (taskId: string) => {
		const updatedTasks = card.tasks.map(task =>
			task.id === taskId ? { ...task, completed: !task.completed } : task
		);

		// Local state updates happen via InstantDB subscription

		// Debounced save to database
		debouncedSaveTasks(updatedTasks);
	};

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		
		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSaveTitle(newTitle);
	};

	const handleTaskTextChange = (taskId: string, newText: string) => {
		const updatedTasks = card.tasks.map(task =>
			task.id === taskId ? { ...task, text: newText } : task
		);

		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSaveTasks(updatedTasks);
	};

	const handleAddTask = () => {
		console.log(card.tasks.length)
		const newTask = {
			id: `task-${Date.now()}`,
			text: 'New task',
			completed: false,
			position: card.tasks.length,
		};

		const updatedTasks = [...card.tasks, newTask];

		// Local state updates happen via InstantDB subscription

		// Save immediately
		debouncedSaveTasks(updatedTasks);
		setEditingTaskId(newTask.id);
	};

	const handleDeleteTask = (taskId: string) => {
		const updatedTasks = card.tasks
			.filter(task => task.id !== taskId)
			.map((task, index) => ({ ...task, position: index }));

		// Local state updates happen via InstantDB subscription

		// Save immediately
		debouncedSaveTasks(updatedTasks);
	};

	return (
		<CardBase
			isEditing={isEditing}
			className="bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border-white/10"
			style={{
				height: isEditing ? `${(card.height || 100) + 60}px` : '100%'
			}}
		>
			<div className="task-list-card p-4">
				{isEditing ? (
					<input
						type="text"
						value={card.task_list_title}
						onChange={handleTitleChange}
						className="font-semibold text-white mb-3 w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1"
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<h3 className="font-semibold text-white mb-3 border-b border-white/5 pb-2">
						{card.task_list_title}
					</h3>
				)}

				<div className="space-y-2 mb-3">
					{[...card.tasks || []]
						.sort((a, b) => a.position - b.position)
						.map(task => (
						<div
							key={task.id}
							className="flex items-start gap-2.5 group"
						>
							<div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
								<input
									type="checkbox"
									checked={task.completed}
									onChange={() => handleToggleTask(task.id)}
									className="w-4 h-4 rounded border border-slate-600 appearance-none cursor-pointer transition-all checked:bg-indigo-500/30 checked:border-indigo-400 hover:border-indigo-400"
									onClick={(e) => e.stopPropagation()}
								/>
								{task.completed && (
									<svg
										className="absolute w-2.5 h-2.5 text-indigo-300 pointer-events-none"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={3}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								)}
							</div>
							{isEditing && editingTaskId === task.id ? (
								<input
									type="text"
									value={task.text}
									onChange={(e) => handleTaskTextChange(task.id, e.target.value)}
									onBlur={() => setEditingTaskId(null)}
									placeholder='Add new task...'
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											setEditingTaskId(null);
										}
									}}
									className="flex-1 text-sm text-slate-300 bg-transparent border-b border-cyan-500 outline-none"
									autoFocus
									onClick={(e) => e.stopPropagation()}
								/>
							) : (
								<span
									className={`flex-1 text-sm transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-300 group-hover:text-white'}`}
									onDoubleClick={(e) => {
										if (isEditing) {
											e.stopPropagation();
											setEditingTaskId(task.id);
										}
									}}
								>
									{task.text}
								</span>
							)}
							{isEditing && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteTask(task.id);
									}}
									className="opacity-0 group-hover:opacity-100 text-red-500 text-xs hover:text-red-700 flex-shrink-0"
									style={{ cursor: 'pointer' }}
								>
									×
								</button>
							)}
						</div>
					))}
				</div>

				{isEditing && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							handleAddTask();
						}}
						className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-dashed border-slate-700 rounded-md transition-colors"
						style={{ cursor: 'pointer' }}
					>
						+ Add task
					</button>
				)}
			</div>
		</CardBase>
	);
}

// ============================================================================
// LINK CARD
// ============================================================================

export function LinkCardComponent({ 
	card, 
	isEditing 
}: { 
	card: LinkCard; 
	isEditing: boolean;
}) {
	const { clearSelection, setEditingCardId  } = useCanvasStore();
	const [faviconUrl, setFaviconUrl] = useState<string>('');
	const [fullURL, setFullURL] = useState<string | null>(null);
	const [faviconError, setFaviconError] = useState(false);
	const previousDataRef = useRef({
		title: card.link_title,
		url: card.link_url,
		favicon_url: card.link_favicon_url,
	});

	useEffect(() => {
		const getFullUrl = async () => {
			const newUrl = card.link_url.startsWith("https://") || card.link_url.startsWith("http://") ?
				card.link_url :
				"https://" + card.link_url;

			setFullURL(newUrl);
		}

		getFullUrl();
	}, [card]);

	useEffect(() => {
		const getFaviconUrl = async () => {
			if (!fullURL) return;
			const domain = new URL(fullURL).hostname;
			setFaviconUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
			setFaviconError(false);
		};

		getFaviconUrl();
	}, [fullURL]);

	useEffect(() => {
		const handleEnterKeyPressed = (e: KeyboardEvent) => {
			if (!isEditing) return;
			const isMod = e.metaKey || e.ctrlKey;
			if (isMod || e.key !== 'Enter') return;

			clearSelection();
			setEditingCardId(null);
		}

		document.addEventListener('keydown', handleEnterKeyPressed);

		return () => {
			document.removeEventListener('keydown', handleEnterKeyPressed)
		}
	});

	const debouncedSave = useDebouncedCallback(
		async (title: string, url: string, favicon_url: string | null) => {
			try {
				const oldData = previousDataRef.current;

				await CardService.updateCardContent(card.id, card.board_id, 'link', {
					link_title: title,
					link_url: url,
					link_favicon_url: favicon_url,
				});

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit link card',
					do: () => CardService.updateCardContent(card.id, card.board_id, 'link', {
						link_title: title,
						link_url: url,
						link_favicon_url: favicon_url,
					}),
					undo: () => CardService.updateCardContent(card.id, card.board_id, 'link', {
						link_title: oldData.title,
						link_url: oldData.url,
						link_favicon_url: oldData.favicon_url,
					}),
				});

				previousDataRef.current = { title, url, favicon_url };
			} catch (error) {
				console.error('Failed to update link card:', error);
			}
		},
		10000
	);

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		
		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSave(newTitle, card.link_url, card.link_favicon_url);
	};

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newUrl = e.target.value;
		
		// Local state updates happen via InstantDB subscription

		// Debounced save
		debouncedSave(card.link_title, newUrl, card.link_favicon_url);
	};

	if (isEditing) {
		return (
			<CardBase isEditing={isEditing} className="bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border-white/10">
				<div className="link-card block p-4 transition-colors">
					<div className="space-y-2">
						<div>
							<label className="text-xs text-slate-400 block mb-1">Title</label>
							<input
								type="text"
								value={card.link_title}
								onChange={handleTitleChange}
								className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
								placeholder="Link title"
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
						<div>
							<label className="text-xs text-slate-400 block mb-1">URL</label>
							<input
								type="url"
								value={card.link_url}
								onChange={handleUrlChange}
								className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
								placeholder="https://example.com"
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
					</div>
				</div>
			</CardBase>
		);
	}

	return (
		<CardBase isEditing={isEditing} className="bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border-white/10 cursor-pointer group">
			<a
				href={fullURL || ''}
				target="_blank"
				rel="noopener noreferrer"
				className="link-card block p-4 transition-colors"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start gap-3">
					{!faviconError && faviconUrl && (
						<div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center shrink-0 border border-white/5 group-hover:border-cyan-500/30 transition-colors">
							<Image
								src={faviconUrl}
								alt=""
								className="w-5 h-5"
								width={18}
								height={18}
								onError={() => {
									setFaviconError(true);
								}}
							/>
						</div>
					)}
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-sm text-white mb-1 group-hover:text-cyan-400 transition-colors truncate">
							{card.link_title || card.link_url}
						</h3>
						{fullURL && (
							<div className="flex items-center gap-1.5 text-[10px] text-slate-500">
								<svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
								</svg>
								<span className="truncate">{new URL(fullURL).hostname}</span>
							</div>
						)}
					</div>
				</div>
			</a>
		</CardBase>
	);
}

// ============================================================================
// FILE CARD
// ============================================================================

export function FileCardComponent({ 
	card, 
	isEditing 
}: { 
	card: FileCard; 
	isEditing: boolean;
}) {
	const formatFileSize = (bytes: number | null) => {
		if (!bytes) return 'Unknown size';
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		return `${(kb / 1024).toFixed(1)} MB`;
	};

	return (
		<CardBase isEditing={isEditing} className="min-w-[280px] max-w-[420px]">
			<a
				href={card.file_cards.file_url}
				target="_blank"
				rel="noopener noreferrer"
				className="file-card block p-4 hover:bg-gray-50 transition-colors"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-semibold text-xs">
						{card.file_cards.file_type?.toUpperCase() || 'FILE'}
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-sm text-gray-900 truncate">
							{card.file_cards.file_name}
						</h3>
						<p className="text-xs text-gray-400">
							{formatFileSize(card.file_cards.file_size)}
						</p>
					</div>
				</div>
			</a>
		</CardBase>
	);
}

// ============================================================================
// COLOR PALETTE CARD
// ============================================================================

export function ColorPaletteCardComponent({
	card,
	isEditing
}: {
	card: ColorPaletteCard;
	isEditing: boolean;
}) {
	const [newColor, setNewColor] = useState('#000000');
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const previousDataRef = useRef({
		title: card.palette_title,
		description: card.palette_description,
		colors: card.palette_colors,
	});

	const debouncedSave = useDebouncedCallback(
		async (title: string, description: string | null, colors: string[]) => {
			try {
				const oldData = previousDataRef.current;

				await CardService.updateCardContent(card.id, card.board_id, 'color_palette', {
					palette_title: title,
					palette_description: description,
					palette_colors: colors,
				});

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit color palette',
					do: () => CardService.updateCardContent(card.id, card.board_id, 'color_palette', {
						palette_title: title,
						palette_description: description,
						palette_colors: colors,
					}),
					undo: () => CardService.updateCardContent(card.id, card.board_id, 'color_palette', {
						palette_title: oldData.title,
						palette_description: oldData.description,
						palette_colors: oldData.colors,
					}),
				});

				previousDataRef.current = { title, description, colors };
			} catch (error) {
				console.error('Failed to update color palette:', error);
			}
		},
		1000
	);

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;

		// Removed: updateCard - using InstantDB subscription

		debouncedSave(newTitle, card.palette_description, card.palette_colors);
	};

	const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newDescription = e.target.value;

		// Removed: updateCard - using InstantDB subscription

		debouncedSave(card.palette_title, newDescription, card.palette_colors);
	};

	const handleAddColor = () => {
		const updatedColors = [...card.palette_colors, newColor];

		// Removed: updateCard - using InstantDB subscription

		debouncedSave(card.palette_title, card.palette_description, updatedColors);
		setNewColor('#000000');
	};

	const handleRemoveColor = (index: number) => {
		const updatedColors = card.palette_colors.filter((_, i) => i !== index);

		// Removed: updateCard - using InstantDB subscription

		debouncedSave(card.palette_title, card.palette_description, updatedColors);
	};

	const handleColorChange = (index: number, newColor: string) => {
		const updatedColors = [...card.palette_colors];
		updatedColors[index] = newColor;

		// Removed: updateCard - using InstantDB subscription

		debouncedSave(card.palette_title, card.palette_description, updatedColors);
	};

	const handleCopyColor = async (color: string, index: number) => {
		try {
			await navigator.clipboard.writeText(color);
			setCopiedIndex(index);
			// Reset after 2 seconds
			setTimeout(() => setCopiedIndex(null), 500);
		} catch (err) {
			console.error('Failed to copy color:', err);
		}
	};

	// Calculate height based on number of colors and editing state
	const colorCount = card.palette_colors.length;
	const rows = Math.ceil(colorCount / 3); // 3 colors per row

	// Base heights
	const headerHeight = 35; // Title + icon
	const descriptionHeight = isEditing ? 50 : (card.palette_description ? 25 : 0);
	const colorRowHeight = isEditing ? 70 : 60; // Taller in edit mode for Remove buttons
	const addColorHeight = isEditing ? 50 : 0;
	const padding = 24; // Reduced padding

	const calculatedHeight = headerHeight + descriptionHeight + (rows * colorRowHeight) + addColorHeight + padding;

	return (
		<CardBase
			isEditing={isEditing}
			className="bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border-white/10"
			style={{
				height: isEditing ? `${calculatedHeight}px` : 'auto',
				minHeight: isEditing ? `${calculatedHeight}px` : 'auto'
			}}
		>
			<div className="color-palette-card px-4 pt-4 pb-0 h-full">
				{/* Header Section */}
				<div className="flex items-center gap-2 mb-2">
					<svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
					</svg>
					{isEditing ? (
						<input
							type="text"
							value={card.palette_title}
							onChange={handleTitleChange}
							className="font-semibold text-white flex-1 bg-transparent border-none outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1"
							placeholder="Palette name"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<h3 className="font-semibold text-white">
							{card.palette_title}
						</h3>
					)}
				</div>

				{/* Description Section */}
				{isEditing ? (
					<textarea
						value={card.palette_description || ''}
						onChange={handleDescriptionChange}
						className="text-xs text-slate-400 mb-4 w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1 resize-none"
						placeholder="Description (optional)"
						rows={2}
						onClick={(e) => e.stopPropagation()}
					/>
				) : card.palette_description ? (
					<p className="text-xs text-slate-400 mb-4">
						{card.palette_description}
					</p>
				) : null}

				{/* Colors Grid - Fixed 3 columns with space for tooltips */}
				<div className="grid grid-cols-3 gap-2 mb-1">
					{card.palette_colors.map((color, index) => (
						<div key={index} className="relative group flex flex-col items-center">
							{isEditing ? (
								<>
									<input
										type="color"
										value={color}
										onChange={(e) => handleColorChange(index, e.target.value)}
										className="w-12 h-12 rounded-lg border border-white/10 shadow-lg cursor-pointer hover:scale-105 transition-transform mb-1"
										onClick={(e) => e.stopPropagation()}
									/>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleRemoveColor(index);
										}}
										className="text-[10px] text-red-400 hover:text-red-300 px-1 py-0.5 hover:bg-red-500/10 rounded transition-colors whitespace-nowrap"
										style={{ cursor: 'pointer' }}
									>
										Remove
									</button>
								</>
							) : (
								<>
									<div
										className="w-12 h-12 rounded-lg border border-white/10 shadow-lg cursor-pointer hover:scale-105 transition-transform mb-1 relative"
										style={{ backgroundColor: color }}
										title={`Click to copy ${color}`}
										onClick={(e) => {
											e.stopPropagation();
											handleCopyColor(color, index);
										}}
									>
										{/* Copy indicator */}
										{copiedIndex === index && (
											<div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
												<svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
												</svg>
											</div>
										)}
									</div>
									<div className="text-[9px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">
										{color}
									</div>
								</>
							)}
						</div>
					))}
				</div>

				{/* Add Color Section */}
				{isEditing && (
					<div className="flex gap-2 items-center mt-2">
						<input
							type="color"
							value={newColor}
							onChange={(e) => setNewColor(e.target.value)}
							className="w-10 h-10 rounded border border-white/10 cursor-pointer flex-shrink-0"
							onClick={(e) => e.stopPropagation()}
						/>
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleAddColor();
							}}
							className="text-sm text-slate-400 hover:text-slate-300 px-2 py-1 hover:bg-white/5 rounded transition-colors"
							style={{ cursor: 'pointer' }}
						>
							+ Add color
						</button>
					</div>
				)}
			</div>
		</CardBase>
	);
}

// ============================================================================
// COLUMN CARD
// ============================================================================

interface ColumnCardComponentProps {
	card: ColumnCard;
	isEditing: boolean;
	isSelected?: boolean;
	onEditorReady?: (cardId: string, editor: any) => void;
}

export function ColumnCardComponent({
	card,
	isEditing,
	isSelected,
	onEditorReady
}: ColumnCardComponentProps) {
	const { potentialColumnTarget,
		selectCard,
		setEditingCardId,
		selectedCardIds,
		setDragPreview,
		viewport
	 } = useCanvasStore();

	// Get cards from InstantDB
	const { cards: cardsArray } = useBoardCards(card.board_id);
	const cards = useMemo(
		() => new Map(cardsArray.map(c => [c.id, c])),
		[cardsArray]
	);

	const [isCollapsed, setIsCollapsed] = useState(card.column_is_collapsed || false);
	const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [cardHoverId, setCardHoverId] = useState<string | null>(null);

	const draggedCardRef = useRef<Card | null>(null);
	const dragStartIndexRef = useRef<number | null>(null);
	const columnListRef = useRef<HTMLDivElement>(null);
	const dragOverIndexRef = useRef<number | null>(null);

	const { handleMouseDown: handleMouseDownResizable, isResizing, currentDimensions } = useResizable({
		card: card
	});

	const isDropTarget = potentialColumnTarget === card.id;
	const previousDataRef = useRef({
		title: card.column_title,
		background_color: card.column_background_color,
		is_collapsed: card.column_is_collapsed,
		column_items: card.column_items,
	});

	const debouncedSave = useDebouncedCallback(
		async (title: string, background_color: string, is_collapsed?: boolean, column_items?: Array<{card_id: string, position: number}>) => {
			try {
				const oldData = previousDataRef.current;

				const updateData: any = {
					column_title: title,
					column_background_color: background_color,
				};
				if (is_collapsed !== undefined) {
					updateData.column_is_collapsed = is_collapsed;
				}
				if (column_items !== undefined) {
					updateData.column_items = column_items;
				}

				await CardService.updateCardContent(card.id, card.board_id, 'column', updateData);

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit column',
					do: () => CardService.updateCardContent(card.id, card.board_id, 'column', updateData),
					undo: () => {
						const undoData: any = {
							column_title: oldData.title,
							column_background_color: oldData.background_color,
							column_is_collapsed: oldData.is_collapsed,
						};
						if (column_items !== undefined) {
							undoData.column_items = oldData.column_items;
						}
						return CardService.updateCardContent(card.id, card.board_id, 'column', undoData);
					},
				});

				previousDataRef.current = {
					title,
					background_color,
					is_collapsed: is_collapsed ?? oldData.is_collapsed,
					column_items: column_items ?? oldData.column_items,
				};
			} catch (error) {
				console.error('Failed to update column:', error);
			}
		},
		1000
	);

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		
		// Removed: updateCard - using InstantDB subscription

		debouncedSave(newTitle, card.column_background_color);
	};

	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newColor = e.target.value;
		
		// Removed: updateCard - using InstantDB subscription

		debouncedSave(card.column_title, newColor);
	};

	const handleToggleCollapse = async () => {
		const newCollapsed = !isCollapsed;
		setIsCollapsed(newCollapsed);
		
		// Removed: updateCard - using InstantDB subscription

		debouncedSave(card.column_title, card.column_background_color, newCollapsed);
	};

	const handleRemoveCard = async (cardId: string) => {
		try {
			await removeCardFromColumn(card.id, cardId);
			
			const updatedItems = (card.column_items || [])
				.filter(item => item.card_id !== cardId)
				.map((item, index) => ({ ...item, position: index }));
			
			// Removed: updateCard - using InstantDB subscription
		} catch (error) {
			console.error('Failed to remove card from column:', error);
		}
	};

	const handleCardClick = (cardId: string) => {
		if (!draggedCardId) {
			selectCard(cardId);
		}
	};

	const handleCardDoubleClick = (cardId: string) => {
		if (!draggedCardId) {
			setEditingCardId(cardId);
		}
	};

	const handleCardContextMenu = (e: React.MouseEvent, itemCard: Card) => {
		// Pass through to parent
		e.stopPropagation();
	};

	/**
	 * Handle card drag start - for REORDERING within column
	 * This creates a preview that works both inside AND outside the column
	 */
	const handleCardDragStart = useCallback((e: React.MouseEvent, itemCard: Card, index: number) => {
		e.preventDefault();
		e.stopPropagation();

		dragStartIndexRef.current = index;

		// Track mouse movement for drag preview
		const handleMouseMove = (me: MouseEvent) => {
			// Update drag over index if still over column
			if (columnListRef.current) {
				const columnRect = columnListRef.current.getBoundingClientRect();
				const isOverColumn = 
					me.clientX >= columnRect.left &&
					me.clientX <= columnRect.right &&
					me.clientY >= columnRect.top &&
					me.clientY <= columnRect.bottom;

				if (isOverColumn) {
					const items = Array.from(columnListRef.current.querySelectorAll('.column-card-wrapper'));
					let newDragOverIndex: number | null = null;

					for (let i = 0; i < items.length; i++) {
						const item = items[i] as HTMLElement;
						const rect = item.getBoundingClientRect();
						const midpoint = rect.top + rect.height / 2;

						if (me.clientY < midpoint) {
							newDragOverIndex = i;
							break;
						}
					}

					// If not over any item, drop at end
					if (newDragOverIndex === null) {
						newDragOverIndex = items.length;
					}

					setDragOverIndex(newDragOverIndex);
					dragOverIndexRef.current = newDragOverIndex;

					const canvas = document.querySelector("div.canvas-viewport");
					if (!canvas) return;

					const rect = canvas.getBoundingClientRect();

					const clientX = me.clientX - rect.left;
					const clientY = me.clientY - rect.top;

					const canvasX = (clientX - viewport.x) / viewport.zoom;
					const canvasY = (clientY - viewport.y) / viewport.zoom;

					setDragPreview({
						cardType: itemCard.card_type,
						canvasX,
						canvasY
					})
				} else {
					// Outside column - clear drop indicator
					setDragOverIndex(null);
					dragOverIndexRef.current = null;
				}
			}
		};

		const handleMouseUp = () => {
			// Handle the drop
			setDragPreview(null);
			const endIndex = dragOverIndexRef.current;
			if (endIndex !== null && dragStartIndexRef.current !== null && draggedCardRef.current) {
				const startIndex = dragStartIndexRef.current;

				// Only reorder if positions actually changed
				if (startIndex !== endIndex) {
					const items = [...(card.column_items || [])];

					// Remove from old position
					const [movedItem] = items.splice(startIndex, 1);

					// Insert at new position
					const insertIndex = endIndex > startIndex ? endIndex - 1 : endIndex;
					items.splice(insertIndex, 0, movedItem);

					// Update positions
					const updatedItems = items.map((item, index) => ({
						...item,
						position: index
					}));

					// Local state updates happen via InstantDB subscription

					// Save to db
					debouncedSave(
						card.column_title,
						card.column_background_color,
						undefined,
						updatedItems
					);
				}
			}

			// Clean up
			setDraggedCardId(null);
			setDragOverIndex(null);
			draggedCardRef.current = null;
			dragStartIndexRef.current = null;
			dragOverIndexRef.current = null;

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, [card, debouncedSave, setDragPreview, viewport]);

	// Get cards that belong to this column
	const columnItems = ([...card.column_items || []])
		.sort((a, b) => a.position - b.position)
		.map(item => cards.get(item.card_id))
		.filter(c => c !== undefined);

	const itemCount = columnItems.length;

	return (
		<div
			className={`
				column-card-container
				flex flex-col
				border
				overflow-hidden
				transition-all duration-200
				w-full h-full
				bg-[#1e293b]/90 backdrop-blur-xl shadow-xl
				${isDropTarget
					? 'border-cyan-400 ring-4 ring-cyan-200 ring-opacity-50'
					: isEditing
						? 'border-cyan-400 hover:border-cyan-500/50'
						: 'border-white/10 hover:border-cyan-500/50'
				}
			`}
		>
			{/* Header */}
			<div className={`
				column-header
				flex items-center gap-2
				px-3 py-2.5
				border-b
				flex-shrink-0
				${isDropTarget ? 'border-cyan-300/50 bg-cyan-100/10' : 'border-white/5 bg-white/5'}
			`}>
				{/* Collapse Button */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						handleToggleCollapse();
					}}
					className={`
						w-6 h-6 flex items-center justify-center
						rounded transition-all flex-shrink-0
						${isDropTarget
							? 'text-cyan-400 hover:bg-cyan-200/20'
							: 'text-slate-400 hover:bg-white/10 hover:text-white'
						}
					`}
					title={isCollapsed ? "Expand column" : "Collapse column"}
				>
					<svg
						className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
					</svg>
				</button>

				{/* Color indicator dot */}
				<div
					className="w-2 h-2 rounded-full flex-shrink-0"
					style={{ backgroundColor: card.column_background_color }}
				/>

				{/* Title */}
				<div className="flex-1 min-w-0">
					{isEditing ? (
						<input
							type="text"
							value={card.column_title}
							onChange={handleTitleChange}
							className="w-full px-2 py-1 text-sm font-medium bg-slate-700/50 text-white border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
							placeholder="Column title"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<h3 className="text-sm font-bold text-white truncate">
							{card.column_title}
						</h3>
					)}
				</div>

				{/* Card count badge */}
				<div className={`
					px-2 py-0.5 rounded-full text-[10px] font-mono flex-shrink-0
					${isDropTarget
						? 'bg-cyan-500/20 text-cyan-300'
						: 'bg-slate-700/50 text-slate-400'
					}
				`}>
					{itemCount}
				</div>

				{/* Color picker (only in edit mode) */}
				{isEditing && (
					<input
						type="color"
						value={card.column_background_color}
						onChange={handleColorChange}
						className="w-6 h-6 rounded cursor-pointer flex-shrink-0"
						title="Change column color"
						onClick={(e) => e.stopPropagation()}
					/>
				)}
			</div>

			{/* Body */}
			{!isCollapsed && (
				<div 
					ref={columnListRef}
					className="column-body flex-1 overflow-y-auto p-3 relative"
				>
					{columnItems.length === 0 ? (
						/* Empty state */
						<div className={`
							flex flex-col items-center justify-center
							min-h-[200px]
							border-2 border-dashed rounded-lg
							transition-all duration-200
							${isDropTarget
								? 'border-cyan-400 bg-cyan-500/10'
								: 'border-slate-700 bg-slate-800/30'
							}
						`}>
							<div className={`
								w-12 h-12 rounded-full flex items-center justify-center mb-3
								transition-all duration-200
								${isDropTarget
									? 'bg-cyan-500/20 text-cyan-400 scale-110'
									: 'bg-slate-700/50 text-slate-500'
								}
							`}>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<p className={`
								text-sm font-medium transition-all duration-200
								${isDropTarget
									? 'text-cyan-400'
									: 'text-slate-500'
								}
							`}>
								{isDropTarget ? 'Drop cards here' : 'Drag cards here'}
							</p>
						</div>
					) : (
						/* Render actual cards inside column */
						<div className="column-cards-list space-y-2">
							{columnItems.map((itemCard, index) => (
								<div key={itemCard.id}>
									{/* Insertion line indicator */}
									{dragOverIndex === index && draggedCardId !== itemCard.id && (
										<div className="h-0.5 bg-cyan-500 rounded mb-2 shadow-lg animate-pulse" />
									)}
									
									<div
										className={`
											column-card-wrapper relative
											transition-opacity duration-150
											${draggedCardId === itemCard.id ? 'opacity-30' : 'opacity-100'}
										`}
										style={{
											width: '100%',
										}}
										onMouseDown={(e) => {
											// Only allow reordering when not editing the column
											if (!isEditing) {
												handleCardDragStart(e, itemCard as unknown as Card, index);
											}
										}}
										onMouseEnter={() => setCardHoverId(itemCard.id)}
										onMouseLeave={() => {
											if(cardHoverId === itemCard.id) {
												setCardHoverId(null);
											}
										}}
									>
										{/* Drag handle indicator */}
										{!isEditing && (
											<div className={`absolute left-1 top-1/2 -translate-y-1/2 ${cardHoverId === itemCard.id ? "hover:opacity-60" : "opacity-0"} transition-opacity cursor-move z-10`}>
												<svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
													<path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
												</svg>
											</div>
										)}
										
										{/* Remove button (only in edit mode) */}
										{isEditing && (
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveCard(itemCard.id);
												}}
												className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md transition-colors"
												title="Remove from column"
											>
												×
											</button>
										)}
										
										{/* Render the actual card */}
										<CanvasElement
											card={itemCard as unknown as Card}
											boardId={card.board_id}
											onCardClick={handleCardClick}
											onCardDoubleClick={handleCardDoubleClick}
											onContextMenu={handleCardContextMenu}
											onEditorReady={onEditorReady}
											isInsideColumn={true}
										/>
									</div>
								</div>
							))}
							
							{/* Drop at end indicator */}
							{dragOverIndex === columnItems.length && (
								<div className="h-0.5 bg-cyan-500 rounded shadow-lg animate-pulse" />
							)}
						</div>
					)}
				</div>
			)}

			{/* Collapsed State */}
			{isCollapsed && (
				<div className="px-3 py-2 text-center border-t border-white/5 bg-white/5">
					<p className="text-xs text-slate-400">
						{itemCount} {itemCount === 1 ? 'card' : 'cards'}
					</p>
				</div>
			)}
		</div>
	);
}

/**
 * Separate component for drag preview that follows cursor
 * Uses a portal-like approach with fixed positioning
 */
function ColumnDragPreview({ card }: { card: Card }) {
	const [position, setPosition] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setPosition({ x: e.clientX, y: e.clientY });
		};

		// Attach immediately
		handleMouseMove(new MouseEvent('mousemove', {
			clientX: window.event ? (window.event as MouseEvent).clientX : 0,
			clientY: window.event ? (window.event as MouseEvent).clientY : 0,
		}));

		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	return (
		<div
			className="fixed pointer-events-none z-[10000]"
			style={{
				left: position.x,
				top: position.y,
				transform: 'translate(-50%, -50%) rotate(-3deg)',
				opacity: 0.8,
			}}
		>
			<div className="shadow-2xl rounded-lg border-2 border-blue-400 bg-white scale-95">
				<div style={{ width: `${card.width}px` }}>
					<CardRenderer
						card={card}
						isEditing={false}
						isSelected={false}
					/>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// BOARD CARD - For nested boards
// ============================================================================

export function BoardCardComponent({
	card,
	isEditing,
	isPublicView = false
}: {
	card: any; // Will be BoardCard type
	isEditing: boolean;
	isPublicView?: boolean;
}) {
	const [availableBoards, setAvailableBoards] = useState<Array<{id: string, title: string, color: string}>>([]);
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [newBoardTitle, setNewBoardTitle] = useState('New Board');
	const [newBoardColor, setNewBoardColor] = useState('#3B82F6');

	// Local state for immediate UI feedback while editing
	const [localTitle, setLocalTitle] = useState(card.board_title || '');

	const previousDataRef = useRef({
		linked_board_id: card.linked_board_id || '',
		board_title: card.board_title || '',
		board_color: card.board_color || '#3B82F6',
	});

	// Update local title when card prop changes (from DB) and not editing
	useEffect(() => {
		if (!isEditing) {
			setLocalTitle(card.board_title || '');
		}
	}, [card.board_title, isEditing]);

	const debouncedSave = useDebouncedCallback(
		async (linked_board_id: string, board_title: string, board_color: string, expectedBoardId: string) => {
			try {
				const oldData = previousDataRef.current;

				await CardService.updateCardContent(card.id, expectedBoardId, 'board', {
					linked_board_id: linked_board_id,
					board_title,
					board_color,
				});

				// Add undo action
				useUndoStore.getState().addAction({
					type: 'card_content',
					timestamp: Date.now(),
					description: 'Edit board card',
					do: () => CardService.updateCardContent(card.id, expectedBoardId, 'board', {
						board_linked_board_id: linked_board_id,
						board_title,
						board_color,
					}),
					undo: () => CardService.updateCardContent(card.id, expectedBoardId, 'board', {
						board_linked_board_id: oldData.linked_board_id,
						board_title: oldData.board_title,
						board_color: oldData.board_color,
					}),
				});

				previousDataRef.current = { linked_board_id, board_title, board_color };
			} catch (error) {
				console.error('Failed to update board card:', error);
			}
		},
		1000
	);

	// Fetch available boards when in edit mode
	const instantUser = db.useAuth();

	// Fetch available boards using InstantDB
	const { data: boardsData } = db.useQuery(
		instantUser.user?.id ? {
			$users: {
				$: { where: { id: instantUser.user.id } },
				owned_boards: {
					$: {
						order: { updated_at: 'desc' as const },
					},
				},
			},
		} : null
	);

	useEffect(() => {
		if (isEditing && boardsData) {
			const userBoards = boardsData.$users?.[0]?.owned_boards || [];
			setAvailableBoards(userBoards.map((b: any) => ({
				id: b.id,
				title: b.title,
				color: b.color,
			})));
		}
	}, [isEditing, boardsData]);

	const handleCreateNewBoard = async () => {
		try {
			if (!instantUser.user?.id) throw new Error('Not authenticated');

			console.log('[BoardCardComponent] Creating new board with parent:', {
				parentBoardId: card.board_id,
				newBoardTitle,
				newBoardColor,
			});

			// Create new board using BoardService with parent link
			const newBoardId = await BoardService.createBoard({
				ownerId: instantUser.user.id,
				title: newBoardTitle,
				color: newBoardColor,
				parentId: card.board_id, // Link to parent board
			});

			console.log('[BoardCardComponent] New board created:', newBoardId);

			// Update card to link to new board
			await CardService.updateCardContent(card.id, card.board_id, 'board', {
				linked_board_id: newBoardId,
				board_title: newBoardTitle,
				board_color: newBoardColor,
			});

			console.log('[BoardCardComponent] Card updated with linked_board_id');

			setIsCreatingNew(false);
		} catch (error) {
			console.error('Failed to create board:', error);
		}
	};

	const handleSelectBoard = async (boardId: string, boardTitle: string, boardColor: string) => {
		// Save to database (InstantDB will update local state via subscription)
		await CardService.updateCardContent(card.id, card.board_id, 'board', {
			board_linked_board_id: boardId,
			board_title: boardTitle,
			board_color: boardColor,
		});
	};

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;

		// Update local state immediately for responsive UI
		setLocalTitle(newTitle);

		// Debounce the database save
		debouncedSave(card.linked_board_id, newTitle, card.board_color, card.board_id);
	};

	const handleNavigateToBoard = async (e: React.MouseEvent) => {
		if (!isEditing && card.linked_board_id) {
			e.stopPropagation();

			// If in public view, fetch the child board's share token and use public link
			if (isPublicView) {
				try {
					// Query InstantDB for the child board
					const { data } = await db.queryOnce({
						boards: {
							$: {
								where: {
									id: card.linked_board_id,
									is_public: true,
								},
								limit: 1,
							},
						},
					});

					const childBoard = data?.boards?.[0];

					if (childBoard && childBoard.is_public && childBoard.share_token) {
						// Navigate to public share link
						window.location.href = `/board/public/${childBoard.share_token}`;
					} else {
						// Child board is not public, show error or just don't navigate
						console.warn('Child board is not publicly accessible');
					}
				} catch (error) {
					console.error('Failed to fetch child board info:', error);
				}
			} else {
				// Regular navigation for authenticated users
				window.location.href = `/board/${card.linked_board_id}`;
			}
		}
	};

	if (isEditing) {
		return (
			<CardBase isEditing={isEditing} className="bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border-white/10">
				<div className="board-card p-4 space-y-3">
					<div>
						<label className="text-xs text-slate-400 block mb-1">Board Title</label>
						<input
							type="text"
							value={localTitle}
							onChange={handleTitleChange}
							className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
							placeholder="Board name"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>

					{isCreatingNew ? (
						<div className="space-y-3 p-3 bg-slate-800/50 rounded border border-white/10">
							<div>
								<label className="text-xs text-slate-400 block mb-1">New Board Name</label>
								<input
									type="text"
									value={newBoardTitle}
									onChange={(e) => setNewBoardTitle(e.target.value)}
									className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
							<div>
								<label className="text-xs text-slate-400 block mb-1">Color</label>
								<input
									type="color"
									value={newBoardColor}
									onChange={(e) => setNewBoardColor(e.target.value)}
									className="w-12 h-8 rounded border border-white/10 cursor-pointer"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
							<div className="flex gap-2">
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleCreateNewBoard();
									}}
									className="px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700"
									style={{ cursor: 'pointer' }}
								>
									Create
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setIsCreatingNew(false);
									}}
									className="px-3 py-1 text-sm border border-white/10 text-slate-300 rounded hover:bg-white/5"
									style={{ cursor: 'pointer' }}
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<button
								onClick={(e) => {
									e.stopPropagation();
									setIsCreatingNew(true);
								}}
								className="w-full px-3 py-2 text-sm text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/10"
								style={{ cursor: 'pointer' }}
							>
								+ Create New Board
							</button>

							{availableBoards.length > 0 && (
								<div>
									<label className="text-xs text-slate-400 block mb-1">Or Link to Existing</label>
									<select
										value={card.linked_board_id || ''}
										onChange={(e) => {
											const selectedBoard = availableBoards.find(b => b.id === e.target.value);
											if (selectedBoard) {
												handleSelectBoard(selectedBoard.id, selectedBoard.title, selectedBoard.color);
											}
										}}
										className="w-full px-2 py-1 text-sm bg-slate-700/50 text-slate-300 border border-white/10 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
										onClick={(e) => e.stopPropagation()}
									>
										<option value="">Select a board...</option>
										{availableBoards.map(board => (
											<option key={board.id} value={board.id}>
												{board.title}
											</option>
										))}
									</select>
								</div>
							)}
						</div>
					)}
				</div>
			</CardBase>
		);
	}

	// View mode - clickable board preview
	return (
		<CardBase isEditing={isEditing} className="bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border-white/10 cursor-pointer group">
			<div
				className="board-card overflow-hidden"
				onDoubleClick={handleNavigateToBoard}
			>
				<div
					className="h-32 flex items-center justify-center relative bg-gradient-to-br from-indigo-600 to-indigo-800"
					style={{ background: `linear-gradient(to bottom right, ${card.board_color}, ${card.board_color}dd)` }}
				>
					<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
					<svg
						className="w-12 h-12 text-white/80 relative z-10 group-hover:scale-110 transition-transform"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
						/>
					</svg>
				</div>
				<div className="p-4 border-t border-white/5">
					<h3 className="font-semibold text-white truncate mb-1 group-hover:text-cyan-400 transition-colors">
						{card.board_title}
					</h3>
					<p className="text-xs text-slate-500 flex items-center gap-1">
						<svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
						</svg>
						{card.board_card_count || 0} {(!!card.board_card_count !== null && (card.board_card_count > 1 || card.board_card_count === 0)) ? 'cards' : 'card'}
					</p>
				</div>
			</div>
		</CardBase>
	);
}