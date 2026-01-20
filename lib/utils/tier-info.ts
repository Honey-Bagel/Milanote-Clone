export const TIER_INFO = {
	free: {
		name: 'Free',
		price: '$0',
		period: 'forever',
		priceId: null,
		features: [
			'10 boards',
			'250 cards across all boards',
			'250 MB file storage',
		],
	},
	standard: {
		name: 'Standard',
		price: '$5',
		period: 'm',
		priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID,
		features: [
			'Unlimited boards',
			'Unlimited cards',
			'5 GB file storage',
			'Priority support',
		],
	},
	pro: {
		name: 'Pro',
		price: '$10',
		period: 'm',
		priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
		features: [
			'Unlimited boards',
			'Unlimited cards',
			'Unlimited file storage',
			'Premium support',
			'Early access to upcoming features',
		],
	},
};

export const TIER_INFO_MAP = [
	{
		id: 'free',
		name: 'Free',
		description: 'Perfect for getting started.',
		features: [
			'10 boards',
			'250 cards total',
			'250 MB file storage',
			'Basic collaboration',
		],
		buttonText: 'Return to Free Plan',
		price: {
			monthly: '$0',
			yearly: '$0',
		},
		priceIds: {
			monthly: null,
			yearly: null,
		}
	},
	{
		id: 'standard',
		name: 'Standard',
		description: 'For small teams and creators.',
		features: [
			'Unlimited boards',
			'Unlimited cards',
			'5 GB file storage',
			'Priority support',
		],
		buttonText: 'Upgrade to Standard',
		price: {
			monthly: '$5',
			yearly: '$48', // Example: $4/mo when billed yearly
		},
		priceIds: {
			monthly: process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID,
			yearly: process.env.NEXT_PUBLIC_STRIPE_STANDARD_YEARLY_PRICE_ID,
		}
	},
	{
		id: 'pro',
		name: 'Pro',
		description: 'For power users who need it all.',
		popular: true,
		features: [
			'Everything in Standard',
			'Unlimited file storage',
			'Advanced analytics',
			'24/7 Premium support',
		],
		buttonText: 'Upgrade to Pro',
		price: {
			monthly: '$10',
			yearly: '$96', // Example: $8/mo when billed yearly
		},
		priceIds: {
			monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
			yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
		}
	},
];