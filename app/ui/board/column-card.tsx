'use client';

import { ColumnCardProps } from '@/lib/types';
import { MoreHorizontal, Plus } from 'lucide-react';

export default function ColumnCard({ 
	title, 
	children 
}: ColumnCardProps) {
	return (
		<div className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-semibold text-white">{title}</h3>
				<button className="text-gray-400 hover:text-gray-300">
					<MoreHorizontal className="w-4 h-4" />
				</button>
			</div>

			<div className="space-y-3">
				{children}

				{/* Add placeholder */}
				<button className="w-full border-2 border-dashed border-gray-700 rounded-lg p-4 text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center space-x-2">
					<Plus className="w-4 h-4" />
					<span className="text-sm">Add item</span>
				</button>
			</div>
		</div>
	);
}