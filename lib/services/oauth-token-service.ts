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
	if (!account) {
		console.error(`[OAuth] No linked account found for user ${userId} and provider ${provider}`);
		throw new Error('No linked account found');
	}

	const now = Date.now();
	if(account.token_expires_at > now + 60000) {
		return await decryptToken(account.access_token);
	}

	console.log(`[OAuth] Token expired for account ${account.id}, refreshing...`);

	try {
		// Refresh expired token
		const newTokens = await refreshOAuthToken(provider, account.refresh_token, account.id);

		await adminDB.transact([
			adminDB.tx.linked_accounts[account.id].update({
				access_token: await encryptToken(newTokens.access_token),
				token_expires_at: now + (newTokens.expires_in * 1000),
				updated_at: now,
			})
		]);

		console.log(`[OAuth] Successfully refreshed token for account ${account.id}`);
		return newTokens.access_token;
	} catch (error) {
		console.error(`[OAuth] Failed to refresh token for account ${account.id}:`, error);

		// Mark account as inactive if refresh fails
		await adminDB.transact([
			adminDB.tx.linked_accounts[account.id].update({
				is_active: false,
				updated_at: now,
			})
		]);

		throw new Error(`Failed to refresh OAuth token: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

async function refreshOAuthToken(provider: OAuthProvider, encryptedRefreshToken: string, accountId: string) {
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

		const data = await response.json();

		if (!response.ok) {
			console.error(`[OAuth] Google Drive token refresh failed for account ${accountId}:`, {
				status: response.status,
				statusText: response.statusText,
				error: data.error,
				errorDescription: data.error_description,
			});
			throw new Error(`Google Drive API error: ${data.error_description || data.error || 'Unknown error'}`);
		}

		if (!data.access_token || !data.expires_in) {
			console.error(`[OAuth] Invalid token response for account ${accountId}:`, data);
			throw new Error('Invalid token response: missing access_token or expires_in');
		}

		return data;
	} else if (provider === 'pinterest') {
		const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(`[OAuth] Pinterest token refresh failed for account ${accountId}:`, {
				status: response.status,
				statusText: response.statusText,
				error: data.error,
				errorDescription: data.error_description,
			});
			throw new Error(`Pinterest API error: ${data.error_description || data.error || 'Unknown error'}`);
		}

		if (!data.access_token || !data.expires_in) {
			console.error(`[OAuth] Invalid token response for account ${accountId}:`, data);
			throw new Error('Invalid token response: missing access_token or expires_in');
		}

		return data;
	}

	throw new Error('Unknown Provider');
}