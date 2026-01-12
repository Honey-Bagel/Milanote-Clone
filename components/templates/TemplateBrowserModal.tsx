'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { useTemplates } from '@/lib/hooks/templates/use-templates';
import type { TemplateCategory } from '@/lib/types/template';
import TemplateCard from './TemplateCard';
import TemplatePreviewModal from './TemplatePreviewModal';
import CategoryTabs from './CategoryTabs';

interface TemplateBrowserModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function TemplateBrowserModal({ isOpen, onClose }: TemplateBrowserModalProps) {
	const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
	const [showPreview, setShowPreview] = useState(false);

	const modalRef = useRef<HTMLDivElement | null>(null);

	// Fetch templates based on category
	const { templates, isLoading } = useTemplates(
		selectedCategory === 'all' ? undefined : selectedCategory
	);

	// Filter by search query
	const filteredTemplates = templates.filter((template) => {
		const query = searchQuery.toLowerCase();
		return (
			template.name.toLowerCase().includes(query) ||
			template.description?.toLowerCase().includes(query) ||
			template.category.toLowerCase().includes(query)
		);
	});

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

	const handleTemplateClick = (template: any) => {
		setSelectedTemplate(template);
		setShowPreview(true);
	};

	const handlePreviewClose = () => {
		setShowPreview(false);
		setSelectedTemplate(null);
	};

	if (!isOpen) return null;

	return (
		<>
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
				<div
					ref={modalRef}
					className="flex h-[90vh] w-[90vw] max-w-6xl flex-col rounded-xl bg-white shadow-2xl dark:bg-neutral-800"
				>
					{/* Header */}
					<div className="border-b border-neutral-200 p-6 dark:border-neutral-700">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
								Browse Templates
							</h2>
							<button
								onClick={onClose}
								className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
							>
								<X size={20} />
							</button>
						</div>

						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search templates..."
								className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500"
							/>
						</div>

						{/* Category Tabs */}
						<div className="mt-4">
							<CategoryTabs
								selectedCategory={selectedCategory}
								onSelectCategory={setSelectedCategory}
							/>
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6">
						{isLoading ? (
							<div className="flex h-full items-center justify-center">
								<div className="text-neutral-500 dark:text-neutral-400">
									Loading templates...
								</div>
							</div>
						) : filteredTemplates.length === 0 ? (
							<div className="flex h-full flex-col items-center justify-center">
								<svg
									className="mb-4 h-24 w-24 text-neutral-300 dark:text-neutral-600"
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
								<p className="text-neutral-500 dark:text-neutral-400">
									No templates found
								</p>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery('')}
										className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
									>
										Clear search
									</button>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{filteredTemplates.map((template) => (
									<TemplateCard
										key={template.id}
										id={template.id}
										name={template.name}
										description={template.description}
										category={template.category}
										preview_url={template.preview_url}
										usage_count={template.usage_count}
										is_featured={template.is_featured}
										onClick={() => handleTemplateClick(template)}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Preview Modal */}
			<TemplatePreviewModal
				template={selectedTemplate}
				isOpen={showPreview}
				onClose={handlePreviewClose}
			/>
		</>
	);
}
