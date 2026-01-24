'use client';

import { ToggleCard } from './toggle-card';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import { useDrawerPersistence } from '@/lib/hooks/use-drawer-persistence';

export function GeneralPreferencesSection() {
	const { preferences, isLoading, updatePreferences } = useUserPreferences();
	const { autoClose, updateAutoClose } = useDrawerPersistence();

	return (
		<div>
			<h3 className="text-lg font-bold text-white mb-2">General Settings</h3>
			<p className="text-sm text-secondary-foreground mb-4">Configure workspace behavior and defaults</p>

			{isLoading ? (<div></div>) : (
				<div className="space-y-3">
					<ToggleCard
						title="Auto-save"
						description="Automatically save changes as you work"
						checked={preferences.autoSaveEnabled}
						onChange={(checked) => updatePreferences({ autoSaveEnabled: checked })}
					/>

					<ToggleCard
						title="Compact Board Cards"
						description="Display nested boards as compact icons instead of full cards"
						checked={preferences.compactBoardCards}
						onChange={(checked) => updatePreferences({ compactBoardCards: checked })}
					/>

					<ToggleCard
						title="Import Drawer Auto-close"
						description="Automatically close the import drawer when clicking outside"
						checked={autoClose}
						onChange={updateAutoClose}
					/>

					<div className="p-4 bg-[#020617] border border-white/10 rounded-xl">
						<label className="block text-sm font-medium text-white mb-3">
							Default Board Color
						</label>
						<div className="flex items-center gap-4">
							<input
								type="color"
								value={preferences.defaultBoardColor}
								onChange={(e) => updatePreferences({ defaultBoardColor: e.target.value })}
								className="w-12 h-12 rounded-lg border-2 border-white/10 cursor-pointer bg-transparent"
							/>
							<div>
								<div className="text-sm text-white font-mono">{preferences.defaultBoardColor}</div>
								<div className="text-xs text-muted-foreground">Choose your preferred board color</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
