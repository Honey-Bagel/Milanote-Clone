'use client';

import { CreditCard, TrendingUp, Zap } from 'lucide-react';

export function BillingSection() {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-bold text-white mb-2">Billing & Subscription</h3>
				<p className="text-sm text-slate-400 mb-6">Manage your subscription and billing information</p>
			</div>

			{/* Current Plan Card */}
			<div className="p-6 bg-[#020617] border border-white/10 rounded-xl">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h4 className="text-base font-semibold text-white">Current Plan</h4>
						<p className="text-sm text-slate-400 mt-1">Free Plan</p>
					</div>
					<div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-medium">
						Active
					</div>
				</div>

				<div className="space-y-3 mb-6">
					<div className="flex items-center gap-3 text-sm text-slate-300">
						<Zap size={16} className="text-indigo-400" />
						<span>Unlimited boards</span>
					</div>
					<div className="flex items-center gap-3 text-sm text-slate-300">
						<TrendingUp size={16} className="text-indigo-400" />
						<span>5 collaborators per board</span>
					</div>
					<div className="flex items-center gap-3 text-sm text-slate-300">
						<CreditCard size={16} className="text-indigo-400" />
						<span>Basic support</span>
					</div>
				</div>

				<button
					disabled
					className="w-full px-4 py-3 bg-indigo-600/20 text-indigo-300 rounded-lg font-medium cursor-not-allowed opacity-50 flex items-center justify-center gap-2"
				>
					<span>Upgrade Plan</span>
					<span className="text-xs bg-indigo-500/20 px-2 py-0.5 rounded">Coming Soon</span>
				</button>
			</div>

			{/* Usage Stats Placeholder */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
					<div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Boards Created</div>
					<div className="text-2xl font-bold text-white">—</div>
					<div className="text-xs text-slate-500 mt-1">Coming soon</div>
				</div>

				<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
					<div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Storage Used</div>
					<div className="text-2xl font-bold text-white">—</div>
					<div className="text-xs text-slate-500 mt-1">Coming soon</div>
				</div>
			</div>
		</div>
	);
}
