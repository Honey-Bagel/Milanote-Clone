'use client';

import { useState, useCallback } from 'react';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { MockCanvasCard, MockCard } from './MockCanvasCard';

const INITIAL_CARDS: MockCard[] = [
	{
		id: 'demo-note',
		type: 'note',
		x: 40,
		y: 60,
		content: 'Brainstorm ideas for the new landing page. Focus on clarity and visual hierarchy.',
	},
	{
		id: 'demo-image',
		type: 'image',
		x: 240,
		y: 40,
		content: null,
	},
	{
		id: 'demo-tasks',
		type: 'tasks',
		x: 100,
		y: 240,
		content: null,
		items: [
			{ text: 'Design review', done: true },
			{ text: 'Update copy', done: false },
			{ text: 'Ship to prod', done: false },
		],
	},
];

export function MockCanvas() {
	const [cards, setCards] = useState<MockCard[]>(INITIAL_CARDS);

	const mouseSensor = useSensor(MouseSensor, {
		activationConstraint: { distance: 3 },
	});
	const touchSensor = useSensor(TouchSensor, {
		activationConstraint: { delay: 150, tolerance: 5 },
	});
	const sensors = useSensors(mouseSensor, touchSensor);

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, delta } = event;
		if (!delta) return;

		setCards((prev) =>
			prev.map((card) => {
				if (card.id === active.id) {
					// Clamp position within bounds (roughly 400x450 container)
					const newX = Math.max(0, Math.min(card.x + delta.x, 350));
					const newY = Math.max(0, Math.min(card.y + delta.y, 380));
					return { ...card, x: newX, y: newY };
				}
				return card;
			})
		);
	}, []);

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
			<div className="relative w-full h-full overflow-hidden">
				{/* Dot grid background */}
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
						backgroundSize: '20px 20px',
					}}
				/>

				{/* Cards */}
				{cards.map((card) => (
					<MockCanvasCard key={card.id} card={card} />
				))}

				{/* Hint text */}
				<div className="absolute bottom-4 right-4 text-[10px] text-slate-600 font-mono">
					drag to move
				</div>
			</div>
		</DndContext>
	);
}
