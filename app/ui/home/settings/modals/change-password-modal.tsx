'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useReverification } from '@clerk/nextjs';
import { X, Key, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useIsSmallScreen } from '@/lib/hooks/use-media-query';

interface ChangePasswordModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
	const { user } = useUser();
	const modalRef = useRef<HTMLDivElement | null>(null);
	const isSmallScreen = useIsSmallScreen();

	// Wrap password update with reverification
	const updatePassword = useReverification(
		(currentPassword: string, newPassword: string, signOutOfOtherSessions: boolean) =>
			user?.updatePassword({ currentPassword, newPassword, signOutOfOtherSessions })
	);

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [signOutOthers, setSignOutOthers] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);

	// Password visibility toggles
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	// Handle click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	// Reset form when modal closes
	useEffect(() => {
		if (!isOpen) {
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setSignOutOthers(true);
			setError(null);
			setShowCurrent(false);
			setShowNew(false);
			setShowConfirm(false);
		}
	}, [isOpen]);

	const getPasswordStrength = (password: string): { label: string; color: string; percent: number } => {
		if (password.length === 0) return { label: '', color: '', percent: 0 };
		if (password.length < 8) return { label: 'Weak', color: 'text-red-400', percent: 25 };

		let strength = 0;
		if (password.length >= 8) strength += 25;
		if (password.length >= 12) strength += 25;
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
		if (/\d/.test(password) && /[!@#$%^&*]/.test(password)) strength += 25;

		if (strength <= 25) return { label: 'Weak', color: 'text-red-400', percent: 25 };
		if (strength <= 50) return { label: 'Fair', color: 'text-yellow-400', percent: 50 };
		if (strength <= 75) return { label: 'Good', color: 'text-blue-400', percent: 75 };
		return { label: 'Strong', color: 'text-green-400', percent: 100 };
	};

	const handleSubmit = async () => {
		// Validation
		if (!currentPassword || !newPassword || !confirmPassword) {
			setError('All fields are required');
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("New passwords don't match");
			return;
		}

		if (newPassword.length < 8) {
			setError('New password must be at least 8 characters');
			return;
		}

		if (currentPassword === newPassword) {
			setError('New password must be different from current password');
			return;
		}

		setError(null);
		setIsUpdating(true);

		try {
			await updatePassword(currentPassword, newPassword, signOutOthers);

			toast.success('Password changed successfully');
			onClose();
		} catch (err: unknown) {
			const errorMessage = (err as { errors?: { message?: string }[] })?.errors?.[0]?.message || 'Failed to update password';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isUpdating) {
			handleSubmit();
		}
	};

	if (!isOpen) return null;

	const passwordStrength = getPasswordStrength(newPassword);

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
			<div
				ref={modalRef}
				className={`bg-[#0f172a] border border-white/10 shadow-2xl w-full flex flex-col text-foreground
					${isSmallScreen
						? 'h-full rounded-none max-h-full'
						: 'rounded-2xl max-w-2xl max-h-[85vh]'
					}`}
			>
				{/* Header */}
				<div className="p-4 sm:p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0">
						<div className="p-1.5 sm:p-2 bg-primary rounded-lg flex-shrink-0">
							<Key size={18} className="sm:w-5 sm:h-5 text-white" />
						</div>
						<h2 className="text-lg sm:text-xl font-bold text-white truncate">Change Password</h2>
					</div>
					<button
						className="text-secondary-foreground hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors flex-shrink-0"
						onClick={onClose}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
					{error && (
						<div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs sm:text-sm text-red-400 flex items-start gap-2 sm:gap-3">
							<div className="w-1 h-full bg-red-500 rounded-full flex-shrink-0"></div>
							<span>{error}</span>
						</div>
					)}

					<p className="text-sm text-secondary-foreground">
						Update your password to keep your account secure. You'll need to enter your current password first.
					</p>

					{/* Current Password */}
					<div>
						<label className="block text-sm font-medium text-secondary-foreground mb-2">
							Current Password
						</label>
						<div className="relative">
							<input
								type={showCurrent ? 'text' : 'password'}
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
								placeholder="Enter current password"
								disabled={isUpdating}
							/>
							<button
								type="button"
								onClick={() => setShowCurrent(!showCurrent)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-foreground hover:text-white transition-colors"
							>
								{showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>

					{/* New Password */}
					<div>
						<label className="block text-sm font-medium text-secondary-foreground mb-2">
							New Password
						</label>
						<div className="relative">
							<input
								type={showNew ? 'text' : 'password'}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
								placeholder="Enter new password"
								disabled={isUpdating}
							/>
							<button
								type="button"
								onClick={() => setShowNew(!showNew)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-foreground hover:text-white transition-colors"
							>
								{showNew ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>

						{/* Password Strength Indicator */}
						{newPassword && (
							<div className="mt-2">
								<div className="flex items-center justify-between mb-1">
									<span className="text-xs text-secondary-foreground">Password strength</span>
									<span className={`text-xs font-medium ${passwordStrength.color}`}>
										{passwordStrength.label}
									</span>
								</div>
								<div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
									<div
										className={`h-full transition-all duration-300 ${
											passwordStrength.percent <= 25 ? 'bg-red-400' :
											passwordStrength.percent <= 50 ? 'bg-yellow-400' :
											passwordStrength.percent <= 75 ? 'bg-blue-400' :
											'bg-green-400'
										}`}
										style={{ width: `${passwordStrength.percent}%` }}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Confirm Password */}
					<div>
						<label className="block text-sm font-medium text-secondary-foreground mb-2">
							Confirm New Password
						</label>
						<div className="relative">
							<input
								type={showConfirm ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
								placeholder="Confirm new password"
								disabled={isUpdating}
							/>
							<button
								type="button"
								onClick={() => setShowConfirm(!showConfirm)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-foreground hover:text-white transition-colors"
							>
								{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>

					{/* Sign out other sessions */}
					<div className="flex items-start gap-3 p-4 bg-[#020617] border border-white/10 rounded-xl">
						<input
							type="checkbox"
							id="signOutOthers"
							checked={signOutOthers}
							onChange={(e) => setSignOutOthers(e.target.checked)}
							className="mt-1 w-4 h-4 rounded border-white/10 bg-[#0f172a] text-primary focus:ring-2 focus:ring-primary"
							disabled={isUpdating}
						/>
						<label htmlFor="signOutOthers" className="flex-1 cursor-pointer">
							<div className="text-sm font-medium text-white">Sign out of all other sessions</div>
							<div className="text-xs text-secondary-foreground mt-1">
								For security, we recommend signing out of other devices when changing your password
							</div>
						</label>
					</div>
				</div>

				{/* Footer */}
				<div className="p-4 sm:p-6 border-t border-white/10 flex-shrink-0 flex flex-col sm:flex-row gap-3 sm:justify-end">
					<button
						onClick={onClose}
						disabled={isUpdating}
						className="px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={isUpdating}
						className="px-4 sm:px-6 py-3 bg-primary hover:bg-primary text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2 order-1 sm:order-2"
					>
						{isUpdating ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>Updating...</span>
							</>
						) : (
							'Change Password'
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
