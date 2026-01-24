import { useState } from 'react';

export function useManageSubscription() {
	const [isLoading, setIsLoading] = useState(false);

	const openPortal = async () => {
		setIsLoading(true);

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
			alert('Failed to open subscription management');
		} finally {
			setIsLoading(false);
		}
	};

	return { openPortal, isLoading };
}
