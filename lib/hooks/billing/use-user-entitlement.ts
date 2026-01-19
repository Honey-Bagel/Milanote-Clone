'use client';

import { useEffect, useState } from 'react';
import type { TierLimits } from '@/lib/billing/tier-limits';

interface UsageData {
	usage: {
		boards: number;
		cards: number;
		storageBytes: number;
	};
	limits: TierLimits;
	tier: string;
}

interface Entitlement {
	tier: string;
	usage: {
		boards: number;
		cards: number;
		storageBytes: number;
	};
	limits: TierLimits;
	canCreateBoard: boolean;
	canCreateCard: boolean;
	canUploadFile: (bytes: number) => boolean;
	isLoading: boolean;
}

export function useUserEntitlement(): Entitlement {
	const [data, setData] = useState<UsageData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/billing/usage')
			.then((res) => res.json())
			.then((data) => {
				setData(data);
				setLoading(false);
			})
			.catch((error) => {
				console.error('Error fetching usage:', error);
				setLoading(false);
			});
	}, []);

	if (loading || !data) {
		return {
			tier: 'free',
			usage: { boards: 0, cards: 0, storageBytes: 0 },
			limits: { boards: 10, cards: 250, storageBytes: 250 * 1024 * 1024 },
			canCreateBoard: false,
			canCreateCard: false,
			canUploadFile: () => false,
			isLoading: true,
		};
	}

	const canCreate = (current: number, limit: number | 'unlimited') => {
		return limit === 'unlimited' || current < limit;
	};

	return {
		tier: data.tier,
		usage: data.usage,
		limits: data.limits,
		canCreateBoard: canCreate(data.usage.boards, data.limits.boards),
		canCreateCard: canCreate(data.usage.cards, data.limits.cards),
		canUploadFile: (bytes: number) => {
			const newStorage = data.usage.storageBytes + bytes;
			return canCreate(newStorage, data.limits.storageBytes);
		},
		isLoading: false,
	};
}
