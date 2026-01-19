'use client';

import { SubscriptionTier } from "@/lib/billing/tier-limits";
import { db } from "@/lib/instant/db";

interface UserPlanResult {
	tier: 'free' | 'standard' | 'pro';
	status?: string;
	current_period_end?: number;
	cancel_at_period_end?: boolean;
	isLoading: boolean;
	error?: string;
};

export function useUserPlan(): UserPlanResult {
	const { user } = db.useAuth();

	const { data, isLoading, error } = db.useQuery(
		user ? {
			profiles: {
				$: {
					where: {
						"user.id": user.id,
					},
				},
			},
		} : null
	);

	const profile = data?.profiles?.[0];

	if (error || !profile) {
		return {
			tier: 'free',
			isLoading,
			error: error?.message
		}
	}

	return {
		tier: profile.subscription_tier as SubscriptionTier,
		status: profile.subscription_status,
		current_period_end: profile.subscription_current_period_end,
		cancel_at_period_end: profile.subscription_cancel_at_period_end,
		isLoading
	};
}