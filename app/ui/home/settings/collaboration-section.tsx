'use client';

import { ToggleCard } from './toggle-card';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';

export function CollaborationSection() {
	const { preferences, updatePreferences } = useUserPreferences();

	return (
		<div className="pt-6 border-t border-white/10">
			<h3 className="text-lg font-bold text-white mb-2">Collaboration</h3>
			<p className="text-sm text-slate-400 mb-4">Control how you work with others</p>

			<div className="space-y-3">
				<ToggleCard
					title="Allow Comments"
					description="Let others comment on your boards"
					checked={preferences.allowCommenting}
					onChange={(checked) => updatePreferences({ allowCommenting: checked })}
				/>

				<ToggleCard
					title="Show Presence Indicators"
					description="Display who else is viewing the board"
					checked={preferences.showPresenceIndicators}
					onChange={(checked) => updatePreferences({ showPresenceIndicators: checked })}
				/>
			</div>
		</div>
	);
}
