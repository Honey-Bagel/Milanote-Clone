'use client';

import { useTemporalStore } from "@/lib/stores/canvas-store";

export function StateDebugger() {
	const { undo, redo, pastStates, futureStates } = useTemporalStore((state) => state);


	return (
		<div className="fixed text-black bottom-[4px] right-[4px] bg-white/90 backdrop-blur border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs z-[10000] text-xs font-mono">
			<div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
				<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
				<div className="font-semibold">State Debugger</div>
			</div>
			past states:
			<br/>
			{JSON.stringify(pastStates)}
			<br/>
			{pastStates.cards?.map((card) => {
				return (
					<div key={card.key}>{card.key} - {card.value}</div>
				)
			})}
			<br />
			future states:
			<br/>
			{JSON.stringify(futureStates)}
			<br/>
			{JSON.stringify(futureStates.cards)}
			<br/>
			<button onClick={() => undo()}>undo</button>
			<button onClick={() => redo()}>redo</button>
		</div>
	);
}