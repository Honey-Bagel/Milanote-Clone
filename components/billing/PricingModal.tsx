'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TIER_INFO_MAP } from "@/lib/utils/tier-info";
import { useUpgradePlan } from "@/lib/hooks/billing/use-upgrade-plan";
import { PricingCard } from "./PricingCard";
import { useUserPlan } from "@/lib/hooks/user/use-user-plan";
import { cn } from "@/lib/utils";

interface PricingModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
	const { handleUpgrade, isLoading } = useUpgradePlan();
	const { tier: currentTierId } = useUserPlan();
	const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-5xl bg-[#0b0e1b] border-white/10 p-0 overflow-hidden text-white">
				
				{/* Header Section */}
				<div className="relative p-8 text-center border-b border-white/5 bg-[#020617]">
					<div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
					
					<DialogTitle className="text-3xl font-bold relative z-10 tracking-tight">
						Upgrade your workspace
					</DialogTitle>
					<DialogDescription className="text-secondary-foreground mt-2 max-w-md mx-auto relative z-10">
						Unlock unlimited boards and premium features.
					</DialogDescription>

					{/* Billing Toggle */}
					<div className="relative z-10 flex justify-center mt-8">
						<div className="flex items-center p-1 bg-white/5 rounded-lg border border-white/5 relative">
							<button
								onClick={() => setBillingCycle('monthly')}
								className={cn(
									"px-6 py-2 rounded-md text-sm font-medium transition-all duration-200",
									billingCycle === 'monthly' 
										? "bg-primary text-primary-foreground shadow-sm" 
										: "text-secondary-foreground hover:text-white"
								)}
							>
								Monthly
							</button>
							<button
								onClick={() => setBillingCycle('yearly')}
								className={cn(
									"px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
									billingCycle === 'yearly' 
										? "bg-primary text-primary-foreground shadow-sm" 
										: "text-secondary-foreground hover:text-white"
								)}
							>
								Yearly
								<span className={cn(
									"text-[10px] px-1.5 py-0.5 rounded-full font-bold",
									billingCycle === 'yearly' 
										? "bg-white/20 text-white" 
										: "bg-primary/20 text-primary"
								)}>
									-20%
								</span>
							</button>
						</div>
					</div>
				</div>

				{/* Cards Grid */}
				<div className="p-8 bg-[#020617]/50">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
						{TIER_INFO_MAP.map((tier) => (
							<PricingCard
								key={tier.id}
								tier={tier}
								billingCycle={billingCycle}
								isLoading={(isLoading === tier.priceIds[billingCycle]) && tier.name !== "Free"}
								onUpgrade={handleUpgrade}
								isCurrent={currentTierId?.toLowerCase() === tier.id}
							/>
						))}
					</div>
					
					<div className="mt-8 text-center">
						<p className="text-xs text-secondary-foreground">
							Secure payments powered by Stripe. You can cancel at any time.
						</p>
					</div>
				</div>

			</DialogContent>
		</Dialog>
	);
}