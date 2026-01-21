'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface SubscriptionData {
	grace_period_end: number | null;
}

export function GracePeriodBanner() {
	const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

	useEffect(() => {
		fetch('/api/billing/subscription')
			.then((r) => r.json())
			.then(setSubscription);
	}, []);

	if (!subscription?.grace_period_end) return null;

	const daysLeft = Math.ceil(
		(subscription.grace_period_end - Date.now()) / (1000 * 60 * 60 * 24)
	);

	const openBillingPortal = async () => {
		const response = await fetch('/api/billing/portal', { method: 'POST' });
		const { url } = await response.json();
		window.location.href = url;
	};

	return (
		<Alert variant="destructive" className="mb-6">
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>Payment Failed</AlertTitle>
			<AlertDescription className="flex items-center justify-between">
				<span>
					Your payment failed. Update your payment method within {daysLeft} day
					{daysLeft !== 1 ? 's' : ''} to avoid losing access.
				</span>
				<Button
					onClick={openBillingPortal}
					variant="outline"
					size="sm"
					className="ml-4"
				>
					Update Payment
				</Button>
			</AlertDescription>
		</Alert>
	);
}
