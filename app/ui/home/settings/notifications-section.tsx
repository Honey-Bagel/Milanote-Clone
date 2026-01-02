'use client';

import { ToggleCard } from './toggle-card';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';

export function NotificationsSection() {
	const { preferences, updatePreferences } = useUserPreferences();

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-lg font-bold text-white mb-2">Notifications</h3>
				<p className="text-sm text-secondary-foreground mb-4">Manage how you receive updates</p>

				<div className="space-y-3">
					<ToggleCard
						title="Email Notifications"
						description="Receive important updates via email"
						checked={preferences.emailNotifications}
						onChange={(checked) => updatePreferences({ emailNotifications: checked })}
					/>

					<ToggleCard
						title="Board Activity"
						description="Get notified when boards are updated"
						checked={preferences.boardActivityNotifications}
						onChange={(checked) => updatePreferences({ boardActivityNotifications: checked })}
					/>

					<ToggleCard
						title="Share Notifications"
						description="Notify when someone shares a board with you"
						checked={preferences.shareNotifications}
						onChange={(checked) => updatePreferences({ shareNotifications: checked })}
					/>

					<ToggleCard
						title="Weekly Digest"
						description="Receive a weekly summary of activity"
						checked={preferences.weeklyDigest}
						onChange={(checked) => updatePreferences({ weeklyDigest: checked })}
					/>
				</div>
			</div>
		</div>
	);
}
