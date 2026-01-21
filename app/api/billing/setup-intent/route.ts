import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { adminDB } from "@/lib/instant/adminDb";
import { withRateLimitedAuth } from "@/lib/rate-limit/with-rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/configs";

export const POST = withRateLimitedAuth(
	async (user, req) => {
		try {
			// Get user's stripe customer ID
			const data = await adminDB.query({
				profiles: {
					$: { where: { id: user.id } },
				},
			});

			const profile = data.profiles[0];

			// Ensure customer exists
			let customerId = profile.stripe_customer_id;

			if (!customerId) {
				const customer = await stripe.customers.create({
					email: user.email,
					metadata: { instant_user_id: user.id },
				});
				customerId = customer.id;

				await adminDB.transact([
					adminDB.tx.profiles[user.id].update({
						stripe_customer_id: customerId,
					}),
				]);
			}

			// Creaet SetupIntent for payment method collection
			const setupIntent = await stripe.setupIntents.create({
				customer_account: customerId as string,
				payment_method_types: ['card'],
				usage: 'off_session',
				metadata: {
					user_id: user.id,
				},
			});

			return NextResponse.json({
				clientSecret: setupIntent.client_secret,
			});
		} catch (error) {
			console.error('[Setup Intent] Error:', error);
			return NextResponse.json(
				{ error: 'Failed to create setup intent' },
				{ status: 500 },
			);
		}
	},
	RATE_LIMITS.BILLING_SETUP_INTENT,
	'billing-setup-intent'
);