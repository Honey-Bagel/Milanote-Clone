import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { init } from "@instantdb/admin";

const adminDb = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});


// TODO: Check and make sure authenticated user owns the row that is being
// updated
export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { accountId } = await req.json();

	await adminDb.transact([
		adminDb.tx.linked_accounts[accountId].update({
			is_active: false,
			updated_at: Date.now(),
		})
	]);

	return NextResponse.json({ success: true });
}