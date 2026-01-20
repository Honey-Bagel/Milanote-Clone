import { NextResponse } from 'next/server';
import { TIER_LIMITS, type SubscriptionTier } from '@/lib/billing/tier-limits';
import { calculateUserUsage } from '@/lib/billing/entitlement-check';
import { init } from '@instantdb/admin';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit/configs';

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export const GET = withRateLimitedAuth(
	async (user, req) => {
		// Get user tier
		const profileData = await adminDB.query({
			profiles: {
				$: { where: { id: user.id } },
			},
		});

		const tier = (profileData.profiles[0]?.subscription_tier || 'free') as SubscriptionTier;
		const limits = TIER_LIMITS[tier];

		// Calculate usage
		const usage = await calculateUserUsage(user.id);

		return NextResponse.json({
			usage,
			limits,
			tier,
		});
	},
	RATE_LIMITS.BILLING_USAGE,
	'billing-usage'
);
