import { withInstantAuth } from '@/lib/auth/with-instant-auth';
import { NextResponse } from 'next/server';
import { TIER_LIMITS, type SubscriptionTier } from '@/lib/billing/tier-limits';
import { calculateUserUsage } from '@/lib/billing/entitlement-check';
import { init } from '@instantdb/admin';

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export const GET = withInstantAuth(async (user, req) => {
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
});
