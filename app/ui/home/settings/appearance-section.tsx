'use client';

import { ThemeSwitcherList } from '@/components/ui/theme-switcher';

export function AppearanceSection() {
	return (
		<div>
			<h3 className="text-lg font-bold text-white mb-2">Appearance</h3>
			<p className="text-sm text-slate-400 mb-4">Customize how the interface looks</p>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-slate-400 mb-3">Theme</label>
					<ThemeSwitcherList />
				</div>
			</div>
		</div>
	);
}
