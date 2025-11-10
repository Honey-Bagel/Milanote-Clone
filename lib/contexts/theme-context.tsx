'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Define available themes
export type ThemeName = 'dark' | 'light' | 'ocean' | 'sunset' | 'forest' | 'purple-haze' | 'midnight';

export interface Theme {
	name: ThemeName;
	displayName: string;
	colors: {
		background: string;
		foreground: string;
		primary: string;
		secondary: string;
		accent: string;
		muted: string;
		border: string;
		card: string;
		cardHover: string;
		input: string;
		ring: string;
	};
}

// Theme presets
export const themes: Record<ThemeName, Theme> = {
	dark: {
		name: 'dark',
		displayName: 'Dark',
		colors: {
			background: '#111827',
			foreground: '#ffffff',
			primary: '#3b82f6',
			secondary: '#1f2937',
			accent: '#8b5cf6',
			muted: '#6b7280',
			border: '#4b5563',
			card: '#1f2937',
			cardHover: '#374151',
			input: '#374151',
			ring: '#3b82f6',
		},
	},
	light: {
		name: 'light',
		displayName: 'Light',
		colors: {
			background: '#ffffff',
			foreground: '#0f172a',
			primary: '#3b82f6',
			secondary: '#f1f5f9',
			accent: '#8b5cf6',
			muted: '#64748b',
			border: '#e2e8f0',
			card: '#f8fafc',
			cardHover: '#f1f5f9',
			input: '#f1f5f9',
			ring: '#3b82f6',
		},
	},
	ocean: {
		name: 'ocean',
		displayName: 'Ocean',
		colors: {
			background: '#0c1821',
			foreground: '#e0f2fe',
			primary: '#06b6d4',
			secondary: '#164e63',
			accent: '#3b82f6',
			muted: '#475569',
			border: '#334155',
			card: '#164e63',
			cardHover: '#0e7490',
			input: '#0e7490',
			ring: '#06b6d4',
		},
	},
	sunset: {
		name: 'sunset',
		displayName: 'Sunset',
		colors: {
			background: '#1e1410',
			foreground: '#fef3c7',
			primary: '#f59e0b',
			secondary: '#78350f',
			accent: '#ef4444',
			muted: '#78716c',
			border: '#57534e',
			card: '#78350f',
			cardHover: '#92400e',
			input: '#92400e',
			ring: '#f59e0b',
		},
	},
	forest: {
		name: 'forest',
		displayName: 'Forest',
		colors: {
			background: '#0f1a13',
			foreground: '#d1fae5',
			primary: '#10b981',
			secondary: '#14532d',
			accent: '#84cc16',
			muted: '#6b7280',
			border: '#374151',
			card: '#14532d',
			cardHover: '#166534',
			input: '#166534',
			ring: '#10b981',
		},
	},
	'purple-haze': {
		name: 'purple-haze',
		displayName: 'Purple Haze',
		colors: {
			background: '#1a0f1e',
			foreground: '#f3e8ff',
			primary: '#a855f7',
			secondary: '#581c87',
			accent: '#ec4899',
			muted: '#71717a',
			border: '#52525b',
			card: '#581c87',
			cardHover: '#6b21a8',
			input: '#6b21a8',
			ring: '#a855f7',
		},
	},
	midnight: {
		name: 'midnight',
		displayName: 'Midnight',
		colors: {
			background: '#020617',
			foreground: '#f1f5f9',
			primary: '#60a5fa',
			secondary: '#1e293b',
			accent: '#818cf8',
			muted: '#64748b',
			border: '#334155',
			card: '#0f172a',
			cardHover: '#1e293b',
			input: '#1e293b',
			ring: '#60a5fa',
		},
	},
};

interface ThemeContextType {
	currentTheme: Theme;
	setTheme: (themeName: ThemeName) => void;
	availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [currentTheme, setCurrentTheme] = useState<Theme>(themes.dark);
	const [mounted, setMounted] = useState(false);

	// Load theme from localStorage on mount
	useEffect(() => {
		setMounted(true);
		const savedTheme = localStorage.getItem('milanote-theme') as ThemeName;
		if (savedTheme && themes[savedTheme]) {
			setCurrentTheme(themes[savedTheme]);
		}
	}, []);

	// Apply theme to document
	useEffect(() => {
		if (!mounted) return;

		const root = document.documentElement;
		const theme = currentTheme.colors;

		// Apply CSS variables
		root.style.setProperty('--background', theme.background);
		root.style.setProperty('--foreground', theme.foreground);
		root.style.setProperty('--primary', theme.primary);
		root.style.setProperty('--secondary', theme.secondary);
		root.style.setProperty('--accent', theme.accent);
		root.style.setProperty('--muted', theme.muted);
		root.style.setProperty('--border', theme.border);
		root.style.setProperty('--card', theme.card);
		root.style.setProperty('--card-hover', theme.cardHover);
		root.style.setProperty('--input', theme.input);
		root.style.setProperty('--ring', theme.ring);

		// Save to localStorage
		localStorage.setItem('milanote-theme', currentTheme.name);
	}, [currentTheme, mounted]);

	const setTheme = (themeName: ThemeName) => {
		if (themes[themeName]) {
			setCurrentTheme(themes[themeName]);
		}
	};

	const availableThemes = Object.values(themes);

	// Prevent flash of unstyled content
	if (!mounted) {
		return null;
	}

	return (
		<ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}