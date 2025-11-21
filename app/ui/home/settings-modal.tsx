'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Settings as SettingsIcon, LogOut, Bell, Palette, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeSwitcherList } from '@/components/ui/theme-switcher';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type TabType = 'profile' | 'preferences' | 'account';

interface UserProfile {
	id: string;
	email: string;
	display_name: string | null;
	avatar_url: string | null;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const [activeTab, setActiveTab] = useState<TabType>('profile');
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
	const router = useRouter();
	const supabase = createClient();
	const modalRef = useRef<HTMLDivElement | null>(null);

	// Form states
	const [displayName, setDisplayName] = useState('');
	const [avatarUrl, setAvatarUrl] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	useEffect(() => {

		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		}

		if (isOpen) {
			fetchUserProfile();
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const fetchUserProfile = async () => {
		setLoading(true);
		try {
			const { data: { user }, error: userError } = await supabase.auth.getUser();
			
			if (userError) throw userError;
			if (!user) throw new Error('No user found');

			// Fetch user metadata
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single();

			const userProfile: UserProfile = {
				id: user.id,
				email: user.email || '',
				display_name: profile?.display_name || user.user_metadata?.full_name || null,
				avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
			};

			setUserProfile(userProfile);
			setDisplayName(userProfile.display_name || '');
			setAvatarUrl(userProfile.avatar_url || '');
		} catch (error) {
			console.error('Error fetching profile:', error);
			showMessage('error', 'Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	const showMessage = (type: 'success' | 'error', text: string) => {
		setMessage({ type, text });
		setTimeout(() => setMessage(null), 3000);
	};

	const handleSaveProfile = async () => {
		setSaving(true);
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error('No user found');

			// Update profile table if it exists
			const { error: profileError } = await supabase
				.from('profiles')
				.upsert({
					id: user.id,
					display_name: displayName,
					avatar_url: avatarUrl,
					updated_at: new Date().toISOString(),
				});

			if (profileError) {
				console.error('Profile update error:', profileError);
			}

			// Update auth metadata
			const { error: metadataError } = await supabase.auth.updateUser({
				data: {
					display_name: displayName,
					avatar_url: avatarUrl,
				},
			});

			if (metadataError) throw metadataError;

			showMessage('success', 'Profile updated successfully!');
			await fetchUserProfile();
		} catch (error) {
			console.error('Error updating profile:', error);
			showMessage('error', 'Failed to update profile');
		} finally {
			setSaving(false);
		}
	};

	const handleChangePassword = async () => {
		if (newPassword !== confirmPassword) {
			showMessage('error', 'Passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			showMessage('error', 'Password must be at least 6 characters');
			return;
		}

		setSaving(true);
		try {
			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) throw error;

			showMessage('success', 'Password changed successfully!');
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
		} catch (error) {
			console.error('Error changing password:', error);
			showMessage('error', 'Failed to change password');
		} finally {
			setSaving(false);
		}
	};

	const handleLogout = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			
			router.push('/auth');
		} catch (error) {
			console.error('Error logging out:', error);
			showMessage('error', 'Failed to log out');
		}
	};

	const handleDeleteAccount = async () => {
		const confirmed = window.confirm(
			'Are you sure you want to delete your account? This action cannot be undone and will delete all your boards and cards.'
		);

		if (!confirmed) return;

		const doubleConfirm = window.confirm(
			'This is your last warning. All your data will be permanently deleted. Are you absolutely sure?'
		);

		if (!doubleConfirm) return;

		setSaving(true);
		try {
			// Delete user's boards and cards (cascade should handle this)
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error('No user found');

			// Delete from auth (this should cascade to other tables)
			const { error } = await supabase.auth.admin.deleteUser(user.id);
			
			if (error) throw error;

			router.push('/login');
		} catch (error) {
			console.error('Error deleting account:', error);
			showMessage('error', 'Failed to delete account. Please contact support.');
		} finally {
			setSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
			<div ref={modalRef} className="bg-[var(--background)] rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
					<h2 className="text-2xl font-bold text-[var(--foreground)]">Settings</h2>
					<button
						onClick={onClose}
						className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Message Banner */}
				{message && (
					<div className={`px-6 py-3 ${message.type === 'success' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-red-500/10 text-red-500'}`}>
						<p className="text-sm font-medium">{message.text}</p>
					</div>
				)}

				<div className="flex flex-1 overflow-hidden">
					{/* Sidebar Tabs */}
					<div className="w-48 bg-[var(--secondary)] border-r border-[var(--border)] p-4">
						<nav className="space-y-1">
							<button
								onClick={() => setActiveTab('profile')}
								className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === 'profile'
										? 'bg-[var(--primary)]/20 text-[var(--primary)]'
										: 'text-[var(--foreground)] hover:bg-[var(--card-hover)]'
								}`}
							>
								<User className="w-4 h-4" />
								Profile
							</button>
							<button
								onClick={() => setActiveTab('preferences')}
								className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === 'preferences'
										? 'bg-[var(--primary)]/20 text-[var(--primary)]'
										: 'text-[var(--foreground)] hover:bg-[var(--card-hover)]'
								}`}
							>
								<Palette className="w-4 h-4" />
								Preferences
							</button>
							<button
								onClick={() => setActiveTab('account')}
								className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === 'account'
										? 'bg-[var(--primary)]/20 text-[var(--primary)]'
										: 'text-[var(--foreground)] hover:bg-[var(--card-hover)]'
								}`}
							>
								<Lock className="w-4 h-4" />
								Account
							</button>
						</nav>

						<div className="mt-8 pt-4 border-t border-[var(--border)]">
							<button
								onClick={handleLogout}
								className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
							>
								<LogOut className="w-4 h-4" />
								Log Out
							</button>
						</div>
					</div>

					{/* Content Area */}
					<div className="flex-1 overflow-y-auto p-6">
						{loading ? (
							<div className="flex items-center justify-center h-64">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
							</div>
						) : (
							<>
								{/* Profile Tab */}
								{activeTab === 'profile' && (
									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Profile Information</h3>
											
											{/* Avatar */}
											<div className="mb-6">
												<div className="flex flex-row space-x-6">
													<div className="flex flex-col">
														<label className="block text-sm font-medium text-[var(--foreground)] mb-2">
															Profile Picture
														</label>
														<div className="flex items-center gap-4">
															<div className="w-20 h-20 rounded-full bg-[var(--secondary)] flex items-center justify-center overflow-hidden">
																{avatarUrl ? (
																	<Image src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
																) : (
																	<User className="w-10 h-10 text-[var(--muted)]" />
																)}
															</div>
														</div>
													</div>

													<div className="flex flex-col">
														{/* Display Name */}
														<div className="flex flex-col">
															<label className="block text-sm font-medium text-[var(--foreground)] mb-2">
																Display Name
															</label>
															<Input
																type="text"
																value={displayName}
																onChange={(e) => setDisplayName(e.target.value)}
															/>
														</div>
													</div>
												</div>
											</div>

											{/* Email (Read-only) */}
											<div className="mb-4">
												<label className="block text-sm font-medium text-[var(--foreground)] mb-2">
													Email
												</label>
												<input
													type="email"
													value={userProfile?.email || ''}
													disabled
													className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] rounded-lg cursor-not-allowed"
												/>
												<p className="text-xs text-[var(--muted)] mt-1">Email cannot be changed</p>
											</div>

											<button
												onClick={handleSaveProfile}
												disabled={saving}
												className="px-4 py-2 bg-[var(--primary)] text-[var(--foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
											>
												{saving ? 'Saving...' : 'Save Changes'}
											</button>
										</div>
									</div>
								)}

								{/* Preferences Tab */}
								{activeTab === 'preferences' && (
									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Preferences</h3>

											{/* Theme */}
											<div className="mb-6">
												<label className="block text-sm font-medium text-[var(--foreground)] mb-2">
													Theme
												</label>
												<ThemeSwitcherList />
											</div>

											{/* Notifications */}
											<div className="mb-6">
												<label className="block text-sm font-medium text-[var(--foreground)] mb-2">
													Notifications
												</label>
												<div className="space-y-3">
													<label className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)]">
														<div>
															<div className="font-medium text-sm text-[var(--foreground)]">Email Notifications</div>
															<div className="text-xs text-[var(--muted)]">Receive updates via email</div>
														</div>
														<input type="checkbox" defaultChecked className="rounded" style={{ accentColor: 'var(--primary)' }} />
													</label>
													<label className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)]">
														<div>
															<div className="font-medium text-sm text-[var(--foreground)]">Board Activity</div>
															<div className="text-xs text-[var(--muted)]">Get notified of board changes</div>
														</div>
														<input type="checkbox" defaultChecked className="rounded" style={{ accentColor: 'var(--primary)' }} />
													</label>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Account Tab */}
								{activeTab === 'account' && (
									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Account Security</h3>

											{/* Change Password */}
											<div className="mb-6">
												<label className="block text-sm font-medium text-[var(--foreground)] mb-2">
													Change Password
												</label>
												<div className="space-y-3">
													<input
														type="password"
														value={newPassword}
														onChange={(e) => setNewPassword(e.target.value)}
														placeholder="New password"
														className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent outline-none"
													/>
													<input
														type="password"
														value={confirmPassword}
														onChange={(e) => setConfirmPassword(e.target.value)}
														placeholder="Confirm new password"
														className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent outline-none"
													/>
													<button
														onClick={handleChangePassword}
														disabled={saving || !newPassword || !confirmPassword}
														className="px-4 py-2 bg-[var(--primary)] text-[var(--foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
													>
														{saving ? 'Changing...' : 'Change Password'}
													</button>
												</div>
											</div>
										</div>

										{/* Danger Zone */}
										<div className="pt-6 border-t border-[var(--border)]">
											<h3 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h3>

											<div className="p-4 border-2 border-red-500/30 rounded-lg bg-red-500/10">
												<h4 className="font-medium text-red-500 mb-2">Delete Account</h4>
												<p className="text-sm text-[var(--foreground)] opacity-80 mb-4">
													Once you delete your account, there is no going back. All your boards, cards, and data will be permanently deleted.
												</p>
												<button
													onClick={handleDeleteAccount}
													className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
												>
													Delete My Account
												</button>
											</div>
										</div>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}