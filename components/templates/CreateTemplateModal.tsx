'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useCreateTemplate } from '@/lib/hooks/templates/use-create-template';
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/types/template';
import { db } from '@/lib/instant/db';

interface CreateTemplateModalProps {
	boardId: string;
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: (templateId: string) => void;
}

export default function CreateTemplateModal({
	boardId,
	isOpen,
	onClose,
	onSuccess,
}: CreateTemplateModalProps) {
	const { user } = db.useAuth();
	const { createTemplate, isLoading, error } = useCreateTemplate();
	const modalRef = useRef<HTMLDivElement | null>(null);

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState<TemplateCategory>('other');
	const [isFeatured, setIsFeatured] = useState(false);

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user || !name.trim()) return;

		const templateId = await createTemplate({
			sourceBoardId: boardId,
			name: name.trim(),
			description: description.trim() || undefined,
			category,
			is_featured: isFeatured,
			creatorId: user.id,
		});

		if (templateId) {
			onSuccess?.(templateId);
			onClose();
			setName('');
			setDescription('');
			setCategory('other');
			setIsFeatured(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div
				ref={modalRef}
				className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-800"
			>
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
						Create Template
					</h2>
					<button
						onClick={onClose}
						className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
					>
						<X size={20} />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Template Name */}
					<div>
						<label
							htmlFor="template-name"
							className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
						>
							Template Name *
						</label>
						<input
							id="template-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Project Planning Board"
							className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500"
							required
						/>
					</div>

					{/* Description */}
					<div>
						<label
							htmlFor="template-description"
							className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
						>
							Description
						</label>
						<textarea
							id="template-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe what this template is for..."
							rows={3}
							className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-500"
						/>
					</div>

					{/* Category */}
					<div>
						<label
							htmlFor="template-category"
							className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
						>
							Category *
						</label>
						<select
							id="template-category"
							value={category}
							onChange={(e) => setCategory(e.target.value as TemplateCategory)}
							className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
						>
							{TEMPLATE_CATEGORIES.map((cat) => (
								<option key={cat} value={cat}>
									{cat.charAt(0).toUpperCase() + cat.slice(1)}
								</option>
							))}
						</select>
					</div>

					{/* Featured */}
					<div className="flex items-center gap-3">
						<input
							id="template-featured"
							type="checkbox"
							checked={isFeatured}
							onChange={(e) => setIsFeatured(e.target.checked)}
							className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600"
						/>
						<label
							htmlFor="template-featured"
							className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
						>
							Mark as featured template
						</label>
					</div>

					{/* Error */}
					{error && (
						<div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
							{error.message}
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading || !name.trim()}
							className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isLoading ? 'Creating...' : 'Create Template'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
