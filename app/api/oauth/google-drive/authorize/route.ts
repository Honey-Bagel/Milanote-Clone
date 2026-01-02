import { NextResponse } from 'next/server';
import { withInstantAuth } from '@/lib/auth/with-instant-auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const GET = withInstantAuth(async (user, req) => {
	// Sign JWT with InstantDB user ID
	const state = jwt.sign(
		{
			instantUserId: user.id,
			nonce: crypto.randomBytes(16).toString('hex')
		},
		process.env.CLERK_SECRET_KEY!,
		{ expiresIn: '10m' }
	);

	const scopes = [
		'https://www.googleapis.com/auth/drive.readonly',
		'https://www.googleapis.com/auth/userinfo.email',
	];

	const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	authUrl.searchParams.set('client_id', process.env.GOOGLE_DRIVE_CLIENT_ID!);
	authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google-drive/callback`);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', scopes.join(' '));
	authUrl.searchParams.set('access_type', 'offline');
	authUrl.searchParams.set('prompt', 'consent');
	authUrl.searchParams.set('state', state);

	return NextResponse.redirect(authUrl.toString());
});