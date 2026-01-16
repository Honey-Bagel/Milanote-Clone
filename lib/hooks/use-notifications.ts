'use client';

import { db } from '@/lib/instant/db';
import { userNotificationsQuery, unreadNotificationsCountQuery } from '../db/queries';
import { NotificationService } from '../services/notification-service';

export function useNotifications() {
	const { user } = db.useAuth();

	// Query notifications
	const { data, isLoading } = db.useQuery(
		user ? {
			notifications: {
				$: {
					where: {
						recipient_id: user.id,
					},
					order: { updated_at: 'desc' },
					limit: 20,
				},
				board: {},
			},
		} : null
	);

	// Query unread count
	const { data: unreadData } = db.useQuery(
		user ? {
			notifications: {
				$: {
					where: {
						recipient_id: user.id,
						is_read: false,
					},
				},
			},
		} : null
	);

	const notifications = data?.notifications || [];
	const unreadCount = unreadData?.notifications?.length || 0;

	const markAsRead = async (notificationId: string) => {
		await NotificationService.markAsRead(notificationId);
	};

	const markAllAsRead = async () => {
		if (!user) return;
		await NotificationService.markAllAsRead(user.id);
	};

	return {
		notifications,
		unreadCount,
		isLoading,
		markAsRead,
		markAllAsRead,
	};
}