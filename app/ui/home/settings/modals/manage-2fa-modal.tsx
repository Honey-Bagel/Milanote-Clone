'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useReverification } from '@clerk/nextjs';
import { X, Smartphone, Loader2, Check, Copy, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useIsSmallScreen } from '@/lib/hooks/use-media-query';
import QRCode from 'qrcode';

interface Manage2FAModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type Step = 'overview' | 'setup' | 'verify' | 'backup-codes' | 'manage';

export function Manage2FAModal({ isOpen, onClose }: Manage2FAModalProps) {
	const { user } = useUser();
	const modalRef = useRef<HTMLDivElement | null>(null);
	const isSmallScreen = useIsSmallScreen();

	// Wrap sensitive 2FA operations with reverification
	const createTOTP = useReverification(() => user?.createTOTP());
	const verifyTOTP = useReverification((code: string) => user?.verifyTOTP({ code }));
	const disableTOTP = useReverification(() => user?.disableTOTP());
	const generateBackupCodes = useReverification(() => user?.createBackupCode());

	const [step, setStep] = useState<Step>('overview');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Setup state
	const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
	const [secret, setSecret] = useState<string>('');
	const [verificationCode, setVerificationCode] = useState('');
	const [backupCodes, setBackupCodes] = useState<string[]>([]);

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

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setStep(user?.twoFactorEnabled ? 'manage' : 'overview');
			setQrCodeUrl('');
			setSecret('');
			setVerificationCode('');
			setBackupCodes([]);
			setError(null);
		} else {
			setStep(user?.twoFactorEnabled ? 'manage' : 'overview');
		}
	}, [isOpen, user?.twoFactorEnabled]);

	const handleStartSetup = async () => {
		setLoading(true);
		setError(null);

		try {
			// Create TOTP secret with reverification
			const totpResponse = await createTOTP();

			if (!totpResponse) {
				throw new Error('Failed to create TOTP');
			}

			setSecret(totpResponse.secret || '');

			// Generate QR code
			const uri = totpResponse.uri;
			if (uri) {
				const qrCode = await QRCode.toDataURL(uri);
				setQrCodeUrl(qrCode);
			}

			setStep('setup');
		} catch (err: any) {
			const errorMessage = err?.errors?.[0]?.message || 'Failed to start 2FA setup';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleVerify = async () => {
		if (!verificationCode || verificationCode.length !== 6) {
			setError('Please enter a valid 6-digit code');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Verify TOTP with reverification
			const verifyResponse = await verifyTOTP(verificationCode);

			if (!verifyResponse) {
				throw new Error('Failed to verify code');
			}

			// Get backup codes
			const codes = verifyResponse.backupCodes || [];
			setBackupCodes(codes);

			toast.success('2FA enabled successfully!');
			setStep('backup-codes');
		} catch (err: unknown) {
			const errorMessage = (err as { errors?: { message?: string }[] })?.errors?.[0]?.message || 'Invalid verification code';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleDisable2FA = async () => {
		const confirmed = window.confirm(
			'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
		);

		if (!confirmed) return;

		setLoading(true);
		setError(null);

		try {
			await disableTOTP();
			toast.success('2FA disabled successfully');
			onClose();
		} catch (err: unknown) {
			const errorMessage = (err as { errors?: { message?: string }[] })?.errors?.[0]?.message || 'Failed to disable 2FA';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleGenerateBackupCodes = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await generateBackupCodes();

			if (!response) {
				throw new Error('Failed to generate backup codes');
			}

			setBackupCodes(response.backupCodes || []);
			toast.success('New backup codes generated');
		} catch (err: unknown) {
			const errorMessage = (err as { errors?: { message?: string }[] })?.errors?.[0]?.message || 'Failed to generate backup codes';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleCopySecret = () => {
		navigator.clipboard.writeText(secret);
		toast.success('Secret copied to clipboard');
	};

	const handleCopyBackupCodes = () => {
		navigator.clipboard.writeText(backupCodes.join('\n'));
		toast.success('Backup codes copied to clipboard');
	};

	const handleDownloadBackupCodes = () => {
		const text = backupCodes.join('\n');
		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'backup-codes.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success('Backup codes downloaded');
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
							<Smartphone size={18} className="sm:w-5 sm:h-5 text-white" />
						</div>
						<h2 className="text-lg sm:text-xl font-bold text-white truncate">
							{user?.twoFactorEnabled ? 'Manage 2FA' : 'Enable Two-Factor Authentication'}
						</h2>
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

					{/* Overview Step */}
					{step === 'overview' && (
						<div className="space-y-6">
							<div className="flex items-center justify-center">
								<div className="p-4 bg-primary/20 rounded-full">
									<Shield className="w-12 h-12 text-primary" />
								</div>
							</div>

							<div className="text-center">
								<h3 className="text-lg font-semibold text-white mb-2">
									Secure Your Account
								</h3>
								<p className="text-sm text-secondary-foreground">
									Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your authenticator app.
								</p>
							</div>

							<div className="space-y-3">
								<div className="flex items-start gap-3 p-3 bg-[#020617] rounded-lg">
									<div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-bold text-primary">1</span>
									</div>
									<div>
										<div className="text-sm font-medium text-white">Install an authenticator app</div>
										<div className="text-xs text-secondary-foreground mt-1">
											Download apps like Google Authenticator, Authy, or 1Password
										</div>
									</div>
								</div>

								<div className="flex items-start gap-3 p-3 bg-[#020617] rounded-lg">
									<div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-bold text-primary">2</span>
									</div>
									<div>
										<div className="text-sm font-medium text-white">Scan the QR code</div>
										<div className="text-xs text-secondary-foreground mt-1">
											Use your authenticator app to scan the QR code we'll show you
										</div>
									</div>
								</div>

								<div className="flex items-start gap-3 p-3 bg-[#020617] rounded-lg">
									<div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-xs font-bold text-primary">3</span>
									</div>
									<div>
										<div className="text-sm font-medium text-white">Enter verification code</div>
										<div className="text-xs text-secondary-foreground mt-1">
											Enter the 6-digit code from your app to complete setup
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Setup Step */}
					{step === 'setup' && (
						<div className="space-y-6">
							<div className="text-center">
								<h3 className="text-lg font-semibold text-white mb-2">
									Scan QR Code
								</h3>
								<p className="text-sm text-secondary-foreground">
									Open your authenticator app and scan this QR code
								</p>
							</div>

							{qrCodeUrl && (
								<div className="flex justify-center">
									<div className="p-4 bg-white rounded-xl">
										<img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
									</div>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-secondary-foreground mb-2">
									Or enter this code manually
								</label>
								<div className="flex items-center gap-2">
									<input
										type="text"
										value={secret}
										readOnly
										className="flex-1 px-4 py-3 bg-[#020617] border border-white/10 rounded-lg text-sm text-white font-mono"
									/>
									<button
										onClick={handleCopySecret}
										className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
									>
										<Copy size={18} className="text-secondary-foreground" />
									</button>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-secondary-foreground mb-2">
									Enter verification code
								</label>
								<input
									type="text"
									inputMode="numeric"
									maxLength={6}
									value={verificationCode}
									onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
									className="w-full px-4 py-3 bg-[#020617] border border-white/10 rounded-lg text-center text-2xl font-mono text-white tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
									placeholder="000000"
								/>
								<p className="text-xs text-secondary-foreground mt-2">
									Enter the 6-digit code from your authenticator app
								</p>
							</div>
						</div>
					)}

					{/* Verify Step */}
					{step === 'verify' && (
						<div className="space-y-6">
							<div className="text-center">
								<h3 className="text-lg font-semibold text-white mb-2">
									Verifying...
								</h3>
								<Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
							</div>
						</div>
					)}

					{/* Backup Codes Step */}
					{step === 'backup-codes' && (
						<div className="space-y-6">
							<div className="text-center">
								<div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-4">
									<Check className="w-6 h-6 text-green-400" />
								</div>
								<h3 className="text-lg font-semibold text-white mb-2">
									2FA Enabled Successfully!
								</h3>
								<p className="text-sm text-secondary-foreground">
									Save these backup codes in a safe place. You can use them to access your account if you lose your device.
								</p>
							</div>

							<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
								<div className="grid grid-cols-2 gap-2 font-mono text-sm text-white mb-4">
									{backupCodes.map((code, index) => (
										<div key={index} className="p-2 bg-[#0f172a] rounded text-center">
											{code}
										</div>
									))}
								</div>

								<div className="flex gap-2">
									<button
										onClick={handleCopyBackupCodes}
										className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
									>
										<Copy size={16} />
										Copy
									</button>
									<button
										onClick={handleDownloadBackupCodes}
										className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all"
									>
										Download
									</button>
								</div>
							</div>

							<div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400">
								<strong>Important:</strong> Each backup code can only be used once. Store them securely!
							</div>
						</div>
					)}

					{/* Manage Step */}
					{step === 'manage' && (
						<div className="space-y-6">
							<div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
								<div className="flex items-center gap-3">
									<Check className="w-5 h-5 text-green-400" />
									<div>
										<div className="text-sm font-medium text-white">2FA is enabled</div>
										<div className="text-xs text-secondary-foreground mt-1">
											Your account is protected with two-factor authentication
										</div>
									</div>
								</div>
							</div>

							<div className="space-y-3">
								<button
									onClick={handleGenerateBackupCodes}
									disabled={loading}
									className="w-full p-4 bg-[#020617] border border-white/10 rounded-xl hover:border-white/20 transition-all text-left group"
								>
									<div className="flex items-center justify-between">
										<div>
											<div className="text-sm font-medium text-white group-hover:text-primary transition-colors">
												Generate New Backup Codes
											</div>
											<div className="text-xs text-secondary-foreground mt-1">
												Replace your existing backup codes with new ones
											</div>
										</div>
										{loading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
									</div>
								</button>

								<button
									onClick={handleDisable2FA}
									disabled={loading}
									className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:border-red-500/30 transition-all text-left group"
								>
									<div className="flex items-center gap-3">
										<AlertTriangle className="w-5 h-5 text-red-400" />
										<div>
											<div className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">
												Disable Two-Factor Authentication
											</div>
											<div className="text-xs text-red-400/70 mt-1">
												This will make your account less secure
											</div>
										</div>
									</div>
								</button>
							</div>

							{backupCodes.length > 0 && (
								<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
									<h4 className="text-sm font-medium text-white mb-3">Your Backup Codes</h4>
									<div className="grid grid-cols-2 gap-2 font-mono text-sm text-white mb-3">
										{backupCodes.map((code, index) => (
											<div key={index} className="p-2 bg-[#0f172a] rounded text-center">
												{code}
											</div>
										))}
									</div>
									<div className="flex gap-2">
										<button
											onClick={handleCopyBackupCodes}
											className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
										>
											<Copy size={16} />
											Copy
										</button>
										<button
											onClick={handleDownloadBackupCodes}
											className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all"
										>
											Download
										</button>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 sm:p-6 border-t border-white/10 flex-shrink-0 flex flex-col sm:flex-row gap-3 sm:justify-end">
					{step === 'overview' && (
						<>
							<button
								onClick={onClose}
								className="px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all order-2 sm:order-1"
							>
								Cancel
							</button>
							<button
								onClick={handleStartSetup}
								disabled={loading}
								className="px-4 sm:px-6 py-3 bg-primary hover:bg-primary text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2 order-1 sm:order-2"
							>
								{loading && <Loader2 className="w-4 h-4 animate-spin" />}
								Get Started
							</button>
						</>
					)}

					{step === 'setup' && (
						<>
							<button
								onClick={() => setStep('overview')}
								disabled={loading}
								className="px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all order-2 sm:order-1"
							>
								Back
							</button>
							<button
								onClick={handleVerify}
								disabled={loading || verificationCode.length !== 6}
								className="px-4 sm:px-6 py-3 bg-primary hover:bg-primary text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2 order-1 sm:order-2"
							>
								{loading && <Loader2 className="w-4 h-4 animate-spin" />}
								Verify & Enable
							</button>
						</>
					)}

					{step === 'backup-codes' && (
						<button
							onClick={onClose}
							className="px-4 sm:px-6 py-3 bg-primary hover:bg-primary text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20"
						>
							Done
						</button>
					)}

					{step === 'manage' && (
						<button
							onClick={onClose}
							className="px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 text-secondary-foreground rounded-lg text-sm font-medium transition-all"
						>
							Close
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
