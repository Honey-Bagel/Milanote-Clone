'use client';

import { useState } from 'react';
import { TemplateService } from '@/lib/services/template-service';
import type { CreateTemplateParams } from '@/lib/types/template';

/**
 * Hook for creating templates from boards (admin only)
 *
 * @returns createTemplate function, loading state, and error state
 */
export function useCreateTemplate() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const createTemplate = async (params: CreateTemplateParams): Promise<string | null> => {
		setIsLoading(true);
		setError(null);

		try {
			const templateId = await TemplateService.createTemplate(params);
			return templateId;
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to create template');
			setError(error);
			console.error('[useCreateTemplate] Error:', error);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		createTemplate,
		isLoading,
		error,
	};
}
