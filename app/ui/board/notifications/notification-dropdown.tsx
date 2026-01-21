"use client";

import { useNotifications } from "@/lib/hooks/use-notifications";
import { NotificationItem } from './notification-item';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function NotificationDropdown() {
	const { notifications, isLoading, markAllAsRead } = useNotifications();

	return (
		<div className="flex flex-col max-h-[500px]">
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#0f172a]">
				<h3 className="font-semibold text-white">Notifications</h3>
				{notifications.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={markAllAsRead}
						className="text-xs text-secondary-foreground hover:text-white"
					>
						Mark all read
					</Button>
				)}
			</div>

			{/* Notification List */}
			<div className="overflow-y-auto">
				{isLoading ? (
					<div className="p-8 text-center-foreground">
						Loading...
					</div>
				) : notifications.length === 0 ? (
					<div className="p-8 text-center text-secondary-foreground">
						<Bell size={48} className="mx-auto mb-2 opacity-20" />
						<p>No notifications yet</p>
					</div>
				) : (
					notifications.map((notification: any) => (
						<NotificationItem key={notification.id} notification={notification} />
					))
				)}
			</div>
		</div>
	);
}