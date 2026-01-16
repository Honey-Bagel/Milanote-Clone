'use client';

import { Bell } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/lib/hooks/use-notifications";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from './notification-dropdown';
import { cn } from "@/lib/utils";

export function NotificationBell() {
	const [isOpen, setIsOpen] = useState(false);
	const { unreadCount } = useNotifications();

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<button
					className="relative p-2 hover:bg-white/5 rounded-lg transition-colors"
					aria-label="Notifications"
				>
					<Bell size={20} className="text-secondary-foreground" />
					{unreadCount > 0 && (
						<span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
							{unreadCount > 9 ? '9+' : unreadCount}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-96 p-0">
				<NotificationDropdown />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}