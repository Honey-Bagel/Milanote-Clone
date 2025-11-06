'use client';

import { TextCardProps } from '@/lib/types';
import { MoreHorizontal, GripVertical } from 'lucide-react';

interface KonvaTextCardProps extends TextCardProps {
	onDragEnd?: (e: any) => void;
	onClick?: () => void;
}

export default function TextCard({ 
	title, 
	content, 
	timestamp,
	position,
	onDragEnd,
	onClick
}: KonvaTextCardProps) {
	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-5 card-shadow hover:shadow-lg transition-shadow cursor-move">
			<div className="flex items-start justify-between mb-4">
				<h2 className="text-2xl font-bold text-white">{title}</h2>
				<button className="text-gray-400 hover:text-gray-300">
					<MoreHorizontal className="w-4 h-4" />
				</button>
			</div>
			<div className="text-gray-300 leading-relaxed space-y-4">
				{content.split('\n').map((paragraph, index) => (
					<p key={index}>{paragraph}</p>
				))}
			</div>
			<div className="mt-4 flex items-center justify-between text-xs text-gray-400">
				<span>{timestamp}</span>
				<GripVertical className="w-4 h-4 text-gray-500" />
			</div>
		</div>
	);
}