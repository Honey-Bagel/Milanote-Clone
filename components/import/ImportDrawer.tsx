'use client';

import { useState, useCallback, useEffect } from "react";
import { GoogleDrivePanel } from './GoogleDrivePanel';
import { useLinkedAccounts } from "@/lib/hooks/use-linked-account";
import { useDrawerPersistence } from '@/lib/hooks/use-drawer-persistence';
import { useDrawerResize } from '@/lib/hooks/use-drawer-resize';
import { DrawerHandle } from './DrawerHandle';
import { DrawerResizer } from './DrawerResizer';
import { DrawerSortDropdown } from './DrawerSortDropdown';
import { ProviderDropdown } from './ProviderDropdown';
import { useIsSmallScreen } from '@/lib/hooks/use-media-query';
import { cn } from '@/lib/utils';
import type { OAuthProvider } from '@/lib/types';

interface ImportDrawerProps {
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
	boardId: string;
}

export function ImportDrawer({ isOpen, onOpen, onClose, boardId }: ImportDrawerProps) {
	const [activeProvider, setActiveProvider] = useState<OAuthProvider>('google_drive');
	const { accounts } = useLinkedAccounts();

	// Persistence and resize hooks
	const {
		width,
		autoClose,
		sortField,
		sortDirection,
		itemsPerRow,
		updateWidth,
		updateSortField,
		updateSortDirection,
		updateItemsPerRow
	} = useDrawerPersistence();
	const { isResizing, handleMouseDown } = useDrawerResize(width, updateWidth, onClose);
	const isSmallScreen = useIsSmallScreen();

	const googleDrive = accounts?.find(a => a.provider === 'google_drive' && a.is_active);

	// Keyboard shortcut: Ctrl+Space to toggle drawer
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.code === 'Space') {
				e.preventDefault();
				if (isOpen) {
					onClose();
				} else {
					onOpen();
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onOpen, onClose]);

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
			{/* Backdrop for auto-close detection - only covers canvas area */}
			{isOpen && autoClose && (
				<div
					className="fixed right-0 z-39 bg-transparent"
					style={{
						top: '112px',
						height: 'calc(100vh - 112px)',
						left: 0,
					}}
					onClick={handleOutsideClick}
					aria-hidden="true"
				/>
			)}

			{/* Drawer container - positioned to only cover the canvas area, not toolbars */}
			<div
				className={cn(
					"fixed right-0 bg-slate-900 border-l border-slate-700 shadow-2xl z-40",
					"flex flex-col",
					// Smooth slide animation
					"transition-transform duration-200 ease-out",
					isOpen ? "translate-x-0" : "translate-x-full",
					// Disable transition during resize for immediate feedback
					isResizing && "transition-none"
				)}
				style={{
					width: isSmallScreen ? 'calc(100vw - 32px)' : `${width}px`,
					// Position below top toolbar (56px) and element toolbar (56px)
					top: '112px',
					height: 'calc(100vh - 112px)',
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

				{/* Provider dropdown and sort controls */}
				<div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/30">
					<ProviderDropdown
						activeProvider={activeProvider}
						accounts={accounts || []}
						onProviderChange={setActiveProvider}
					/>
					<DrawerSortDropdown
						sortField={sortField}
						sortDirection={sortDirection}
						itemsPerRow={itemsPerRow}
						onSortFieldChange={updateSortField}
						onSortDirectionChange={updateSortDirection}
						onItemsPerRowChange={updateItemsPerRow}
					/>
				</div>

				<div className="flex-1 overflow-hidden">
					{activeProvider === 'google_drive' && (
						<GoogleDrivePanel
							account={googleDrive}
							boardId={boardId}
							sortField={sortField}
							sortDirection={sortDirection}
							itemsPerRow={itemsPerRow}
						/>
					)}
					{/* {activeProvider === 'pinterest' && <PinterestPanel account={pinterest} boardId={boardId} />} */}
				</div>
			</div>
		</>
	);
}
