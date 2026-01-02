'use client';

import { useState } from 'react';
import { Folder, ChevronRight, Home, Loader2, AlertCircle } from 'lucide-react';
import { useGoogleDriveFiles } from '@/lib/hooks/connected-apps/useGoogleDriveFiles';
import { DriveFileItem } from './DriveFileItem';
import type { LinkedAccount } from '@/lib/types';

interface GoogleDrivePanelProps {
	account: LinkedAccount | undefined;
	boardId: string;
};

interface BreadcrumbItem {
	id: string;
	name: string;
};

export function GoogleDrivePanel({ account, boardId }: GoogleDrivePanelProps) {
	const [currentFolderId, setCurrentFolderId] = useState('root');
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
		{ id: 'root', name: 'My Drive' }
	]);

	const { files, isLoading, error } = useGoogleDriveFiles(currentFolderId);

	// Handle folder navigation
	const navigateToFolder = (folderId: string, folderName: string) => {
		setCurrentFolderId(folderId);
		setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
	};

	// Handle breadcrumb navigation
	const navigateToBreadcrumb = (index: number) => {
		const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
		setBreadcrumbs(newBreadcrumbs);
		setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
	};

	// Not connected state
	if (!account) {
		return (
			<div className="flex flex-col items-center justify-center h-full px-6 text-center">
				<div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
					<Folder size={32} className="text-slate-500" />
				</div>
				<h3 className="text-lg font-semibold text-white mb-2">
					Connect Google Drive
				</h3>
				<p className="text-sm text-slate-400 mb-6">
					Connect your Google Drive account to import files into your boards
				</p>
				<a
					href="/settings?tab=connected_Accounts"
					className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm"
				>
					Go to Settings
				</a>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Breadcrumb navigation */}
			<div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
				<div className="flex items-center gap-1 text-sm overflow-x-auto">
					{breadcrumbs.map((crumb, index) => (
						<div key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
							{index > 0 && <ChevronRight size={14} className="text-slate-500" />}
							<button
								onClick={() => navigateToBreadcrumb(index)}
								className={`px-2 py-1 rounded hover:bg-slate-700 transition-colors ${
									index === breadcrumbs.length - 1
										? 'text-white font-medium'
										: 'text-slate-400'
								}`}
							>
								{index === 0 ? (
									<Home size={14} className="inline" />
								) : (
									crumb.name
								)}
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Account Info */}
			<div className="px-4 py-2 border-b border-slate-700 bg-slate-800/30">
				<div className="flex items-center gap-2">
					<div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
						{account.provider_name?.[0] || 'G'}
					</div>
					<div className="flex-1 min-w-0">
						<div className="text-xs text-slate-400 truncate">
							{account.provider_email}
						</div>
					</div>
				</div>
			</div>

			{/* File list */}
			<div className="flex-1 overflow-y-auto min-h-0">
				{isLoading ? (
					<div className="flex items-center justify-center h-full min-h-[200px]">
						<Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
					</div>
				) : error ? (
					<div className="flex flex-col items-center justify-center h-full min-h-[200px] px-6 text-center">
						<AlertCircle size={32} className="text-red-400 mb-2" />
						<p className="text-sm text-slate-400">Failed to load files</p>
						<p className="text-xs text-slate-500 mt-1">{error.message}</p>
					</div>
				) : files.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full min-h-[200px] px-6 text-center">
						<Folder size={32} className="text-slate-600 mb-2" />
						<p className="text-sm text-slate-400">This folder is empty</p>
					</div>
				) : (
					<div className="p-3 space-y-2">
						{/* Folders first */}
						{files
							.filter(file => file.mimeType === 'application/vnd.google-apps.folder')
							.map(folder => (
								<button
									key={folder.id}
									onClick={() => navigateToFolder(folder.id, folder.name)}
									className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-left"
								>
									<Folder size={20} className="text-blue-400 shrink-0" />
									<div className="flex-1 min-w-0">
										<div className="text-sm text-white truncate">{folder.name}</div>
										<div className="text-xs text-slate-400">Folder</div>
									</div>
									<ChevronRight size={16} className="text-slate-500 shrink-0" />
								</button>
							))}

						{/* Files (draggable */}
						{files
							.filter(file => file.mimeType !== 'application/vnd.google-apps.folder')
							.map(file => (
								<DriveFileItem
									key={file.id}
									file={file}
									boardId={boardId}
								/>
							))}
					</div>
				)}
			</div>

			{/* Footer hint */}
			<div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30">
				<p className="text-xs text-slate-500 text-center">
					Drag files onto the canvas to import them
				</p>
			</div>
		</div>
	);
}