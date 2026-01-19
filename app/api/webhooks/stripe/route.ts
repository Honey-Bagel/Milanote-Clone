import { NextResponse } from "next/server";
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { init } from "@instantdb/admin";
import { id } from "@instantdb/react";

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function verifyWebhook(req: Request): Promise<Stripe.Event> {
	const body = await req.text();
	const headersList = await headers();
	const signature = headersList.get('stripe-signature');

	if (!signature) {
		throw new Error('Missing stripe-signature header');
	}

	return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

async function isEventProcessed(eventId: string): Promise<boolean> {
	const data = await adminDB.query({
		stripe_webhook_events: {
			$: { where: { event_id: eventId } },
		},
	});

	return data.stripe_webhook_events.length > 0;
}

async function markEventProcessed(event: Stripe.Event): Promise<void> {
	await adminDB.transact([
		adminDB.tx.stripe_webhook_events[id()].update({
			event_id: event.id,
			event_type: event.type,
			processed_at: Date.now(),
			data: event.data,
		}),
	]);
}

async function getUserByStripeCustomer(customerId: string): Promise<string> {
	// Try finding by stripe customer_id
	const profileData = await adminDB.query({
		profiles: {
			$: { where: { stripe_customer_id: customerId } },
		},
	});

	if (profileData.profiles.length > 0) {
		return profileData.profiles[0].id;
	}

	// Fallback: find by email from Stripe
	const customer = await stripe.customers.retrieve(customerId);
	if (customer.deleted) throw new Error('Customer deleted');

	const userData = await adminDB.query({
		$users: {
			$: { where: { email: customer.email } },
			profile: {},
		},
	});

	if (userData.$users.length === 0) {
		throw new Error('USER_NOT_SYNCED');
	}

	const user = userData.$users[0];
	const profileId = user.profile.id;

	// Store customer ID for future lookups
	await adminDB.transact([
		adminDB.tx.profiles[profileId].update({
			stripe_customer_id: customerId,
		}),
	]);

	return profileId;
}

async function getTierFromPriceId(priceId: string) {
	const price = await stripe.prices.retrieve(priceId);
	const tier = price.metadata.tier || 'free';
	return tier;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
	const customerId = session.customer as string;
	const subscriptionId = session.subscription as string;

	const userId = await getUserByStripeCustomer(customerId);
	const subscription = await stripe.subscriptions.retrieve(subscriptionId);

	const priceId = subscription.items.data[0].price.id;
	const tier = await getTierFromPriceId(priceId);

	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			subscription_tier: tier,
			subscription_status: subscription.status,
			stripe_subscription_id: subscriptionId,
			subscription_current_period_end: subscription.current_period_end * 1000,
			subscription_cancel_at_period_end: false,
			grace_period_end: null,
		}),
	]);

	console.log(`[Webhook] Checkout completed: User ${userId} -> ${tier}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string;
	const userId = await getUserByStripeCustomer(customerId);

	const priceId = subscription.items.data[0].price.id;
	const tier = await getTierFromPriceId(priceId);

	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			subscription_tier: tier,
			subscription_status: subscription.status,
			subscription_current_period_end: subscription.current_period_end * 1000,
			subscription_cancel_at_period_end: subscription.cancel_at_period_end,
		}),
	]);

	console.log(`[Webhook] Subscription updated: User ${userId} -> ${tier} (${subscription.status})`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string;
	const userId = await getUserByStripeCustomer(customerId);

	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			subscription_tier: 'free',
			subscription_status: 'canceled',
			stripe_subscription_id: null,
			subscription_cancel_at_period_end: false,
			grace_period_end: null,
		}),
	]);

	console.log(`[Webhook] Subscription deleted: User ${userId} → free`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
	const customerId = invoice.customer as string;
	const userId = await getUserByStripeCustomer(customerId);

	const gracePeriodEnd = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			subscription_status: 'past_due',
			grace_period_end: gracePeriodEnd,
		}),
	]);

	console.log(`[Webhook] Payment failed: User ${userId} → grace period until ${new Date(gracePeriodEnd)}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
	const customerId = invoice.customer as string;
	const userId = await getUserByStripeCustomer(customerId);

	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			subscription_status: 'active',
			grace_period_end: null,
		}),
	]);

	console.log(`[Webhook] Payment succeeded: User ${userId} → active`);
}

export async function POST(req: Request) {
	try {
		const event = await verifyWebhook(req);

		// Check idempotency
		if (await isEventProcessed(event.id)) {
			console.log(`[Webhook] Event ${event.id} already processed`);
			return NextResponse.json({ received: true }, { status: 200 });
		}

		// Handle event
		switch (event.type) {
			case 'checkout.session.completed':
				await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
				break;

			case 'customer.subscription.created':
			case 'customer.subscription.updated':
				await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
				break;

			case 'customer.subscription.deleted':
				await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
				break;

			case 'invoice.payment_failed':
				await handlePaymentFailed(event.data.object as Stripe.Invoice);
				break;

			case 'invoice.payment_succeeded':
				await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
				break;

			default:
				console.log(`[Webhook] Unhandled event type: ${event.type}`);
		}

		// Mark as processed
		await markEventProcessed(event);

		return NextResponse.json({ received: true }, { status: 200 });
	} catch (error) {
		console.error('[Webhook] Error:', error);

		if (error instanceof Error && error.message === 'USER_NOT_SYNCED') {
			// User not synced yet - return 4xx to not retry
			return NextResponse.json({ error: 'User not found' }, { status: 400 });
		}

		// Transient error - return 5xx for Stripe to retry
		return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
	}
}