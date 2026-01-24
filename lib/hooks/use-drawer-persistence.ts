'use client';

import { useState, useCallback } from 'react';

export type SortField = 'name' | 'date';
export type SortDirection = 'asc' | 'desc';
export type ItemsPerRow = 1 | 2;

interface DrawerPreferences {
	width: number;        // 280-800px
	autoClose: boolean;   // Click-outside behavior
	sortField: SortField;
	sortDirection: SortDirection;
	itemsPerRow: ItemsPerRow;
	version: number;      // For future migrations
}

const STORAGE_KEY = 'import-drawer-prefs';
const DEFAULT_PREFS: DrawerPreferences = {
	width: 384,
	autoClose: true,
	sortField: 'date',
	sortDirection: 'desc',
	itemsPerRow: 1,
	version: 2
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
				sortField: ['name', 'date'].includes(parsed.sortField) ? parsed.sortField : DEFAULT_PREFS.sortField,
				sortDirection: ['asc', 'desc'].includes(parsed.sortDirection) ? parsed.sortDirection : DEFAULT_PREFS.sortDirection,
				itemsPerRow: [1, 2].includes(parsed.itemsPerRow) ? parsed.itemsPerRow : DEFAULT_PREFS.itemsPerRow,
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

	const updateSortField = useCallback((sortField: SortField) => {
		const newPrefs = { ...preferences, sortField };
		setPreferences(newPrefs);
		savePreferences(newPrefs);
	}, [preferences]);

	const updateSortDirection = useCallback((sortDirection: SortDirection) => {
		const newPrefs = { ...preferences, sortDirection };
		setPreferences(newPrefs);
		savePreferences(newPrefs);
	}, [preferences]);

	const updateItemsPerRow = useCallback((itemsPerRow: ItemsPerRow) => {
		const newPrefs = { ...preferences, itemsPerRow };
		setPreferences(newPrefs);
		savePreferences(newPrefs);
	}, [preferences]);

	return {
		width: preferences.width,
		autoClose: preferences.autoClose,
		sortField: preferences.sortField,
		sortDirection: preferences.sortDirection,
		itemsPerRow: preferences.itemsPerRow,
		updateWidth,
		updateAutoClose,
		updateSortField,
		updateSortDirection,
		updateItemsPerRow
	};
}
