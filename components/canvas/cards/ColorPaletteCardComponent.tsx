/**
 * Color Palette Card Component
 *
 * Uses CardContext for shared state and persistence.
 */

'use client';

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import type { ColorPaletteCard } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';
import { PlusIcon } from "@radix-ui/react-icons";

// ============================================================================
// PROPS INTERFACE (for legacy compatibility with CardRenderer)
// ============================================================================

interface ColorPaletteCardComponentProps {
	card: ColorPaletteCard;
	isEditing: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ColorPaletteCardComponent({
	card: propCard,
	isEditing: propIsEditing,
}: ColorPaletteCardComponentProps) {
	// Try to use context, fall back to props for backwards compatibility
	const context = useOptionalCardContext();

	// Use context values if available, otherwise use props
	const card = (context?.card as ColorPaletteCard) ?? propCard;
	const isEditing = context?.isEditing ?? propIsEditing;
	const { saveContent, saveContentImmediate, reportContentHeight } = context ?? {
		saveContent: () => {},
		saveContentImmediate: async () => {},
	};

	const [newColor, setNewColor] = useState('#000000');
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [localTitle, setLocalTitle] = useState<string>(card.palette_title || '');
	const [localDescription, setLocalDescription] = useState<string>(card.palette_description || '');
	const rootRef = useRef<HTMLDivElement | null>(null);

	// Keep CardDimensions in sync with actual rendered height
	useLayoutEffect(() => {
		if (!reportContentHeight || !rootRef.current) return;

		const el = rootRef.current;
		const observer = new ResizeObserver(entries => {
			for (const entry of entries) {
				reportContentHeight(entry.contentRect.height);
			}
		});

		observer.observe(el);
		return () => observer.disconnect();
	}, [reportContentHeight]);

	// Track previous editing state to save on exit
	const wasEditingRef = useRef(isEditing);
	const justSavedRef = useRef(false);

	// Save when exiting edit mode (e.g., clicking on canvas)
	useEffect(() => {
		if (wasEditingRef.current && !isEditing) {
			// Was editing, now not - save the current local state
			saveContent({ palette_title: localTitle, palette_description: localDescription });
			justSavedRef.current = true;
		}
		wasEditingRef.current = isEditing;
	}, [isEditing, localTitle, localDescription, saveContent]);

	// Sync local state when card changes from DB and not editing
	useEffect(() => {
		if (!isEditing) {
			// Skip sync if we just saved - wait for DB to catch up
			if (justSavedRef.current) {
				justSavedRef.current = false;
				return;
			}
			setLocalTitle(card.palette_title || '');
			setLocalDescription(card.palette_description || '');
		}
	}, [card.palette_title, card.palette_description, isEditing]);

	// Event handlers
	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newTitle = e.target.value;
		setLocalTitle(newTitle);
	}, []);

	const handleBlur = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ palette_title: e.target.value });
	}, [saveContent]);

	const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setLocalDescription(e.target.value);
	}, []);

	const handleDescriptionBlur = useCallback(() => {
		saveContent({ palette_description: localDescription });
	}, [saveContent, localDescription]);

	const handleAddColor = useCallback(async () => {
		const updatedColors = [...card.palette_colors, newColor];
		await saveContentImmediate({ palette_colors: updatedColors });
		setNewColor('#000000');
	}, [card.palette_colors, newColor, saveContentImmediate]);

	const handleRemoveColor = useCallback(async (index: number) => {
		const updatedColors = card.palette_colors.filter((_, i) => i !== index);
		await saveContentImmediate({ palette_colors: updatedColors });
	}, [card.palette_colors, saveContentImmediate]);

	const handleColorChange = useCallback(async (index: number, color: string) => {
		const updatedColors = [...card.palette_colors];
		updatedColors[index] = color;
		await saveContentImmediate({ palette_colors: updatedColors });
	}, [card.palette_colors, saveContentImmediate]);

	const handleCopyColor = useCallback(async (color: string, index: number) => {
		try {
			await navigator.clipboard.writeText(color);
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 500);
		} catch (err) {
			console.error('Failed to copy color:', err);
		}
	}, []);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div ref={rootRef} className="color-palette-card group/palette-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-accent/50 border border-white/10 w-full overflow-hidden">
			<div className="px-4 pt-4 pb-3">
				{/* Header Section */}
				<div className="flex items-center gap-2 mb-2">
					<svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
					</svg>
					{isEditing ? (
						<input
							type="text"
							value={localTitle}
							onChange={handleTitleChange}
							onSubmit={handleBlur}
							onBlur={handleBlur}
							className="font-semibold text-white flex-1 bg-transparent border-none outline-none focus:ring-1 focus:ring-ring rounded px-1"
							placeholder="Palette name"
							onClick={(e) => e.stopPropagation()}
							style={{
								width: "100%"
							}}
						/>
					) : (
						<div className="flex items-center w-full justify-between">
							<h3 className="font-semibold text-white">
								{card.palette_title}
							</h3>
							<div className="invisible opacity-0 group-hover/palette-card:visible group-hover/palette-card:opacity-100">
								<PlusIcon
									onClick={handleAddColor}
									className="hover:text-cyan-500/50"
									width={20}
									height={20}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Description Section */}
				{isEditing ? (
					<textarea
						value={localDescription}
						onChange={handleDescriptionChange}
						onBlur={handleDescriptionBlur}
						className="text-xs text-secondary-foreground mb-4 w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-ring rounded px-1 resize-none"
						placeholder="Description (optional)"
						rows={2}
						onClick={(e) => e.stopPropagation()}
					/>
				) : card.palette_description ? (
					<p className="text-xs text-secondary-foreground mb-4">
						{card.palette_description}
					</p>
				) : null}

				{/* Colors Grid */}
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
									<div className="text-[9px] text-secondary-foreground font-mono opacity-0 group-hover/palette-card:opacity-100 transition-opacity bg-secondary px-1.5 py-0.5 rounded whitespace-nowrap">
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
							className="text-sm text-secondary-foreground hover:text-foreground px-2 py-1 hover:bg-white/5 rounded transition-colors"
							style={{ cursor: 'pointer' }}
						>
							+ Add color
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
