'use client';

import { ChevronDown } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import type { OAuthProvider } from '@/lib/types';

// Provider configuration with display info
const PROVIDER_CONFIG: Record<OAuthProvider, { name: string; icon: string }> = {
	google_drive: { name: 'Google Drive', icon: '📁' },
	pinterest: { name: 'Pinterest', icon: '📌' },
};

// Account type that matches what we receive from the hook
interface AccountInfo {
	provider: string;
	is_active: boolean;
}

interface ProviderDropdownProps {
	activeProvider: OAuthProvider;
	accounts: AccountInfo[];
	onProviderChange: (provider: OAuthProvider) => void;
}

export function ProviderDropdown({
	activeProvider,
	accounts,
	onProviderChange,
}: ProviderDropdownProps) {
	// Filter to only show providers that have active linked accounts
	const availableProviders = (Object.keys(PROVIDER_CONFIG) as OAuthProvider[]).filter(
		(provider) => accounts.some((a) => a.provider === provider && a.is_active)
	);

	const currentProviderConfig = PROVIDER_CONFIG[activeProvider];

	// If no providers are available, show a disabled state
	if (availableProviders.length === 0) {
		return (
			<div className="flex items-center gap-2 text-slate-400 text-sm">
				<span>No connected services</span>
			</div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-left">
					<span>{currentProviderConfig.icon}</span>
					<span className="text-white font-medium text-sm">{currentProviderConfig.name}</span>
					<ChevronDown size={14} className="text-slate-400" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-56 bg-[#0f172a] border-white/10 text-foreground"
			>
				<DropdownMenuRadioGroup
					value={activeProvider}
					onValueChange={(value) => onProviderChange(value as OAuthProvider)}
				>
					{availableProviders.map((provider) => {
						const config = PROVIDER_CONFIG[provider];
						return (
							<DropdownMenuRadioItem
								key={provider}
								value={provider}
								className="focus:bg-white/5 focus:text-white cursor-pointer"
							>
								<span className="mr-2">{config.icon}</span>
								{config.name}
							</DropdownMenuRadioItem>
						);
					})}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
