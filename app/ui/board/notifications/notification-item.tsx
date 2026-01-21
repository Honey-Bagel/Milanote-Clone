"use client";

import { useRouter } from "next/navigation";
import { useNotifications } from '@/lib/hooks/use-notifications';
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
	notification: any;
}

export function NotificationItem({ notification }: NotificationItemProps) {
	const router = useRouter();
	const { markAsRead } = useNotifications();

	const handleClick = async () => {
		// Mark as read
		if (!notification.is_read) {
			await markAsRead(notification.id);
		}

		// Navigate to board
		router.push(`/board/${notification.board_id}`);
	};

	// Generate summary text
	const summaryText = generateNotificationSummary(notification);

	return (
		<div
			className={cn(
				'p-3 hover:bg-white/5 cursor-pointer border-b border-white/10 transition-colors',
				!notification.is_read && 'bg-white/3'
			)}
			onClick={handleClick}
		>
			<div  className="flex items-start gap-3">
				{/* Board color indicator */}
				<div
					className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
					style={{ backgroundColor: notification.board_color || '#4f46e5' }}
				/>

				<div className="flex-1 min-w-0">
					{/* Summary text */}
					<p className="text-sm text-white/90 leading-snug">
						{summaryText}
					</p>

					{/* Board Title */}
					<p className="text-xs text-secondary-foreground mt-1">
						in {notification.board_title}
					</p>

					{/* Timestamp */}
					<p className="text-xs text-secondary-foreground/60 mt-1">
						{formatDistanceToNow(notification.updated_at, { addSuffix: true })}
					</p>
				</div>

				{/* Unread indicator */}
				{!notification.is_read && (
					<div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
				)}
			</div>
		</div>
	);
}

/**
 * Generate human-readable notification summary
 */
function generateNotificationSummary(notification: any): string {
	const { notification_type, activity_summary, actor_ids } = notification;

	// Format actor names (simplified) TODO fetch profiles
	const actorCount = actor_ids?.length || 1;
	const actorText = actorCount === 1 ? 'Someone' : `${actorCount} people`;

	if (notification_type === 'board_activity') {
		const parts: string[] = [];
		const summary = activity_summary || [];

		// Cards created
		if (summary.cards_created) {
			const types = Object.entries(summary.cards_created)
				.map(([type, count]: [string, any]) => `${count} ${type} card${count > 1 ? 's' : ''}`)
				.join(', ');
			parts.push(`added ${types}`);
		}

		// Cards updated
		if (summary.cards_updated) {
			const total = Object.values(summary.cards_updated).reduce((a: any, b: any) => a + b, 0);
			parts.push(`updated ${total} card${total > 1 ? 's' : ''}`)
		}

		return `${actorText} ${parts.join(' and ')}`;
	}

	if (notification_type === 'collaborator_added') {
		return `${actorText} added you as a ${activity_summary.role || 'collaborator'}`;
	}

	return 'New activity';
}