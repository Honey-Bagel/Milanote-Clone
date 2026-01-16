'use client';

import { useState } from 'react';
import { useLinkedAccounts } from '@/lib/hooks/use-linked-account';
import { CheckCircle, Loader2 } from 'lucide-react';
import { db } from "@/lib/instant/db";
import { FaGoogleDrive } from "react-icons/fa";
import { AccountCardSkeleton } from './settings-section-skeleton';

export function ConnectedAccountsSection() {
	const { user } = db.useAuth();
	const { accounts, isLoading } = useLinkedAccounts();
	const [isConnecting, setIsConnecting] = useState<string | null>(null);

	const googleDrive = accounts?.find(a => a.provider === 'google_drive' && a.is_active);
	const pinterest = accounts?.find(a => a.provider === 'pinterest' && a.is_active);

	const handleConnect = (provider: 'google-drive' | 'pinterest') => {
		if (!user) {
			alert('Please sign in first');
			return;
		}
		setIsConnecting(provider);
		window.location.href = `/api/oauth/${provider}/authorize?userId=${user.id}`;
	};

	const handleDisconnect = async (accountId: string) => {
		if (!confirm('Disconnect this account?')) return;

		await fetch('/api/oauth/disconnect', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ accountId }),
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h3 className="text-xl font-semibold text-white mb-2">Connected Accounts</h3>
					<p className="text-sm text-slate-400">
						Connect external services to import content
					</p>
				</div>
				<AccountCardSkeleton />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-xl font-semibold text-white mb-2">Connected Accounts</h3>
				<p className="text-sm text-slate-400">
					Connect external services to import content
				</p>
			</div>

			{/* Google Drive */}
			<div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded flex items-center justify-center">
						<FaGoogleDrive size={36}/>
					</div>
					<div>
						<div className="font-medium text-white">Google Drive</div>
						{googleDrive ? (
							<div className="flex items-center gap-2 text-sm text-green-400">
								<CheckCircle size={14} />
								Connected as {googleDrive.provider_email}
							</div>
						) : (
							<div className="text-sm text-slate-400">Import files from Drive</div>
						)}
					</div>
				</div>

				{googleDrive ? (
					<button
						onClick={() => handleDisconnect(googleDrive.id)}
						className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
					>
						Disconnect
					</button>
				) : (
					<button
						onClick={() => handleConnect('google-drive')}
						disabled={isConnecting === 'google_drive'}
						className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
					>
						{isConnecting === 'google_drive' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
					</button>
				)}
			</div>

			{/* Pinterest (similar structure) */}
		</div>
	)
}