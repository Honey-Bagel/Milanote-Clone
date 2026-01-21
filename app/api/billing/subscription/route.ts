import { NextResponse } from 'next/server';
import { init } from '@instantdb/admin';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit/configs';

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export const GET = withRateLimitedAuth(
	async (user, req) => {
		const data = await adminDB.query({
			profiles: {
				$: { where: { id: user.id } },
			},
		});

		const profile = data.profiles[0];

		return NextResponse.json({
			tier: profile.subscription_tier || 'free',
			status: profile.subscription_status,
			current_period_end: profile.subscription_current_period_end,
			cancel_at_period_end: profile.subscription_cancel_at_period_end,
			grace_period_end: profile.grace_period_end,
		});
	},
	RATE_LIMITS.BILLING_SUBSCRIPTION,
	'billing-subscription'
);
