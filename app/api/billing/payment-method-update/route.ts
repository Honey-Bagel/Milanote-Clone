import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { adminDB } from "@/lib/instant/adminDb";
import { withRateLimitedAuth } from "@/lib/rate-limit/with-rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit/configs";

export const POST = withRateLimitedAuth(
	async (user, req) => {
		try {
			const { paymentMethodId } = await req.json();

			if (!paymentMethodId) {
				return NextResponse.json(
					{ error: 'Payment method ID required' },
					{ status: 400 }
				);
			}

			// Get user's stripe customer ID
			const data = await adminDB.query({
				profiles: {
					$: { where: { id: user.id } },
				},
			});

			const profile = data.profiles[0];

			if (!profile.stripe_customer_id) {
				return NextResponse.json(
					{ error: 'No customer found' },
					{ status: 404 }
				);
			}

			// Attach payment method to customer and set as default
			await stripe.paymentMethods.attach(paymentMethodId, {
				customer: profile.stripe_customer_id as string,
			});

			await stripe.customers.update(profile.stripe_customer_id as string, {
				invoice_settings: {
					default_payment_method: paymentMethodId,
				},
			});

			// Update subscription if exists
			if (profile.stripe_subscription_id) {
				await stripe.subscriptions.update(profile.stripe_subscription_id as string, {
					default_payment_method: paymentMethodId,
				});
			}

			return NextResponse.json({ success: true });
		} catch (error) {
			console.error('[Update Payment Method] Error:', error);
			return NextResponse.json(
				{ error: 'Failed to update payment method' },
				{ status: 500 }
			);
		}
	},
	RATE_LIMITS.BILLING_UPDATE_PAYMENT_METHOD,
	'billing-update-payment-method'
);