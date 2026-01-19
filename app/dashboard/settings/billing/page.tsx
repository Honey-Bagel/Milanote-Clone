'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UsageDashboard } from '@/components/billing/UsageDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionData {
	tier: string;
	status: string | null;
	current_period_end: number | null;
	cancel_at_period_end: boolean | null;
}

export default function BillingPage() {
	const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

	useEffect(() => {
		fetch('/api/billing/subscription')
			.then((res) => res.json())
			.then(setSubscription);
	}, []);

	const openBillingPortal = async () => {
		const response = await fetch('/api/billing/portal', { method: 'POST' });
		const { url } = await response.json();
		window.location.href = url;
	};

	return (
		<div className="max-w-4xl mx-auto p-8 space-y-8">
			<h1 className="text-3xl font-bold">Billing & Usage</h1>

			<Card>
				<CardHeader>
					<CardTitle>Usage</CardTitle>
				</CardHeader>
				<CardContent>
					<UsageDashboard />
				</CardContent>
			</Card>

			{subscription && subscription.tier !== 'free' && (
				<Card>
					<CardHeader>
						<CardTitle>Subscription Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-500">Plan</p>
								<p className="font-medium capitalize">{subscription.tier}</p>
							</div>
							<div>
								<p className="text-sm text-gray-500">Status</p>
								<p className="font-medium capitalize">
									{subscription.status || 'Active'}
								</p>
							</div>
						</div>

						{subscription.current_period_end && (
							<div>
								<p className="text-sm text-gray-500">Next billing date</p>
								<p className="font-medium">
									{new Date(subscription.current_period_end).toLocaleDateString()}
								</p>
							</div>
						)}

						{subscription.cancel_at_period_end && (
							<p className="text-red-500 text-sm">
								Your subscription will cancel at the end of the billing period.
							</p>
						)}

						<Button onClick={openBillingPortal} className="w-full">
							Manage Subscription
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
