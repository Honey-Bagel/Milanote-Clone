import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME, getPublicUrl } from '@/lib/config/r2';
import { reserveStorage, releaseReservation } from '@/lib/billing/storage-reservation';
import { init } from '@instantdb/admin';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit/configs';

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

/**
 * Upload types for organizing files in R2
 */
type UploadType = 'image' | 'file' | 'avatar';

/**
 * Request body schema
 */
interface PresignedUrlRequest {
  key: string;
  contentType: string;
  uploadType: UploadType;
}

/**
 * Response schema
 */
interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
  reservationId: string;
}

/**
 * Validate and sanitize the file key
 * Prevents path traversal and ensures correct directory structure
 */
function validateKey(key: string, uploadType: UploadType): boolean {
  // Check for path traversal attempts
  if (key.includes('..') || key.includes('\\')) {
    return false;
  }

  // Validate key structure based on upload type
  switch (uploadType) {
    case 'image':
      return key.startsWith('boards/') && key.includes('/images/');
    case 'file':
      return key.startsWith('boards/') && key.includes('/files/');
    case 'avatar':
      return key.startsWith('users/') && key.includes('/avatar/');
    default:
      return false;
  }
}

/**
 * POST /api/upload/presigned-url
 *
 * Generate a presigned URL for uploading files to R2
 * The client will use this URL to upload directly to R2
 */
export const POST = withRateLimitedAuth(
	async (user, req) => {
		try {
			const body = await req.json();
			const { key, contentType, uploadType, fileSize, boardId } = body;

			// Validate required fields
			if (!key || !contentType || !uploadType) {
			return NextResponse.json(
				{ error: 'Missing required fields: key, contentType, uploadType' },
				{ status: 400 }
			);
			}

			// Skip validation for avatar uploads (no board/storage limits)
			let reservationId = '';
			if (uploadType !== 'avatar') {
				// Require boardId for non-avatar uploads
				if (!boardId) {
					return NextResponse.json({ error: 'Board ID required for file uploads' }, { status: 400 });
				}

				// Require fileSize for storage check
				if (typeof fileSize !== 'number' || fileSize <= 0) {
					return NextResponse.json({ error: 'Valid file size required' }, { status: 400 });
				}

				// RESERVE STORAGE QUOTA (prevents race conditions)
				const reservation = await reserveStorage(boardId, fileSize);

				if (!reservation.allowed) {
					return NextResponse.json(
						{
							error: reservation.reason,
							upgrade_required: true,
							owner_limits_exceeded: true,
						},
						{ status: 403 }
					);
				}

				reservationId = reservation.reservationId || '';
			}

			// Validate key structure
			if (!validateKey(key, uploadType)) {
				// Release reservation if validation fails (for non-avatar uploads)
				if (uploadType !== 'avatar' && boardId) {
					const { boards } = await adminDB.query({
						boards: { $: { where: { id: boardId } }, owner: {} },
					});
					if (boards[0]?.owner) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const owner = boards[0].owner as any;
						await releaseReservation(owner.id, fileSize);
					}
				}

				return NextResponse.json(
					{ error: 'Invalid key format or path traversal attempt' },
					{ status: 400 }
				);
			}

			// Create the PutObject command
			const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			ContentType: contentType,
			});

			// Generate presigned URL with 1 hour expiry
			const expiresIn = 3600; // 1 hour in seconds
			const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

			// Generate public URL for the uploaded file
			const publicUrl = getPublicUrl(key);

			const response: PresignedUrlResponse = {
			uploadUrl,
			publicUrl,
			key,
			expiresIn,
			reservationId,
			};

			return NextResponse.json(response);
		} catch (error) {
			console.error('[PresignedURL] Error generating presigned URL:', error);
			return NextResponse.json(
			{ error: 'Failed to generate presigned URL' },
			{ status: 500 }
			);
		}
	},
	RATE_LIMITS.UPLOAD_PRESIGNED_URL,
	'upload-presigned-url'
);
