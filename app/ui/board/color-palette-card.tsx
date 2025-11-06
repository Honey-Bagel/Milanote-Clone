'use client';

import { ColorPaletteCardProps } from '@/lib/types';
import { MoreHorizontal, GripVertical } from 'lucide-react';

export default function ColorPaletteCard({ 
	title, 
	colors, 
	description, 
	timestamp 
}: ColorPaletteCardProps) {
	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 card-shadow hover:shadow-lg transition-shadow cursor-move">
			<div className="flex items-start justify-between mb-3">
				<h3 className="font-semibold text-white">{title}</h3>
				<button className="text-gray-400 hover:text-gray-300">
					<MoreHorizontal className="w-4 h-4" />
				</button>
			</div>
			<div className="grid grid-cols-5 gap-2 mb-3">
				{colors.map((color, index) => (
					<div
						key={index}
						className="aspect-square rounded-lg"
						style={{ backgroundColor: color }}
					></div>
				))}
			</div>
			<p className="text-xs text-gray-400">{description}</p>
			<div className="mt-4 flex items-center justify-between text-xs text-gray-400">
				<span>{timestamp}</span>
				<GripVertical className="w-4 h-4 text-gray-500" />
			</div>
		</div>
	);
}