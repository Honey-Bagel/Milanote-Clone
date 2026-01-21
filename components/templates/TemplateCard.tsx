'use client';

import { Star } from 'lucide-react';

interface TemplateCardProps {
	id: string;
	name: string;
	description?: string;
	category: string;
	preview_url?: string;
	usage_count?: number;
	is_featured?: boolean;
	onClick: () => void;
}

export default function TemplateCard({
	name,
	description,
	category,
	preview_url,
	usage_count,
	is_featured,
	onClick,
}: TemplateCardProps) {
	return (
		<button
			onClick={onClick}
			className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white text-left transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
		>
			{/* Preview Image */}
			<div className="aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-700">
				{preview_url ? (
					<img
						src={preview_url}
						alt={name}
						className="h-full w-full object-cover transition-transform group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-neutral-400">
						<svg
							className="h-16 w-16"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col p-4">
				<div className="mb-2 flex items-start justify-between gap-2">
					<h3 className="flex-1 text-base font-semibold text-neutral-900 dark:text-white">
						{name}
					</h3>
					{is_featured && (
						<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
					)}
				</div>

				{description && (
					<p className="mb-3 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
						{description}
					</p>
				)}

				<div className="mt-auto flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
					<span className="rounded-full bg-neutral-100 px-2 py-1 dark:bg-neutral-700">
						{category.charAt(0).toUpperCase() + category.slice(1)}
					</span>
					{usage_count !== undefined && usage_count > 0 && (
						<span>{usage_count} uses</span>
					)}
				</div>
			</div>
		</button>
	);
}
