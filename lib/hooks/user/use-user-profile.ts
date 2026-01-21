'use client';

import { db } from "@/lib/instant/db";
import { type SubscriptionTier } from "@/lib/billing/tier-limits";

interface UserProfileReturn {
	tier: SubscriptionTier;
	boardCount: number;
	cardCount: number;
};

export function useUserProfile(): UserProfileReturn {
	const { user } = db.useAuth();

	const { data, isLoading, error } = db.useQuery(
		user ? {
			profiles: {
				$: { where: { "user.id": user.id } }
			}
		} : null
	);

	const profile = data?.profiles?.[0];
	
	return {
		tier: profile?.subscription_tier as SubscriptionTier,
		boardCount: profile?.board_count || Infinity,
		cardCount: profile?.card_count || Infinity,
	}
}