'use client';

import { useUserUsage } from '@/lib/hooks/user/use-user-usage';
import { formatBytes } from '@/lib/utils';
import { UsageCardSkeleton } from './settings-section-skeleton';
import { CurrentPlanCard } from '@/components/settings/billing/CurrentPlanCard';

export function BillingSection() {
	const { boardCount, fileUsage, isLoading, error } = useUserUsage();
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-bold text-white mb-2">Billing & Subscription</h3>
				<p className="text-sm text-secondary-foreground mb-6">Manage your subscription and billing information</p>
			</div>

			{/* Current Plan Card */}
			<CurrentPlanCard />

			{/* Usage Stats */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<UsageCardSkeleton />
					<UsageCardSkeleton />
				</div>
			) : error ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
						<div className="text-secondary-foreground text-xs uppercase tracking-wider mb-2">Boards Created</div>
						<div className="text-sm text-red-400">Failed to load</div>
					</div>

					<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
						<div className="text-secondary-foreground text-xs uppercase tracking-wider mb-2">Storage Used</div>
						<div className="text-sm text-red-400">Failed to load</div>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
						<div className="text-secondary-foreground text-xs uppercase tracking-wider mb-2">Boards Created</div>
						<div className="text-2xl font-bold text-white">{boardCount}</div>
					</div>

					<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
						<div className="text-secondary-foreground text-xs uppercase tracking-wider mb-2">Storage Used</div>
						<div className="text-2xl font-bold text-white">{formatBytes(fileUsage, { base: 1000 })}</div>
					</div>
				</div>
			)}
		</div>
	);
}