import { NextResponse } from 'next/server';
import { withInstantAuth } from '@/lib/auth/with-instant-auth';
import { getValidToken } from '@/lib/services/oauth-token-service';

export const GET = withInstantAuth(async (user, req) => {
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

		return NextResponse.json(await response.json());
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
	}
});