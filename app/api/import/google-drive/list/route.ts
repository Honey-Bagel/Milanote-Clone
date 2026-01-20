import { NextResponse } from 'next/server';
import { getValidToken } from '@/lib/services/oauth-token-service';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit/configs';

export const GET = withRateLimitedAuth(
	async (user, req) => {
		const { searchParams } = new URL(req.url);
		const folderId = searchParams.get('folderId') || 'root';
		const pageToken = searchParams.get('pageToken');

		try {
			const accessToken = await getValidToken(user.id, 'google_drive');

			const driveUrl = new URL('https://www.googleapis.com/drive/v3/files');
			driveUrl.searchParams.set('q', `'${folderId}' in parents and trashed=false`);
			driveUrl.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,iconLink,size)');
			driveUrl.searchParams.set('pageSize', '50');
			if (pageToken) driveUrl.searchParams.set('pageToken', pageToken);

			const response = await fetch(driveUrl.toString(), {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			const data = await response.json();

			if (!response.ok) {
				console.error('Google Drive API error:', data);
				return NextResponse.json({
					error: 'Failed to fetch files from Google Drive',
					details: data.error?.message || 'Unknown error'
				}, { status: response.status });
			}

			return NextResponse.json(data);
		} catch (error) {
			console.error('Import-google-drive-list error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch files';
			return NextResponse.json({
				error: errorMessage,
				needsReconnect: errorMessage.includes('OAuth') || errorMessage.includes('token')
			}, { status: 500 });
		}
	},
	RATE_LIMITS.GOOGLE_DRIVE_LIST,
	'google-drive-list'
);