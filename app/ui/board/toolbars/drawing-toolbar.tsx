/**
 * Drawing Toolbar Component
 *
 * Provides controls for the drawing mode:
 * - Brush size
 * - Color picker
 * - Eraser tool
 * - Save/Cancel buttons
 */

'use client';

import { Paintbrush, Eraser, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DrawingToolState {
	type: 'pen' | 'eraser';
	color: string;
	size: number;
}

interface DrawingToolbarProps {
	tool: DrawingToolState;
	onToolChange: (tool: Partial<DrawingToolState>) => void;
	onSave: () => void;
	onCancel: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BRUSH_SIZES = [2, 4, 8, 12, 16];

const COLORS = [
	{ name: 'White', value: '#FFFFFF' },
	{ name: 'Red', value: '#ef4444' },
	{ name: 'Orange', value: '#f97316' },
	{ name: 'Yellow', value: '#eab308' },
	{ name: 'Green', value: '#22c55e' },
	{ name: 'Blue', value: '#3b82f6' },
	{ name: 'Purple', value: '#a855f7' },
	{ name: 'Pink', value: '#ec4899' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function DrawingToolbar({
	tool,
	onToolChange,
	onSave,
	onCancel,
}: DrawingToolbarProps) {
	const colorInputRef = useRef<HTMLInputElement>(null);
	return (
		<TooltipProvider>
			<div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 p-2 bg-[#0f172a] border border-white/10 rounded-lg shadow-xl backdrop-blur-xl">
				{/* Tool type selector */}
				<div className="flex items-center gap-1 pr-2 border-r border-white/10">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className={`h-8 w-8 ${
									tool.type === 'pen'
										? 'bg-primary text-white shadow-lg shadow-primary/20'
										: 'text-secondary-foreground hover:bg-white/5 hover:text-white'
								}`}
								onClick={() => onToolChange({ type: 'pen' })}
							>
								<Paintbrush className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Pen</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className={`h-8 w-8 ${
									tool.type === 'eraser'
										? 'bg-primary text-white shadow-lg shadow-primary/20'
										: 'text-secondary-foreground hover:bg-white/5 hover:text-white'
								}`}
								onClick={() => onToolChange({ type: 'eraser' })}
							>
								<Eraser className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Eraser</TooltipContent>
					</Tooltip>
				</div>

				{/* Brush size selector */}
				{tool.type === 'pen' && (
					<div className="flex items-center gap-1 pr-2 border-r border-white/10">
						{BRUSH_SIZES.map((size) => (
							<Tooltip key={size}>
								<TooltipTrigger asChild>
									<button
										className={`h-8 w-8 rounded flex items-center justify-center ${
											tool.size === size
												? 'bg-primary text-white'
												: 'text-secondary-foreground hover:bg-white/5 hover:text-white'
										}`}
										onClick={() => onToolChange({ size })}
									>
										<div
											className={`rounded-full ${tool.size === size ? 'bg-white' : 'bg-current'}`}
											style={{ width: size, height: size }}
										/>
									</button>
								</TooltipTrigger>
								<TooltipContent>Size {size}</TooltipContent>
							</Tooltip>
						))}
					</div>
				)}

				{/* Color picker */}
				{tool.type === 'pen' && (
					<div className="flex items-center gap-1 pr-2 border-r border-white/10">
						{COLORS.map((color) => (
							<Tooltip key={color.value}>
								<TooltipTrigger asChild>
									<button
										className={`h-8 w-8 rounded border-2 transition-all ${
											tool.color === color.value
												? 'border-white scale-110'
												: 'border-transparent hover:border-white/50'
										}`}
										style={{ backgroundColor: color.value }}
										onClick={() => onToolChange({ color: color.value })}
									/>
								</TooltipTrigger>
								<TooltipContent>{color.name}</TooltipContent>
							</Tooltip>
						))}
						{/* Custom color picker */}
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className={`h-8 w-8 rounded border-2 transition-all relative overflow-hidden ${
										COLORS.find(c => c.value === tool.color)
											? 'border-transparent hover:border-white/50'
											: 'border-white scale-110'
									}`}
									style={{
										background: COLORS.find(c => c.value === tool.color)
											? 'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)'
											: tool.color
									}}
									onClick={() => colorInputRef.current?.click()}
								>
									<input
										ref={colorInputRef}
										type="color"
										value={tool.color}
										onChange={(e) => onToolChange({ color: e.target.value })}
										className="absolute inset-0 opacity-0 cursor-pointer"
										onClick={(e) => e.stopPropagation()}
									/>
								</button>
							</TooltipTrigger>
							<TooltipContent>Custom Color</TooltipContent>
						</Tooltip>
					</div>
				)}

				{/* Action buttons */}
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-3 text-secondary-foreground hover:bg-white/5 hover:text-white"
								onClick={onCancel}
							>
								<X className="h-4 w-4 mr-1" />
								Cancel
							</Button>
						</TooltipTrigger>
						<TooltipContent>Cancel (Esc)</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-3 bg-primary text-white hover:bg-primary/90"
								onClick={onSave}
							>
								<Save className="h-4 w-4 mr-1" />
								Save
							</Button>
						</TooltipTrigger>
						<TooltipContent>Save (Ctrl+S)</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</TooltipProvider>
	);
}
