'use client';

import { useState, useEffect } from 'react';
import { Camera, Play } from 'lucide-react';
import type { PresentationNodeCard } from '@/lib/types';
import { useCanvasStore } from '@/lib/stores/canvas-store';

interface NodePropertyEditorProps {
	node: PresentationNodeCard;
	onUpdate: (updates: Partial<PresentationNodeCard>) => void;
}

export function NodePropertyEditor({
	node,
	onUpdate,
}: NodePropertyEditorProps) {
	const [title, setTitle] = useState(node.presentation_title || '');
	const [transitionType, setTransitionType] = useState(node.presentation_transition_type);
	const [duration, setDuration] = useState(node.presentation_transition_duration);
	const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(node.presentation_auto_advance_delay?.toString() || '');

	// Sync state when node changes
	useEffect(() => {
		setTitle(node.presentation_title || '');
		setTransitionType(node.presentation_transition_type);
		setDuration(node.presentation_transition_duration);
		setAutoAdvanceDelay(node.presentation_auto_advance_delay?.toString() || '');
	}, [node.id, node.presentation_title, node.presentation_transition_type,
	    node.presentation_transition_duration, node.presentation_auto_advance_delay]);

	const handleUpdate = (updates: Partial<PresentationNodeCard>) => {
		onUpdate(updates);
	};

	return (
		<div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
					Node Properties
				</h3>
			</div>

			{/* Title */}
			<div>
				<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
					Title
				</label>
				<input
					type="text"
					value={title}
					onChange={(e) => {
						setTitle(e.target.value);
						handleUpdate({ presentation_title: e.target.value || null });
					}}
					placeholder={`Slide ${node.presentation_order + 1}`}
					className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
						bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
						focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>

			{/* Transition Type */}
			<div>
				<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
					Transition Type
				</label>
				<select
					value={transitionType}
					onChange={(e) => {
						const value = e.target.value as PresentationNodeCard['presentation_transition_type'];
						setTransitionType(value);
						handleUpdate({ presentation_transition_type: value });
					}}
					className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
						bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
						focus:outline-none focus:ring-2 focus:ring-indigo-500"
				>
					<option value="linear">Linear</option>
					<option value="ease-in-out">Ease In-Out</option>
					<option value="ease-in">Ease In</option>
					<option value="ease-out">Ease Out</option>
				</select>
			</div>

			{/* Transition Duration */}
			<div>
				<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
					Transition Duration (ms)
				</label>
				<input
					type="number"
					value={duration}
					onChange={(e) => {
						const value = parseInt(e.target.value) || 1000;
						setDuration(value);
						handleUpdate({ presentation_transition_duration: value });
					}}
					min={100}
					max={10000}
					step={100}
					className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
						bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
						focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>

			{/* Auto-Advance Delay */}
			<div>
				<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
					Auto-Advance Delay (ms)
				</label>
				<input
					type="number"
					value={autoAdvanceDelay}
					onChange={(e) => {
						const value = e.target.value;
						setAutoAdvanceDelay(value);
						handleUpdate({
							presentation_auto_advance_delay: value ? parseInt(value) : null
						});
					}}
					placeholder="Manual advance"
					min={0}
					step={1000}
					className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
						bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
						focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
				<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Leave empty for manual advance
				</p>
			</div>

			{/* Action Button */}
			<div className="pt-2">
				<button
					onClick={() => {
						// Calculate target viewport to center on this node
						// Node is 40x40px, so we center the node's center point (position + 20)
						const nodeCenterX = node.position_x + 20;
						const nodeCenterY = node.position_y + 20;
						const targetViewport = {
							x: -nodeCenterX * node.presentation_target.zoom + window.innerWidth / 2,
							y: -nodeCenterY * node.presentation_target.zoom + window.innerHeight / 2,
							zoom: node.presentation_target.zoom,
						};
						useCanvasStore.getState().setViewport(targetViewport);
					}}
					className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium
						bg-indigo-600 text-white rounded-lg
						hover:bg-indigo-700 transition-colors"
				>
					<Camera size={14} />
					Snap Viewport to Node
				</button>
			</div>
		</div>
	);
}
