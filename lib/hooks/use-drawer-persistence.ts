'use client';

import { useState, useCallback } from 'react';

interface DrawerPreferences {
	width: number;        // 300-800px
	autoClose: boolean;   // Click-outside behavior
	version: number;      // For future migrations
}

const STORAGE_KEY = 'import-drawer-prefs';
const DEFAULT_PREFS: DrawerPreferences = {
	width: 384,
	autoClose: true,
	version: 1
};

function getStoredPreferences(): DrawerPreferences {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Validate the stored data
			return {
				width: typeof parsed.width === 'number' ? parsed.width : DEFAULT_PREFS.width,
				autoClose: typeof parsed.autoClose === 'boolean' ? parsed.autoClose : DEFAULT_PREFS.autoClose,
				version: parsed.version || DEFAULT_PREFS.version,
			};
		}
	} catch (error) {
		console.error('[useDrawerPersistence] Failed to load preferences:', error);
	}
	return DEFAULT_PREFS;
}

function savePreferences(preferences: DrawerPreferences): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
	} catch (error) {
		console.error('[useDrawerPersistence] Failed to save preferences:', error);
	}
}

export function useDrawerPersistence() {
	const [preferences, setPreferences] = useState<DrawerPreferences>(getStoredPreferences);

	const updateWidth = useCallback((width: number) => {
		const newPrefs = { ...preferences, width };
		setPreferences(newPrefs);
		savePreferences(newPrefs);
	}, [preferences]);

	const updateAutoClose = useCallback((autoClose: boolean) => {
		const newPrefs = { ...preferences, autoClose };
		setPreferences(newPrefs);
		savePreferences(newPrefs);
	}, [preferences]);

	return {
		width: preferences.width,
		autoClose: preferences.autoClose,
		updateWidth,
		updateAutoClose
	};
}
