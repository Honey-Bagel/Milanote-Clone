'use client';

import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/types/template';

interface CategoryTabsProps {
	selectedCategory: TemplateCategory | 'all';
	onSelectCategory: (category: TemplateCategory | 'all') => void;
}

export default function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
	const categories = ['all', ...TEMPLATE_CATEGORIES] as const;

	return (
		<div className="flex gap-2 overflow-x-auto pb-2">
			{categories.map((category) => (
				<button
					key={category}
					onClick={() => onSelectCategory(category)}
					className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
						selectedCategory === category
							? 'bg-blue-600 text-white'
							: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
					}`}
				>
					{category.charAt(0).toUpperCase() + category.slice(1)}
				</button>
			))}
		</div>
	);
}
