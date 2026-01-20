import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Updated interface to match new data structure
interface PricingTier {
	id: string;
	name: string;
	description: string;
	features: string[];
	buttonText: string;
	price: {
		monthly: string;
		yearly: string;
	};
	priceIds: {
		monthly: string | null;
		yearly: string | null;
	};
	popular?: boolean;
}

interface PricingCardProps {
	tier: PricingTier;
	billingCycle: 'monthly' | 'yearly';
	isLoading: boolean;
	onUpgrade: (priceId: string) => void;
	isCurrent?: boolean;
}

export function PricingCard({ tier, billingCycle, isLoading, onUpgrade, isCurrent }: PricingCardProps) {
	// Get current price and ID based on cycle
	const price = tier.price[billingCycle];
	const priceId = tier.priceIds[billingCycle];

	return (
		<div
			className={cn(
				"relative flex flex-col p-6 rounded-xl border transition-all duration-200 h-full",
				tier.popular 
					? "bg-[#020617] border-primary/50 shadow-2xl shadow-primary/10 scale-105 z-10" 
					: "bg-[#020617]/50 border-white/10 hover:border-white/20"
			)}
		>
			{tier.popular && (
				<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg border border-primary-foreground/20">
					Most Popular
				</div>
			)}

			<div className="mb-6">
				<h3 className="text-lg font-semibold text-white mb-1">{tier.name}</h3>
				<p className="text-sm text-secondary-foreground mb-4 h-10">{tier.description}</p>
				<div className="flex items-baseline gap-1">
					<span className="text-3xl font-bold text-white">{price}</span>
					<span className="text-sm text-secondary-foreground">
						/{billingCycle === 'monthly' ? 'mo' : 'yr'}
					</span>
				</div>
			</div>

			<div className="flex-1 space-y-3 mb-8">
				{tier.features.map((feature) => (
					<div key={feature} className="flex items-start gap-3">
						<div className={cn(
							"mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0",
							tier.popular ? "bg-primary/20" : "bg-white/10"
						)}>
							<Check size={10} className={tier.popular ? "text-primary" : "text-white"} strokeWidth={3} />
						</div>
						<span className="text-sm text-secondary-foreground">{feature}</span>
					</div>
				))}
			</div>

			<Button
				onClick={() => priceId && onUpgrade(priceId)}
				disabled={!priceId || isLoading || isCurrent}
				variant={tier.popular ? "default" : "outline"}
				className={cn(
					"w-full font-medium transition-all mt-auto",
					tier.popular 
						? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
						: "border-white/10 hover:bg-white/5 text-white bg-transparent",
					isCurrent && "opacity-50 cursor-not-allowed"
				)}
			>
				{isLoading ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : isCurrent ? (
					"Current Plan"
				) : (
					tier.buttonText
				)}
			</Button>
		</div>
	);
}