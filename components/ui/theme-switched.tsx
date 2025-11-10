'use client';

import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, type ThemeName } from '@/lib/contexts/theme-context';

export function ThemeSwitcher() {
	const { currentTheme, setTheme, availableThemes } = useTheme();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] text-[var(--foreground)]"
				aria-label="Change theme"
			>
				<Palette className="w-5 h-5" />
				<span className="text-sm font-medium">{currentTheme.displayName}</span>
			</button>

			{isOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>

					{/* Theme Selector Dropdown */}
					<div className="absolute right-0 mt-2 w-80 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-2xl z-50 overflow-hidden">
						<div className="p-4 border-b border-[var(--border)]">
							<h3 className="text-lg font-semibold text-[var(--foreground)]">Choose Theme</h3>
							<p className="text-sm text-[var(--muted)] mt-1">
								Select your preferred color scheme
							</p>
						</div>

						<div className="p-3 max-h-96 overflow-y-auto">
							<div className="grid grid-cols-2 gap-3">
								{availableThemes.map((theme) => (
									<button
										key={theme.name}
										onClick={() => {
											setTheme(theme.name as ThemeName);
											setIsOpen(false);
										}}
										className={`relative group p-3 rounded-lg border-2 transition-all duration-200 ${
											currentTheme.name === theme.name
												? 'border-[var(--primary)] shadow-lg'
												: 'border-transparent hover:border-[var(--border)]'
										}`}
										style={{
											backgroundColor: theme.colors.background,
										}}
									>
										{/* Theme Preview */}
										<div className="space-y-2">
											<div className="flex items-center justify-between mb-2">
												<span
													className="text-sm font-medium"
													style={{ color: theme.colors.foreground }}
												>
													{theme.displayName}
												</span>
												{currentTheme.name === theme.name && (
													<Check
														className="w-4 h-4"
														style={{ color: theme.colors.primary }}
													/>
												)}
											</div>

											{/* Color Palette Preview */}
											<div className="flex space-x-1">
												<div
													className="w-full h-2 rounded"
													style={{ backgroundColor: theme.colors.primary }}
												/>
												<div
													className="w-full h-2 rounded"
													style={{ backgroundColor: theme.colors.accent }}
												/>
												<div
													className="w-full h-2 rounded"
													style={{ backgroundColor: theme.colors.secondary }}
												/>
											</div>

											{/* Mini UI Preview */}
											<div className="space-y-1 mt-2">
												<div
													className="h-4 rounded"
													style={{ backgroundColor: theme.colors.card }}
												/>
												<div
													className="h-3 w-3/4 rounded"
													style={{ backgroundColor: theme.colors.muted }}
												/>
											</div>
										</div>

										{/* Hover Effect */}
										<div
											className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"
											style={{ backgroundColor: theme.colors.foreground }}
										/>
									</button>
								))}
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

// Compact version for toolbar
export function ThemeSwitcherCompact() {
	const { currentTheme, setTheme, availableThemes } = useTheme();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="p-2 rounded-lg transition-all duration-200 bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)]"
				aria-label="Change theme"
				title={`Current theme: ${currentTheme.displayName}`}
			>
				<Palette className="w-5 h-5 text-[var(--foreground)]" />
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>

					<div className="absolute right-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden">
						<div className="p-2">
							{availableThemes.map((theme) => (
								<button
									key={theme.name}
									onClick={() => {
										setTheme(theme.name as ThemeName);
										setIsOpen(false);
									}}
									className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
										currentTheme.name === theme.name
											? 'bg-[var(--primary)] bg-opacity-20'
											: 'hover:bg-[var(--card-hover)]'
									}`}
								>
									<div className="flex items-center space-x-2">
										<div
											className="w-4 h-4 rounded-full border border-[var(--border)]"
											style={{ backgroundColor: theme.colors.primary }}
										/>
										<span className="text-sm text-[var(--foreground)]">
											{theme.displayName}
										</span>
									</div>
									{currentTheme.name === theme.name && (
										<Check className="w-4 h-4 text-[var(--primary)]" />
									)}
								</button>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}