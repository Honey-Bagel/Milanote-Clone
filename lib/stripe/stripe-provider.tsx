'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeProviderProps {
	children: ReactNode;
	clientSecret: string;
};

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
	const options = {
		clientSecret,
		appearance: {
			theme: 'night' as const,
			variables: {
				colorPrimary: '#6366f1',
				colorBackground: '#020617',
				colorText: '#ffffff',
				colorDanger: '#ef4444',
				fontFamily: 'system-ui, sans-serif',
				borderRadius: '8px',
			},
		},
	};

	return (
		<Elements stripe={stripePromise} options={options}>
			{children}
		</Elements>
	)
}