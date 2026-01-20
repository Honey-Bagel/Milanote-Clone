'use client';

import { useState } from "react";
import { TIER_INFO_MAP } from "@/lib/utils/tier-info";
import { useUpgradePlan } from "@/lib/hooks/billing/use-upgrade-plan";
import { PricingCard } from "./PricingCard";
import { useUserPlan } from "@/lib/hooks/user/use-user-plan";
import { cn } from "@/lib/utils";

interface PricingContentProps {
	variant?: 'modal' | 'page';
	className?: string;
}

export function PricingContent({ variant = 'modal', className }: PricingContentProps) {
	const { handleUpgrade, isLoading } = useUpgradePlan();
	const { tier: currentTier } = useUserPlan();
	const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

	const isModalVariant = variant === 'modal';

	return (
		<div className={cn(
			isModalVariant
				? "bg-[#0b0e1b] text-white"
				: "bg-transparent text-gray-900",
			className
		)}>
			{/* Header Section */}
			<div className={cn(
				"relative p-8 text-center border-b",
				isModalVariant
					? "border-white/5 bg-[#020617]"
					: "border-gray-200 bg-white/50"
			)}>
				{isModalVariant && (
					<>
						<div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
					</>
				)}

				<h2 className={cn(
					"text-3xl font-bold relative z-10 tracking-tight",
					isModalVariant ? "text-white" : "text-gray-900"
				)}>
					Upgrade your workspace
				</h2>
				<p className={cn(
					"mt-2 max-w-md mx-auto relative z-10",
					isModalVariant ? "text-secondary-foreground" : "text-gray-600"
				)}>
					Unlock unlimited boards and premium features.
				</p>

				{/* Billing Toggle */}
				<div className="relative z-10 flex justify-center mt-8">
					<div className={cn(
						"flex items-center p-1 rounded-lg border relative",
						isModalVariant
							? "bg-white/5 border-white/5"
							: "bg-gray-100 border-gray-200"
					)}>
						<button
							onClick={() => setBillingCycle('monthly')}
							className={cn(
								"px-6 py-2 rounded-md text-sm font-medium transition-all duration-200",
								billingCycle === 'monthly'
									? "bg-primary text-primary-foreground shadow-sm"
									: isModalVariant
										? "text-secondary-foreground hover:text-white"
										: "text-gray-600 hover:text-gray-900"
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
									: isModalVariant
										? "text-secondary-foreground hover:text-white"
										: "text-gray-600 hover:text-gray-900"
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
			<div className={cn(
				"p-8",
				isModalVariant ? "bg-[#020617]/50" : "bg-transparent"
			)}>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
					{TIER_INFO_MAP.map((tier) => (
						<PricingCard
							key={tier.id}
							tier={tier}
							billingCycle={billingCycle}
							isLoading={isLoading === tier.priceIds[billingCycle]}
							onUpgrade={handleUpgrade}
							isCurrent={currentTier === tier.name}
						/>
					))}
				</div>

				<div className="mt-8 text-center">
					<p className={cn(
						"text-xs",
						isModalVariant ? "text-secondary-foreground" : "text-gray-500"
					)}>
						Secure payments powered by Stripe. You can cancel at any time.
					</p>
				</div>
			</div>
		</div>
	);
}