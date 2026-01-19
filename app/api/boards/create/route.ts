import { withInstantAuth } from '@/lib/auth/with-instant-auth';
import { NextResponse } from 'next/server';
import { checkEntitlement } from '@/lib/billing/entitlement-check';
import { db } from '@/lib/instant/db';
import { id } from '@instantdb/react';

export const POST = withInstantAuth(async (user, req) => {
	// Check entitlement
	const check = await checkEntitlement(user.id, 'board');

	if (!check.allowed) {
		return NextResponse.json(
			{
				error: check.reason,
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
});
