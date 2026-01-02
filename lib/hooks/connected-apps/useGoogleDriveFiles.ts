'use client';

import { useState, useEffect } from 'react';

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

export function useGoogleDriveFiles(folderId: string = 'root') {
	const [files, setFiles] = useState<GoogleDriveFile[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		async function fetchFiles() {
			setIsLoading(true);
			try {
				const response = await fetch(`/api/import/google-drive/list?folderId=${folderId}`);
				const data = await response.json();
				setFiles(data.files || []);
				setError(null);
			} catch (err) {
				setError(err as Error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchFiles();
	}, [folderId]);

	return { files, isLoading, error };
}