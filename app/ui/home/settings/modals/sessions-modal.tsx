'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { X, Monitor, Smartphone, Tablet, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useIsSmallScreen } from '@/lib/hooks/use-media-query';

interface ChangePasswordModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface SessionWithActivities {
	id: string;
	status: 'active' | 'expired' | 'abandoned';
	lastActiveAt: number;
	latestActivity?: {
		deviceType?: 'desktop' | 'mobile' | 'tablet';
		browserName?: string;
		browserVersion?: string;
		ipAddress?: string;
		city?: string;
		country?: string;
	};
}

export function SessionsModal({ isOpen, onClose }: ChangePasswordModalProps) {
	const { user } = useUser();
	const { sessionId: currentSessionId } = useAuth();
	const modalRef = useRef<HTMLDivElement | null>(null);
	const isSmallScreen = useIsSmallScreen();

	const [sessions, setSessions] = useState<SessionWithActivities[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

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

	// Fetch sessions when modal opens
	useEffect(() => {
		const fetchSessions = async () => {
			if (!isOpen || !user) return;

			setLoading(true);
			setError(null);

			try {
				const sessionsData = await user.getSessions();
				setSessions(sessionsData as SessionWithActivities[]);
			} catch (err: any) {
				setError('Failed to load sessions');
				console.error('Error fetching sessions:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchSessions();
	}, [isOpen, user]);

	const handleRevokeSession = async (sessionId: string) => {
		// Confirm before revoking
		const confirmed = window.confirm(
			'Are you sure you want to revoke this session? The device will be signed out immediately.'
		);

		if (!confirmed) return;

		setRevokingSessionId(sessionId);
		setError(null);

		try {
			const response = await fetch('/api/sessions/revoke', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to revoke session');
			}

			toast.success('Session revoked successfully');

			// Refresh sessions list
			if (user) {
				const sessionsData = await user.getSessions();
				setSessions(sessionsData as SessionWithActivities[]);
			}
		} catch (err: any) {
			const errorMessage = err.message || 'Failed to revoke session';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setRevokingSessionId(null);
		}
	};

	const getDeviceIcon = (deviceType?: string) => {
		switch (deviceType) {
			case 'mobile':
				return <Smartphone size={20} className="text-secondary-foreground" />;
			case 'tablet':
				return <Tablet size={20} className="text-secondary-foreground" />;
			default:
				return <Monitor size={20} className="text-secondary-foreground" />;
		}
	};

	const formatRelativeTime = (timestamp: number) => {
		const now = Date.now();
		const diff = now - timestamp;

		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
		if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
		return `${days} day${days === 1 ? '' : 's'} ago`;
	};

	if (!isOpen) return null;

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
							<Monitor size={18} className="sm:w-5 sm:h-5 text-white" />
						</div>
						<h2 className="text-lg sm:text-xl font-bold text-white truncate">Active Sessions</h2>
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
						Manage your active sessions across all devices. You can revoke access from any device except your current one.
					</p>

					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : sessions.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="p-4 bg-white/5 rounded-full mb-4">
								<Monitor className="w-8 h-8 text-secondary-foreground" />
							</div>
							<p className="text-sm text-secondary-foreground">No active sessions found</p>
						</div>
					) : (
						<div className="space-y-3">
							{sessions.map((session) => {
								const isCurrentSession = session.id === currentSessionId;
								const isRevoking = revokingSessionId === session.id;

								return (
									<div
										key={session.id}
										className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-[#020617] border rounded-xl transition-all ${
											isCurrentSession
												? 'border-primary'
												: 'border-white/10 hover:border-white/20'
										}`}
									>
										{/* Device Icon */}
										<div className="flex-shrink-0">
											{getDeviceIcon(session.latestActivity?.deviceType)}
										</div>

										{/* Session Info */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<p className="text-sm font-medium text-white truncate">
													{session.latestActivity?.browserName || 'Unknown Browser'}
													{session.latestActivity?.browserVersion && (
														<span className="text-secondary-foreground font-normal">
															{' '}v{session.latestActivity.browserVersion}
														</span>
													)}
												</p>
												{isCurrentSession && (
													<span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
														This device
													</span>
												)}
											</div>

											<div className="space-y-0.5">
												{session.latestActivity?.ipAddress && (
													<p className="text-xs text-secondary-foreground">
														IP: {session.latestActivity.ipAddress}
													</p>
												)}
												{(session.latestActivity?.city || session.latestActivity?.country) && (
													<p className="text-xs text-secondary-foreground">
														Location: {session.latestActivity?.city}
														{session.latestActivity?.city && session.latestActivity?.country && ', '}
														{session.latestActivity?.country}
													</p>
												)}
												<p className="text-xs text-secondary-foreground">
													Last active: {formatRelativeTime(session.lastActiveAt)}
												</p>
											</div>
										</div>

										{/* Revoke Button */}
										<div className="flex-shrink-0">
											<button
												onClick={() => handleRevokeSession(session.id)}
												disabled={isCurrentSession || isRevoking}
												className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
													isCurrentSession
														? 'bg-white/5 text-secondary-foreground opacity-50 cursor-not-allowed'
														: 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
												}`}
											>
												{isRevoking ? (
													<>
														<Loader2 className="w-4 h-4 animate-spin" />
														<span>Revoking...</span>
													</>
												) : (
													<>
														<AlertTriangle size={16} />
														<span>Revoke</span>
													</>
												)}
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{sessions.length > 0 && (
						<div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400">
							<strong>Note:</strong> Revoking a session will immediately sign out that device. You cannot revoke your current session.
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 sm:p-6 border-t border-white/10 flex-shrink-0 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
