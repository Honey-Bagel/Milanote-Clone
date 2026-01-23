'use client';

import { useDraggable } from '@dnd-kit/core';
import { ImageIcon, CheckSquare } from 'lucide-react';
import { CSSProperties } from 'react';

interface TaskItem {
	text: string;
	done: boolean;
}

interface MockCard {
	id: string;
	type: 'note' | 'image' | 'tasks';
	x: number;
	y: number;
	content: string | null;
	items?: TaskItem[];
}

interface MockCanvasCardProps {
	card: MockCard;
}

export function MockCanvasCard({ card }: MockCanvasCardProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: card.id,
	});

	const style: CSSProperties = {
		position: 'absolute',
		left: card.x,
		top: card.y,
		transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
		zIndex: isDragging ? 50 : 10,
		cursor: isDragging ? 'grabbing' : 'grab',
		transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
	};

	const baseClasses =
		'rounded-xl border border-white/10 bg-[#1e293b]/90 backdrop-blur-sm shadow-lg select-none';
	const dragClasses = isDragging ? 'shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/50' : '';

	if (card.type === 'note') {
		return (
			<div
				ref={setNodeRef}
				style={style}
				{...listeners}
				{...attributes}
				className={`${baseClasses} ${dragClasses} w-48 p-4`}
			>
				<p className="text-sm text-slate-300 leading-relaxed">{card.content}</p>
			</div>
		);
	}

	if (card.type === 'image') {
		return (
			<div
				ref={setNodeRef}
				style={style}
				{...listeners}
				{...attributes}
				className={`${baseClasses} ${dragClasses} w-40 p-3`}
			>
				<div className="w-full h-24 rounded-lg bg-indigo-900/30 border border-indigo-500/20 flex items-center justify-center mb-2">
					<ImageIcon size={28} className="text-indigo-400" />
				</div>
				<p className="text-[10px] text-slate-500 font-mono truncate">reference_01.png</p>
			</div>
		);
	}

	if (card.type === 'tasks' && card.items) {
		return (
			<div
				ref={setNodeRef}
				style={style}
				{...listeners}
				{...attributes}
				className={`${baseClasses} ${dragClasses} w-52 p-4`}
			>
				<div className="flex items-center gap-2 mb-3">
					<CheckSquare size={14} className="text-emerald-400" />
					<span className="text-xs font-semibold text-white">Sprint Tasks</span>
				</div>
				<div className="space-y-2">
					{card.items.map((item, i) => (
						<div key={i} className="flex items-center gap-2">
							<div
								className={`w-3.5 h-3.5 rounded border ${
									item.done
										? 'bg-emerald-500 border-emerald-500'
										: 'border-slate-600'
								}`}
							/>
							<span
								className={`text-xs ${
									item.done ? 'text-slate-500 line-through' : 'text-slate-300'
								}`}
							>
								{item.text}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	}

	return null;
}

export type { MockCard, TaskItem };
