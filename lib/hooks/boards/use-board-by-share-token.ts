'use client';

import { db } from "@/lib/instant/db";

export function useBoardByShareToken(shareToken: string) {
	const { data, isLoading, error } = db.useQuery({
		boards: {
			$: {
				where: {
					share_token: shareToken,
				},
			},
		},
	});

	return {
		board: data?.boards?.[0] || null,
		isLoading,
		error
	};
}