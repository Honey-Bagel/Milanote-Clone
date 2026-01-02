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
		const metadata = await metaResponse.json();

		// If image, download and upload to storage
		if (metadata.mimeType.startsWith('image/')) {
			const contentResponse = await fetch(
				`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);

			const blob = await contentResponse.blob();
			const file = new File([blob], metadata.name, { type: metadata.mimeType });
			const fileUrl = await FileService.uploadImage(file, boardId);

			return NextResponse.json({ type: 'image', url: fileUrl, metadata });
		} else {
			// For non-images, return Drive link
			return NextResponse.json({ type: 'link', url: metadata.webViewLink, metadata });
		}
	} catch (error) {
		console.log(error);
		return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
	}
});