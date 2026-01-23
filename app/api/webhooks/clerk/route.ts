import { verifyWebhook } from '@clerk/backend/webhooks';
import { NextResponse } from 'next/server';
import { adminDB } from '@/lib/instant/adminDb';
import { id } from '@instantdb/admin';
import {
	handleUserCreated,
	handleUserUpdated,
	handleUserDeleted,
	handleSessionCreated,
	handleSessionEnded,
} from '@/lib/clerk/webhook-handlers';
import type { WebhookEvent } from '@clerk/nextjs/server';

/**
 * Check if event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
	const data = await adminDB.query({
		clerk_webhook_events: {
			$: { where: { event_id: eventId } },
		},
	});

	return data.clerk_webhook_events.length > 0;
}

/**
 * Mark event as processed
 */
async function markEventProcessed(
	eventId: string,
	eventType: string,
	data: unknown
): Promise<void> {
	await adminDB.transact([
		adminDB.tx.clerk_webhook_events[id()].update({
			event_id: eventId,
			event_type: eventType,
			processed_at: Date.now(),
			data: data as Record<string, unknown>,
		}),
	]);
}

/**
 * Extract event ID from webhook event
 */
function getEventid(evt: WebhookEvent): string {
	const objectId = (evt.data as { id?: string }).id || 'unknown';
	return `${evt.type}-${objectId}-${Date.now()}`;
}

/**
 * Main webhook handler
 */
export async function POST(req: Request) {
	let eventId = '';
	let eventType = '';

	try {
		// Verify webhook signature
		const evt = await verifyWebhook(req);

		eventType = evt.type;
		eventId = getEventid(evt);

		// Check idempotency
		if (await isEventProcessed(eventId)) {
			return NextResponse.json({ received: true, skipped: true }, { status: 200 });
		}

		// Route to appropriate handler
		switch (evt.type) {
			case 'user.created':
				await handleUserCreated(evt.data as Parameters<typeof handleUserCreated>[0]);
				break;

			case 'user.updated':
				await handleUserUpdated(evt.data as Parameters<typeof handleUserUpdated>[0]);
				break;

			case 'user.deleted':
				await handleUserDeleted(evt.data as Parameters<typeof handleUserDeleted>[0]);
				break;

			case 'session.created':
				await handleSessionCreated(evt.data as Parameters<typeof handleSessionCreated>[0]);
				break;

			case 'session.ended':
				await handleSessionEnded(evt.data as Parameters<typeof handleSessionEnded>[0]);
				break;
			
			default:
				console.log(`[Clerk Webhook] Unhandled event type: ${evt.type}`);
		}

		// Mark as processed
		await markEventProcessed(eventId, eventType, evt.data);

		return NextResponse.json({ received: true }, { status: 200 });
	} catch (error) {
		console.error(`[Clerk Webhook] Error processing ${eventType}:`, error);

		// Determine if error is retryable
		if (error instanceof Error) {
			const message = error.message;

			// Non-retryable errors (4xx)
			if (
				message.includes('MISSING_EMAIL') ||
				message.includes('Invalid signature') ||
				message.includes('signature')
			) {
				return NextResponse.json(
					{error: message, retryable: false },
					{ status: 400 }
				);
			}

			if (message.includes('INSTANT_USER_NOT_FOUND')) {
				return NextResponse.json(
					{ error: 'User not yet synced to InstantDB', retryable: true },
					{ status: 503 }
				);
			}
		}

		return NextResponse.json(
			{ error: 'Processing failed', retryable: true },
			{ status: 500 }
		);
	}
}

/**
 * Health check endpoint
 */
export async function GET() {
	return NextResponse.json({
		status: 'ok',
		endpoint: 'clerk-webook',
		timestamp: Date.now().toString()
	});
}