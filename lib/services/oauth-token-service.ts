import { init } from '@instantdb/admin';
import { encryptToken, decryptToken } from './encryption';
import type { OAuthProvider } from '@/lib/types';

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export async function getValidToken(userId: string, provider: OAuthProvider): Promise<string> {
	const data = await adminDB.query({
		linked_accounts: {
			$: { where: { 'user.id': userId, provider, is_active: true } }
		},
	});

	const account = data?.linked_accounts?.[0];
	if (!account) throw new Error('No linked account found');

	const now = Date.now();
	if(account.token_expires_at > now + 60000) {
		return await decryptToken(account.access_token);
	}

	// Refresh expired token
	const newTokens = await refreshOAuthToken(provider, account.refresh_token);

	await adminDB.transact([
		adminDB.tx.linked_accounts[account.id].update({
			access_token: await encryptToken(newTokens.access_token),
			token_expires_at: now + (newTokens.expires_in * 1000),
			updated_at: now,
		})
	]);

	return newTokens.access_token;
};

async function refreshOAuthToken(provider: OAuthProvider, encryptedRefreshToken: string) {
	const refreshToken = await decryptToken(encryptedRefreshToken);

	if (provider === 'google_drive') {
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
				client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
				refresh_token: refreshToken,
				grant_type: 'refresh_token',
			}),
		});
		return await response.json();
	} else if (provider === 'pinterest') {
		const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
			}),
		});
		return await response.json();
	}

	throw new Error('Unknown Provider');
}