import { NextResponse } from 'next/server';
import { cleanupStaleReservations } from '@/lib/billing/storage-reservation';

/**
 * GET /api/cron/cleanup-reservations
 *
 * Cleanup stale storage reservations (should be called every hour via Vercel Cron)
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-reservations",
 *     "schedule": "0 * * * *"
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
		await cleanupStaleReservations();
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('[Cron] Cleanup failed:', error);
		return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
	}
}
