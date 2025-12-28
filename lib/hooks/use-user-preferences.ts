'use client';

import { db } from '@/lib/instant/db';
import { UserPreferencesService, UserPreferences } from '@/lib/services/user-preferences-service';
import { useEffect, useState } from 'react';

export function useUserPreferences() {
	const { user } = db.useAuth();
	const [initializing, setInitializing] = useState(true);

	// Query user preferences
	const { data, isLoading, error } = db.useQuery({
		user_preferences: {
			$: {
				where: {
					user: user?.id,
				},
			},
		},
	});

	const preferences = data?.user_preferences?.[0];

	// Auto-create preferences if user exists but has none
	useEffect(() => {
		const initPreferences = async () => {
			if (!isLoading && user && !preferences) {
				await UserPreferencesService.createPreferences(user.id);
			}
			setInitializing(false);
		};
		initPreferences();
	}, [user, preferences, isLoading]);

	const updatePreferences = async (updates: Partial<UserPreferences>) => {
		if (!preferences?.id) return;
		await UserPreferencesService.updatePreferences(preferences.id, updates);
	};

	return {
		preferences: preferences || UserPreferencesService.getDefaults(),
		isLoading: isLoading || initializing,
		error,
		updatePreferences,
	};
}
