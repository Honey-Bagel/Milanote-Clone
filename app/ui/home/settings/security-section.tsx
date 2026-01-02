'use client';

import { useUser } from '@clerk/nextjs';
import { Shield, Key, Smartphone, Monitor, ChevronRight } from 'lucide-react';

export function SecuritySection() {
	const { user } = useUser();

	const handleChangePassword = () => {
		// Trigger Clerk's password change flow
		// This can be done by navigating to Clerk's account portal or using their modal
		window.open('https://accounts.clerk.dev', '_blank');
	};

	const handleManage2FA = () => {
		// Trigger Clerk's 2FA management
		window.open('https://accounts.clerk.dev', '_blank');
	};

	const handleManageSessions = () => {
		// Trigger Clerk's session management
		window.open('https://accounts.clerk.dev', '_blank');
	};

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-2xl font-bold text-white mb-2">Security</h3>
				<p className="text-sm text-secondary-foreground">Manage your account security and authentication</p>
			</div>

			{/* Password Section */}
			<div className="space-y-4">
				<h4 className="text-lg font-semibold text-white flex items-center gap-2">
					<Key size={18} className="text-primary" />
					Password
				</h4>
				<button
					onClick={handleChangePassword}
					className="w-full flex items-center justify-between p-4 bg-[#020617] border border-white/10 rounded-xl hover:border-white/20 transition-all group"
				>
					<div className="text-left">
						<div className="font-medium text-sm text-white group-hover:text-primary transition-colors">
							Change Password
						</div>
						<div className="text-xs text-secondary-foreground mt-1">
							Update your account password
						</div>
					</div>
					<ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={18} />
				</button>
			</div>

			{/* Two-Factor Authentication */}
			<div className="space-y-4">
				<h4 className="text-lg font-semibold text-white flex items-center gap-2">
					<Smartphone size={18} className="text-primary" />
					Two-Factor Authentication
				</h4>
				<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
					<div className="flex items-center justify-between mb-3">
						<div>
							<div className="font-medium text-sm text-white">2FA Status</div>
							<div className="text-xs text-secondary-foreground mt-1">
								{user?.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
							</div>
						</div>
						<div className={`px-3 py-1 rounded-lg text-xs font-medium ${
							user?.twoFactorEnabled
								? 'bg-green-500/20 text-green-400'
								: 'bg-slate-500/20 text-secondary-foreground'
						}`}>
							{user?.twoFactorEnabled ? 'Active' : 'Inactive'}
						</div>
					</div>
					<button
						onClick={handleManage2FA}
						className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-medium text-sm"
					>
						{user?.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
					</button>
				</div>
				<p className="text-xs text-muted-foreground">
					Add an extra layer of security to your account with two-factor authentication
				</p>
			</div>

			{/* Active Sessions */}
			<div className="space-y-4">
				<h4 className="text-lg font-semibold text-white flex items-center gap-2">
					<Monitor size={18} className="text-primary" />
					Active Sessions
				</h4>
				<button
					onClick={handleManageSessions}
					className="w-full flex items-center justify-between p-4 bg-[#020617] border border-white/10 rounded-xl hover:border-white/20 transition-all group"
				>
					<div className="text-left">
						<div className="font-medium text-sm text-white group-hover:text-primary transition-colors">
							Manage Sessions
						</div>
						<div className="text-xs text-secondary-foreground mt-1">
							View and manage active sessions across devices
						</div>
					</div>
					<ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={18} />
				</button>
			</div>

			{/* Security Recommendations */}
			<div className="pt-6 border-t border-white/10">
				<h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
					<Shield size={18} className="text-primary" />
					Security Recommendations
				</h4>
				<div className="space-y-3">
					<div className="flex items-start gap-3 p-3 bg-[#020617] rounded-lg">
						<div className={`w-2 h-2 rounded-full mt-1.5 ${
							user?.twoFactorEnabled ? 'bg-green-500' : 'bg-yellow-500'
						}`} />
						<div className="flex-1">
							<div className="text-sm text-white font-medium">
								{user?.twoFactorEnabled ? 'Two-factor authentication enabled' : 'Enable two-factor authentication'}
							</div>
							<div className="text-xs text-secondary-foreground mt-1">
								{user?.twoFactorEnabled
									? 'Your account is protected with 2FA'
									: 'Add an extra layer of security to your account'}
							</div>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 bg-[#020617] rounded-lg">
						<div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
						<div className="flex-1">
							<div className="text-sm text-white font-medium">Strong password in use</div>
							<div className="text-xs text-secondary-foreground mt-1">
								Your password meets security requirements
							</div>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 bg-[#020617] rounded-lg">
						<div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
						<div className="flex-1">
							<div className="text-sm text-white font-medium">Email verified</div>
							<div className="text-xs text-secondary-foreground mt-1">
								Your email address has been verified
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
