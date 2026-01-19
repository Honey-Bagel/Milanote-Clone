"use server";

import { init } from "@instantdb/admin";
import { TIER_LIMITS, isWithinLimit, formatBytes, type SubscriptionTier } from "./tier-limits";

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export type ResourceType = 'board' | 'card' | 'storage';

export interface EntitlementCheckResult {
	allowed: boolean;
	reason?: string;
	currentUsage?: {
		boards: number;
		cards: number;
		storageBytes: number;
	};
	limits?: {
		boards: number | 'unlimited';
		cards: number | 'unlimited';
		storageBytes: number | 'unlimited';
	};
	tier?: SubscriptionTier;
}

/**
 * Calculate usage for a user
 */
async function calculateUserUsage(userId: string): Promise<{
	boards: number;
	cards: number;
	storageBytes: number;
}> {
	const data = await adminDB.query({
		boards: {
			$: { where: { 'owner.id': userId } },
			cards: {},
		},
	});

	const boardCount = data.boards.length;
	const cardCount = data.boards.reduce(
		(total, board) => total + (board.cards?.length || 0),
		0
	);

	let storageBytes = 0;
	for (const board of data.boards) {
		for (const card of board.cards || []) {
			storageBytes += (card.file_size || 0) + (card.image_size || 0);
		}
	}

	return { boards: boardCount, cards: cardCount, storageBytes };
}

/**
 * Check if user can create a resource based on their tier and current usage
 * 
 * @param userId - User ID (owner of the board)
 * @param resourceType - Type of resource being created
 * @param additionalBytes - For storage checks, how many bytes will be added
 */
export async function checkEntitlement(
	userId: string,
	resourceType: ResourceType,
	additionalBytes: number = 0
): Promise<EntitlementCheckResult> {
	// 1. Get user's subscription tier
	const profileData = await adminDB.query({
		profiles: {
			$: { where: { id: userId } },
		},
	});

	const profile = profileData.profiles[0];
	if (!profile) {
		return { allowed: false, reason: 'User not found' };
	}

	const tier = (profile.subscription_tier || 'free') as SubscriptionTier;
	const limits = TIER_LIMITS[tier];

	// 2. Calculate current usage
	const currentUsage = await calculateUserUsage(userId);

	// 3. Check limits based on resource type
	let allowed = true;
	let reason: string | undefined;
	
	switch (resourceType) {
		case 'board':
			if (!isWithinLimit(currentUsage.boards, limits.boards)) {
				allowed = false;
				reason = `Board limit reached (${currentUsage.boards}/${limits.boards})`;
			}
			break;
		case 'card':
			if (!isWithinLimit(currentUsage.cards, limits.cards)) {
				allowed = false;
				reason = `Card limit reached (${currentUsage.cards}/${limits.cards})`;
			}
			break;
		case 'storage':
			const newStorage = currentUsage.storageBytes + additionalBytes;
			if (!isWithinLimit(newStorage, limits.storageBytes)) {
				allowed = false;
				reason = `Storage limit reached (${formatBytes(newStorage)}/${formatBytes(limits.storageBytes)})`;
			}
			break;
	}

	return {
		allowed,
		reason,
		currentUsage,
		limits,
		tier,
	};
}

/**
 * Check if board owner allows creation (for collaborators)
 */
export async function checkBoardOwnerLimits(
	boardId: string,
	resourceType: 'card' | 'storage',
	additionalBytes: number = 0,
): Promise<EntitlementCheckResult> {
	// Get board owner 
	console.log(adminDB);
	const data = await adminDB.query({
		boards: {
			$: { where: { id: boardId } },
			owner: {},
		},
	});

	const board = data.boards[0];
	if (!board || !board.owner) {
		return { allowed: false, reason: 'Board not found' };
	}

	const ownerId = board.owner.id;
	return checkEntitlement(ownerId, resourceType, additionalBytes);
}

/**
 * Export calculateUserUsage for use in other files
 */
export { calculateUserUsage };