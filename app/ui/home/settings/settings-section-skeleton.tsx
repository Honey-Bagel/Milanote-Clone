import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSectionSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<Skeleton className="h-7 w-48 mb-2" />
				<Skeleton className="h-4 w-96" />
			</div>

			{/* Content blocks */}
			<div className="space-y-4">
				<Skeleton className="h-32 w-full rounded-xl" />
				<Skeleton className="h-32 w-full rounded-xl" />
			</div>
		</div>
	);
}

export function AccountCardSkeleton() {
	return (
		<div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
			<div className="flex items-center gap-4">
				<Skeleton className="w-12 h-12 rounded" />
				<div className="space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-3 w-48" />
				</div>
			</div>
			<Skeleton className="h-9 w-24 rounded-lg" />
		</div>
	);
}

export function UsageCardSkeleton() {
	return (
		<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
			<Skeleton className="h-3 w-24 mb-2" />
			<Skeleton className="h-8 w-16" />
		</div>
	);
}
