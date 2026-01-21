'use server';

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { init } from "@instantdb/admin";
import { withRateLimitedAuth } from "@/lib/rate-limit/with-rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/configs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-12-15.clover',
});

const ALLOWED_PRICE_IDS = [
	process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID,
	process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
];

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export const POST = withRateLimitedAuth(
	async (user, req) => {
		try {
			const { priceId } = await req.json();

			if (!priceId || !ALLOWED_PRICE_IDS.includes(priceId)) {
				return NextResponse.json({ error: 'Invalid or No Price ID Provided' }, { status: 400 });
			}

			// Get or create stripe customer
			const data = await adminDB.query({
				profiles: {
					$: { where: { id: user.id } },
				},
			});

			const profile = data.profiles[0];
			let customerId = profile.stripe_customer_id;

			if (!customerId) {
				const customer = await stripe.customers.create({
					email: user.email,
					metadata: {
						instant_user_id: user.id,
					},
				});

				customerId = customer.id;

				// Store customer ID
				try {
					await adminDB.transact([
						adminDB.tx.profiles[user.id].update({
							stripe_customer_id: customerId,
						}),
					]);
				} catch (error) {
					console.log('db error:', error);
				}
			}

			// Create checkout session
			const session = await stripe.checkout.sessions.create({
				customer: customerId,
				mode: 'subscription',
				line_items: [
					{
						price: priceId,
						quantity: 1,
					},
				],
				success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
				cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
				metadata: {
					user_id: user.id,
				},
			});

			return NextResponse.json({ url: session.url });
		} catch (error) {
			console.error('[Checkout] Error:', error);
			return NextResponse.json(
				{ error: 'Failed to create checkout session' },
				{ status: 500 }
			);
		}
	},
	RATE_LIMITS.BILLING_CREATE_CHECKOUT,
	'billing-create-checkout'
);