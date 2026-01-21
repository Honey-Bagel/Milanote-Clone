'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateService } from '@/lib/services/template-service';
import { db } from '@/lib/instant/db';

/**
 * Hook for instantiating templates into new boards
 *
 * @returns instantiate function, loading state, and error state
 */
export function useInstantiateTemplate() {
	const router = useRouter();
	const { user } = db.useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const instantiate = async (templateId: string): Promise<boolean> => {
		if (!user) {
			setError(new Error('User not authenticated'));
			return false;
		}

		setIsLoading(true);
		setError(null);

		try {
			const boardId = await TemplateService.instantiateTemplate(templateId, user.id);

			// Navigate to the new board
			router.push(`/board/${boardId}`);

			return true;
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to instantiate template');
			setError(error);
			console.error('[useInstantiateTemplate] Error:', error);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		instantiate,
		isLoading,
		error,
	};
}
