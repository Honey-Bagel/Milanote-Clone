'use client';

import { useState, useEffect } from 'react';
import { X, User, Settings as SettingsIcon, LogOut, Bell, Palette, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from '@/components/ui/theme-switched';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type TabType = 'profile' | 'preferences' | 'account';

interface UserProfile {
	id: string;
	email: string;
	full_name: string | null;
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

	// Form states
	const [fullName, setFullName] = useState('');
	const [avatarUrl, setAvatarUrl] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	useEffect(() => {
		if (isOpen) {
			fetchUserProfile();
		}
	}, [isOpen]);

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
				full_name: profile?.full_name || user.user_metadata?.full_name || null,
				avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
			};

			setUserProfile(userProfile);
			setFullName(userProfile.full_name || '');
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
					full_name: fullName,
					avatar_url: avatarUrl,
					updated_at: new Date().toISOString(),
				});

			if (profileError) {
				console.error('Profile update error:', profileError);
			}

			// Update auth metadata
			const { error: metadataError } = await supabase.auth.updateUser({
				data: {
					full_name: fullName,
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
			
			router.push('/login');
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-2xl font-bold text-gray-900">Settings</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Message Banner */}
				{message && (
					<div className={`px-6 py-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
						<p className="text-sm font-medium">{message.text}</p>
					</div>
				)}

				<div className="flex flex-1 overflow-hidden">
					{/* Sidebar Tabs */}
					<div className="w-48 bg-gray-50 border-r border-gray-200 p-4">
						<nav className="space-y-1">
							<button
								onClick={() => setActiveTab('profile')}
								className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === 'profile'
										? 'bg-blue-100 text-blue-700'
										: 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<User className="w-4 h-4" />
								Profile
							</button>
							<button
								onClick={() => setActiveTab('preferences')}
								className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === 'preferences'
										? 'bg-blue-100 text-blue-700'
										: 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<Palette className="w-4 h-4" />
								Preferences
							</button>
							<button
								onClick={() => setActiveTab('account')}
								className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									activeTab === 'account'
										? 'bg-blue-100 text-blue-700'
										: 'text-gray-700 hover:bg-gray-100'
								}`}
							>
								<Lock className="w-4 h-4" />
								Account
							</button>
						</nav>

						<div className="mt-8 pt-4 border-t border-gray-200">
							<button
								onClick={handleLogout}
								className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							</div>
						) : (
							<>
								{/* Profile Tab */}
								{activeTab === 'profile' && (
									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
											
											{/* Avatar */}
											<div className="mb-6">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Profile Picture
												</label>
												<div className="flex items-center gap-4">
													<div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
														{avatarUrl ? (
															<img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
														) : (
															<User className="w-10 h-10 text-gray-400" />
														)}
													</div>
													<div className="flex-1">
														<input
															type="url"
															value={avatarUrl}
															onChange={(e) => setAvatarUrl(e.target.value)}
															placeholder="https://example.com/avatar.jpg"
															className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
														/>
														<p className="text-xs text-gray-500 mt-1">Enter a URL for your profile picture</p>
													</div>
												</div>
											</div>

											{/* Full Name */}
											<div className="mb-4">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Full Name
												</label>
												<input
													type="text"
													value={fullName}
													onChange={(e) => setFullName(e.target.value)}
													placeholder="Enter your name"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
												/>
											</div>

											{/* Email (Read-only) */}
											<div className="mb-4">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Email
												</label>
												<input
													type="email"
													value={userProfile?.email || ''}
													disabled
													className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
												/>
												<p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
											</div>

											<button
												onClick={handleSaveProfile}
												disabled={saving}
												className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
											<h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
											
											{/* Theme */}
											<div className="mb-6">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Theme
												</label>
												<ThemeSwitcher />
											</div>

											{/* Notifications */}
											<div className="mb-6">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Notifications
												</label>
												<div className="space-y-3">
													<label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
														<div>
															<div className="font-medium text-sm">Email Notifications</div>
															<div className="text-xs text-gray-500">Receive updates via email</div>
														</div>
														<input type="checkbox" defaultChecked className="text-blue-600 rounded" />
													</label>
													<label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
														<div>
															<div className="font-medium text-sm">Board Activity</div>
															<div className="text-xs text-gray-500">Get notified of board changes</div>
														</div>
														<input type="checkbox" defaultChecked className="text-blue-600 rounded" />
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
											<h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
											
											{/* Change Password */}
											<div className="mb-6">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Change Password
												</label>
												<div className="space-y-3">
													<input
														type="password"
														value={newPassword}
														onChange={(e) => setNewPassword(e.target.value)}
														placeholder="New password"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
													/>
													<input
														type="password"
														value={confirmPassword}
														onChange={(e) => setConfirmPassword(e.target.value)}
														placeholder="Confirm new password"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
													/>
													<button
														onClick={handleChangePassword}
														disabled={saving || !newPassword || !confirmPassword}
														className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
													>
														{saving ? 'Changing...' : 'Change Password'}
													</button>
												</div>
											</div>
										</div>

										{/* Danger Zone */}
										<div className="pt-6 border-t border-gray-200">
											<h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
											
											<div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
												<h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
												<p className="text-sm text-red-700 mb-4">
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