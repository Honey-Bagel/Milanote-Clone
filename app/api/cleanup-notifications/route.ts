import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";

export async function POST(req: Request) {
	// Verify request is from authorized source (cron job)
	const authHeader = req.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const notifCount = await NotificationService.cleanupOldNotifications();
		const activityCount = await NotificationService.cleanupOldActivityLogs();

		return NextResponse.json({
			success: true,
			notificationsDeleted: notifCount,
			activityLogsDeleted: activityCount,
		});
	} catch (error) {
		console.error('[Cleanup API] Error:', error);
		return NextResponse.json(
			{ error: 'Cleaup failed', details: error.message},
			{ status: 500 },
		);
	}
}