'use client';

export function CardsLoadingIndicator() {
	return (
		<div className="absolute top-4 right-4 z-50 bg-[#0f172a]/90 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
			<div className="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
			<span className="text-xs text-white/70">Loading cards...</span>
		</div>
	);
}
