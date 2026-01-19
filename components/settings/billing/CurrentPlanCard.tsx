'use client';

import { useUserPlan } from "@/lib/hooks/user/use-user-plan";
import { Zap } from "lucide-react";

export function CurrentPlanCard() {
	const { tier } = useUserPlan();

	return (
		<div className="p-6 bg-[#020617] border border-white/10 rounded-xl">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h4 className="text-base font-semibold text-white">Current Plan</h4>
					<p className="text-sm text-secondary-foreground mt-1">{tier.replace(/^./, (char) => char.toUpperCase())} Plan</p>
				</div>
				<div className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs font-medium">
					Active
				</div>
			</div>

			<div className="space-y-3 mb-6">
				<div className="flex items-center gap-3 text-sm text-foreground">
					<Zap size={16} className="text-primary" />
					
				</div>
			</div>
			<button
				disabled
				className="w-full px-4 py-3 bg-primary/20 text-primary rounded-lg font-medium cursor-not-allowed opacity-50 flex items-center justify-center gap-2"
			>
				<span> Upgrade Plan</span>
				<span className="text-xs bg-primary/20 px-2 py-0.5 rounded">Coming soon</span>
			</button>
		</div>
	)
}