import { init } from '@instantdb/admin';
import { id } from '@instantdb/react';
import { NextResponse } from 'next/server';
import { encryptToken } from '@/lib/services/encryption';
import jwt from 'jsonwebtoken';

const db = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});


export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const code = searchParams.get('code');
	const state = searchParams.get('state');

	if (!code || !state) {
		return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?oauth_error=1`);
	}

	// Verify and decode state
	const decoded = jwt.verify(state, process.env.CLERK_SECRET_KEY!) as {
		instantUserId: string;
		nonce: string;
	};

	const instantUserId = decoded.instantUserId;

	try {
		// Exchange code for tokens
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json ' },
			body: JSON.stringify({
				code,
				client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
				client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
				redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google-drive/callback`,
				grant_type: 'authorization_code',
			}),
		});
		const tokens = await tokenResponse.json();

		// Get user info
		const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: { Authorization: `Bearer ${tokens.access_token}` },
		});
		const userInfo = await userInfoResponse.json();

		// Store in database
		const accountId = id();
		const now = Date.now();
		await db.transact([
			db.tx.linked_accounts[accountId].update({
				provider: 'google_drive',
				provider_user_id: userInfo.id,
				provider_email: userInfo.email,
				provider_name: userInfo.name,
				access_token: await encryptToken(tokens.access_token),
				refresh_token: await encryptToken(tokens.refresh_token),
				token_expires_at: now + (tokens.expires_in * 1000),
				scopes: ['drive.readonly', 'userinfo.email'],
				connected_at: now,
				is_active: true,
				created_at: now,
				updated_at: now,
			}),
			db.tx.linked_accounts[accountId].link({ user: instantUserId }) // TODO: Fix this, this trys to use the Clerks user_id not the instantdb
		]);

		return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?oauth_success=google_drive`);
	} catch (error) {
		console.error('OAuth error:', error);
		return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?oauth_error=1`);
	}
}