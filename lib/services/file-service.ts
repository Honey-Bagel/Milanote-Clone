/**
 * File Service - Handles file uploads to Cloudflare R2
 *
 * Uses presigned URLs for secure client-side uploads to R2
 */

import { db } from '../instant/db';
import { PresignedUrlResponse } from '@/lib/types';

// Maximum file size before compression (1MB)
const MAX_IMAGE_SIZE = 1024 * 1024;
// Target quality for JPEG compression
const COMPRESSION_QUALITY = 0.8;
// Maximum dimension for images
const MAX_IMAGE_DIMENSION = 2000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize filename to prevent path traversal and special character issues
 */
function sanitizeFilename(filename: string): string {
	return filename
		.replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
		.replace(/^\.+/, '') // Remove leading dots
		.substring(0, 100); // Limit length to 100 chars
}

/**
 * Extract R2 key from public URL
 * Example: https://files.example.com/boards/123/images/file.jpg -> boards/123/images/file.jpg
 */
function extractKeyFromUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.pathname.substring(1); // Remove leading slash
	} catch {
		// If not a valid URL, assume it's already a key
		return url;
	}
}

/**
 * Determine upload type from key path
 */
function determineUploadType(key: string): 'image' | 'file' | 'avatar' {
	if (key.includes('/images/')) return 'image';
	if (key.includes('/avatar/')) return 'avatar';
	return 'file';
}

// ============================================================================
// IMAGE COMPRESSION
// ============================================================================

/**
 * Compress an image file using canvas
 *
 * Skips non-images, small images, and GIFs (to preserve animation)
 */
async function compressImage(file: File): Promise<File> {
	// Skip non-images or small images
	if (!file.type.startsWith('image/') || file.size <= MAX_IMAGE_SIZE) {
		return file;
	}

	// Skip GIFs (to preserve animation)
	if (file.type === 'image/gif') {
		return file;
	}

	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);

			// Calculate new dimensions while maintaining aspect ratio
			let { width, height } = img;
			if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
				const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}

			// Create canvas and draw scaled image
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(file);
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);

			// Convert to blob
			canvas.toBlob(
				(blob) => {
					if (blob && blob.size < file.size) {
						// Create new file with compressed data
						const compressedFile = new File([blob], file.name, {
							type: 'image/jpeg',
							lastModified: Date.now(),
						});
						resolve(compressedFile);
					} else {
						// Compression didn't help, use original
						resolve(file);
					}
				},
				'image/jpeg',
				COMPRESSION_QUALITY
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(file);
		};

		img.src = url;
	});
}

// ============================================================================
// R2 UPLOAD FUNCTION
// ============================================================================

/**
 * Upload file to R2 using presigned URL
 *
 * Flow:
 * 1. Request presigned URL from API
 * 2. Upload file directly to R2 using presigned URL
 * 3. Return public URL for database storage
 */
async function uploadToR2(file: File, key: string): Promise<string> {
	try {
		// Step 1: Get presigned URL from API
		const response = await fetch('/api/upload/presigned-url', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				key,
				contentType: file.type,
				uploadType: determineUploadType(key),
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to get presigned URL: ${error}`);
		}

		const data: PresignedUrlResponse = await response.json();

		// Step 2: Upload file directly to R2
		const uploadResponse = await fetch(data.uploadUrl, {
			method: 'PUT',
			body: file,
			headers: {
				'Content-Type': file.type,
			},
		});

		if (!uploadResponse.ok) {
			throw new Error(`Failed to upload to R2: ${uploadResponse.statusText}`);
		}

		// Step 3: Return public URL
		return data.publicUrl;
	} catch (error) {
		console.error('[FileService] Upload error:', error);
		throw error;
	}
}

// ============================================================================
// REFERENCE COUNTING & SAFE DELETION
// ============================================================================

/**
 * Count how many cards reference a specific file URL
 *
 * @param fileUrl - The file URL to check
 * @param cardType - 'image' or 'file' to determine which field to query
 * @returns Number of cards referencing this URL
 */
async function countFileReferences(fileUrl: string, cardType: 'image' | 'file'): Promise<number> {
	try {
		const fieldName = cardType === 'image' ? 'image_url' : 'file_url';

		// Query InstantDB for all cards with this URL
	const { data } = await db.queryOnce({
		cards: {
			$: {
				where: {
					[fieldName]: fileUrl
				}
			}
		}
	});

	const cards = data?.cards || [];
	

		return cards?.length || 0;
	} catch (error) {
		console.error('[FileService] Error counting file references:', error);
		return 0;
	}
}

/**
 * Safely delete a file from R2 with reference counting
 *
 * Only deletes the file if it's the last card referencing it.
 * Avatars are always deleted (users only have one avatar).
 *
 * @param fileUrl - URL of the file to delete
 * @param cardType - Type of card: 'image', 'file', or 'avatar'
 */
export async function safeDeleteFile(
	fileUrl: string,
	cardType: 'image' | 'file' | 'avatar'
): Promise<void> {
	// Skip data URLs (backwards compatibility)
	if (fileUrl.startsWith('data:')) {
		console.log('[FileService] Skipping deletion of data URL');
		return;
	}

	// Skip empty URLs
	if (!fileUrl) {
		return;
	}

	try {
		// For avatars, always delete (users have only one avatar at a time)
		if (cardType === 'avatar') {
			console.log('[FileService] Deleting avatar (always delete)');
			await deleteFile(fileUrl);
			return;
		}

		// For images/files, check reference count
		const referenceCount = await countFileReferences(fileUrl, cardType);
		console.log(`[FileService] File ${fileUrl} has ${referenceCount} reference(s)`);

		if (referenceCount <= 1) {
			// This is the last reference, safe to delete
			console.log('[FileService] Last reference - deleting file from R2');
			await deleteFile(fileUrl);
		} else {
			// Other cards still reference this file
			console.log(`[FileService] Skipping deletion - ${referenceCount} cards still reference this file`);
		}
	} catch (error) {
		console.error('[FileService] Error in safeDeleteFile:', error);
		// Don't throw - deletion failures shouldn't block card deletion
	}
}

// ============================================================================
// PUBLIC UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload image to R2
 *
 * @param file - Image file to upload
 * @param boardId - Board ID for organizing files
 * @returns Promise<string> - Public URL of uploaded image
 */
export async function uploadImage(file: File, boardId: string): Promise<{ url: string, size: number }> {
	try {
		// Compress image
		const compressedFile = await compressImage(file);

		// Generate unique key with timestamp
		const timestamp = Date.now();
		const sanitizedName = sanitizeFilename(file.name);
		const key = `boards/${boardId}/images/${timestamp}-${sanitizedName}`;

		// Upload to R2
		const size = compressedFile.size;
		const url = await uploadToR2(compressedFile, key);

		return { url, size};
	} catch (error) {
		console.error('[FileService] Image upload failed:', error);
		if (error instanceof Error) {
			throw new Error(`Failed to upload image: ${error.message}`);
		}
		throw new Error('Failed to upload image. Please try again.');
	}
}

/**
 * Upload file to R2
 *
 * @param file - File to upload
 * @param boardId - Board ID for organizing files
 * @returns Promise<string> - Public URL of uploaded file
 */
export async function uploadFile(file: File, boardId: string): Promise<string> {
	try {
		const timestamp = Date.now();
		const sanitizedName = sanitizeFilename(file.name);
		const key = `boards/${boardId}/files/${timestamp}-${sanitizedName}`;

		return await uploadToR2(file, key);
	} catch (error) {
		console.error('[FileService] File upload failed:', error);
		if (error instanceof Error) {
			throw new Error(`Failed to upload file: ${error.message}`);
		}
		throw new Error('Failed to upload file. Please try again.');
	}
}

/**
 * Upload avatar image to R2
 *
 * @param file - Avatar image file
 * @param userId - User ID for organizing files
 * @returns Promise<string> - Public URL of uploaded avatar
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
	try {
		// Compress to reasonable avatar size
		const compressedFile = await compressImage(file);

		// Use fixed key (automatically overwrites old avatar)
		const key = `users/${userId}/avatar/avatar.jpg`;

		return await uploadToR2(compressedFile, key);
	} catch (error) {
		console.error('[FileService] Avatar upload failed:', error);
		if (error instanceof Error) {
			throw new Error(`Failed to upload avatar: ${error.message}`);
		}
		throw new Error('Failed to upload avatar. Please try again.');
	}
}

/**
 * Delete file from R2
 *
 * @param fileUrl - URL of file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
	// Skip data URLs (backwards compatibility during migration)
	if (fileUrl.startsWith('data:')) {
		console.log('[FileService] Skipping deletion of data URL');
		return;
	}

	try {
		// Extract key from URL
		const key = extractKeyFromUrl(fileUrl);

		const response = await fetch('/api/upload/delete', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ key }),
		});

		if (!response.ok) {
			console.error('[FileService] Failed to delete file:', fileUrl);
		}
	} catch (error) {
		console.error('[FileService] Error deleting file:', error);
		// Don't throw - deletion failures shouldn't block card deletion
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

export const FileService = {
	uploadImage,
	uploadFile,
	uploadAvatar,
	deleteFile,
	safeDeleteFile,
};
