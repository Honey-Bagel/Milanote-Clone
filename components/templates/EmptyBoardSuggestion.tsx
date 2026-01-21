'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFeaturedTemplates } from '@/lib/hooks/templates/use-templates';
import { useInstantiateTemplate } from '@/lib/hooks/templates/use-instantiate-template';

interface EmptyBoardSuggestionProps {
	boardId: string;
}

export default function EmptyBoardSuggestion({ boardId }: EmptyBoardSuggestionProps) {
	const { templates, isLoading } = useFeaturedTemplates();
	const { instantiate, isLoading: isInstantiating } = useInstantiateTemplate();
	const [dismissed, setDismissed] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	if (dismissed || isLoading || templates.length === 0) return null;

	const handleUseTemplate = async (templateId: string) => {
		await instantiate(templateId);
		// Navigation handled by hook
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev + 1) % templates.length);
	};

	const handlePrev = () => {
		setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
	};

	const currentTemplate = templates[currentIndex];

	return (
		<div className="absolute left-1/2 top-8 z-10 w-full max-w-2xl -translate-x-1/2 animate-in fade-in slide-in-from-top-4">
			<div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
				<div className="mb-3 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
						Start with a template?
					</h3>
					<button
						onClick={() => setDismissed(true)}
						className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
					>
						<X size={18} />
					</button>
				</div>

				<div className="flex items-center gap-4">
					{/* Navigation */}
					{templates.length > 1 && (
						<button
							onClick={handlePrev}
							className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
						>
							<ChevronLeft size={20} />
						</button>
					)}

					{/* Template Card */}
					<div className="flex flex-1 items-center gap-4">
						{/* Preview */}
						<div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
							{currentTemplate.preview_url ? (
								<img
									src={currentTemplate.preview_url}
									alt={currentTemplate.name}
									className="h-full w-full object-cover"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-neutral-400">
									<svg
										className="h-10 w-10"
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

						{/* Info */}
						<div className="flex-1">
							<h4 className="mb-1 font-medium text-neutral-900 dark:text-white">
								{currentTemplate.name}
							</h4>
							{currentTemplate.description && (
								<p className="mb-2 line-clamp-1 text-sm text-neutral-600 dark:text-neutral-400">
									{currentTemplate.description}
								</p>
							)}
							<span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
								{currentTemplate.category.charAt(0).toUpperCase() +
									currentTemplate.category.slice(1)}
							</span>
						</div>

						{/* Action */}
						<button
							onClick={() => handleUseTemplate(currentTemplate.id)}
							disabled={isInstantiating}
							className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isInstantiating ? 'Creating...' : 'Use Template'}
						</button>
					</div>

					{/* Navigation */}
					{templates.length > 1 && (
						<button
							onClick={handleNext}
							className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
						>
							<ChevronRight size={20} />
						</button>
					)}
				</div>

				{/* Dots indicator */}
				{templates.length > 1 && (
					<div className="mt-3 flex justify-center gap-1.5">
						{templates.map((_, index) => (
							<button
								key={index}
								onClick={() => setCurrentIndex(index)}
								className={`h-1.5 w-1.5 rounded-full transition-all ${
									index === currentIndex
										? 'w-4 bg-blue-600'
										: 'bg-neutral-300 dark:bg-neutral-600'
								}`}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
