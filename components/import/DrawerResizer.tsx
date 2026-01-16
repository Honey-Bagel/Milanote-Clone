'use client';

import { cn } from '@/lib/utils';

interface DrawerResizerProps {
	onResizeStart: (e: React.MouseEvent) => void;
	isResizing: boolean;
}

export function DrawerResizer({ onResizeStart, isResizing }: DrawerResizerProps) {
	return (
		<div
			className={cn(
				"absolute left-0 top-0 bottom-0 w-1 z-50",
				"cursor-ew-resize",
				isResizing ? "bg-indigo-500/30" : "hover:bg-indigo-500/10"
			)}
			onMouseDown={onResizeStart}
			aria-label="Resize drawer"
		/>
	);
}
