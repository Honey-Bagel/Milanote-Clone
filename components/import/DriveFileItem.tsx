'use client';

import { useState } from "react";
import { FileIcon, Image } from "lucide-react";
import type { GoogleDriveFile } from "@/lib/hooks/connected-apps/useGoogleDriveFiles";

interface DriveFileItemProps {
	file: GoogleDriveFile,
	boardId: string;
};

export function DriveFileItem({ file, boardId }: DriveFileItemProps) {
	const [isDragging, setIsDragging] = useState(false);
	const isImage = file.mimeType.startsWith('image/');

	const handleDragStart = (e: React.DragEvent) => {
		setIsDragging(true);
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('application/json', JSON.stringify({
			type: 'import',
			provider: 'google-drive',
			fileId: file.id,
			fileName: file.name,
			mimeType: file.mimeType,
			boardId,
		}));
	};

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onDragEnd={() => setIsDragging(false)}
			className={`flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-move ${
				isDragging ? 'opacity-50' : ''
			}`}
		>
			{file.thumbnailLink ? (
				<img src={file.thumbnailLink} alt={file.name} className="w-10 h-10 object-cover rounded" />
			) : (
				<FileIcon size={20} className="text-slate-400" />
			)}
			<div className="flex-1 min-w-0">
				<div className="text-sm text-white truncate">{file.name}</div>
				<div className="text-xs text-slate-400">
					{file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Google Doc'}
				</div>
			</div>
		</div>
	)
}