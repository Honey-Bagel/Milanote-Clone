'use client';

import { useCanvasStore } from '@/lib/stores/canvas-store';
import { useEffect, useState } from 'react';

/**
 * Z-Index Debugger Component
 * 
 * Add this temporarily to your canvas to see z-index values in real-time
 * and verify they're updating correctly.
 * 
 * Usage:
 * ```tsx
 * import { ZIndexDebugger } from '@/components/debug/ZIndexDebugger';
 * 
 * <Canvas>
 *   <ZIndexDebugger />
 * </Canvas>
 * ```
 */
export function ZIndexDebugger() {
	const { cards } = useCanvasStore();
	const [cardsList, setCardsList] = useState<Array<{ id: string; z_index: number }>>([]);

	useEffect(() => {
		const list = Array.from(cards.values())
			.map(card => ({ 
				id: card.id.slice(0, 8), 
				z_index: card.z_index 
			}))
			.sort((a, b) => b.z_index - a.z_index);
		
		setCardsList(list);
	}, [cards]);

	return (
		<div className="fixed top-4 left-4 bg-white/90 backdrop-blur border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs z-[10000] text-xs font-mono">
			<div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
				<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
				<div className="font-semibold">Z-Index Monitor</div>
			</div>
			
			<div className="space-y-1">
				{cardsList.map((card, index) => (
					<div 
						key={card.id}
						className="flex justify-between items-center p-1 rounded"
						style={{ 
							backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent' 
						}}
					>
						<span className="text-gray-600">
							{card.id}...
						</span>
						<span className={`font-bold ${index === 0 ? 'text-blue-600' : 'text-gray-800'}`}>
							{card.z_index}
						</span>
					</div>
				))}
			</div>

			{cardsList.length === 0 && (
				<div className="text-gray-400 text-center py-2">
					No cards
				</div>
			)}
		</div>
	);
}

/**
 * Simplified version - just shows the top 3 cards
 */
export function ZIndexDebuggerMini() {
	const { cards, selectedCardIds } = useCanvasStore();
	const [topCards, setTopCards] = useState<Array<{ id: string; z_index: number; selected: boolean }>>([]);

	useEffect(() => {
		const list = Array.from(cards.values())
			.map(card => ({ 
				id: card.id.slice(0, 8), 
				z_index: card.z_index,
				selected: selectedCardIds.has(card.id)
			}))
			.sort((a, b) => b.z_index - a.z_index)
			.slice(0, 3);
		
		setTopCards(list);
	}, [cards, selectedCardIds]);

	return (
		<div className="fixed top-4 left-4 bg-black/80 backdrop-blur text-white rounded-lg p-2 text-xs font-mono z-[10000]">
			<div className="opacity-60 mb-1">Top 3 Cards:</div>
			{topCards.map((card, i) => (
				<div key={card.id} className="flex gap-2">
					<span className="opacity-60">{i + 1}.</span>
					<span className={card.selected ? 'text-blue-400' : ''}>
						{card.id}
					</span>
					<span className="text-green-400">z={card.z_index}</span>
				</div>
			))}
		</div>
	);
}