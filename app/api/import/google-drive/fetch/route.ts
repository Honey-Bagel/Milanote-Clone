import { NextResponse } from 'next/server';
import { withInstantAuth } from '@/lib/auth/with-instant-auth';
import { getValidToken } from '@/lib/services/oauth-token-service';
import { FileService } from '@/lib/services';

export const POST = withInstantAuth(async (user, req) => {
	const { fileId, boardId } = await req.json();

	try {
		const accessToken = await getValidToken(user.id, 'google_drive');

		// Get metadata
		const metaResponse = await fetch(
			`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);

		if (!metaResponse.ok) {
			const errorData = await metaResponse.json();
			console.error('Google Drive metadata fetch error:', errorData);
			return NextResponse.json({
				error: 'Failed to fetch file metadata',
				details: errorData.error?.message || 'Unknown error'
			}, { status: metaResponse.status });
		}

		const metadata = await metaResponse.json();

		// If image, download and upload to storage
		if (metadata.mimeType.startsWith('image/')) {
			const contentResponse = await fetch(
				`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);

			if (!contentResponse.ok) {
				const errorData = await contentResponse.json();
				console.error('Google Drive content fetch error:', errorData);
				return NextResponse.json({
					error: 'Failed to fetch file content',
					details: errorData.error?.message || 'Unknown error'
				}, { status: contentResponse.status });
			}

			const blob = await contentResponse.blob();
			const file = new File([blob], metadata.name, { type: metadata.mimeType });
			const fileUrl = await FileService.uploadImage(file, boardId);

			return NextResponse.json({ type: 'image', url: fileUrl, metadata });
		} else {
			// For non-images, return Drive link
			return NextResponse.json({ type: 'link', url: metadata.webViewLink, metadata });
		}
	} catch (error) {
		console.error('Import-google-drive-fetch error:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to fetch file';
		return NextResponse.json({
			error: errorMessage,
			needsReconnect: errorMessage.includes('OAuth') || errorMessage.includes('token')
		}, { status: 500 });
	}
});