import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { withInstantAuth } from '@/lib/auth/with-instant-auth';
import { r2Client, R2_BUCKET_NAME, getPublicUrl } from '@/lib/config/r2';

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
export const POST = withInstantAuth(async (user, req) => {
  try {
    const body: PresignedUrlRequest = await req.json();
    const { key, contentType, uploadType } = body;

    // Validate required fields
    if (!key || !contentType || !uploadType) {
      return NextResponse.json(
        { error: 'Missing required fields: key, contentType, uploadType' },
        { status: 400 }
      );
    }

    // Validate key structure
    if (!validateKey(key, uploadType)) {
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[PresignedURL] Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
});
