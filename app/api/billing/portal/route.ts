import { RATE_LIMITS } from '@/lib/rate-limit/configs';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { init } from '@instantdb/admin';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-12-15.clover',
});

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export const POST = withRateLimitedAuth(
	async (user, req) => {
		try {
			const data = await adminDB.query({
				profiles: {
					$: { where: { id: user.id } },
				},
			});

			const profile = data.profiles[0];
			if (!profile.stripe_customer_id) {
				return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
			}

			const session = await stripe.billingPortal.sessions.create({
				customer: profile.stripe_customer_id,
				return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
			});

			return NextResponse.json({ url: session.url });
		} catch (error) {
			console.error('[Billing Portal] Error:', error);
			return NextResponse.json(
				{ error: 'Failed to create portal session' },
				{ status: 500 }
			);
		}
	},
	RATE_LIMITS.BILLING_PORTAL,
	'billing-portal'
);
