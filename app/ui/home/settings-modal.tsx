'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { UserProfile } from '@clerk/nextjs';
import { ThemeSwitcherList } from '@/components/ui/theme-switcher';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface UserPreferences {
	defaultBoardColor: string;
	autoSaveEnabled: boolean;
	gridSnapEnabled: boolean;
	emailNotifications: boolean;
	boardActivityNotifications: boolean;
	shareNotifications: boolean;
	weeklyDigest: boolean;
	allowCommenting: boolean;
	showPresenceIndicators: boolean;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
	const modalRef = useRef<HTMLDivElement | null>(null);

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
			document.addEventListener('mousedown', handleClickOutside);
			// Load preferences from database here
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const showMessage = (type: 'success' | 'error', text: string) => {
		setMessage({ type, text });
		setTimeout(() => setMessage(null), 3000);
	};

	const handleSavePreferences = async () => {
		setSaving(true);
		try {
			// Save preferences to your database here
			showMessage('success', 'Preferences saved successfully!');
		} catch (error) {
			console.error('Error saving preferences:', error);
			showMessage('error', 'Failed to save preferences');
		} finally {
			setSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div ref={modalRef} className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				{/* Message Banner */}
				{message && (
					<div className={`px-6 py-3 border-b ${
						message.type === 'success' 
							? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
							: 'bg-red-500/10 border-red-500/20 text-red-400'
					}`}>
						<p className="text-sm font-medium">{message.text}</p>
					</div>
				)}

				{/* Clerk UserProfile with Custom Pages */}
				<div className="flex-1 overflow-hidden">
					<UserProfile 
						routing="hash"
						appearance={{
							elements: {
								rootBox: "w-full h-full",
								card: "bg-transparent shadow-none border-0 w-full h-full",
								
								// Navbar
								navbar: "bg-[#020617] border-b border-white/10 px-6",
								navbarButton: "text-slate-300 hover:text-white hover:bg-white/5 rounded-lg data-[active]:bg-indigo-500/20 data-[active]:text-indigo-400",
								navbarMobileMenuButton: "text-slate-300",
								
								// Page content
								page: "bg-[#0f172a]",
								pageScrollBox: "bg-[#0f172a] px-6 py-6",
								
								// Headers
								headerTitle: "text-white text-xl font-bold",
								headerSubtitle: "text-slate-400 text-sm",
								
								// Form elements
								formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white font-medium rounded-lg",
								formButtonReset: "text-slate-400 hover:text-white hover:bg-white/5",
								
								// Input fields
								formFieldInput: "bg-[#020617] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-slate-500",
								formFieldLabel: "text-slate-400 text-sm font-medium",
								formFieldInputShowPasswordButton: "text-slate-400 hover:text-white",
								
								// Profile section
								profileSection: "bg-[#0f172a] border-b border-white/10 pb-6",
								profileSectionTitle: "text-white font-bold text-base",
								profileSectionPrimaryButton: "text-indigo-400 hover:text-indigo-300",
								profileSectionContent: "text-slate-300 text-sm",
								
								// Avatar
								avatarBox: "border-2 border-white/10",
								
								// Divider
								dividerLine: "bg-white/10",
								dividerText: "text-slate-400 text-xs",
								
								// Badge
								badge: "bg-indigo-500/20 text-indigo-400 text-xs",
								
								// Footer
								footer: "bg-[#020617] border-t border-white/10",
								footerActionText: "text-slate-400 text-sm",
								footerActionLink: "text-indigo-400 hover:text-indigo-300",
								
								// Modal
								modalContent: "bg-[#0f172a] border border-white/10",
								modalCloseButton: "text-slate-400 hover:text-white",
								modalBackdrop: "bg-black/60 backdrop-blur-sm",
								
								// Table
								tableHead: "bg-[#020617] text-slate-400 text-xs uppercase tracking-wider",
								table: "border border-white/10",
								
								// Accordion
								accordionTriggerButton: "text-slate-300 hover:text-white bg-[#020617] hover:bg-white/5 border border-white/10 rounded-lg",
								accordionContent: "bg-[#020617] text-slate-300 border border-white/10 rounded-lg mt-2",
								
								// Form field row
								formFieldRow: "gap-4",
							},
							variables: {
								colorPrimary: "#6366f1",
								colorBackground: "#0f172a",
								colorText: "#ffffff",
								colorTextSecondary: "#94a3b8",
								colorInputBackground: "#020617",
								colorInputText: "#ffffff",
								borderRadius: "0.5rem",
							},
						}}
					>
						{/* Add custom "Preferences" page */}
						<UserProfile.Page 
							label="Preferences" 
							labelIcon={
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
								</svg>
							}
							url="preferences"
						>
							<div className="space-y-8">
								{/* Theme Section */}
								<div>
									<h3 className="text-lg font-bold text-white mb-2">Appearance</h3>
									<p className="text-sm text-slate-400 mb-4">Customize how the interface looks</p>
									<div className="space-y-4">
										<div>
											<label className="block text-sm font-medium text-slate-400 mb-3">
												Theme
											</label>
											<ThemeSwitcherList />
										</div>
									</div>
								</div>

								{/* General Preferences */}
								<div className="pt-6 border-t border-white/10">
									<h3 className="text-lg font-bold text-white mb-2">General Settings</h3>
									<p className="text-sm text-slate-400 mb-4">Configure workspace behavior and defaults</p>
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
													className="w-12 h-12 rounded-lg border-2 border-white/10 cursor-pointer bg-transparent"
												/>
												<div>
													<div className="text-sm text-white font-mono">{preferences.defaultBoardColor}</div>
													<div className="text-xs text-slate-500">Choose your preferred board color</div>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Notifications */}
								<div className="pt-6 border-t border-white/10">
									<h3 className="text-lg font-bold text-white mb-2">Notifications</h3>
									<p className="text-sm text-slate-400 mb-4">Manage how you receive updates</p>
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

								{/* Collaboration */}
								<div className="pt-6 border-t border-white/10">
									<h3 className="text-lg font-bold text-white mb-2">Collaboration</h3>
									<p className="text-sm text-slate-400 mb-4">Control how you work with others</p>
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
										onClick={handleSavePreferences}
										disabled={saving}
										className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-500/20"
									>
										{saving ? 'Saving Preferences...' : 'Save Preferences'}
									</button>
								</div>
							</div>
						</UserProfile.Page>
					</UserProfile>
				</div>
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