'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ProfileSection() {
	const { user } = useUser();
	const [isUpdating, setIsUpdating] = useState(false);
	const [displayName, setDisplayName] = useState(user?.username || '');

	const handleUpdateProfile = async () => {
		if (!user) return;

		setIsUpdating(true);
		try {
			await user.update({
				username: displayName,
			});
		} catch (error) {
			console.error('Error updating profile:', error);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleAvatarClick = () => {
		// This would trigger Clerk's avatar upload modal or custom file picker
		// For now, we'll just log - you can implement custom avatar upload later
		console.log('Avatar upload clicked');
	};

	if (!user) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-2xl font-bold text-white mb-2">Profile</h3>
				<p className="text-sm text-slate-400">Manage your public profile information</p>
			</div>

			{/* Avatar Section */}
			<div className="flex items-center gap-6">
				<div className="relative group">
					<Avatar className="w-24 h-24 border-2 border-white/10">
						<AvatarImage src={user.imageUrl} />
						<AvatarFallback className="bg-indigo-600 text-white text-2xl font-medium">
							{user.username?.substring(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<button
						onClick={handleAvatarClick}
						className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<Camera className="w-6 h-6 text-white" />
					</button>
				</div>
				<div>
					<h4 className="text-base font-semibold text-white">{user.username}</h4>
					<p className="text-sm text-slate-400 mt-1">
						{user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress}
					</p>
					<button
						onClick={handleAvatarClick}
						className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
					>
						Change avatar
					</button>
				</div>
			</div>

			{/* Profile Information */}
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-slate-400 mb-2">
						Display Name
					</label>
					<input
						type="text"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						className="w-full px-4 py-3 bg-[#020617] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-500"
						placeholder="Enter your display name"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-slate-400 mb-2">
						Email
					</label>
					<input
						type="email"
						value={user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress}
						disabled
						className="w-full px-4 py-3 bg-[#020617] border border-white/10 text-slate-500 rounded-lg cursor-not-allowed"
					/>
					<p className="text-xs text-slate-500 mt-2">
						Email is managed by your authentication provider
					</p>
				</div>

				<div className="pt-4">
					<button
						onClick={handleUpdateProfile}
						disabled={isUpdating || displayName === user.username}
						className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2"
					>
						{isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
						{isUpdating ? 'Updating...' : 'Update Profile'}
					</button>
				</div>
			</div>

			{/* Account Information */}
			<div className="pt-6 border-t border-white/10">
				<h4 className="text-lg font-semibold text-white mb-4">Account Information</h4>
				<div className="space-y-3">
					<div className="flex justify-between items-center">
						<span className="text-sm text-slate-400">User ID</span>
						<span className="text-sm text-slate-300 font-mono">{user.id.substring(0, 16)}...</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm text-slate-400">Account Created</span>
						<span className="text-sm text-slate-300">
							{new Date(user.createdAt).toLocaleDateString()}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm text-slate-400">Last Sign In</span>
						<span className="text-sm text-slate-300">
							{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
