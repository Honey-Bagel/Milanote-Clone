/**
 * Undo/Redo Controls Component
 * 
 * A simple UI component for undo/redo buttons with visual feedback
 */

'use client';

import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { useCanUndo, useCanRedo, useUndo, useRedo } from '@/lib/stores/canvas-store';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export function UndoRedoControls() {
	const canUndo = useCanUndo();
	const canRedo = useCanRedo();
	const undo = useUndo();
	const redo = useRedo();
	const clearHistory = useClearHistory();

	return (
		<TooltipProvider>
			<div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
				{/* Undo Button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => undo()}
							disabled={!canUndo}
							className="h-8 w-8 p-0"
						>
							<Undo2 className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Undo (Cmd+Z)</p>
					</TooltipContent>
				</Tooltip>

				{/* Redo Button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => redo()}
							disabled={!canRedo}
							className="h-8 w-8 p-0"
						>
							<Redo2 className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Redo (Cmd+Shift+Z)</p>
					</TooltipContent>
				</Tooltip>

				{/* Clear History Button (optional) */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								if (confirm('Clear all undo history?')) {
									clearHistory();
								}
							}}
							className="h-8 w-8 p-0"
						>
							<RotateCcw className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Clear History</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}