import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { init } from "@instantdb/admin";

const adminDb = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});


export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { accountId } = await req.json();

	// Verify the user owns this linked account
	const { linked_accounts } = await adminDb.query({
		linked_accounts: {
			$: { where: { id: accountId } },
			user: {},
		},
	});

	const account = linked_accounts?.[0];
	if (!account || account.user?.[0]?.id !== userId) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	await adminDb.transact([
		adminDb.tx.linked_accounts[accountId].update({
			is_active: false,
			updated_at: Date.now(),
		})
	]);

	return NextResponse.json({ success: true });
}