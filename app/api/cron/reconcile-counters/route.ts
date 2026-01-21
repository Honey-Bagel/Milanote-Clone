import { NextResponse } from 'next/server';
import { reconcileCounters } from '@/lib/billing/atomic-counter-service';
import { init } from '@instantdb/admin';

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

/**
 * GET /api/cron/reconcile-counters
 *
 * Reconcile usage counters for all users (should be called nightly via Vercel Cron)
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reconcile-counters",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(req: Request) {
	// Verify cron secret to prevent unauthorized calls
	const authHeader = req.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Reconcile users who haven't been reconciled in 24 hours
		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

		const { profiles } = await adminDB.query({
			profiles: {
				$: {
					where: {
						// Reconcile users with null or old reconciliation timestamp
						counters_last_reconciled: { $lt: oneDayAgo },
					},
				},
			},
		});

		let reconciledCount = 0;
		for (const profile of profiles) {
			try {
				await reconcileCounters(profile.id);
				reconciledCount++;
			} catch (error) {
				console.error(`[Reconcile] Failed for user ${profile.id}:`, error);
				// Continue with other users
			}
		}

		return NextResponse.json({
			success: true,
			reconciled: reconciledCount,
			total: profiles.length,
		});
	} catch (error) {
		console.error('[Cron] Reconciliation failed:', error);
		return NextResponse.json({ error: 'Reconciliation failed' }, { status: 500 });
	}
}
