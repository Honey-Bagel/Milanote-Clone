import { NextResponse } from "next/server";
import Stripe from "stripe";
import { init } from "@instantdb/admin";
import { withRateLimitedAuth } from "@/lib/rate-limit/with-rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/configs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-12-15.clover',
});

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export const GET = withRateLimitedAuth(
	async (user, req) => {
		try {
			// Get user's stripe customer ID
			const data = await adminDB.query({
				profiles: {
					$: { where: { id: user.id } },
				},
			});

			const profile = data.profiles[0];

			if (!profile.stripe_customer_id) {
				return NextResponse.json({ paymentMethod: null }, { status: 200 });
			}

			// Fetch default payment method from Stripe
			const customer = await stripe.customers.retrieve(profile.stripe_customer_id, {
				expand: ['invoice_settings.default_payment_method'],
			});

			if (customer.deleted) {
				return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
			}

			const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

			if (!defaultPaymentMethod || typeof defaultPaymentMethod === 'string') {
				return NextResponse.json({ paymentMethod: null }, { status: 200 });
			}

			// Extract card details
			const card = defaultPaymentMethod.card;

			return NextResponse.json({
				paymentMethod: {
					id: defaultPaymentMethod.id,
					brand: card?.brand || 'unknown',
					last4: card?.last4 || '****',
					expMonth: card?.exp_month,
					expYear: card?.exp_year,
					isDefault: true,
				},
			});
		} catch (error) {
			console.error('[Payment Method] Error:', error);
			return NextResponse.json(
				{ error: 'Failed to fetch payment method' },
				{ status: 500 }
			);
		}
	},
	RATE_LIMITS.BILLING_PAYMENT_METHOD,
	'billing-payment-method'
)