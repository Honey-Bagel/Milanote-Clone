'use client';

import { useState } from "react";
import { X, Link2 } from 'lucide-react';
import { GoogleDrivePanel } from './GoogleDrivePanel';
import { useLinkedAccounts } from "@/lib/hooks/useLinkedAccount";

interface ImportDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	boardId: string;
};

export function ImportDrawer({ isOpen, onClose, boardId }: ImportDrawerProps) {
	const [activeProvider, setActiveProvider] = useState<'google_drive' |'pinterest'>('google_drive');
	const { accounts } = useLinkedAccounts();

	const googleDrive = accounts?.find(a => a.provider === 'google_drive' && a.is_active);
 	const pinterest = accounts?.find(a => a.provider === 'pinterest' && a.is_active);

	if (!isOpen) return null;

	return (
		<div className="absolute right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-40 flex flex-col">
			<div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
				<div className="flex items-center gap-2">
					<Link2 size={20} className="text-indigo-400" />
					<h2 className="text-lg font-semibold text-white">Import Content</h2>
				</div>
				<button onClick={onClose}>
					<X size={20} className="text-slate-400" />
				</button>
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
	);
}