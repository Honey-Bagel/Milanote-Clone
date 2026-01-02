'use client';

import { useState } from 'react';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon, Settings, HelpCircle, Keyboard, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, useUser } from "@clerk/nextjs";
import SettingsModal from '../home/settings-modal';

export default function UserMenu() {
	const { user, isLoaded } = useUser();
	const { signOut } = useAuth();
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	
	if (!isLoaded || !user) {
		return <div></div>
	}

	const avatarUrl = user.imageUrl;

	return (
		<>
		<DropdownMenu.Root>
			{/* Trigger Button (Avatar) */}
			<DropdownMenu.Trigger asChild>
				<button className="hover:ring-2 hover:ring-primary/50 rounded-full transition-all">
					<Avatar>
						<AvatarImage src={avatarUrl} />
						<AvatarFallback className="bg-primary text-white font-medium">
							{user.username
								?.split(' ')
								?.map((word: string) => word[0])
								?.join('')
								?.toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenu.Trigger>

			{/* Dropdown Content */}
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="min-w-[280px] bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl py-2 text-foreground animate-in fade-in-0 zoom-in-95 z-50 backdrop-blur-xl"
					sideOffset={8}
					align="end"
				>
					{/* Account Section */}
					<div className="px-4 py-3 border-b border-white/10">
						<DropdownMenu.Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-bold">
							Account
						</DropdownMenu.Label>
						<div className="flex items-center gap-3">
							<Avatar className="w-10 h-10">
								<AvatarImage src={avatarUrl} />
								<AvatarFallback className="bg-primary text-white font-medium">
									{user?.username
										?.split(' ')
										?.map((word: string) => word[0])
										?.join('')
										?.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-semibold text-sm text-white">{user.username}</p>
								<p className="text-xs text-secondary-foreground">{user.primaryEmailAddress?.toString() || user.emailAddresses[0].toString()}</p>
							</div>
						</div>
					</div>

					{/* Manage Account */}
					<DropdownMenu.Item className="relative flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-sm outline-none hover:bg-white/5 focus:bg-white/5 rounded-lg mx-2 my-1 transition-colors">
						<div className="flex items-center gap-3">
							<User size={16} className="text-secondary-foreground" />
							<span className="text-foreground">Manage account</span>
						</div>
						<ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
					</DropdownMenu.Item>

					<DropdownMenu.Separator className="h-px bg-white/10 my-2" />

					{/* Settings */}
					<DropdownMenu.Item
						onClick={() => setIsSettingsModalOpen(true)}
						className="relative flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 text-sm outline-none hover:bg-white/5 focus:bg-white/5 rounded-lg mx-2 my-1 transition-colors">
						<Settings size={16} className="text-secondary-foreground" />
						<span className="text-foreground">Settings</span>
					</DropdownMenu.Item>

					{/* Theme Submenu */}
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger className="relative flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-sm outline-none hover:bg-white/5 focus:bg-white/5 data-[state=open]:bg-white/5 rounded-lg mx-2 my-1 transition-colors">
							<div className="flex items-center gap-3">
								<div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-primary" />
								<span className="text-foreground">Theme</span>
							</div>
							<ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
						</DropdownMenu.SubTrigger>
						<DropdownMenu.Portal>
							<DropdownMenu.SubContent
								className="min-w-[200px] bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl py-2 text-foreground animate-in fade-in-0 zoom-in-95"
								sideOffset={12}
							>
								<DropdownMenu.Item className="relative flex cursor-pointer select-none items-center px-4 py-2.5 text-sm outline-none hover:bg-white/5 focus:bg-white/5 rounded-lg mx-2 my-1 transition-colors text-foreground">
									Light
								</DropdownMenu.Item>
								<DropdownMenu.Item className="relative flex cursor-pointer select-none items-center px-4 py-2.5 text-sm outline-none hover:bg-white/5 focus:bg-white/5 rounded-lg mx-2 my-1 transition-colors text-foreground">
									Dark
								</DropdownMenu.Item>
								<DropdownMenu.Item className="relative flex cursor-pointer select-none items-center px-4 py-2.5 text-sm outline-none hover:bg-white/5 focus:bg-white/5 rounded-lg mx-2 my-1 transition-colors text-foreground">
									System
								</DropdownMenu.Item>
							</DropdownMenu.SubContent>
						</DropdownMenu.Portal>
					</DropdownMenu.Sub>

					<DropdownMenu.Separator className="h-px bg-white/10 my-2" />

					{/* Help */}
					<DropdownMenu.Item className="relative flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 text-sm outline-none hover:bg-white/5 focus:bg-white/5 rounded-lg mx-2 my-1 transition-colors">
						<HelpCircle size={16} className="text-secondary-foreground" />
						<span className="text-foreground">Help</span>
					</DropdownMenu.Item>

					{/* Shortcuts */}
					<DropdownMenu.Item className="relative flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 text-sm outline-none hover:bg-white/5 focus:bg-white/5 rounded-lg mx-2 my-1 transition-colors">
						<Keyboard size={16} className="text-secondary-foreground" />
						<span className="text-foreground">Shortcuts</span>
					</DropdownMenu.Item>

					<DropdownMenu.Separator className="h-px bg-white/10 my-2" />

					{/* Log out */}
					<DropdownMenu.Item 
						onClick={() => signOut({ redirectUrl: "/auth" })}
						className="relative flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 text-sm outline-none hover:bg-red-500/10 focus:bg-red-500/10 rounded-lg mx-2 my-1 transition-colors text-red-400 hover:text-red-300"
					>
						<LogOut size={16} />
						<span>Log out</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>

		{/* Settings Modal */}
		<SettingsModal
			isOpen={isSettingsModalOpen}
			onClose={() => setIsSettingsModalOpen(false)}
		/>
	</>
	)
}