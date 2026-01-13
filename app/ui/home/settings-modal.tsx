'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Settings, Palette, Bell, CreditCard, Shield, Link2 } from 'lucide-react';
import { ProfileSection } from './settings/profile-section';
import { AppearanceSection } from './settings/appearance-section';
import { GeneralPreferencesSection } from './settings/general-preferences-section';
import { CollaborationSection } from './settings/collaboration-section';
import { NotificationsSection } from './settings/notifications-section';
import { BillingSection } from './settings/billing-section';
import { SecuritySection } from './settings/security-section';
import { ConnectedAccountsSection } from './settings/connected-accounts-section';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type SectionId = 'profile' | 'preferences' | 'appearance' | 'notifications' | 'billing' | 'security' | 'connected_accounts';

const SECTIONS = [
	{ id: 'profile' as SectionId, label: 'Profile', icon: User },
	{ id: 'preferences' as SectionId, label: 'Preferences', icon: Settings },
	{ id: 'appearance' as SectionId, label: 'Appearance', icon: Palette },
	{ id: 'billing' as SectionId, label: 'Billing', icon: CreditCard },
	{ id: 'security' as SectionId, label: 'Security', icon: Shield },
	{ id: 'connected_accounts' as SectionId, label: 'Connections', icon: Link2 },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const modalRef = useRef<HTMLDivElement | null>(null);
	const [activeSection, setActiveSection] = useState<SectionId>('profile');

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const modalContent = (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
			<div ref={modalRef} className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-[90vw] max-w-6xl h-[85vh] flex overflow-hidden m-4 will-change-transform">

				{/* Sidebar Navigation */}
				<div className="w-64 border-r border-white/10 p-6 flex flex-col">
					<div className="mb-8">
						<h2 className="text-2xl font-bold text-white">Settings</h2>
						<p className="text-sm text-secondary-foreground mt-1">Manage your account</p>
					</div>

					<nav className="space-y-1 flex-1">
						{SECTIONS.map((section) => {
							const Icon = section.icon;
							return (
								<button
									key={section.id}
									onClick={() => setActiveSection(section.id)}
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 ${
										activeSection === section.id
											? 'bg-primary text-white shadow-lg shadow-primary/20'
											: 'text-secondary-foreground hover:bg-white/5 hover:text-white'
									}`}
								>
									<Icon size={18} />
									<span className="font-medium">{section.label}</span>
								</button>
							);
						})}
					</nav>

					<div className="pt-4 border-t border-white/10 mt-4">
						<div className="text-xs text-muted-foreground">
							<div className="flex items-center justify-between mb-1">
								<span>Version</span>
								<span className="text-secondary-foreground font-mono">1.0.0</span>
							</div>
						</div>
					</div>
				</div>

				{/* Content Area */}
				<div className="flex-1 flex flex-col">
					{/* Header with Close Button */}
					<div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
						<div>
							<h3 className="text-xl font-semibold text-white">
								{SECTIONS.find(s => s.id === activeSection)?.label}
							</h3>
						</div>
						<button
							onClick={onClose}
							className="p-2 rounded-lg text-secondary-foreground hover:text-white hover:bg-white/5 transition-colors duration-150"
						>
							<X size={20} />
						</button>
					</div>

					{/* Scrollable Content */}
					<div className="flex-1 overflow-y-auto px-8 py-6 will-change-scroll overscroll-contain">
						{activeSection === 'profile' && <ProfileSection />}
						{activeSection === 'preferences' && (
							<div className="space-y-8">
								<GeneralPreferencesSection />
								<CollaborationSection />
								<NotificationsSection />
							</div>
						)}
						{activeSection === 'appearance' && <AppearanceSection />}
						{activeSection === 'billing' && <BillingSection />}
						{activeSection === 'security' && <SecuritySection />}
						{activeSection === 'connected_accounts' && <ConnectedAccountsSection />}
					</div>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}