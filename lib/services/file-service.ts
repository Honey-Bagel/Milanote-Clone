/**
 * File Service - Handles file uploads with S3 placeholder
 *
 * CURRENT: Returns placeholder URLs (data URLs)
 * FUTURE: Will upload to AWS S3 and return real URLs
 */

// Maximum file size before compression (1MB)
const MAX_IMAGE_SIZE = 1024 * 1024;
// Target quality for JPEG compression
const COMPRESSION_QUALITY = 0.8;
// Maximum dimension for images
const MAX_IMAGE_DIMENSION = 2000;

// ============================================================================
// IMAGE COMPRESSION (Reused from useCanvasDrop)
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
// UPLOAD FUNCTIONS (PLACEHOLDER IMPLEMENTATION)
// ============================================================================

/**
 * Upload image to storage
 *
 * CURRENT: Returns placeholder URL (data URL)
 * FUTURE: Upload to S3 and return S3 URL
 *
 * @param file - Image file to upload
 * @param boardId - Board ID for organizing files
 * @returns Promise<string> - URL of uploaded image
 */
export async function uploadImage(file: File, boardId: string): Promise<string> {
  // Compress image
  const compressedFile = await compressImage(file);

  // TODO: Replace with S3 upload
  // const s3Url = await uploadToS3(compressedFile, `boards/${boardId}/images/${Date.now()}-${file.name}`);
  // return s3Url;

  // PLACEHOLDER: Return data URL for now
  console.warn('[FileService] Using placeholder data URL. Replace with S3 upload for production.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressedFile);
  });
}

/**
 * Upload file to storage
 *
 * CURRENT: Returns placeholder URL (data URL)
 * FUTURE: Upload to S3 and return S3 URL
 *
 * @param file - File to upload
 * @param boardId - Board ID for organizing files
 * @returns Promise<string> - URL of uploaded file
 */
export async function uploadFile(file: File, boardId: string): Promise<string> {
  // TODO: Replace with S3 upload
  // const s3Url = await uploadToS3(file, `boards/${boardId}/files/${Date.now()}-${file.name}`);
  // return s3Url;

  // PLACEHOLDER: Return data URL for now
  console.warn('[FileService] Using placeholder data URL. Replace with S3 upload for production.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload avatar image
 *
 * CURRENT: Returns placeholder URL (data URL)
 * FUTURE: Upload to S3 and return S3 URL
 *
 * @param file - Avatar image file
 * @param userId - User ID for organizing files
 * @returns Promise<string> - URL of uploaded avatar
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  // Compress to reasonable avatar size
  const compressedFile = await compressImage(file);

  // TODO: Replace with S3 upload
  // Delete old avatar first
  // await deleteFromS3(`avatars/${userId}/`);
  // const s3Url = await uploadToS3(compressedFile, `avatars/${userId}/${Date.now()}.jpg`);
  // return s3Url;

  // PLACEHOLDER: Return data URL for now
  console.warn('[FileService] Using placeholder data URL. Replace with S3 upload for production.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressedFile);
  });
}

/**
 * Delete file from storage
 *
 * CURRENT: No-op
 * FUTURE: Delete from S3
 *
 * @param fileUrl - URL of file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  // TODO: Implement S3 deletion
  // const key = extractS3KeyFromUrl(fileUrl);
  // await deleteFromS3(key);

  // PLACEHOLDER: No-op
  console.log('[FileService] File deletion placeholder (no-op):', fileUrl);
}

// ============================================================================
// S3 FUNCTIONS (TO BE IMPLEMENTED LATER)
// ============================================================================

/**
 * Upload file to S3
 * Implementation will be added when S3 is integrated
 *
 * Future implementation:
 * 1. Get presigned URL from API route
 * 2. Upload file to S3 using presigned URL
 * 3. Return public S3 URL
 */
// async function uploadToS3(file: File, key: string): Promise<string> {
//   const response = await fetch('/api/upload/presigned-url', {
//     method: 'POST',
//     body: JSON.stringify({ key, contentType: file.type }),
//   });
//   const { url, publicUrl } = await response.json();
//
//   await fetch(url, {
//     method: 'PUT',
//     body: file,
//     headers: { 'Content-Type': file.type },
//   });
//
//   return publicUrl;
// }

/**
 * Delete file from S3
 * Implementation will be added when S3 is integrated
 */
// async function deleteFromS3(key: string): Promise<void> {
//   await fetch('/api/upload/delete', {
//     method: 'DELETE',
//     body: JSON.stringify({ key }),
//   });
// }

// ============================================================================
// EXPORTS
// ============================================================================

export const FileService = {
  uploadImage,
  uploadFile,
  uploadAvatar,
  deleteFile,
};
