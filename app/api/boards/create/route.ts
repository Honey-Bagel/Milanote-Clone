import { NextResponse } from 'next/server';
import { checkEntitlement } from '@/lib/billing/entitlement-check';
import { incrementCounterWithCheck, decrementCounter } from '@/lib/billing/atomic-counter-service';
import { TIER_LIMITS, type SubscriptionTier } from '@/lib/billing/tier-limits';
import { db } from '@/lib/instant/db';
import { id } from '@instantdb/react';
import { init } from '@instantdb/admin';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit/configs';

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export const POST = withRateLimitedAuth(
	async (user, req) => {
		// Get user's subscription tier for limit check
		const profileData = await adminDB.query({
			profiles: { $: { where: { id: user.id } } },
		});

		const profile = profileData.profiles[0];
		if (!profile) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const tier = (profile.subscription_tier || 'free') as SubscriptionTier;
		const limit = TIER_LIMITS[tier].boards;

		// Atomic counter increment with limit check
		const result = await incrementCounterWithCheck(user.id, 'board_count', 1, limit);

		if (!result.success) {
			// Also run legacy check for detailed error message
			const check = await checkEntitlement(user.id, 'board');
			return NextResponse.json(
				{
					error: result.reason || check.reason,
					upgrade_required: true,
					current_usage: check.currentUsage,
					limits: check.limits,
				},
				{ status: 403 }
			);
		}

		// Proceed with board creation
		const body = await req.json();
		const boardId = id();

		try {
			await db.transact([
				db.tx.boards[boardId].update({
					title: body.title || 'Untitled Board',
					color: body.color || '#ffffff',
					is_public: body.is_public || false,
					parent_board_id: body.parent_board_id || null,
					created_at: Date.now(),
					updated_at: Date.now(),
				}),
				db.tx.$users[user.id].link({ owned_boards: boardId }),
			]);

			return NextResponse.json({ boardId });
		} catch (error) {
			// Rollback counter on failure
			await decrementCounter(user.id, 'board_count', 1);
			console.error('[BoardCreate] Error:', error);
			return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
		}
	},
	RATE_LIMITS.BOARD_CREATE,
	'board-create'
);
