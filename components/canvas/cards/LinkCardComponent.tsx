/**
 * Link Card Component
 *
 * Uses CardContext for shared state and persistence.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { LinkCard } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';
import Image from 'next/image';
import { useDraggable } from '@dnd-kit/core';

// ============================================================================
// PROPS INTERFACE (for legacy compatibility with CardRenderer)
// ============================================================================

interface LinkCardComponentProps {
	card: LinkCard;
	isEditing: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LinkCardComponent({
	card: propCard,
	isEditing: propIsEditing,
}: LinkCardComponentProps) {
	// Try to use context, fall back to props for backwards compatibility
	const context = useOptionalCardContext();

	// Use context values if available, otherwise use props
	const card = (context?.card as LinkCard) ?? propCard;
	const isEditing = context?.isEditing ?? propIsEditing;
	const { saveContent, stopEditing } = context ?? {
		saveContent: () => {},
		stopEditing: () => {},
	};

	const { isDragging } = useDraggable({ id: card.id });

	// Local state for text inputs
	const [localTitle, setLocalTitle] = useState(card.link_title || '');
	const [localUrl, setLocalUrl] = useState(card.link_url || '');

	// Use refs for input elements
	const titleInputRef = useRef<HTMLInputElement>(null);
	const urlInputRef = useRef<HTMLInputElement>(null);

	// Track previous editing state to save on exit
	const wasEditingRef = useRef(isEditing);
	const justSavedRef = useRef(false);

	// Save when exiting edit mode (e.g., clicking on canvas)
	useEffect(() => {
		if (wasEditingRef.current && !isEditing) {
			// Was editing, now not - save the current local state
			saveContent({ link_title: localTitle, link_url: localUrl });
			justSavedRef.current = true;
		}
		wasEditingRef.current = isEditing;
	}, [isEditing, localTitle, localUrl, saveContent]);

	// Sync local state when card changes from DB and not editing
	useEffect(() => {
		if (!isEditing) {
			// Skip sync if we just saved - wait for DB to catch up
			if (justSavedRef.current) {
				justSavedRef.current = false;
				return;
			}
			setLocalTitle(card.link_title || '');
			setLocalUrl(card.link_url || '');
		}
	}, [card.link_title, card.link_url, isEditing]);

	// Compute full URL (derived state, not effect)
	const fullURL = useMemo(() => {
		if (!card.link_url) return null;
		return card.link_url.startsWith("https://") || card.link_url.startsWith("http://")
			? card.link_url
			: "https://" + card.link_url;
	}, [card.link_url]);

	// Track previous URL to reset error state
	const prevUrlRef = useRef(fullURL);

	// Compute favicon URL and error state together
	const faviconUrl = useMemo(() => {
		if (!fullURL) return '';
		try {
			const domain = new URL(fullURL).hostname;
			return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
		} catch {
			return '';
		}
	}, [fullURL]);

	// Track favicon error - reset when URL changes during render
	const [faviconError, setFaviconError] = useState(false);
	if (prevUrlRef.current !== fullURL) {
		prevUrlRef.current = fullURL;
		if (faviconError) {
			setFaviconError(false);
		}
	}

	// Handle Enter key to exit editing
	useEffect(() => {
		const handleEnterKeyPressed = (e: KeyboardEvent) => {
			if (!isEditing) return;
			const isMod = e.metaKey || e.ctrlKey;
			if (isMod || e.key !== 'Enter') return;

			stopEditing();
		};

		document.addEventListener('keydown', handleEnterKeyPressed);
		return () => {
			document.removeEventListener('keydown', handleEnterKeyPressed);
		};
	}, [isEditing, stopEditing]);

	// Event handlers - use local state with blur save
	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalTitle(e.target.value);
	}, []);

	const handleTitleBlur = useCallback(() => {
		saveContent({ link_title: localTitle });
	}, [saveContent, localTitle]);

	const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalUrl(e.target.value);
	}, []);

	const handleUrlBlur = useCallback(() => {
		saveContent({ link_url: localUrl });
	}, [saveContent, localUrl]);

	// ========================================================================
	// EDITING MODE
	// ========================================================================

	if (isEditing) {
		return (
			<div className="link-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-accent/50 border border-white/10 w-full">
				<div className="block p-4 transition-colors">
					<div className="space-y-2">
						<div>
							<label className="text-xs text-secondary-foreground block mb-1">Title</label>
							<input
								ref={titleInputRef}
								type="text"
								value={localTitle}
								onChange={handleTitleChange}
								onBlur={handleTitleBlur}
								className="w-full px-2 py-1 text-sm bg-slate-700/50 text-foreground border border-white/10 rounded focus:ring-1 focus:ring-ring outline-none"
								placeholder="Link title"
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
						<div>
							<label className="text-xs text-secondary-foreground block mb-1">URL</label>
							<input
								ref={urlInputRef}
								type="url"
								value={localUrl}
								onChange={handleUrlChange}
								onBlur={handleUrlBlur}
								className="w-full px-2 py-1 text-sm bg-slate-700/50 text-foreground border border-white/10 rounded focus:ring-1 focus:ring-ring outline-none"
								placeholder="https://example.com"
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// ========================================================================
	// VIEW MODE
	// ========================================================================

	return (
		<div className="link-card group/link-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-accent/50 border border-white/10 cursor-pointer group w-full h-full">
			<a
				href={!isDragging ? (fullURL || '') : undefined}
				target="_blank"
				rel="noopener noreferrer"
				style={{
					pointerEvents: isDragging ? 'none' : 'auto',
				}}
				className="block p-4 transition-colors"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start gap-3">
					{/* Favicon or fallback icon */}
					<div className="w-10 h-10 flex items-center justify-center shrink-0">
						{!faviconError && faviconUrl ? (
							<Image
								src={faviconUrl}
								alt=""
								className="w-5 h-5"
								width={18}
								height={18}
								onError={() => setFaviconError(true)}
							/>
						) : (
							<svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-sm text-white mb-1 group-hover/link-card:text-accent transition-colors truncate">
							{card.link_title || card.link_url}
						</h3>
						{fullURL && (
							<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
								<svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
								</svg>
								<span className="truncate">{new URL(fullURL).hostname}</span>
							</div>
						)}
					</div>
				</div>
			</a>
		</div>
	);
}
