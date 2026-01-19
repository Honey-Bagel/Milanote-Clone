'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const tiers = [
	{
		name: 'Free',
		price: '$0',
		period: 'forever',
		priceId: null,
		features: [
			'10 boards',
			'250 cards total',
			'250 MB file storage',
			'Basic collaboration',
			'Public board sharing',
		],
	},
	{
		name: 'Standard',
		price: '$5',
		period: 'per month',
		priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID,
		features: [
			'Unlimited boards',
			'Unlimited cards',
			'5 GB file storage',
			'Full collaboration features',
			'Priority support',
		],
	},
	{
		name: 'Pro',
		price: '$10',
		period: 'per month',
		priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
		features: [
			'Unlimited boards',
			'Unlimited cards',
			'Unlimited file storage',
			'Full collaboration features',
			'Premium support',
			'Advanced features',
		],
		popular: true,
	},
];

export default function PricingPage() {
	const [loading, setLoading] = useState<string | null>(null);
	const router = useRouter();

	const handleUpgrade = async (priceId: string) => {
		setLoading(priceId);

		try {
			const response = await fetch('/api/billing/create-checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ priceId }),
			});

			const { url, error } = await response.json();

			if (error) {
				alert(error);
				setLoading(null);
				return;
			}

			window.location.href = url;
		} catch (error) {
			console.error('Checkout error:', error);
			alert('Failed to start checkout');
			setLoading(null);
		}
	};

	console.log(tiers);

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-16">
					<h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
					<p className="text-xl text-gray-600">
						Start free, upgrade when you need more
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{tiers.map((tier) => (
						<div
							key={tier.name}
							className={`relative border rounded-2xl p-8 ${
								tier.popular
									? 'border-blue-500 shadow-xl scale-105'
									: 'border-gray-200'
							} bg-white`}
						>
							{tier.popular && (
								<div className="absolute -top-4 left-1/2 -translate-x-1/2">
									<span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
										Most Popular
									</span>
								</div>
							)}

							<div className="text-center mb-8">
								<h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
								<div className="mb-4">
									<span className="text-5xl font-bold">{tier.price}</span>
									<span className="text-gray-500 ml-2">{tier.period}</span>
								</div>
							</div>

							<ul className="space-y-4 mb-8">
								{tier.features.map((feature) => (
									<li key={feature} className="flex items-start">
										<Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
										<span className="text-gray-700">{feature}</span>
									</li>
								))}
							</ul>

							{tier.priceId ? (
								<Button
									onClick={() => handleUpgrade(tier.priceId!)}
									disabled={loading === tier.priceId}
									className={`w-full py-6 text-lg ${
										tier.popular
											? 'bg-blue-500 hover:bg-blue-600'
											: 'bg-gray-900 hover:bg-gray-800'
									}`}
								>
									{loading === tier.priceId ? 'Loading...' : 'Upgrade to ' + tier.name}
								</Button>
							) : (
								<Button
									onClick={() => router.push('/auth')}
									variant="outline"
									className="w-full py-6 text-lg"
								>
									Get Started Free
								</Button>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
