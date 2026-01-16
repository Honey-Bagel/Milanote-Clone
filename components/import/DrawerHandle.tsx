'use client';

import { cn } from '@/lib/utils';

interface DrawerHandleProps {
	isOpen: boolean;
	onToggle: () => void;
	onDragStart: (e: React.MouseEvent) => void;
	isResizing: boolean;
}

export function DrawerHandle({ isOpen, onToggle, onDragStart, isResizing }: DrawerHandleProps) {
	return (
		<button
			className={cn(
				"absolute top-1/2 -translate-y-1/2 left-0 -translate-x-full",
				"flex items-center justify-center transition-all duration-200",
				"rounded-l-lg border border-r-0 border-slate-700",
				"w-2 h-10 bg-slate-800",
				isResizing
					? "bg-indigo-500/20 border-indigo-500 cursor-grabbing"
					: "hover:bg-slate-700 hover:border-indigo-500/50 cursor-grab"
			)}
			onClick={onToggle}
			onMouseDown={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onDragStart(e);
			}}
			aria-label="Toggle import drawer"
		>
		</button>
	);
}
