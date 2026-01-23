'use client';

import { Check, Circle, ArrowRight } from 'lucide-react';

interface Milestone {
	phase: 'past' | 'current' | 'future';
	version: string;
	title: string;
	items: string[];
}

const MILESTONES: Milestone[] = [
	{
		phase: 'past',
		version: 'v0.1',
		title: 'Foundation',
		items: ['Authentication', 'Database Setup', 'Basic API'],
	},
	{
		phase: 'past',
		version: 'v0.5',
		title: 'Core Canvas',
		items: ['Board System', 'Drag & Drop', 'Card Types'],
	},
	{
		phase: 'current',
		version: 'v1.0',
		title: 'Launch',
		items: ['Public Beta', 'Billing', 'Collaboration'],
	},
	{
		phase: 'future',
		version: 'v1.5',
		title: 'Teams',
		items: ['Real-time Cursors', 'Comments', 'Permissions'],
	},
	{
		phase: 'future',
		version: 'v2.0',
		title: 'Intelligence',
		items: ['AI Assistant', 'Templates', 'Integrations'],
	},
];

export function ProductRoadmap() {
	return (
		<section className="w-full max-w-7xl mx-auto mb-32">
			<div className="text-left mb-12 pl-4 border-l-4 border-indigo-500">
				<h2 className="text-3xl font-bold text-white mb-2">Product Roadmap</h2>
				<p className="text-slate-400">Where we've been and where we're going.</p>
			</div>

			{/* Timeline container */}
			<div className="relative overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
				<div className="flex gap-6 min-w-max py-4">
					{MILESTONES.map((milestone, index) => {
						const isPast = milestone.phase === 'past';
						const isCurrent = milestone.phase === 'current';
						const isFuture = milestone.phase === 'future';

						return (
							<div key={milestone.version} className="relative flex flex-col items-center">
								{/* Connector line */}
								{index < MILESTONES.length - 1 && (
									<div
										className={`absolute top-6 left-1/2 w-[calc(100%+1.5rem)] h-0.5 ${
											isPast || isCurrent ? 'bg-indigo-500' : 'bg-slate-700'
										}`}
										style={{ transform: 'translateX(50%)' }}
									/>
								)}

								{/* Dot indicator */}
								<div
									className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
										isPast
											? 'bg-indigo-500/20 border-indigo-500'
											: isCurrent
											? 'bg-indigo-500 border-indigo-400 ring-4 ring-indigo-500/30'
											: 'bg-slate-800 border-slate-600'
									}`}
								>
									{isPast ? (
										<Check size={20} className="text-indigo-400" />
									) : isCurrent ? (
										<Circle size={12} className="text-white fill-white animate-pulse" />
									) : (
										<Circle size={12} className="text-slate-500" />
									)}
								</div>

								{/* Current indicator */}
								{isCurrent && (
									<div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-indigo-500 rounded text-[10px] font-bold text-white uppercase tracking-wider">
										Now
									</div>
								)}

								{/* Card */}
								<div
									className={`mt-6 w-52 rounded-xl border p-4 ${
										isCurrent
											? 'bg-indigo-950/50 border-indigo-500/50'
											: 'bg-[#0f172a]/50 border-white/5'
									}`}
								>
									<div className="flex items-center justify-between mb-2">
										<span
											className={`text-xs font-mono ${
												isPast
													? 'text-slate-500'
													: isCurrent
													? 'text-indigo-400'
													: 'text-slate-600'
											}`}
										>
											{milestone.version}
										</span>
										{isFuture && <ArrowRight size={12} className="text-slate-600" />}
									</div>
									<h3
										className={`font-bold mb-3 ${
											isPast ? 'text-slate-400' : isCurrent ? 'text-white' : 'text-slate-300'
										}`}
									>
										{milestone.title}
									</h3>
									<ul className="space-y-1.5">
										{milestone.items.map((item) => (
											<li
												key={item}
												className={`text-xs flex items-center gap-2 ${
													isPast ? 'text-slate-500' : 'text-slate-400'
												}`}
											>
												<div
													className={`w-1 h-1 rounded-full ${
														isPast
															? 'bg-slate-600'
															: isCurrent
															? 'bg-indigo-400'
															: 'bg-slate-600'
													}`}
												/>
												{item}
											</li>
										))}
									</ul>
								</div>
							</div>
						);
					})}
				</div>

				{/* Fade edges */}
				<div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#020617] to-transparent pointer-events-none" />
				<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#020617] to-transparent pointer-events-none" />
			</div>
		</section>
	);
}
