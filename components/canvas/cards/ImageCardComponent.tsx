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
		const naturalWidth = img.naturalWidth;
		const naturalHeight = img.naturalHeight;

		setImageDimensions({
			width: naturalWidth,
			height: naturalHeight
		});

		// Note: Height is now calculated before card creation in handleFileDrop
		// so we don't need to update it here
	}, []);

	// Event handlers
	const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		saveContent({ image_url: e.target.value });
	}, [saveContent]);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="image-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-accent/50 border border-white/10 w-full h-auto overflow-hidden">
			<div className="flex flex-col h-auto">
				{card.image_url ? (
					<>
						<div className="shrink-0 relative" style={{ width: '100%', height: '100%' }}>
							<Image
								src={card.image_url}
								alt={card.image_alt_text || 'Image'}
								width={card.width || 300}
								height={card.height || 300}
								className="w-full h-auto"
								onLoad={handleImageLoad}
							/>
						</div>
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
