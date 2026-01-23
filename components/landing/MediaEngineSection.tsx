import { ImageIcon, Type, Code, CheckSquare } from 'lucide-react';

export function MediaEngineSection() {
	return (
		<section id="visual-engine" className="w-full max-w-7xl mx-auto mb-32">
			<div className="text-center mb-16">
				<h2 className="text-3xl font-bold text-white mb-4">Native Media Engine.</h2>
				<p className="text-slate-400 max-w-2xl mx-auto">
					Unlike standard whiteboards, Notera understands code, video, and design assets natively.
				</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[400px] md:h-[500px] overflow-hidden rounded-3xl border border-white/5 bg-[#0f172a]/20 p-4 relative group">
				{/* Hover glow effect */}
				<div className="absolute inset-0 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

				{/* Column 1: Images */}
				<div className="space-y-4 animate-scroll-slow relative">
					<div className="h-32 bg-indigo-900/20 rounded-xl border border-indigo-500/20 flex flex-col items-center justify-center gap-2 p-4">
						<ImageIcon size={28} className="text-indigo-400" />
						<span className="text-[10px] text-indigo-300 font-medium text-center">
							Drag & drop images
						</span>
					</div>
					<div className="h-48 bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
						<div className="w-full h-full bg-gradient-to-br from-indigo-900/20 to-purple-900/20" />
					</div>
					<div className="h-36 bg-slate-800/50 rounded-xl border border-white/5" />
					<div className="h-32 bg-indigo-900/20 rounded-xl border border-indigo-500/20 flex items-center justify-center">
						<ImageIcon size={28} className="text-indigo-400" />
					</div>
					<div className="h-48 bg-slate-800/50 rounded-xl border border-white/5" />
				</div>

				{/* Column 2: Rich Text */}
				<div className="space-y-4 pt-12 animate-scroll-slow" style={{ animationDelay: '-2s' }}>
					<div className="h-32 bg-cyan-900/20 rounded-xl border border-cyan-500/20 flex flex-col items-center justify-center gap-2 p-4">
						<Type size={28} className="text-cyan-400" />
						<span className="text-[10px] text-cyan-300 font-medium text-center">
							Rich text editing
						</span>
					</div>
					<div className="h-40 bg-slate-800/50 rounded-xl border border-white/5 p-4">
						<div className="h-2 w-3/4 bg-slate-700 rounded mb-2" />
						<div className="h-2 w-full bg-slate-700 rounded mb-2" />
						<div className="h-2 w-2/3 bg-slate-700 rounded" />
					</div>
					<div className="h-48 bg-slate-800/50 rounded-xl border border-white/5" />
					<div className="h-32 bg-cyan-900/20 rounded-xl border border-cyan-500/20 flex items-center justify-center">
						<Type size={28} className="text-cyan-400" />
					</div>
					<div className="h-40 bg-slate-800/50 rounded-xl border border-white/5" />
				</div>

				{/* Column 3: Code */}
				<div className="space-y-4 animate-scroll-slow" style={{ animationDelay: '-5s' }}>
					<div className="h-48 bg-slate-800/50 rounded-xl border border-white/5 p-4 font-mono text-xs text-slate-500 overflow-hidden">
						<div className="text-purple-400">const</div>
						<div className="pl-2 text-slate-400">
							canvas = <span className="text-cyan-400">init</span>()
						</div>
						<div className="text-slate-600 mt-2">// drag to move</div>
					</div>
					<div className="h-32 bg-purple-900/20 rounded-xl border border-purple-500/20 flex flex-col items-center justify-center gap-2 p-4">
						<Code size={28} className="text-purple-400" />
						<span className="text-[10px] text-purple-300 font-medium text-center">
							Syntax highlighting
						</span>
					</div>
					<div className="h-40 bg-slate-800/50 rounded-xl border border-white/5" />
					<div className="h-48 bg-slate-800/50 rounded-xl border border-white/5 p-4 font-mono text-xs text-slate-500">
						<div className="text-emerald-400">function</div>
						<div className="pl-2 text-slate-400">render()</div>
					</div>
					<div className="h-32 bg-purple-900/20 rounded-xl border border-purple-500/20 flex items-center justify-center">
						<Code size={28} className="text-purple-400" />
					</div>
				</div>

				{/* Column 4: Tasks */}
				<div className="space-y-4 pt-8 animate-scroll-slow" style={{ animationDelay: '-7s' }}>
					<div className="h-32 bg-emerald-900/20 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center gap-2 p-4">
						<CheckSquare size={28} className="text-emerald-400" />
						<span className="text-[10px] text-emerald-300 font-medium text-center">
							Track progress
						</span>
					</div>
					<div className="h-48 bg-slate-800/50 rounded-xl border border-white/5 p-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded bg-emerald-500" />
								<div className="h-2 w-20 bg-slate-700 rounded" />
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded border border-slate-600" />
								<div className="h-2 w-24 bg-slate-700 rounded" />
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded border border-slate-600" />
								<div className="h-2 w-16 bg-slate-700 rounded" />
							</div>
						</div>
					</div>
					<div className="h-36 bg-slate-800/50 rounded-xl border border-white/5" />
					<div className="h-32 bg-emerald-900/20 rounded-xl border border-emerald-500/20 flex items-center justify-center">
						<CheckSquare size={28} className="text-emerald-400" />
					</div>
					<div className="h-48 bg-slate-800/50 rounded-xl border border-white/5" />
				</div>

				{/* Gradient overlays */}
				<div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] pointer-events-none" />
			</div>
		</section>
	);
}
