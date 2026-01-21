'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';

interface DrawerSettingsMenuProps {
	autoClose: boolean;
	onAutoCloseChange: (value: boolean) => void;
}

export function DrawerSettingsMenu({ autoClose, onAutoCloseChange }: DrawerSettingsMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className="p-1.5 hover:bg-slate-800 rounded transition-colors"
					aria-label="Drawer settings"
				>
					<Settings size={16} className="text-slate-400" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuItem
					onClick={() => onAutoCloseChange(!autoClose)}
					className="cursor-pointer"
				>
					<div className="flex items-center gap-2 w-full">
						<input
							type="checkbox"
							checked={autoClose}
							readOnly
							className="pointer-events-none"
						/>
						<span className="text-sm">Auto-close when clicking outside</span>
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
