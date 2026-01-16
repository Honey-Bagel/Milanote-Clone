'use client';

import { useState, useCallback } from "react";
import { X, Link2 } from 'lucide-react';
import { GoogleDrivePanel } from './GoogleDrivePanel';
import { useLinkedAccounts } from "@/lib/hooks/useLinkedAccount";
import { useDrawerPersistence } from '@/lib/hooks/useDrawerPersistence';
import { useDrawerResize } from '@/lib/hooks/useDrawerResize';
import { DrawerHandle } from './DrawerHandle';
import { DrawerResizer } from './DrawerResizer';
import { DrawerSettingsMenu } from './DrawerSettingsMenu';
import { useIsSmallScreen } from '@/lib/hooks/use-media-query';
import { cn } from '@/lib/utils';

interface ImportDrawerProps {
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
	boardId: string;
};

export function ImportDrawer({ isOpen, onOpen, onClose, boardId }: ImportDrawerProps) {
	const [activeProvider, setActiveProvider] = useState<'google_drive' |'pinterest'>('google_drive');
	const { accounts } = useLinkedAccounts();

	// Persistence and resize hooks
	const { width, autoClose, updateWidth, updateAutoClose } = useDrawerPersistence();
	const { isResizing, handleMouseDown } = useDrawerResize(width, updateWidth, onClose);
	const isSmallScreen = useIsSmallScreen();

	const googleDrive = accounts?.find(a => a.provider === 'google_drive' && a.is_active);
 	const pinterest = accounts?.find(a => a.provider === 'pinterest' && a.is_active);

	// Handle outside click if autoClose enabled
	const handleOutsideClick = useCallback(() => {
		if (autoClose) {
			onClose();
		}
	}, [autoClose, onClose]);

	// Handle drag start - open drawer if closed, then start resizing
	const handleDragStart = useCallback((e: React.MouseEvent) => {
		if (!isOpen) {
			onOpen();
		}
		handleMouseDown(e);
	}, [isOpen, onOpen, handleMouseDown]);

	return (
		<>
			{/* Backdrop for auto-close detection */}
			{isOpen && autoClose && (
				<div
					className="fixed inset-0 z-39 bg-transparent"
					onClick={handleOutsideClick}
					aria-hidden="true"
				/>
			)}

			{/* Drawer container */}
			<div
				className={cn(
					"fixed right-0 top-0 h-full bg-slate-900 border-l border-slate-700 shadow-2xl z-40",
					"flex flex-col",
					// Smooth slide animation
					"transition-transform duration-200 ease-out",
					isOpen ? "translate-x-0" : "translate-x-full",
					// Disable transition during resize for immediate feedback
					isResizing && "transition-none"
				)}
				style={{
					width: isSmallScreen ? 'calc(100vw - 32px)' : `${width}px`
				}}
				role="complementary"
				aria-label="Import content drawer"
			>
				{/* Resize handle (desktop only) */}
				{!isSmallScreen && (
					<DrawerResizer
						onResizeStart={handleDragStart}
						isResizing={isResizing}
					/>
				)}

				{/* Visual handle for toggle/drag (desktop only) */}
				{!isSmallScreen && (
					<DrawerHandle
						isOpen={isOpen}
						onToggle={isOpen ? onClose : onOpen}
						onDragStart={handleDragStart}
						isResizing={isResizing}
					/>
				)}

				{/* Header with settings */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
					<div className="flex items-center gap-2">
						<Link2 size={20} className="text-indigo-400" />
						<h2 className="text-lg font-semibold text-white">Import Content</h2>
					</div>
					<div className="flex items-center gap-2">
						<DrawerSettingsMenu
							autoClose={autoClose}
							onAutoCloseChange={updateAutoClose}
						/>
						<button onClick={onClose} aria-label="Close drawer">
							<X size={20} className="text-slate-400 hover:text-white transition-colors" />
						</button>
					</div>
				</div>

				{/* Provider tabs */}
				<div className="flex border-b border-slate-700">
					<button
						onClick={() => setActiveProvider('google_drive')}
						className={`flex-1 px-4 py-3 ${activeProvider === 'google_drive' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400'}`}
					>
						Google Drive
					</button>
					<button
						onClick={() => setActiveProvider('pinterest')}
						className={`flex-1 px-4 py-3 ${activeProvider === 'pinterest' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400'}`}
					>
						Pinterest
					</button>
				</div>

				<div className="flex-1 overflow-hidden">
					{activeProvider === 'google_drive' && <GoogleDrivePanel account={googleDrive} boardId={boardId} />}
					{/* {activeProvider === 'pinterest' && <PinterestPanel account={pinterest} boardId={boardId} />} */}
				</div>
			</div>
		</>
	);
}
