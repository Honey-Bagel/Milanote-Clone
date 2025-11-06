'use client';

import { TaskListCardProps } from '@/lib/types';
import { MoreHorizontal, GripVertical } from 'lucide-react';

export default function TaskListCard({ 
	title, 
	tasks, 
	timestamp 
}: TaskListCardProps) {
	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 card-shadow hover:shadow-lg transition-shadow cursor-move">
			<div className="flex items-start justify-between mb-3">
				<h3 className="font-semibold text-white">{title}</h3>
				<button className="text-gray-400 hover:text-gray-300">
					<MoreHorizontal className="w-4 h-4" />
				</button>
			</div>
			<div className="space-y-2.5">
				{tasks.map((task) => (
					<label key={task.id} className="flex items-start space-x-3 cursor-pointer group">
						<input
							type="checkbox"
							defaultChecked={task.completed}
							className="mt-1 w-4 h-4 text-blue-500 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
						/>
						<span className={`text-sm flex-1 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
							{task.text}
						</span>
					</label>
				))}
			</div>
			<div className="mt-4 flex items-center justify-between text-xs text-gray-400">
				<span>{tasks.length} items</span>
				<GripVertical className="w-4 h-4 text-gray-500" />
			</div>
		</div>
	);
}