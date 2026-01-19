import { withInstantAuth } from '@/lib/auth/with-instant-auth';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDB } from '@/lib/instant/admin-db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-12-15.clover',
});

export const POST = withInstantAuth(async (user, req) => {
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
});
