'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Star } from 'lucide-react';
import { useInstantiateTemplate } from '@/lib/hooks/templates/use-instantiate-template';

interface TemplatePreviewModalProps {
	template: {
		id: string;
		name: string;
		description?: string;
		category: string;
		preview_url?: string;
		usage_count?: number;
		is_featured?: boolean;
	} | null;
	isOpen: boolean;
	onClose: () => void;
}

export default function TemplatePreviewModal({
	template,
	isOpen,
	onClose,
}: TemplatePreviewModalProps) {
	const { instantiate, isLoading } = useInstantiateTemplate();
	const modalRef = useRef<HTMLDivElement | null>(null);

	// Handle click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleUseTemplate = async () => {
		if (!template) return;
		await instantiate(template.id);
		// Navigation handled by hook
	};

	if (!isOpen || !template) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div
				ref={modalRef}
				className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-800"
			>
				{/* Header */}
				<div className="mb-4 flex items-start justify-between">
					<div className="flex-1">
						<div className="mb-1 flex items-center gap-2">
							<h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
								{template.name}
							</h2>
							{template.is_featured && (
								<Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
							)}
						</div>
						<div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
							<span className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-700">
								{template.category.charAt(0).toUpperCase() + template.category.slice(1)}
							</span>
							{template.usage_count !== undefined && template.usage_count > 0 && (
								<span>{template.usage_count} uses</span>
							)}
						</div>
					</div>
					<button
						onClick={onClose}
						className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
					>
						<X size={20} />
					</button>
				</div>

				{/* Preview Image */}
				<div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
					{template.preview_url ? (
						<img
							src={template.preview_url}
							alt={template.name}
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-neutral-400">
							<svg
								className="h-24 w-24"
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

				{/* Description */}
				{template.description && (
					<p className="mb-6 text-neutral-700 dark:text-neutral-300">
						{template.description}
					</p>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
					>
						Cancel
					</button>
					<button
						onClick={handleUseTemplate}
						disabled={isLoading}
						className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isLoading ? 'Creating...' : 'Use This Template'}
					</button>
				</div>
			</div>
		</div>
	);
}
