'use server';
import { init } from "@instantdb/admin";

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export type CounterType = 'board_count' | 'card_count' | 'storage_bytes_used';

export interface CounterResult {
	success: boolean;
	newValue?: number;
	reason?: string;
}

/**
 * Atomically increment a counter and check against limit
 * Returns success=false if limit would be exceeded
 */
export async function incrementCounterWithCheck(
	userId: string,
	counterType: CounterType,
	increment: number,
	limit: number | 'unlimited'
): Promise<CounterResult> {
	// Get current counter value
	const profileData = await adminDB.query({
		profiles: {
			$: { where: { id: userId } },
		},
	});

	const profile = profileData.profiles[0];
	if (!profile) {
		return { success: false, reason: 'User profile not found' };
	}

	const currentValue = profile[counterType] || 0;
	const newValue = currentValue + increment;

	// Check limit
	if (limit !== 'unlimited' && newValue > limit) {
		return {
			success: false,
			newValue: currentValue,
			reason: `Would exceed limit: ${newValue} / ${limit}`,
		};
	}

	// Atomic increment
	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			[counterType]: newValue,
		}),
	]);

	return { success: true, newValue };
}

/**
 * Atomically decrement a counter
 */
export async function decrementCounter(
	userId: string,
	counterType: CounterType,
	decrement: number
): Promise<void> {
	const profileData = await adminDB.query({
		profiles: { $: { where: { id: userId } } },
	});

	const profile = profileData.profiles[0];
	if (!profile) return;

	const currentValue = profile[counterType] || 0;
	const newValue = Math.max(0, currentValue - decrement);

	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			[counterType]: newValue,
		}),
	]);
}

/**
 * Reconcile counters with actual usage
 * Run this periodically (nightly cron) to fix drift
 */
export async function reconcileCounters(userId: string): Promise<void> {
	// Import dynamically to avoid circular dependencies
	const { calculateUserUsage } = await import('./entitlement-check');
	const actualUsage = await calculateUserUsage(userId);

	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			board_count: actualUsage.boards,
			card_count: actualUsage.cards,
			storage_bytes_used: actualUsage.storageBytes,
			counters_last_reconciled: Date.now(),
		}),
	]);
}

/**
 * Initialize counters for a user (used during migration or new user setup)
 */
export async function initializeCounters(userId: string): Promise<void> {
	const { calculateUserUsage } = await import('./entitlement-check');
	const actualUsage = await calculateUserUsage(userId);

	await adminDB.transact([
		adminDB.tx.profiles[userId].update({
			board_count: actualUsage.boards || 0,
			card_count: actualUsage.cards || 0,
			storage_bytes_used: actualUsage.storageBytes || 0,
			counters_last_reconciled: Date.now(),
		}),
	]);
}