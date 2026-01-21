'use client';

import { useState } from "react";
import { useUserPlan } from "@/lib/hooks/user/use-user-plan";
import { Check, ExternalLink, Zap } from "lucide-react";
import { TIER_INFO } from "@/lib/utils/tier-info";
import { PricingModal } from "@/components/billing/PricingModal";

export function CurrentPlanCard() {
	const { tier } = useUserPlan();
	const tierInfo = TIER_INFO[tier];
	
	// State to control the modal
	const [isPricingOpen, setIsPricingOpen] = useState(false);
	const [isLoadingPortal, setIsLoadingPortal] = useState(false);

	const handleManageSubscription = async () => {
		setIsLoadingPortal(true);

		try {
			const response = await fetch('/api/billing/portal', {
				method: 'POST',
			});

			const { url, error } = await response.json();

			if (error) {
				throw new Error(error);
			}

			window.location.href = url;
		} catch (error) {
			console.error('Portal error:', error);
			alert('Failed to open customer portal');
		} finally {
			setIsLoadingPortal(false);
		}
	}

	return (
		<>
			<div className="h-full p-8 bg-[#020617] border border-white/10 rounded-xl relative overflow-hidden flex flex-col">
				
				{/* Background Glow */}
				<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />

				{/* Header Section */}
				<div className="flex items-start justify-between relative z-10 mb-8">
					<div>
						<div className="flex items-center gap-3 mb-3">
							<h4 className="text-2xl font-bold text-white tracking-tight">Current Plan</h4>
							<div className="px-2.5 py-0.5 bg-primary/20 text-primary rounded-full text-[11px] font-bold uppercase tracking-wide border border-primary/20">
								Active
							</div>
						</div>
						<p className="text-base text-secondary-foreground leading-relaxed max-w-md">
							You are currently on the <strong className="text-white">{tierInfo.name} Plan</strong>. 
						</p>
					</div>
					
					{/* Price */}
					<div className="text-right">
						<div className="text-3xl font-bold text-white tracking-tight">$0</div>
						<div className="text-xs font-medium text-secondary-foreground mt-1">per month</div>
					</div>
				</div>

				{/* Features List */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 relative z-10 mb-8 flex-grow content-start">
					{tierInfo.features.map((feature) => (
						<div key={feature} className="flex items-start gap-3">
							<div className="mt-1 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
								<Check size={10} className="text-primary" strokeWidth={4} />
							</div>
							<span className="text-sm text-secondary-foreground">{feature}</span>
						</div>
					))}
				</div>

				{/* Footer Actions */}
				<div className="mt-auto pt-8 border-t border-white/5 relative z-10 flex flex-col sm:flex-row gap-3">
					<button
						onClick={() => setIsPricingOpen(true)}
						className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
					>
						<Zap size={16} fill="currentColor" />
						<span>Upgrade Plan</span>
					</button>

					<button onClick={async () => await handleManageSubscription()} className="flex-1 px-4 py-2 bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors rounded-lg font-medium text-sm flex items-center justify-center gap-2">
						Manage Subscription
						<ExternalLink size={14} className="opacity-70" />
					</button>
				</div>
			</div>

			{/* Pricing Modal Component */}
			<PricingModal 
				isOpen={isPricingOpen} 
				onClose={() => setIsPricingOpen(false)} 
			/>
		</>
	);
}