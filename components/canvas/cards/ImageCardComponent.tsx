/**
 * Image Card Component
 *
 * Uses CardContext for shared state and persistence.
 */

'use client';

import { useState, useCallback } from 'react';
import type { ImageCard } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';
import Image from 'next/image';

// ============================================================================
// PROPS INTERFACE (for legacy compatibility with CardRenderer)
// ============================================================================

interface ImageCardComponentProps {
	card: ImageCard;
	isEditing: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ImageCardComponent({
	card: propCard,
	isEditing: propIsEditing,
}: ImageCardComponentProps) {
	// Try to use context, fall back to props for backwards compatibility
	const context = useOptionalCardContext();

	// Use context values if available, otherwise use props
	const card = (context?.card as ImageCard) ?? propCard;
	const isEditing = context?.isEditing ?? propIsEditing;
	const { saveContent } = context ?? {
		saveContent: () => {},
	};

	const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

	// Handle image load to update dimensions
	const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget as HTMLImageElement;
		setImageDimensions({
			width: img.naturalWidth,
			height: img.naturalHeight
		});

		// Update card height based on aspect ratio
		if (card.width) {
			const aspectRatio = img.naturalHeight / img.naturalWidth;
			const newHeight = Math.round(card.width * aspectRatio);

			if (card.height !== newHeight) {
				// Use saveContent to update height (goes through transform update)
				// Note: height updates go through CardService.updateCardTransform
				// For now, we'll let the parent handle this via dimensions hook
			}
		}
	}, [card.width, card.height]);

	// Event handlers
	const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ image_url: e.target.value });
	}, [saveContent]);

	const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ image_caption: e.target.value });
	}, [saveContent]);

	const handleAltTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ image_alt_text: e.target.value });
	}, [saveContent]);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="image-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-accent/50 border border-white/10 rounded-lg w-full h-full overflow-hidden">
			<div className="flex flex-col h-full">
				{card.image_url ? (
					<>
						<div className="flex-shrink-0 relative" style={{ width: '100%', height: 'auto' }}>
							<Image
								src={card.image_url}
								alt={card.image_alt_text || 'Image'}
								width={card.width || 300}
								height={card.height || 300}
								className="w-full h-auto"
								sizes="(max-width: 1200px) 100vw, 1200px"
								onLoad={handleImageLoad}
							/>
						</div>
						{isEditing && (
							<div className="p-3 space-y-2 bg-secondary/50 border-t border-white/10">
								<input
									type="text"
									value={card.image_caption || ''}
									onChange={handleCaptionChange}
									className="w-full px-2 py-1 text-xs bg-slate-700/50 text-foreground border border-white/10 rounded focus:ring-1 focus:ring-ring outline-none"
									placeholder="Caption (optional)"
									onClick={(e) => e.stopPropagation()}
								/>
								<input
									type="text"
									value={card.image_alt_text || ''}
									onChange={handleAltTextChange}
									className="w-full px-2 py-1 text-xs bg-slate-700/50 text-foreground border border-white/10 rounded focus:ring-1 focus:ring-ring outline-none"
									placeholder="Alt text (optional)"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						)}
					</>
				) : (
					<div className="p-4 h-full">
						{isEditing ? (
							<div className="space-y-2">
								<label className="text-xs text-secondary-foreground block">Image URL</label>
								<input
									type="url"
									value={card.image_url || ''}
									onChange={handleImageUrlChange}
									className="w-full px-2 py-1 text-sm bg-slate-700/50 text-foreground border border-white/10 rounded focus:ring-1 focus:ring-ring outline-none"
									placeholder="https://example.com/image.jpg"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						) : (
							<div className="flex items-center justify-center h-full bg-secondary/50 text-secondary-foreground rounded">
								No image
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
