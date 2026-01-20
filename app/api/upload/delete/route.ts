import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { init } from '@instantdb/admin';
import { r2Client, R2_BUCKET_NAME } from '@/lib/config/r2';
import { withRateLimitedAuth } from '@/lib/rate-limit/with-rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit/configs';

// Initialize admin DB for ownership verification
const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

/**
 * Request body schema
 */
interface DeleteFileRequest {
	key: string;
}

/**
 * Response schema
 */
interface DeleteFileResponse {
	success: boolean;
	key: string;
}

/**
 * Extract board ID from R2 key
 * Expected key format: boards/{boardId}/images/... or boards/{boardId}/files/...
 */
function extractBoardIdFromKey(key: string): string | null {
	const match = key.match(/^boards\/([^/]+)\//);
	return match ? match[1] : null;
}

/**
 * Extract user ID from R2 key
 * Expected key format: users/{userId}/avatar/...
 */
function extractUserIdFromKey(key: string): string | null {
	const match = key.match(/^users\/([^/]+)\//);
	return match ? match[1] : null;
}

/**
 * Verify user has permission to delete this file
 */
async function verifyDeletePermission(
	key: string,
	userId: string
): Promise<boolean> {
	// For avatar uploads, verify the user ID matches
	if (key.startsWith('users/')) {
		const fileUserId = extractUserIdFromKey(key);
		return fileUserId === userId;
	}

	// For board files, verify the user owns the board
	if (key.startsWith('boards/')) {
		const boardId = extractBoardIdFromKey(key);
		if (!boardId) return false;

		try {
			const { boards } = await adminDB.query({
				boards: {
					$: {
						where: { id: boardId },
					},
					owner: {},
				},
			});

			const board = boards[0];
			if (!board) return false;

			// Check if user is the owner
			return board.owner?.[0].id === userId;
		} catch (error) {
			console.error('[DeleteFile] Error verifying board ownership:', error);
			return false;
		}
	}

	return false;
}

/**
 * DELETE /api/upload/delete
 *
 * Delete a file from R2
 * Requires authentication and ownership verification
 */
export const DELETE = withRateLimitedAuth(
	async (user, req) => {
		try {
			const body: DeleteFileRequest = await req.json();
			const { key } = body;

			// Validate required fields
			if (!key) {
				return NextResponse.json(
					{ error: 'Missing required field: key' },
					{ status: 400 }
				);
			}

			// Check for path traversal attempts
			if (key.includes('..') || key.includes('\\')) {
				return NextResponse.json(
					{ error: 'Invalid key format' },
					{ status: 400 }
				);
			}

			// Verify user has permission to delete this file
			const hasPermission = await verifyDeletePermission(key, user.id);
			if (!hasPermission) {
				return NextResponse.json(
					{ error: 'Unauthorized: You do not have permission to delete this file' },
					{ status: 403 }
				);
			}

			// Delete the object from R2
			const command = new DeleteObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: key,
			});

			await r2Client.send(command);

			const response: DeleteFileResponse = {
				success: true,
				key,
			};

			return NextResponse.json(response);
		} catch (error: any) {
			// Handle "NoSuchKey" error gracefully (file already deleted)
			if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
				return NextResponse.json({
					success: true,
					key: (await req.json()).key,
				});
			}

			console.error('[DeleteFile] Error deleting file:', error);
			return NextResponse.json(
				{ error: 'Failed to delete file' },
				{ status: 500 }
			);
		}
	},
	RATE_LIMITS.UPLOAD_DELETE,
	'upload-delete'
);
