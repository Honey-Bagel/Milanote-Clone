'use client';

import { useState } from "react";
import { FileIcon } from "lucide-react";
import type { GoogleDriveFile } from "@/lib/hooks/connected-apps/use-google-drive-files";

interface DriveFileItemProps {
	file: GoogleDriveFile;
	boardId: string;
	compact?: boolean;
}

export function DriveFileItem({ file, boardId, compact = false }: DriveFileItemProps) {
	const [isDragging, setIsDragging] = useState(false);

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

	if (compact) {
		return (
			<div
				draggable
				onDragStart={handleDragStart}
				onDragEnd={() => setIsDragging(false)}
				className={`flex flex-col p-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-move ${
					isDragging ? 'opacity-50' : ''
				}`}
			>
				{file.thumbnailLink ? (
					<img
						src={file.thumbnailLink}
						alt={file.name}
						className="w-full aspect-square object-cover rounded mb-2"
					/>
				) : (
					<div className="w-full aspect-square bg-slate-700 rounded mb-2 flex items-center justify-center">
						<FileIcon size={24} className="text-slate-400" />
					</div>
				)}
				<div className="text-xs text-white truncate">{file.name}</div>
			</div>
		);
	}

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
	);
}