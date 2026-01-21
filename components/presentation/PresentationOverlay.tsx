'use client';

import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Pause, Play } from 'lucide-react';
import { useCanvasStore } from '@/lib/stores/canvas-store';

export function PresentationOverlay() {
	const {
		presentationMode,
		goToNextNode,
		goToPreviousNode,
		exitPresentationMode,
		setAutoPlay,
	} = useCanvasStore();

	const {
		isActive,
		type,
		currentNodeIndex,
		nodeSequence,
		isAutoPlaying,
		isTransitioning,
	} = presentationMode;

	useEffect(() => {
		if (!isActive) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Escape to exit
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation(); // Prevent other listeners from firing
				exitPresentationMode();
				return;
			}

			// Arrow keys or Space for navigation (advanced mode only)
			if (type === 'advanced') {
				if (e.key === 'ArrowRight' || e.key === ' ') {
					e.preventDefault();
					goToNextNode();
				} else if (e.key === 'ArrowLeft') {
					e.preventDefault();
					goToPreviousNode();
				}
			}
		};

		const handleFullscreenChange = () => {
			// If fullscreen exited externally (browser UI), also exit presentation
			if (!document.fullscreenElement && isActive) {
				exitPresentationMode();
			}
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [isActive, type, goToNextNode, goToPreviousNode, exitPresentationMode]);

	const handleCanvasClick = useCallback(
		(e: React.MouseEvent) => {
			if (type === 'advanced' && !isTransitioning) {
				goToNextNode();
			}
		},
		[type, isTransitioning, goToNextNode]
	);

	if (!isActive) return null;

	return (
		<>
			{/* Fullscreen click handler for advanced mode */}
			{type === 'advanced' && (
				<div
					className="fixed inset-0 z-40 cursor-pointer"
					onClick={handleCanvasClick}
				/>
			)}

			{/* Control bar */}
			<div
				className="fixed bottom-8 left-1/2 -translate-x-1/2
							bg-black/80 backdrop-blur-lg rounded-full
							px-6 py-3 flex items-center gap-4 z-50
							shadow-2xl border border-white/20"
			>
				{/* Exit button */}
				<button
					onClick={exitPresentationMode}
					className="p-2 hover:bg-white/10 rounded-full transition-colors"
					title="Exit presentation (Esc)"
				>
					<X size={20} className="text-white" />
				</button>

				{/* Advanced mode controls */}
				{type === 'advanced' && (
					<>
						<div className="w-px h-6 bg-white/20" />

						{/* Previous */}
						<button
							onClick={goToPreviousNode}
							disabled={currentNodeIndex === 0}
							className="p-2 hover:bg-white/10 rounded-full transition-colors
										disabled:opacity-30 disabled:cursor-not-allowed"
							title="Previous (Left Arrow)"
						>
							<ChevronLeft size={20} className="text-white" />
						</button>

						{/* Progress indicator */}
						<div className="text-white text-sm font-medium px-2">
							{currentNodeIndex + 1} / {nodeSequence.length}
						</div>

						{/* Next */}
						<button
							onClick={goToNextNode}
							disabled={currentNodeIndex === nodeSequence.length - 1}
							className="p-2 hover:bg-white/10 rounded-full transition-colors
										disabled:opacity-30 disabled:cursor-not-allowed"
							title="Next (Right Arrow or Space)"
						>
							<ChevronRight size={20} className="text-white" />
						</button>

						<div className="w-px h-6 bg-white/20" />

						{/* Auto-play toggle */}
						<button
							onClick={() => setAutoPlay(!isAutoPlaying)}
							className="p-2 hover:bg-white/10 rounded-full transition-colors"
							title={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
						>
							{isAutoPlaying ? (
								<Pause size={20} className="text-white" />
							) : (
								<Play size={20} className="text-white" />
							)}
						</button>
					</>
				)}

				{/* Basic mode hint */}
				{type === 'basic' && (
					<>
						<div className="w-px h-6 bg-white/20" />
						<div className="text-white text-sm px-2">
							Fullscreen Presentation - Pan & Zoom Enabled
						</div>
					</>
				)}
			</div>

			{/* Progress bar (advanced mode) */}
			{type === 'advanced' && nodeSequence.length > 0 && (
				<div className="fixed bottom-0 left-0 right-0 h-1 bg-white/10 z-50">
					<div
						className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
						style={{
							width: `${((currentNodeIndex + 1) / nodeSequence.length) * 100}%`,
						}}
					/>
				</div>
			)}

			{/* Exit hint (fades out after 3 seconds) */}
			<div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-fade-out opacity-0 pointer-events-none">
				<div className="bg-black/80 backdrop-blur-lg rounded-full px-4 py-2 text-white text-sm">
					Press <kbd className="px-2 py-1 bg-white/20 rounded mx-1">Esc</kbd> to
					exit
				</div>
			</div>
		</>
	);
}
