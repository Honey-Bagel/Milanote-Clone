import { db, generateId } from "@/lib/db/client";

const GROUPING_WINDOW_MS = 15 * 60 * 1000; // 15 Minutes

export const NotificationService = {
	/**
	 * Process an activity and create/update notifcations for affected users
	 * This should be called from a background process or webhook
	 */
	processActivity: async (activityId: string): Promise<void> => {
		// 1. Fetch the activity entry with board and actor data
		const { data } = await db.queryOnce({
			activity_log: {
				$: { where: { id: activityId } },
				board: {
					collaborators: {
						user: {
							preferences: {},
							profile: {},
						},
					},
				},
				actor: {
					profile: {},
				},
			},
		});

		const activity = data?.activity_log?.[0];
		if (!activity) return;
		
		const actorId = activity.actor_id;
		const boardId = activity.board_id;
		const actionType = activity.action_type;
		const now = Date.now();

		// 2. Determine affected users (all collaborators except actor)
		const collaborators = activity.board?.collaborators || [];
		const recipients = collaborators
			.filter((c: any) => c.user.id !== actorId) // Exclude actor
			.map((c: any) => ({
				userId: c.user.id,
				preferences: c.user.preferences,
				profile: c.user.profile,
			}));

		// 3. For each recipient, create or update notification
		for (const recipient of recipients) {
			// Check user preferences
			if (actionType === 'card.created' || actionType === 'card.updated') {
				if (!recipient.preferences?.boardActivityNotifications) continue;
			}
			if (actionType === 'collaborator.added') {
				if (!recipient.preferences?.shareNotifications) continue;
			}

			// Check for existing notification in 15-min window
			const windowStart = now - GROUPING_WINDOW_MS;
			const { data: existingData } = await db.queryOnce({
				notifications: {
					$: {
						where: {
							recipient_id: recipient.userId,
							board_id: boardId,
							group_window_end: { $gte: windowStart },
						},
					},
				},
			});

			const existingNotification = existingData?.notifications?.[0];

			if (existingNotification) {
				// Update existing notfication
				await updateNotificationWithActivity(existingNotification.id, activity, now);
			} else {
				// Create new notification
				await createNotificationFromActivity(recipient.userId, activity, now);
			}
		}
	},

	/**
	 * Mark a notifcation as read
	 */
	markAsRead: async (notificationId: string): Promise<void> => {
		const now = Date.now();
		await db.transact([
			db.tx.notifications[notificationId].update({
				is_read: true,
				read_at: now,
			}),
		]);
	},

	/**
	 * Mark all notifications as read for a user
	 */
	markAllAsRead: async (userId: string): Promise<void> => {
		const { data } = await db.queryOnce({
			notifications: {
				$: {
					where: {
						recipient_id: userId,
						is_read:false,
					},
				},
			},
		});

		const notifications = data?.notifications || [];
		const now = Date.now();

		await db.transact(
			notifications.map((n: any) =>
				db.tx.notifications[n.id].update({
					is_read: true,
					read_at: now,
				})
			)
		);
	},

	/**
	 * Clean up old notifications to prevent db bloat
	 * should be called in Vercel cron job
	 * 
	 * Cleanup strategy:
	 * - Delete read notifications older than 30 days
	 * - Delete all notifications older than 90 days
	 */
	cleanupOldNotifications: async (): Promise<number> => {
		const now = Date.now();
		const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
		const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

		// Find notifications to delete
		const { data } = await db.queryOnce({
			notifications: {
				$: {
					where: {
						// Read notifications older than 30 days or any old than 90
						or: [
							{ is_read: true, read_at: { $lt: now - THIRTY_DAYS } },
							{ created_at: { $lt: now - NINETY_DAYS } },
						],
					},
				},
			},
		});

		const notificationsToDelete = data?.notifications || [];

		if (notificationsToDelete.length === 0) {
			return 0;
		}

		// Delete in batches
		await db.transact(
			notificationsToDelete.map((n: any) =>
				db.tx.notifications[n.id].delete()
			)
		);

		console.log(`[NotificationService] cleaned up ${notificationsToDelete.length} old notifications`);
		return notificationsToDelete.length;
	},

	/**
	 * Clean up old activity logs to prevent db bkiat
	 * 
	 * Delete activity logs older than 90 days
	 */
	cleanupOldActivityLogs: async (): Promise<number> => {
		const now = Date.now();
		const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

		const { data } = await db.queryOnce({
			activity_log: {
				$: {
					where: {
						created_at: { $lt: now - NINETY_DAYS },
					},
				},
			},
		});

		const logsToDelete = data?.activity_log || [];

		if (logsToDelete.length === 0) {
			return 0;
		}

		await db.transact(
			logsToDelete.map((log: any) =>
			db.tx.activity_log[log.id].delete()
			)
		);

		console.log(`[NotificationService] Cleaned up ${logsToDelete.length} old activity logs`);
		return logsToDelete.length;
	},
};

/**
 * Helper: Create new notification from activity
 */
async function createNotificationFromActivity(
	recipientId: string,
	activity: any,
	now: number
): Promise<void> {
	const notificationId = generateId();
	const windowStart = now;
	const windowEnd = now + GROUPING_WINDOW_MS;

	let notificationType: string;
	let activitySummary: any = { total_actions: 1 };

	if (activity.action_type === 'card.created') {
		notificationType = 'board_activity';
		activitySummary.cards_created = {
			[activity.card_type]: 1,
		};
	} else if (activity.action_type === 'card.updated') {
		notificationType = 'board_activity';
		activitySummary.cards_updated = {
			[activity.card_type]: 1,
		};
	} else if (activity.action_type === 'collaborator.added') {
		notificationType = 'collaborator_added';
		activitySummary.added_by = activity.actor_id;
		activitySummary.role = activity.metadata?.role;
	} else {
		return;
	}

	await db.transact([
		db.tx.notifications[notificationId].update({
			recipient_id: recipientId,
			notification_type: notificationType,
			board_id: activity.board_id,
			board_title: activity.board?.title || 'Untitled board',
			board_color: activity.board?.color,
			actor_ids: [activity.actor_id],
			activity_summary: activitySummary,
			is_read: false,
			created_at: now,
			updated_at: now,
			group_window_start: windowStart,
			group_window_end: windowEnd,
		}),
		db.tx.notifications[notificationId].link({ recipient: recipientId }),
		db.tx.notifications[notificationId].link({ board: activity.board_id }),
	]);
}

/**
 * Helper: update existing notification with new activity
 */
async function updateNotificationWithActivity(
	notificationId: string,
	activity: any,
	now: number
): Promise<void> {
	// Fetch existing notification
	const { data } = await db.queryOnce({
		notifications: {
			$: { where: { id: notificationId } },
		},
	});

	const notification = data?.notifications?.[0];
	if (!notification) return;

	// Update actor_ids (add if not present)
	const actorIds = notification.actor_ids || [];
	if (!actorIds.includes(activity.actor_id)) {
		actorIds.push(activity.actor_id);
	}

	// Update activity summary
	const summary = notification.activity_summary || {};
	summary.total_actions = (summary.total_actions || 0) + 1;

	if (activity.action_type === 'card.created') {
		summary.cards_created = summary.cards_created || {};
		summary.cards_created[activity.card_type] =
			(summary.cards_created[activity.card_type] || 0) + 1;
	} else if (activity.action_type === 'card.updated') {
		summary.cards_updated = summary.cards_updated || {};
		summary.cards_updated[activity.card_type] =
			(summary.cards_updated[activity.card_type] || 0) + 1;
	}

	await db.transact([
		db.tx.notifications[notificationId].update({
			actor_ids: actorIds,
			activity_summary: summary,
			updated_at: now,
			is_read: false,
		}),
	]);
}