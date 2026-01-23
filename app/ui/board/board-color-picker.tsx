'use client';

import { useState, useRef } from 'react';
import { Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BoardService } from '@/lib/services/board-service';

const PRESET_COLORS = [
	'#ef4444', // red
	'#f97316', // orange
	'#f59e0b', // amber
	'#eab308', // yellow
	'#84cc16', // lime
	'#22c55e', // green
	'#10b981', // emerald
	'#14b8a6', // teal
	'#06b6d4', // cyan
	'#0ea5e9', // sky
	'#3b82f6', // blue
	'#6366f1', // indigo
	'#8b5cf6', // violet
	'#a855f7', // purple
	'#d946ef', // fuchsia
];

interface BoardColorPickerProps {
	boardId: string;
	currentColor?: string;
	disabled?: boolean;
}

export function BoardColorPicker({ boardId, currentColor, disabled }: BoardColorPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [color, setColor] = useState(currentColor || '#6366f1');
	const [isUpdating, setIsUpdating] = useState(false);
	const colorInputRef = useRef<HTMLInputElement>(null);

	const handleColorSelect = async (newColor: string) => {
		if (isUpdating) return;

		setColor(newColor);
		setIsUpdating(true);

		try {
			await BoardService.updateBoard(boardId, { color: newColor });
		} catch (error) {
			console.error('Failed to update board color:', error);
			setColor(currentColor || '#6366f1');
		} finally {
			setIsUpdating(false);
			setIsOpen(false);
		}
	};

	const handleCustomColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newColor = e.target.value;
		setColor(newColor);
	};

	const handleCustomColorComplete = async () => {
		if (color !== currentColor) {
			await handleColorSelect(color);
		}
	};

	if (disabled) {
		return (
			<div
				className="w-4 h-4 rounded shadow-[0_0_8px_rgba(255,255,255,0.2)] cursor-default"
				style={{ backgroundColor: currentColor || '#6366f1' }}
			/>
		);
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<button
					className="w-4 h-4 rounded shadow-[0_0_8px_rgba(255,255,255,0.2)] hover:scale-110 hover:shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all cursor-pointer"
					style={{ backgroundColor: color }}
					title="Click to change board color"
					onClick={(e) => e.stopPropagation()}
				/>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-3"
				align="start"
				sideOffset={8}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="space-y-3">
					<p className="text-xs text-secondary-foreground font-medium">Board Color</p>
					<div className="grid grid-cols-5 gap-2">
						{PRESET_COLORS.map((presetColor) => (
							<button
								key={presetColor}
								onClick={() => handleColorSelect(presetColor)}
								disabled={isUpdating}
								className={`w-7 h-7 rounded-md transition-all ${
									color === presetColor
										? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a] scale-110'
										: 'hover:scale-110'
								} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
								style={{ backgroundColor: presetColor }}
								aria-label={`Select color ${presetColor}`}
							/>
						))}
					</div>
					<div className="flex items-center gap-2 pt-2 border-t border-white/10">
						<button
							onClick={() => colorInputRef.current?.click()}
							disabled={isUpdating}
							className={`w-7 h-7 rounded-md transition-all bg-gradient-to-br from-pink-500 via-purple-500 to-primary hover:scale-110 flex items-center justify-center ${
								isUpdating ? 'opacity-50 cursor-not-allowed' : ''
							}`}
							aria-label="Open custom color picker"
						>
							<Palette className="w-4 h-4 text-white" />
						</button>
						<input
							ref={colorInputRef}
							type="color"
							value={color}
							onChange={handleCustomColorChange}
							onBlur={handleCustomColorComplete}
							disabled={isUpdating}
							className="w-0 h-0 opacity-0 absolute"
						/>
						<input
							type="text"
							value={color}
							onChange={(e) => setColor(e.target.value)}
							onBlur={handleCustomColorComplete}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleCustomColorComplete();
								}
							}}
							disabled={isUpdating}
							placeholder="#6366f1"
							className="flex-1 bg-[#020617] border border-white/10 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
