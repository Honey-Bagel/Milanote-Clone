import { NextResponse } from 'next/server';
import { getValidToken } from '@/lib/services/oauth-token-service';
import { FileService } from '@/lib/services';
import { checkBoardOwnerLimits } from '@/lib/billing/entitlement-check';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit/configs';

export const POST = withRateLimitedAuth(
	async (user, req) => {
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

			// Pre-check storage limits before downloading from Google Drive
			if (metadata.mimeType.startsWith('image/') && metadata.size) {
				const fileSize = parseInt(metadata.size, 10);
				const storageCheck = await checkBoardOwnerLimits(boardId, 'storage', fileSize);

				if (!storageCheck.allowed) {
					return NextResponse.json({
						error: storageCheck.reason,
						upgrade_required: true,
					}, { status: 403 });
				}
			}

			// Check card limit (importing creates a new card)
			const cardCheck = await checkBoardOwnerLimits(boardId, 'card');
			if (!cardCheck.allowed) {
				return NextResponse.json({
					error: cardCheck.reason,
					upgrade_required: true,
				}, { status: 403 });
			}

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
	},
	RATE_LIMITS.GOOGLE_DRIVE_FETCH,
	'google-drive-fetch'
);