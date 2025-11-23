import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'avatars';
const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const COMPRESSION_QUALITY = 0.9;

/**
 * Compresses an image blob if it's larger than 1MB
 * Reuses the compression pattern from useCanvasDrop
 */
async function compressImageBlob(blob: Blob): Promise<Blob> {
	// Skip compression if already small enough
	if (blob.size <= MAX_IMAGE_SIZE) {
		return blob;
	}

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Failed to get canvas context'));
				return;
			}

			// Avatar is already 400x400, so no need to resize
			canvas.width = img.width;
			canvas.height = img.height;

			ctx.drawImage(img, 0, 0);

			canvas.toBlob(
				(compressedBlob) => {
					if (compressedBlob) {
						// Only use compressed version if it's actually smaller
						resolve(compressedBlob.size < blob.size ? compressedBlob : blob);
					} else {
						reject(new Error('Failed to compress image'));
					}
				},
				'image/jpeg',
				COMPRESSION_QUALITY
			);
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = URL.createObjectURL(blob);
	});
}

/**
 * Uploads an avatar image to Supabase Storage
 * @param blob - The image blob to upload
 * @param userId - The user's ID
 * @returns The public URL of the uploaded image
 */
export async function uploadAvatar(blob: Blob, userId: string): Promise<string> {
	const supabase = createClient();

	// Delete old avatar if exists
	await deleteOldAvatar(userId);

	// Compress image if needed
	const compressedBlob = await compressImageBlob(blob);

	// Generate filename with timestamp
	const timestamp = Date.now();
	const fileName = `${userId}/${timestamp}.jpg`;

	// Upload to storage
	const { data, error } = await supabase.storage
		.from(BUCKET_NAME)
		.upload(fileName, compressedBlob, {
			cacheControl: '3600',
			upsert: true,
			contentType: 'image/jpeg',
		});

	if (error) {
		console.error('Error uploading avatar:', error);
		throw new Error('Failed to upload avatar');
	}

	// Get public URL
	const { data: urlData } = supabase.storage
		.from(BUCKET_NAME)
		.getPublicUrl(fileName);

	return urlData.publicUrl;
}

/**
 * Deletes the user's old avatar from storage
 * @param userId - The user's ID
 */
export async function deleteOldAvatar(userId: string): Promise<void> {
	const supabase = createClient();

	try {
		// List all files in the user's folder
		const { data: files, error: listError } = await supabase.storage
			.from(BUCKET_NAME)
			.list(userId);

		if (listError) {
			console.error('Error listing files:', listError);
			return;
		}

		if (!files || files.length === 0) {
			return;
		}

		// Delete all old avatars
		const filesToDelete = files.map((file) => `${userId}/${file.name}`);
		const { error: deleteError } = await supabase.storage
			.from(BUCKET_NAME)
			.remove(filesToDelete);

		if (deleteError) {
			console.error('Error deleting old avatar:', deleteError);
		}
	} catch (error) {
		console.error('Error in deleteOldAvatar:', error);
	}
}

/**
 * Removes the user's avatar completely
 * @param userId - The user's ID
 */
export async function removeAvatar(userId: string): Promise<void> {
	await deleteOldAvatar(userId);
}
