/**
 * Task List Card Component
 *
 * Uses CardContext for shared state and persistence.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TaskListCard } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';

// ============================================================================
// PROPS INTERFACE (for legacy compatibility with CardRenderer)
// ============================================================================

interface TaskListCardComponentProps {
	card: TaskListCard;
	isEditing: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TaskListCardComponent({
	card: propCard,
	isEditing: propIsEditing,
}: TaskListCardComponentProps) {
	// Try to use context, fall back to props for backwards compatibility
	const context = useOptionalCardContext();

	// Use context values if available, otherwise use props
	const card = (context?.card as TaskListCard) ?? propCard;
	const { saveContent, saveContentImmediate } = context ?? {
		saveContent: () => {},
		saveContentImmediate: async () => {},
	};

	const [editingTitle, setEditingTitle] = useState(false);
	const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
	const [localTitle, setLocalTitle] = useState(card.task_list_title);
	const [localTasks, setLocalTasks] = useState<Map<string, string>>(new Map());
	const taskInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

	// Sync local title when card prop changes (from DB) and not editing
	useEffect(() => {
		if (!editingTitle) {
			setLocalTitle(card.task_list_title);
		}
	}, [card.task_list_title, editingTitle]);

	// Event handlers
	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		setLocalTitle(newTitle);
		saveContent({ task_list_title: newTitle });
	}, [saveContent]);

	const handleToggleTask = useCallback(async (taskId: string) => {
		const updatedTasks = card.tasks.map(task =>
			task.id === taskId ? { ...task, completed: !task.completed } : task
		);
		await saveContentImmediate({ tasks: updatedTasks });
	}, [card.tasks, saveContentImmediate]);

	const handleTaskTextChange = useCallback((taskId: string, newText: string) => {
		setLocalTasks(prev => new Map(prev).set(taskId, newText));

		const updatedTasks = card.tasks.map(task =>
			task.id === taskId ? { ...task, text: newText } : task
		);
		saveContent({ tasks: updatedTasks });
	}, [card.tasks, saveContent]);

	const handleTaskKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>, taskId: string, taskText: string) => {
		const sortedTasks = [...card.tasks].sort((a, b) => a.position - b.position);
		const currentIndex = sortedTasks.findIndex(t => t.id === taskId);

		if (e.key === 'Enter') {
			e.preventDefault();

			const newTask = {
				id: `task-${Date.now()}`,
				text: '',
				completed: false,
				position: sortedTasks.length,
			};

			const updatedTasks = [...sortedTasks];
			updatedTasks.splice(currentIndex + 1, 0, newTask);

			const reindexedTasks = updatedTasks.map((task, index) => ({
				...task,
				position: index
			}));

			saveContentImmediate({ tasks: reindexedTasks });

			setTimeout(() => {
				const input = taskInputRefs.current.get(newTask.id);
				if (input) {
					input.focus();
					setFocusedTaskId(newTask.id);
				}
			}, 50);
		} else if (e.key === 'Backspace' && taskText === '') {
			e.preventDefault();

			const updatedTasks = sortedTasks
				.filter(task => task.id !== taskId)
				.map((task, index) => ({ ...task, position: index }));

			saveContentImmediate({ tasks: updatedTasks });

			if (currentIndex > 0) {
				const previousTask = sortedTasks[currentIndex - 1];
				const prevTaskId = previousTask?.id;
				if (prevTaskId) {
					setTimeout(() => {
						const input = taskInputRefs.current.get(prevTaskId);
						if (input) {
							input.focus();
							input.setSelectionRange(input.value.length, input.value.length);
							setFocusedTaskId(prevTaskId);
						}
					}, 50);
				}
			}
		}
	}, [card.tasks, saveContentImmediate]);

	const handleDeleteTask = useCallback(async (taskId: string) => {
		const updatedTasks = card.tasks
			.filter(task => task.id !== taskId)
			.map((task, index) => ({ ...task, position: index }));

		await saveContentImmediate({ tasks: updatedTasks });
	}, [card.tasks, saveContentImmediate]);

	const handleAddNewTask = useCallback(async () => {
		const newTask = {
			id: `task-${Date.now()}`,
			text: '',
			completed: false,
			position: card.tasks.length,
		};

		const updatedTasks = [...card.tasks, newTask];
		saveContentImmediate({ tasks: updatedTasks });

		setTimeout(() => {
			const input = taskInputRefs.current.get(newTask.id);
			if (input) {
				input.focus();
				setFocusedTaskId(newTask.id);
			}
		}, 50);
	}, [card.tasks, saveContentImmediate]);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="task-list-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border border-white/10 rounded-lg w-full h-full">
			<div
				className="p-4 flex flex-col h-full"
				onDoubleClick={(e) => e.stopPropagation()}
			>
				{/* Title */}
				<div className="font-bold text-white mb-3 text-lg">
					{editingTitle ? (
						<input
							type="text"
							value={localTitle}
							onChange={handleTitleChange}
							onBlur={() => setEditingTitle(false)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									setEditingTitle(false);
								}
							}}
							className="w-full font-bold text-white bg-transparent border-none outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1"
							onClick={(e) => e.stopPropagation()}
							placeholder="Task List"
							autoFocus
						/>
					) : (
						<div
							onDoubleClick={(e) => {
								e.stopPropagation();
								setEditingTitle(true);
							}}
							className="cursor-text px-1 hover:bg-white/5 rounded transition-colors"
						>
							{localTitle}
						</div>
					)}
				</div>

				{/* Tasks */}
				<div className="flex flex-col gap-1">
					{[...card.tasks || []]
						.sort((a, b) => a.position - b.position)
						.filter(task => task.id) // Filter out tasks without IDs
						.map(task => {
							const taskId = task.id!; // We've filtered, so id exists
							const displayText = localTasks.get(taskId) ?? task.text;

							return (
								<div
									key={taskId}
									className="group/item flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/5 transition-colors relative"
								>
									{/* Drag Handle */}
									<span className="absolute left-0 text-white/20 cursor-grab opacity-0 group-hover/item:opacity-100 -ml-1">
										<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
											<circle cx="9" cy="5" r="1.5"/>
											<circle cx="9" cy="12" r="1.5"/>
											<circle cx="9" cy="19" r="1.5"/>
											<circle cx="15" cy="5" r="1.5"/>
											<circle cx="15" cy="12" r="1.5"/>
											<circle cx="15" cy="19" r="1.5"/>
										</svg>
									</span>

									{/* Checkbox */}
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleToggleTask(taskId);
										}}
										className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all ml-3 flex-shrink-0
											${task.completed
												? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
												: 'border-white/20 hover:border-white/40 bg-transparent'
											}`}
										style={{ cursor: 'pointer' }}
									>
										{task.completed && (
											<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										)}
									</button>

									{/* Text Input */}
									<input
										ref={(el) => {
											if (el) {
												taskInputRefs.current.set(taskId, el);
											} else {
												taskInputRefs.current.delete(taskId);
											}
										}}
										type="text"
										value={displayText}
										onChange={(e) => handleTaskTextChange(taskId, e.target.value)}
										onKeyDown={(e) => handleTaskKeyDown(e, taskId, displayText)}
										placeholder="Task text..."
										className={`flex-1 text-sm bg-transparent border-none outline-none transition-all
											${task.completed ? 'text-white/30 line-through' : 'text-gray-200'}
										`}
										onClick={(e) => e.stopPropagation()}
									/>

									{/* Delete Button */}
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteTask(taskId);
										}}
										className="text-white/20 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0"
										style={{ cursor: 'pointer' }}
									>
										<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							);
						})}
				</div>

				{/* Add task area */}
				<div
					className="mt-3 pl-11 relative cursor-text"
					onClick={(e) => {
						e.stopPropagation();
						handleAddNewTask();
					}}
				>
					<svg className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					<div className="text-sm text-white/20 py-1">
						Add a task...
					</div>
				</div>
			</div>
		</div>
	);
}
