'use client';

import useSWR from 'swr';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink: string;
  iconLink?: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
};

interface GoogleDriveFilesResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

// Fetcher function for SWR
async function fetchGoogleDriveFiles(url: string): Promise<GoogleDriveFilesResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }

  return response.json();
}

export function useGoogleDriveFiles(folderId: string = 'root') {
	// Create a unique cache key for each folder
	const cacheKey = `/api/import/google-drive/list?folderId=${folderId}`;

	const { data, error, isLoading, isValidating } = useSWR<GoogleDriveFilesResponse>(
		cacheKey,
		fetchGoogleDriveFiles,
		{
			// Session-only cache: SWR's default cache is in-memory only (clears on page reload)
			revalidateOnFocus: true,        // Refresh when user returns to tab
			revalidateOnReconnect: true,    // Refresh when network reconnects
			dedupingInterval: 2000,         // Dedupe requests within 2 seconds
			revalidateIfStale: true,        // Always show cached data, then revalidate
			shouldRetryOnError: true,       // Retry on error
			errorRetryCount: 3,             // Retry up to 3 times
			errorRetryInterval: 5000,       // 5 seconds between retries
		}
	);

	return {
		files: data?.files || [],
		nextPageToken: data?.nextPageToken,
		isLoading,                        // Initial loading (no cached data)
		isValidating,                     // Background refresh indicator
		error,
	};
}