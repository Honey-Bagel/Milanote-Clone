'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Shield, Key, Smartphone, Monitor, ChevronRight, Activity } from 'lucide-react';
import { ChangePasswordModal } from './modals/change-password-modal';
import { SessionsModal } from './modals/sessions-modal';
import { Manage2FAModal } from './modals/manage-2fa-modal';

export function SecuritySection() {
	const { user } = useUser();

	// Modal state
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showSessionsModal, setShowSessionsModal] = useState(false);
	const [show2FAModal, setShow2FAModal] = useState(false);

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
					onClick={() => setShowPasswordModal(true)}
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
						onClick={() => setShow2FAModal(true)}
						className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
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
					onClick={() => setShowSessionsModal(true)}
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

			{/* Security Activity Section */}
			<div className="space-y-4">
				<h4 className="text-lg font-semibold text-white flex items-center gap-2">
					<Activity size={18} className="text-primary" />
					Security Activity
				</h4>
				<div className="space-y-3">
					<div className="flex justify-between items-center p-3 bg-[#020617] border border-white/10 rounded-lg">
						<span className="text-sm text-secondary-foreground">Last sign in</span>
						<span className="text-sm text-foreground font-medium">
							{user?.lastSignInAt
								? new Date(user.lastSignInAt).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})
								: 'N/A'
							}
						</span>
					</div>
					<div className="flex justify-between items-center p-3 bg-[#020617] border border-white/10 rounded-lg">
						<span className="text-sm text-secondary-foreground">Password protection</span>
						<span className="text-sm text-foreground font-medium">
							{user?.passwordEnabled ? 'Enabled' : 'Disabled'}
						</span>
					</div>
					<div className="flex justify-between items-center p-3 bg-[#020617] border border-white/10 rounded-lg">
						<span className="text-sm text-secondary-foreground">Account created</span>
						<span className="text-sm text-foreground font-medium">
							{user?.createdAt
								? new Date(user.createdAt).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								})
								: 'N/A'
							}
						</span>
					</div>
				</div>
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
						<div className={`w-2 h-2 rounded-full mt-1.5 ${
							user?.passwordEnabled ? 'bg-green-500' : 'bg-yellow-500'
						}`} />
						<div className="flex-1">
							<div className="text-sm text-white font-medium">
								{user?.passwordEnabled ? 'Password protection enabled' : 'Enable password protection'}
							</div>
							<div className="text-xs text-secondary-foreground mt-1">
								{user?.passwordEnabled
									? 'Your account is protected with a password'
									: 'Set up a password for additional security'}
							</div>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 bg-[#020617] rounded-lg">
						<div className={`w-2 h-2 rounded-full mt-1.5 ${
							user?.primaryEmailAddress?.verification?.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'
						}`} />
						<div className="flex-1">
							<div className="text-sm text-white font-medium">
								{user?.primaryEmailAddress?.verification?.status === 'verified' ? 'Email verified' : 'Verify your email'}
							</div>
							<div className="text-xs text-secondary-foreground mt-1">
								{user?.primaryEmailAddress?.verification?.status === 'verified'
									? 'Your email address has been verified'
									: 'Verify your email to secure your account'}
							</div>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 bg-[#020617] rounded-lg">
						<div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
						<div className="flex-1">
							<div className="text-sm text-white font-medium">Regular security checkups</div>
							<div className="text-xs text-secondary-foreground mt-1">
								Review your active sessions and security settings regularly
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Modals */}
			<ChangePasswordModal
				isOpen={showPasswordModal}
				onClose={() => setShowPasswordModal(false)}
			/>
			<SessionsModal
				isOpen={showSessionsModal}
				onClose={() => setShowSessionsModal(false)}
			/>
			<Manage2FAModal
				isOpen={show2FAModal}
				onClose={() => setShow2FAModal(false)}
			/>
		</div>
	);
}
