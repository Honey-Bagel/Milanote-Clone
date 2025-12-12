/**
 * Color Palette Card Component
 *
 * Uses CardContext for shared state and persistence.
 */

'use client';

import { useState, useCallback } from 'react';
import type { ColorPaletteCard } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';

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
	const { saveContent } = context ?? {
		saveContent: () => {},
	};

	const [newColor, setNewColor] = useState('#000000');
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	// Event handlers
	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ palette_title: e.target.value });
	}, [saveContent]);

	const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		saveContent({ palette_description: e.target.value });
	}, [saveContent]);

	const handleAddColor = useCallback(() => {
		const updatedColors = [...card.palette_colors, newColor];
		saveContent({ palette_colors: updatedColors });
		setNewColor('#000000');
	}, [card.palette_colors, newColor, saveContent]);

	const handleRemoveColor = useCallback((index: number) => {
		const updatedColors = card.palette_colors.filter((_, i) => i !== index);
		saveContent({ palette_colors: updatedColors });
	}, [card.palette_colors, saveContent]);

	const handleColorChange = useCallback((index: number, color: string) => {
		const updatedColors = [...card.palette_colors];
		updatedColors[index] = color;
		saveContent({ palette_colors: updatedColors });
	}, [card.palette_colors, saveContent]);

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
		<div className="color-palette-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 border border-white/10 w-full h-full">
			<div className="px-4 pt-4 pb-3">
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
		</div>
	);
}
