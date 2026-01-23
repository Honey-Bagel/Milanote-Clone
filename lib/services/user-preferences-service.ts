import { db } from '@/lib/instant/db';
import { tx, id } from '@instantdb/react';

export interface UserPreferences {
	defaultBoardColor: string;
	autoSaveEnabled: boolean;
	gridSnapEnabled: boolean;
	compactBoardCards: boolean;
	emailNotifications: boolean;
	boardActivityNotifications: boolean;
	shareNotifications: boolean;
	weeklyDigest: boolean;
	allowCommenting: boolean;
	showPresenceIndicators: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
	defaultBoardColor: '#6366f1',
	autoSaveEnabled: true,
	gridSnapEnabled: true,
	compactBoardCards: false,
	emailNotifications: true,
	boardActivityNotifications: true,
	shareNotifications: true,
	weeklyDigest: false,
	allowCommenting: true,
	showPresenceIndicators: true,
};

export const UserPreferencesService = {
	getDefaults: (): UserPreferences => ({ ...DEFAULT_PREFERENCES }),

	createPreferences: async (userId: string) => {
		const prefsId = id();
		await db.transact([
			tx.user_preferences[prefsId].update({
				...DEFAULT_PREFERENCES,
				created_at: Date.now(),
				updated_at: Date.now(),
			}).link({ user: userId }),
		]);
		return prefsId;
	},

	updatePreferences: async (prefsId: string, updates: Partial<UserPreferences>) => {
		await db.transact([
			tx.user_preferences[prefsId].update({
				...updates,
				updated_at: Date.now(),
			}),
		]);
	},
};
