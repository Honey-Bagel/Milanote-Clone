import { S3Client } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 Configuration
 *
 * R2 is S3-compatible, so we use the AWS SDK with a custom endpoint
 */

// Initialize R2 client with S3-compatible endpoint
export const r2Client = new S3Client({
  region: 'auto', // R2 uses 'auto' or any region (ignored)
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// R2 bucket configuration
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Generate public URL for an R2 object key
 * @param key - Object key in R2 bucket (e.g., "boards/123/images/file.jpg")
 * @returns Full public URL
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}
