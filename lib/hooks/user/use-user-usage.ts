'use client';

import { db } from '@/lib/instant/db';
import { useMemo, useRef } from 'react';

interface UserUsageReturn {
	boardCount: number;
	fileUsage: number;
	isLoading: boolean;
	error: string | null;
}

interface UsageData {
	boardCount: number;
	fileUsage: number;
}

/**
 * Hook to get the current user's usage information
 *
 * Usage includes:
 * - Number of boards
 * - R2 storage usage (bytes)
 *
 * Caches computed results to avoid expensive recalculations
 */
export function useUserUsage(): UserUsageReturn {
	const { user } = db.useAuth();
	const cacheRef = useRef<{ data: UsageData | null; timestamp: number }>({
		data: null,
		timestamp: 0
	});

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

	// Calculate usage data with memoization and caching
	const calculatedUsage = useMemo<UsageData>(() => {
		const now = Date.now();
		const CACHE_DURATION = 60000; // 1 minute

		// Return cached data if it's still fresh
		if (
			cacheRef.current.data &&
			now - cacheRef.current.timestamp < CACHE_DURATION
		) {
			return cacheRef.current.data;
		}

		if (!data?.boards) {
			const emptyData = { boardCount: 0, fileUsage: 0 };
			// Don't cache empty data
			return emptyData;
		}

		let totalBytes = 0;

		for (const board of data.boards) {
			for (const card of board.cards ?? []) {
				totalBytes += (card.file_size ?? 0) + (card.image_size ?? 0);
			}
		}

		const newData = {
			boardCount: data.boards.length,
			fileUsage: totalBytes
		};

		// Update cache
		cacheRef.current = {
			data: newData,
			timestamp: now
		};

		return newData;
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
		boardCount: calculatedUsage.boardCount,
		fileUsage: calculatedUsage.fileUsage,
		isLoading,
		error: null
	};
}