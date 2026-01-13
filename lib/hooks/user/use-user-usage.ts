'use client';

import { db } from '@/lib/instant/db';
import { useMemo } from 'react';

interface UserUsageReturn {
	boardCount: number;
	fileUsage: number;
	isLoading: boolean;
	error: string | null;
}

/**
 * Hook to get the current user's usage information
 * 
 * Usage includes:
 * - Number of boards
 * - R2 storage usage (bytes)
 */
export function useUserUsage(): UserUsageReturn {
	const { user } = db.useAuth();

	const { data, isLoading, error } = db.useQuery(
		user ? {
			boards: {
				$: {
					where: {
						"owner.id": user.id
					},
				},
				cards: {},
			}
		} : null
	);

	const { boardCount, fileUsage } = useMemo(() => {
		if (!data?.boards) {
			return { boardCount: 0, fileUsage: 0 };
		}

		let totalBytes = 0;

		for (const board of data.boards) {
			for (const card of board.cards ?? []) {
				totalBytes += (card.file_size ?? 0) + (card.image_size ?? 0);
				if (card.file_size || card.image_size) {
					console.log(`Adding ${card.file_size ?? card.image_size ?? 0} to the total bytes. New total = ${totalBytes}`)
				}
			}
		}

		return {
			boardCount: data.boards.length,
			fileUsage: totalBytes
		};
	}, [data]);

	if (error) {
		return {
			boardCount: 0,
			fileUsage: 0,
			isLoading: false,
			error: error.message ?? 'Failed to load usage data',
		};
	}

	return {
		boardCount,
		fileUsage,
		isLoading,
		error: null
	};
}