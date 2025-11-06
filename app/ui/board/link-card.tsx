'use client';

import { LinkCardProps } from '@/lib/types';
import { Link as LinkIcon, MoreHorizontal, GripVertical } from 'lucide-react';

export default function LinkCard({ 
	title, 
	url, 
	timestamp 
}: LinkCardProps) {
	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 card-shadow hover:shadow-lg transition-shadow cursor-move">
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1">
					<div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
						<LinkIcon className="text-blue-400 w-5 h-5" />
					</div>
					<h3 className="font-semibold text-white mb-1">{title}</h3>
					<p className="text-xs text-gray-400 truncate">{url}</p>
				</div>
				<button className="text-gray-400 hover:text-gray-300">
					<MoreHorizontal className="w-4 h-4" />
				</button>
			</div>
			<div className="mt-4 flex items-center justify-between text-xs text-gray-400">
				<span>{timestamp}</span>
				<GripVertical className="w-4 h-4 text-gray-500" />
			</div>
		</div>
	);
}