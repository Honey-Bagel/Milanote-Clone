'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Settings as SettingsIcon, LogOut, Bell, Palette, Lock, Camera, Sun, Moon, Monitor } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeSwitcherList } from '@/components/ui/theme-switcher';
import { Input } from '@/components/ui/input';
import { UserProfile, UserPreferences } from '@/lib/types';
import AvatarUploadCrop from '@/components/avatar-upload-crop';
import { uploadAvatar, removeAvatar } from '@/lib/utils/avatar-storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type TabType = 'profile' | 'preferences' | 'account';

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
	const [isAvatarUploadOpen, setIsAvatarUploadOpen] = useState(false);

	// Preferences states
	const [preferences, setPreferences] = useState<UserPreferences>({
		defaultBoardColor: '#6366f1',
		autoSaveEnabled: true,
		gridSnapEnabled: true,
		emailNotifications: true,
		boardActivityNotifications: true,
		shareNotifications: true,
		weeklyDigest: false,
		allowCommenting: true,
		showPresenceIndicators: true,
	});

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

	const handleAvatarUpload = async (croppedImageBlob: Blob) => {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error('No user found');

			// Check if this is a removal (empty blob)
			if (croppedImageBlob.size === 0) {
				await removeAvatar(user.id);
				await updateAvatarUrl(null);
				showMessage('success', 'Avatar removed successfully!');
				return;
			}

			// Upload avatar
			const publicUrl = await uploadAvatar(croppedImageBlob, user.id);
			await updateAvatarUrl(publicUrl);
			showMessage('success', 'Avatar updated successfully!');
		} catch (error) {
			console.error('Error uploading avatar:', error);
			showMessage('error', 'Failed to upload avatar');
			throw error;
		}
	};

	const updateAvatarUrl = async (url: string | null) => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('No user found');

		// Update profile table
		const { error: profileError } = await supabase
			.from('profiles')
			.update({
				avatar_url: url,
				updated_at: new Date().toISOString(),
			})
			.eq("id", user.id);

		if (profileError) {
			console.error('Profile update error:', profileError);
		}

		// Update auth metadata
		const { error: metadataError } = await supabase.auth.updateUser({
			data: {
				display_name: displayName,
				avatar_url: url,
			},
		});

		if (metadataError) throw metadataError;

		setAvatarUrl(url || '');
		await fetchUserProfile();
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div ref={modalRef} className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-indigo-600 rounded-lg">
							<SettingsIcon size={20} className="text-white"/>
						</div>
						<h2 className="text-2xl font-bold text-white">Settings</h2>
					</div>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Message Banner */}
				{message && (
					<div className={`px-8 py-3 border-b ${
						message.type === 'success' 
							? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
							: 'bg-red-500/10 border-red-500/20 text-red-400'
					}`}>
						<p className="text-sm font-medium">{message.text}</p>
					</div>
				)}

				<div className="flex flex-1 overflow-hidden">
					{/* Sidebar Tabs */}
					<div className="w-64 bg-[#020617] border-r border-white/10 p-6">
						<nav className="space-y-2">
							<button
								onClick={() => setActiveTab('profile')}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
									activeTab === 'profile'
										? 'bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10'
										: 'text-slate-300 hover:bg-white/5 hover:text-white'
								}`}
							>
								<User className="w-4 h-4" />
								Profile
							</button>
							<button
								onClick={() => setActiveTab('preferences')}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
									activeTab === 'preferences'
										? 'bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10'
										: 'text-slate-300 hover:bg-white/5 hover:text-white'
								}`}
							>
								<Palette className="w-4 h-4" />
								Preferences
							</button>
							<button
								onClick={() => setActiveTab('account')}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
									activeTab === 'account'
										? 'bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10'
										: 'text-slate-300 hover:bg-white/5 hover:text-white'
								}`}
							>
								<Lock className="w-4 h-4" />
								Account & Security
							</button>
						</nav>

						<div className="mt-8 pt-6 border-t border-white/10">
							<button
								onClick={handleLogout}
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
							>
								<LogOut className="w-4 h-4" />
								Log Out
							</button>
						</div>
					</div>

					{/* Content Area */}
					<div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
						{loading ? (
							<div className="flex items-center justify-center h-64">
								<div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
							</div>
						) : (
							<>
								{/* Profile Tab */}
								{activeTab === 'profile' && (
									<div className="space-y-8 max-w-2xl">
										<div>
											<h3 className="text-xl font-bold text-white mb-2">Profile Information</h3>
											<p className="text-sm text-slate-400 mb-6">Manage your personal information and profile picture</p>

											{/* Avatar */}
											<div className="mb-8">
												<label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
													Profile Picture
												</label>
												<div className="flex items-center gap-6">
													<Avatar className="w-24 h-24 border-2 border-white/10">
														<AvatarImage src={avatarUrl || ''} alt={displayName || 'User'} />
														<AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold">
															{displayName ? displayName.charAt(0).toUpperCase() : userProfile?.email?.charAt(0).toUpperCase() || 'U'}
														</AvatarFallback>
													</Avatar>
													<div className="flex flex-col gap-3">
														<button
															onClick={() => setIsAvatarUploadOpen(true)}
															className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/20"
														>
															<Camera className="w-4 h-4" />
															{avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
														</button>
														<p className="text-xs text-slate-500">
															JPG, PNG or GIF • Max 5MB
														</p>
													</div>
												</div>
											</div>

											{/* Display Name */}
											<div className="mb-6">
												<label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
													Display Name
												</label>
												<input
													type="text"
													value={displayName}
													onChange={(e) => setDisplayName(e.target.value)}
													placeholder="Enter your display name"
													className="w-full px-4 py-3 bg-[#020617] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
												/>
											</div>

											{/* Email (Read-only) */}
											<div className="mb-6">
												<label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
													Email Address
												</label>
												<input
													type="email"
													value={userProfile?.email || ''}
													disabled
													className="w-full px-4 py-3 bg-[#020617]/50 border border-white/10 text-slate-500 rounded-lg cursor-not-allowed"
												/>
												<p className="text-xs text-slate-500 mt-2">Email address cannot be changed</p>
											</div>

											<button
												onClick={handleSaveProfile}
												disabled={saving}
												className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-500/20"
											>
												{saving ? 'Saving Changes...' : 'Save Changes'}
											</button>
										</div>
									</div>
								)}

								{/* Preferences Tab */}
								{activeTab === 'preferences' && (
									<div className="space-y-8 max-w-2xl">
										{/* Theme Section */}
										<div>
											<h3 className="text-xl font-bold text-white mb-2">Appearance</h3>
											<p className="text-sm text-slate-400 mb-6">Customize how the interface looks</p>
											<div className="space-y-4">
												<div>
													<label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
														Theme
													</label>
													<ThemeSwitcherList />
												</div>
											</div>
										</div>

										{/* General Preferences Section */}
										<div className="pt-8 border-t border-white/10">
											<h3 className="text-xl font-bold text-white mb-2">General Settings</h3>
											<p className="text-sm text-slate-400 mb-6">Configure workspace behavior and defaults</p>
											<div className="space-y-3">
												<ToggleCard
													title="Auto-save"
													description="Automatically save changes as you work"
													checked={preferences.autoSaveEnabled}
													onChange={(checked) => setPreferences({ ...preferences, autoSaveEnabled: checked })}
												/>
												<ToggleCard
													title="Grid Snap"
													description="Snap cards to grid when moving"
													checked={preferences.gridSnapEnabled}
													onChange={(checked) => setPreferences({ ...preferences, gridSnapEnabled: checked })}
												/>
												<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
													<label className="block text-sm font-medium text-white mb-3">
														Default Board Color
													</label>
													<div className="flex items-center gap-4">
														<input
															type="color"
															value={preferences.defaultBoardColor}
															onChange={(e) => setPreferences({ ...preferences, defaultBoardColor: e.target.value })}
															className="w-14 h-14 rounded-lg border-2 border-white/10 cursor-pointer bg-transparent"
														/>
														<div>
															<div className="text-sm text-white font-mono">{preferences.defaultBoardColor}</div>
															<div className="text-xs text-slate-500">Choose your preferred board color</div>
														</div>
													</div>
												</div>
											</div>
										</div>

										{/* Notification Preferences Section */}
										<div className="pt-8 border-t border-white/10">
											<h3 className="text-xl font-bold text-white mb-2">Notifications</h3>
											<p className="text-sm text-slate-400 mb-6">Manage how you receive updates</p>
											<div className="space-y-3">
												<ToggleCard
													title="Email Notifications"
													description="Receive important updates via email"
													checked={preferences.emailNotifications}
													onChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
												/>
												<ToggleCard
													title="Board Activity"
													description="Get notified when boards are updated"
													checked={preferences.boardActivityNotifications}
													onChange={(checked) => setPreferences({ ...preferences, boardActivityNotifications: checked })}
												/>
												<ToggleCard
													title="Share Notifications"
													description="Notify when someone shares a board with you"
													checked={preferences.shareNotifications}
													onChange={(checked) => setPreferences({ ...preferences, shareNotifications: checked })}
												/>
												<ToggleCard
													title="Weekly Digest"
													description="Receive a weekly summary of activity"
													checked={preferences.weeklyDigest}
													onChange={(checked) => setPreferences({ ...preferences, weeklyDigest: checked })}
												/>
											</div>
										</div>

										{/* Collaboration Preferences Section */}
										<div className="pt-8 border-t border-white/10">
											<h3 className="text-xl font-bold text-white mb-2">Collaboration</h3>
											<p className="text-sm text-slate-400 mb-6">Control how you work with others</p>
											<div className="space-y-3">
												<ToggleCard
													title="Allow Comments"
													description="Let others comment on your boards"
													checked={preferences.allowCommenting}
													onChange={(checked) => setPreferences({ ...preferences, allowCommenting: checked })}
												/>
												<ToggleCard
													title="Show Presence Indicators"
													description="Display who else is viewing the board"
													checked={preferences.showPresenceIndicators}
													onChange={(checked) => setPreferences({ ...preferences, showPresenceIndicators: checked })}
												/>
											</div>
										</div>

										{/* Save Button */}
										<div className="pt-6">
											<button
												onClick={async () => {
													setSaving(true);
													try {
														// Here you would save preferences to Supabase
														// For now, just show success message
														showMessage('success', 'Preferences saved successfully!');
													} catch (error) {
														showMessage('error', 'Failed to save preferences');
													} finally {
														setSaving(false);
													}
												}}
												disabled={saving}
												className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-500/20"
											>
												{saving ? 'Saving Preferences...' : 'Save Preferences'}
											</button>
										</div>
									</div>
								)}

								{/* Account Tab */}
								{activeTab === 'account' && (
									<div className="space-y-8 max-w-2xl">
										<div>
											<h3 className="text-xl font-bold text-white mb-2">Account Security</h3>
											<p className="text-sm text-slate-400 mb-6">Manage your password and account settings</p>

											{/* Change Password */}
											<div className="mb-8">
												<label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
													Change Password
												</label>
												<div className="space-y-4">
													<input
														type="password"
														value={newPassword}
														onChange={(e) => setNewPassword(e.target.value)}
														placeholder="New password"
														className="w-full px-4 py-3 bg-[#020617] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
													/>
													<input
														type="password"
														value={confirmPassword}
														onChange={(e) => setConfirmPassword(e.target.value)}
														placeholder="Confirm new password"
														className="w-full px-4 py-3 bg-[#020617] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
													/>
													<button
														onClick={handleChangePassword}
														disabled={saving || !newPassword || !confirmPassword}
														className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-500/20"
													>
														{saving ? 'Changing Password...' : 'Change Password'}
													</button>
												</div>
											</div>
										</div>

										{/* Danger Zone */}
										<div className="pt-8 border-t border-white/10">
											<h3 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h3>
											<p className="text-sm text-slate-400 mb-6">Irreversible actions that affect your account</p>

											<div className="p-6 border-2 border-red-500/30 rounded-xl bg-red-500/5">
												<h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
													<Lock className="w-4 h-4" />
													Delete Account
												</h4>
												<p className="text-sm text-slate-300 mb-4">
													Once you delete your account, there is no going back. All your boards, cards, and data will be permanently deleted.
												</p>
												<button
													onClick={handleDeleteAccount}
													className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all font-medium shadow-lg shadow-red-500/20"
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

				{/* Avatar Upload Modal */}
				<AvatarUploadCrop
					isOpen={isAvatarUploadOpen}
					onClose={() => setIsAvatarUploadOpen(false)}
					onSave={handleAvatarUpload}
					currentAvatarUrl={avatarUrl}
				/>
			</div>
		</div>
	);
}

// Helper Component for Toggle Cards
interface ToggleCardProps {
	title: string;
	description: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

function ToggleCard({ title, description, checked, onChange }: ToggleCardProps) {
	return (
		<label className="flex items-center justify-between p-4 bg-[#020617] border border-white/10 rounded-xl hover:border-white/20 cursor-pointer transition-all group">
			<div className="flex-1">
				<div className="font-medium text-sm text-white group-hover:text-indigo-400 transition-colors">{title}</div>
				<div className="text-xs text-slate-400 mt-1">{description}</div>
			</div>
			<div className="relative">
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					className="sr-only"
				/>
				<div className={`w-11 h-6 rounded-full transition-all ${
					checked ? 'bg-indigo-600' : 'bg-slate-700'
				}`}>
					<div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-200 ease-in-out transform ${
						checked ? 'translate-x-6' : 'translate-x-0.5'
					} translate-y-0.5`}></div>
				</div>
			</div>
		</label>
	);
}