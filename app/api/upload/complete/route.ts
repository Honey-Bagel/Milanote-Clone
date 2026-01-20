import { NextResponse } from 'next/server';
import { HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/config/r2';
import { confirmReservation, releaseReservation } from '@/lib/billing/storage-reservation';
import { checkBoardOwnerLimits } from '@/lib/billing/entitlement-check';
import { init } from '@instantdb/admin';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit/configs';

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

interface CompleteUploadRequest {
	key: string;
	boardId: string;
	declaredSize: number;
	reservationId: string;
}

interface CompleteUploadResponse {
	success: boolean;
	actualSize?: number;
	reason?: string;
}

/**
 * POST /api/upload/complete
 *
 * Validates upload after file is in R2:
 * 1. Verify file exists in R2 with HEAD request
 * 2. Compare actual size vs declared size
 * 3. Re-validate storage limits with actual size
 * 4. Confirm reservation if valid, or delete file and release if invalid
 */
export const POST = withRateLimitedAuth(
	async (user, req) => {
		try {
			const body: CompleteUploadRequest = await req.json();
			const { key, boardId, declaredSize, reservationId } = body;

			// Validate inputs
			if (!key || !boardId || typeof declaredSize !== 'number') {
				return NextResponse.json(
					{ error: 'Missing required fields' },
					{ status: 400 }
				);
			}

			// Get board owner
			const { boards } = await adminDB.query({
				boards: {
					$: { where: { id: boardId } },
					owner: {},
				},
			});

			const board = boards[0];
			if (!board?.owner) {
				return NextResponse.json(
					{ error: 'Board not found' },
					{ status: 404 }
				);
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const owner = board.owner as any;
			const ownerId = owner.id;

			// STEP 1: Verify file exists and get actual size from R2
			let actualSize: number;
			try {
				const headCommand = new HeadObjectCommand({
					Bucket: R2_BUCKET_NAME,
					Key: key,
				});
				const headResponse = await r2Client.send(headCommand);
				actualSize = headResponse.ContentLength || 0;
			} catch (error: unknown) {
				console.error('[CompleteUpload] File not found in R2:', error);
				await releaseReservation(ownerId, declaredSize);
				return NextResponse.json(
					{
						success: false,
						reason: 'File not found in storage',
					},
					{ status: 404 }
				);
			}

			// STEP 2: Validate size matches (within 5% tolerance for compression variance)
			const sizeTolerance = 0.05;
			const sizeMatch =
				Math.abs(actualSize - declaredSize) / declaredSize <= sizeTolerance;

			if (!sizeMatch) {
				console.warn(
					`[CompleteUpload] Size mismatch: declared=${declaredSize}, actual=${actualSize}`
				);
				// For security, treat large mismatches as failures
				if (actualSize > declaredSize * 1.5) {
					try {
						const deleteCommand = new DeleteObjectCommand({
							Bucket: R2_BUCKET_NAME,
							Key: key,
						});
						await r2Client.send(deleteCommand);
					} catch (deleteError) {
						console.error('[CompleteUpload] Failed to delete file:', deleteError);
					}

					await releaseReservation(ownerId, declaredSize);
					return NextResponse.json(
						{
							success: false,
							reason: 'File size mismatch detected',
						},
						{ status: 400 }
					);
				}
			}

			// STEP 3: Re-validate storage limits with ACTUAL size
			const check = await checkBoardOwnerLimits(boardId, 'storage', actualSize);

			if (!check.allowed) {
				console.log('[CompleteUpload] Limits exceeded after upload:', check.reason);

				// Delete file from R2
				try {
					const deleteCommand = new DeleteObjectCommand({
						Bucket: R2_BUCKET_NAME,
						Key: key,
					});
					await r2Client.send(deleteCommand);
				} catch (deleteError) {
					console.error('[CompleteUpload] Failed to delete file:', deleteError);
				}

				// Release reservation
				await releaseReservation(ownerId, declaredSize);

				return NextResponse.json(
					{
						success: false,
						reason: check.reason,
						upgrade_required: true,
					},
					{ status: 403 }
				);
			}

			// STEP 4: Validation passed - confirm reservation
			await confirmReservation(ownerId, declaredSize);

			return NextResponse.json({
				success: true,
				actualSize,
			});
		} catch (error) {
			console.error('[CompleteUpload] Error:', error);
			return NextResponse.json(
				{ error: 'Failed to complete upload validation' },
				{ status: 500 }
			);
		}
	},
	RATE_LIMITS.UPLOAD_COMPLETE,
	'upload-complete'
);
