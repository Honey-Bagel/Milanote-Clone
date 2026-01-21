'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useReverification } from '@clerk/nextjs';
import { Camera, Loader2, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function ProfileSection() {
	const { user, isSignedIn, isLoaded } = useUser();
	const [isUpdating, setIsUpdating] = useState(false);
	const [displayName, setDisplayName] = useState('');
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Wrap sensitive operations with reverification
	const updateUsername = useReverification((newUsername: string) =>
		user?.update({ username: newUsername })
	);

	const updateProfileImage = useReverification((file: File | null) =>
		user?.setProfileImage({ file })
	);

	// Initialize display name when user loads
	useEffect(() => {
		if (user?.username) {
			setDisplayName(user.username);
		}
	}, [user?.username]);

	const handleUpdateProfile = async () => {
		if (!isSignedIn || !isLoaded || !user) return;

		if (!displayName.trim()) {
			toast.error('Display name cannot be empty');
			return;
		}

		if (displayName === user.username) {
			toast.info('No changes to save');
			return;
		}

		setIsUpdating(true);
		try {
			await updateUsername(displayName.trim());
			toast.success('Profile updated successfully');
		} catch (error: unknown) {
			const errorMessage = (error as { errors?: { message?: string }[] })?.errors?.[0]?.message || 'Failed to update profile';
			toast.error(errorMessage);
			console.error('Error updating profile:', error);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleAvatarClick = () => {
		fileInputRef.current?.click();
	};

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !user) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please upload an image file');
			return;
		}

		// Validate file size (max 10MB)
		console.log(file.size);
		if (file.size > 10 * 1024 * 1024) {
			toast.error('Image size must be less than 10MB');
			return;
		}

		setIsUploadingAvatar(true);
		try {
			await updateProfileImage(file);
			toast.success('Avatar updated successfully');
		} catch (error: unknown) {
			const errorMessage = (error as { errors?: { message?: string }[] })?.errors?.[0]?.message || 'Failed to upload avatar';
			toast.error(errorMessage);
			console.error('Error uploading avatar:', error);
		} finally {
			setIsUploadingAvatar(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const handleRemoveAvatar = async () => {
		if (!user) return;

		const confirmed = window.confirm('Are you sure you want to remove your avatar?');
		if (!confirmed) return;

		setIsUploadingAvatar(true);
		try {
			await updateProfileImage(null);
			toast.success('Avatar removed successfully');
		} catch (error: unknown) {
			const errorMessage = (error as { errors?: { message?: string }[] })?.errors?.[0]?.message || 'Failed to remove avatar';
			toast.error(errorMessage);
			console.error('Error removing avatar:', error);
		} finally {
			setIsUploadingAvatar(false);
		}
	};

	if (!user) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	const hasChanges = displayName.trim() !== user.username;

	return (
		<div className="space-y-8">
			{/* Avatar Section */}
			<div className="flex items-center gap-6">
				<div className="relative group">
					<Avatar className="w-24 h-24 border-2 border-white/10">
						<AvatarImage src={user.imageUrl} />
						<AvatarFallback className="bg-primary text-white text-2xl font-medium">
							{user.username?.substring(0, 2).toUpperCase() || user.primaryEmailAddress?.emailAddress?.substring(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<button
						onClick={handleAvatarClick}
						disabled={isUploadingAvatar}
						className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
					>
						{isUploadingAvatar ? (
							<Loader2 className="w-6 h-6 text-white animate-spin" />
						) : (
							<Camera className="w-6 h-6 text-white" />
						)}
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleAvatarUpload}
						className="hidden"
					/>
				</div>
				<div>
					<h4 className="text-base font-semibold text-white">{user.username || 'No username set'}</h4>
					<p className="text-sm text-secondary-foreground mt-1">
						{user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress}
					</p>
					<div className="flex items-center gap-2 mt-2">
						<button
							onClick={handleAvatarClick}
							disabled={isUploadingAvatar}
							className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Change avatar
						</button>
						{user.hasImage && (
							<>
								<span className="text-secondary-foreground">•</span>
								<button
									onClick={handleRemoveAvatar}
									disabled={isUploadingAvatar}
									className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Remove
								</button>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Profile Information */}
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-secondary-foreground mb-2">
						Display Name
					</label>
					<input
						type="text"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && hasChanges && !isUpdating) {
								handleUpdateProfile();
							}
						}}
						className="w-full px-4 py-3 bg-[#020617] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-slate-500"
						placeholder="Enter your display name"
						disabled={isUpdating}
					/>
					<p className="text-xs text-muted-foreground mt-2">
						This is how your name will appear throughout the app
					</p>
				</div>

				<div>
					<label className="block text-sm font-medium text-secondary-foreground mb-2">
						Email
					</label>
					<input
						type="email"
						value={user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress}
						disabled
						className="w-full px-4 py-3 bg-[#020617] border border-white/10 text-muted-foreground rounded-lg cursor-not-allowed"
					/>
					<p className="text-xs text-muted-foreground mt-2">
						Email is managed by your authentication provider
					</p>
				</div>

				<div className="pt-4">
					<button
						onClick={handleUpdateProfile}
						disabled={isUpdating || !hasChanges}
						className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
					>
						{isUpdating ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>Updating...</span>
							</>
						) : hasChanges ? (
							<>
								<Check className="w-4 h-4" />
								<span>Save Changes</span>
							</>
						) : (
							<span>No Changes</span>
						)}
					</button>
				</div>
			</div>

			{/* Account Information */}
			<div className="pt-6 border-t border-white/10">
				<h4 className="text-lg font-semibold text-white mb-4">Account Information</h4>
				<div className="space-y-3">
					<div className="flex justify-between items-center p-3 bg-[#020617] border border-white/10 rounded-lg">
						<span className="text-sm text-secondary-foreground">Account Created</span>
						<span className="text-sm text-foreground font-medium">
							{user.createdAt
								? new Date(user.createdAt).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								})
								: 'N/A'
							}
						</span>
					</div>
					<div className="flex justify-between items-center p-3 bg-[#020617] border border-white/10 rounded-lg">
						<span className="text-sm text-secondary-foreground">Last Sign In</span>
						<span className="text-sm text-foreground font-medium">
							{user.lastSignInAt
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
						<span className="text-sm text-secondary-foreground">User ID</span>
						<span className="text-sm text-foreground font-mono">
							{user.id.substring(0, 16)}...
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
