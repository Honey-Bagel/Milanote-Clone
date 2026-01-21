import { useState } from 'react';

export function useUpgradePlan() {
	const [isLoading, setIsLoading] = useState<string | null>(null);

	const handleUpgrade = async (priceId: string) => {
		setIsLoading(priceId);

		try {
			const response = await fetch('/api/billing/create-checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ priceId }),
			});

			const { url, error } = await response.json();

			if (error) {
				throw new Error(error);
			}

			window.location.href = url;
		} catch (error) {
			console.error('Checkout error:', error);
			// In a real app, use a toast notification here
			alert('Failed to start checkout');
		} finally {
			setIsLoading(null);
		}
	};

	return { handleUpgrade, isLoading };
}