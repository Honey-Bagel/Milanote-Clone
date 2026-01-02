/**
 * File Card Component
 *
 * Uses CardContext for shared state and persistence.
 */

'use client';

import type { FileCard } from '@/lib/types';
import { useOptionalCardContext } from './CardContext';

// ============================================================================
// PROPS INTERFACE (for legacy compatibility with CardRenderer)
// ============================================================================

interface FileCardComponentProps {
	card: FileCard;
	isEditing: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileCardComponent({
	card: propCard,
	isEditing: propIsEditing,
}: FileCardComponentProps) {
	// Try to use context, fall back to props for backwards compatibility
	const context = useOptionalCardContext();

	// Use context values if available, otherwise use props
	const card = (context?.card as FileCard) ?? propCard;

	// Format file size helper
	const formatFileSize = (bytes: number | null) => {
		if (!bytes) return 'Unknown size';
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		return `${(kb / 1024).toFixed(1)} MB`;
	};

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="file-card bg-[#1e293b]/90 backdrop-blur-xl shadow-xl hover:border-accent/50 border border-white/10 rounded-lg w-full h-full">
			<a
				href={card.file_url}
				target="_blank"
				rel="noopener noreferrer"
				className="block p-4 hover:bg-white/5 transition-colors h-full"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent font-semibold text-xs border border-accent/30">
						{card.file_type?.toUpperCase() || 'FILE'}
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-sm text-white truncate">
							{card.file_name}
						</h3>
						<p className="text-xs text-muted-foreground">
							{formatFileSize(card.file_size)}
						</p>
					</div>
				</div>
			</a>
		</div>
	);
}
