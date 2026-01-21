'use client';

export default function LoadingSkeleton() {
	return (
		<div className="min-h-screen bg-[#020617] flex flex-col h-screen">
			{/* Top Toolbar Skeleton */}
			<div className="h-14 border-b border-white/10 px-4 flex items-center justify-between">
				<div className="shimmer h-6 w-48 rounded bg-white/5" />
				<div className="flex gap-2">
					<div className="shimmer h-8 w-24 rounded-lg bg-white/5" />
					<div className="shimmer h-8 w-8 rounded-full bg-white/5" />
				</div>
			</div>

			{/* Canvas Skeleton */}
			<div className="flex-1 relative overflow-hidden bg-[#020617]">
				{/* Subtle grid pattern indication */}
				<div className="absolute inset-0 opacity-20">
					<div className="h-full w-full" style={{
						backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
						backgroundSize: '40px 40px'
					}} />
				</div>
			</div>
		</div>
	);
}
