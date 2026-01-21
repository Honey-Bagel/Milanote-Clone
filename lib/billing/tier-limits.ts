export type SubscriptionTier = 'free' | 'standard' | 'pro';

export interface TierLimits {
	boards: number | 'unlimited';
	cards: number | 'unlimited';
	storageBytes: number | 'unlimited';
};

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
	free: {
		boards: 10,
		cards: 250,
		storageBytes: 250 * 1024 * 1024, // 250 MB
	},
	standard: {
		boards: 'unlimited',
		cards: 'unlimited',
		storageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
	},
	pro: {
		boards: 'unlimited',
		cards: 'unlimited',
		storageBytes: 'unlimited',
	},
};

export function isUnlimited(value: number | 'unlimited'): value is 'unlimited' {
	return value === 'unlimited';
}

export function isWithinLimit(current: number, limit: number | 'unlimited'): boolean {
	return isUnlimited(limit) || current < limit;
}

export function formatBytes(bytes: number | 'unlimited'): string {
	if (bytes === 'unlimited') return 'Unlimited';

	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < unitIndex.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(2)} ${units[unitIndex]}`;
}