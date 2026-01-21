'use client';

import { db } from '@/lib/instant/db';
import type { TemplateCategory } from '@/lib/types/template';

/**
 * Hook to query all public templates, optionally filtered by category
 *
 * @param category - Optional category filter
 * @returns Templates array and loading state
 */
export function useTemplates(category?: TemplateCategory) {
	const { data, isLoading } = db.useQuery(
		category
			? {
					templates: {
						$: {
							where: {
								is_public: true,
								category,
							},
						},
					},
			  }
			: {
					templates: {
						$: {
							where: {
								is_public: true,
							},
						},
					},
			  }
	);

	return {
		templates: data?.templates || [],
		isLoading,
	};
}

/**
 * Hook to query featured templates
 *
 * @returns Featured templates array and loading state
 */
export function useFeaturedTemplates() {
	const { data, isLoading } = db.useQuery({
		templates: {
			$: {
				where: {
					is_public: true,
					is_featured: true,
				},
			},
		},
	});

	return {
		templates: data?.templates || [],
		isLoading,
	};
}

/**
 * Hook to query a single template by ID
 *
 * @param templateId - ID of the template to fetch
 * @returns Template data and loading state
 */
export function useTemplate(templateId: string | null) {
	const { data, isLoading } = db.useQuery(
		templateId
			? {
					templates: {
						$: {
							where: {
								id: templateId,
							},
						},
					},
			  }
			: null
	);

	return {
		template: data?.templates?.[0] || null,
		isLoading,
	};
}
