"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { X, Trash2, Loader2, Palette } from 'lucide-react';
import { updateBoard, deleteBoard } from '@/lib/services/board-service';

interface BoardSettingsModalProps {
	board: {
		id: string;
		title: string;
		color?: string;
		description?: string;
	};
	isOpen: boolean;
	onClose: () => void;
}

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
	'WILDCARD', // special wildcard for color picker
];

export function BoardSettingsModal({ board, isOpen, onClose }: BoardSettingsModalProps) {
	const [title, setTitle] = useState(board.title);
	const [description, setDescription] = useState(board.description || '');
	const [color, setColor] = useState(board.color || '#6366f1');
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const colorPickerRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	if (!isOpen) return null;

	const handleWildcardClick = () => {
		// Trigger the hidden color picker
		colorPickerRef.current?.click();
	};

	const handleSave = async () => {
		setIsLoading(true);
		try {
			await updateBoard(board.id, {
				title,
				color
			});
			router.refresh();
			onClose();
		} catch (error) {
			console.error('Error updating board:', error);
			alert('Failed to update board');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
			return;
		}

		setIsDeleting(true);
		try {
			await deleteBoard(board.id);
			router.refresh();
			onClose();
		} catch (error) {
			console.error('Error deleting board:', error);
			alert('Failed to delete board');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div 
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
			onClick={onClose}
		>
			<div 
				className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-white">Board Settings</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="space-y-4">
					{/* Title */}
					<div>
						<Label htmlFor="board-title" className="text-white mb-2 block">
							Title
						</Label>
						<Input
							id="board-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Board title"
							className="bg-gray-900 border-gray-700 text-white"
						/>
					</div>

					{/* Description */}
					<div>
						<Label htmlFor="board-description" className="text-white mb-2 block">
							Description
						</Label>
						<textarea
							id="board-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Add a description..."
							rows={3}
							className="flex w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>

					{/* Color */}
					<div>
						<Label className="text-white mb-2 block">Color</Label>
						<div className="grid grid-cols-8 gap-2">
							{PRESET_COLORS.map((presetColor, index) => {
								if (presetColor === 'WILDCARD') {
									return (
										<button
											key={`wildcard-${index}`}
											onClick={handleWildcardClick}
											className="w-8 h-8 rounded-md transition-all bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 hover:scale-110 flex items-center justify-center"
											aria-label="Open color picker"
										>
											<Palette className="w-4 h-4 text-white" />
										</button>
									);
								}
								return (
									<button
										key={presetColor}
										onClick={() => setColor(presetColor)}
										className={`w-8 h-8 rounded-md transition-all ${
											color === presetColor
												? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800'
												: 'hover:scale-110'
										}`}
										style={{ backgroundColor: presetColor }}
										aria-label={`Select color ${presetColor}`}
									/>
								);
							})}
						</div>
						<div className="mt-3 flex items-center gap-2">
							<Input
								ref={colorPickerRef}
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className="w-16 h-10 bg-gray-900 border-gray-700 cursor-pointer"
							/>
							<Input
								type="text"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								placeholder="#6366f1"
								className="bg-gray-900 border-gray-700 text-white flex-1"
							/>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
					<Button
						onClick={handleDelete}
						disabled={isDeleting || isLoading}
						size="sm"
						className="bg-red-600 hover:bg-red-700 text-white"
					>
						{isDeleting ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Deleting...
							</>
						) : (
							<>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete
							</>
						)}
					</Button>
					<div className="flex gap-2">
						<Button
							onClick={onClose}
							disabled={isLoading || isDeleting}
							variant="outline"
							size="sm"
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={isLoading || isDeleting || !title.trim()}
							size="sm"
							className="bg-green-600 hover:bg-green-700 text-white"
						>
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Saving...
								</>
							) : (
								'Save Changes'
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}