'use client';

import { PricingContent } from '@/components/billing/PricingContent';

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24 px-4">
			<div className="max-w-7xl mx-auto">
				<PricingContent variant="page" />
			</div>
		</div>
	);
}