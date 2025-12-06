'use client';

import { ShareModalProps, BoardRole } from '@/lib/types';
import { X, Link as LinkIcon, Check, Globe, Lock, UserPlus, RefreshCw, Users, UserIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import {
	useCollaborators,
	useIsCollaborator,
	useAddCollaboratorByEmail,
	useUpdateCollaboratorRole,
	useRemoveCollaborator
} from '@/lib/hooks/collaborators';
import { useBoardSharing, useBoard } from '@/lib/hooks/boards';

export default function ShareModal({ boardId, isOpen, onClose }: ShareModalProps) {
	const { isOwner } = useIsCollaborator(boardId);
	const { board } = useBoard(boardId);
	const { addCollaboratorByEmail, error: addCollaboratorError, isAdding } = useAddCollaboratorByEmail();
	const { removeCollaborator, error: removeCollaboratorError } = useRemoveCollaborator();
	const { updateRole, error: updateCollaboratorError } = useUpdateCollaboratorRole();
	const { collaborators } = useCollaborators(boardId);

	const {
		toggleBoardPublic,
		toggleBoardPublicRecursive,
		generateShareToken,
		getBoardInfo,
		isUpdating: sharingLoading,
		error: sharingError,
	} = useBoardSharing();

	const modalRef = useRef<HTMLDivElement | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	// Email invite form
	const [email, setEmail] = useState('');
	const [selectedRole, setSelectedRole] = useState<BoardRole>('viewer');

	// Recursive toggle state
	const [includeChildBoards, setIncludeChildBoards] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [pendingPublicState, setPendingPublicState] = useState(false);

	// Handle click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleInvite = async () => {
		if (!email) {
			setError('Please enter an email address');
			return;
		}

		setError(null);

		const result = await addCollaboratorByEmail(boardId, email, selectedRole);

		if (result?.user) {
			setEmail('');
			setSelectedRole('viewer');
		}
	};

	const handleRoleChange = async (collabId: string, newRole: BoardRole) => {
		const success = await updateRole(collabId, newRole, boardId);

		if (!success) {
			setError(updateCollaboratorError || 'Failed to update role');
		}
	};

	const handleRemove = async (collabId: string) => {
		const success = await removeCollaborator(collabId, boardId);

		if (success) {
			setError(removeCollaboratorError || 'Failed to remove collaborator');
		}
	};

	const handleTogglePublic = async () => {
		const newPublicState = !board?.is_public;

		// If checkbox is checked, show confirmation dialog
		if (includeChildBoards) {
			setPendingPublicState(newPublicState);
			setShowConfirmDialog(true);
			return;
		}

		// Otherwise, toggle only this board
		const result = await toggleBoardPublic(boardId, newPublicState);

		if (!result.success) {
			setError(result.error || 'Failed to update public status');
		}
	};

	const handleConfirmRecursiveToggle = async () => {
		setShowConfirmDialog(false);

		const result = await toggleBoardPublicRecursive(boardId, pendingPublicState);

		if (result.success) {
			// Show success message
			setError(null);
		} else {
			setError(result.error || 'Failed to update public status');
		}
	};

	const handleCancelRecursiveToggle = () => {
		setShowConfirmDialog(false);
	};

	const handleRegenerateLink = async () => {
		const result = await generateShareToken(boardId);

		if (!result.success || !result.shareToken) {
			setError(result.error || 'Failed to regenerate link');
		}
	};

	const handleCopyLink = () => {
		const link = board?.share_token
			? `${window.location.origin}/board/public/${board?.share_token}`
			: `${window.location.origin}/board/${boardId}`;

		navigator.clipboard.writeText(link);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div ref={modalRef} className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-slate-300">
				{/* Header */}
				<div className="p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-indigo-600 rounded-lg">
							<UserPlus size={20} className="text-white"/>
						</div>
						<h2 className="text-xl font-bold text-white">Share Board</h2>
					</div>
					<button 
						className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors" 
						onClick={onClose}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
					{(error || addCollaboratorError) && (
						<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-3">
							<div className="w-1 h-full bg-red-500 rounded-full flex-shrink-0"></div>
							<span>{addCollaboratorError || error}</span>
						</div>
					)}

					{/* Share with people - Only for owner */}
					{isOwner && (
						<div>
							<label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
								Invite People
							</label>
							<div className="flex gap-2">
								<input
									type="email"
									placeholder="Enter email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
									className="flex-1 bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
								/>
								<select
									value={selectedRole}
									onChange={(e) => setSelectedRole(e.target.value as BoardRole)}
									className="bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
								>
									<option value="viewer">Can view</option>
									<option value="editor">Can edit</option>
								</select>
								<button
									onClick={handleInvite}
									disabled={isAdding}
									className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
								>
									{isAdding ? 'Sending...' : 'Invite'}
								</button>
							</div>
						</div>
					)}

					{/* Current collaborators */}
					{collaborators.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-4">
								<Users size={16} className="text-slate-400" />
								<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
									Members ({collaborators.length})
								</h3>
							</div>
							<div className="space-y-2">
								{collaborators.map((collab) => (
									<div 
										key={collab.id} 
										className="flex items-center justify-between p-3 bg-[#020617] border border-white/10 hover:border-white/20 rounded-xl transition-all group"
									>
										<div className="flex items-center gap-3 flex-1">
											<Avatar className="w-10 h-10">
												<AvatarImage src={collab.user?.profile?.avatar_url || undefined} />
												<AvatarFallback className="bg-indigo-600 text-white font-medium">
													<UserIcon />
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-white truncate">
													{collab.user?.profile?.display_name || 'Unknown User'}
												</p>
												<p className="text-xs text-slate-500 truncate">{collab.user?.email}</p>
											</div>
										</div>
										{isOwner ? (
											<select
												value={collab.role}
												onChange={(e) => {
													const value = e.target.value;
													if (value === 'remove') {
														handleRemove(collab.id);
													} else {
														handleRoleChange(collab.id, value as BoardRole);
													}
												}}
												className="text-xs text-slate-300 bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0 cursor-pointer hover:border-white/20 transition-all"
											>
												<option value="editor">Can edit</option>
												<option value="viewer">Can view</option>
												<option value="remove" className="text-red-400">Remove</option>
											</select>
										) : (
											<span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 capitalize flex-shrink-0">
												{collab.role}
											</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Public/Private toggle - Only for owner */}
					{isOwner && (
						<div className="border-t border-white/10 pt-6">
							<div className="flex items-center justify-between p-4 bg-[#020617] border border-white/10 rounded-xl hover:border-white/20 transition-all">
								<div className="flex items-center gap-3">
									<div className={`p-2.5 rounded-lg transition-all ${
										board?.is_public 
											? 'bg-emerald-500/20 text-emerald-400' 
											: 'bg-slate-700/50 text-slate-400'
									}`}>
										{board?.is_public ? <Globe size={20} /> : <Lock size={20} />}
									</div>
									<div>
										<p className="text-sm font-semibold text-white">
											{board?.is_public ? 'Public Access' : 'Private Access'}
										</p>
										<p className="text-xs text-slate-500">
											{board?.is_public ? 'Anyone with the link can view' : 'Only invited members can access'}
										</p>
									</div>
								</div>
								{/* Toggle switch */}
								<button
									onClick={handleTogglePublic}
									disabled={sharingLoading}
									className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
										board?.is_public ? 'bg-indigo-600' : 'bg-slate-700'
									} ${sharingLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
								>
									<div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-lg ${
										board?.is_public ? 'translate-x-6' : 'translate-x-0.5'
									}`}></div>
								</button>
							</div>

							{/* Include child boards checkbox */}
							<div className="mt-3 ml-1">
								<label className="flex items-center gap-2 cursor-pointer group">
									<div className="relative">
										<input
											type="checkbox"
											checked={includeChildBoards}
											onChange={(e) => setIncludeChildBoards(e.target.checked)}
											className="sr-only peer"
										/>
										<div className="w-5 h-5 border-2 border-white/20 rounded bg-[#020617] peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
											{includeChildBoards && <Check size={14} className="text-white" />}
										</div>
									</div>
									<span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
										Apply to all child boards (boards linked within this board)
									</span>
								</label>
							</div>
						</div>
					)}

					{/* Link sharing */}
					{board?.is_public && board.share_token && (
						<div>
							<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
								Public Share Link
							</h3>
							<div className="flex items-center gap-2 p-4 bg-[#020617] border border-white/10 rounded-xl">
								<LinkIcon className="text-slate-500 w-4 h-4 flex-shrink-0" />
								<input
									type="text"
									value={`${window.location.origin}/board/public/${board.share_token}`}
									readOnly
									className="flex-1 bg-transparent text-sm text-slate-300 focus:outline-none"
								/>
								<button
									onClick={handleCopyLink}
									className="text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center gap-2 flex-shrink-0 px-3 py-1.5 hover:bg-indigo-500/10 rounded-lg transition-all"
								>
									{copied ? (
										<>
											<Check className="w-4 h-4" />
											<span>Copied!</span>
										</>
									) : (
										<span>Copy</span>
									)}
								</button>
							</div>
							{isOwner && (
								<div className="mt-3 flex items-center justify-end">
									<button
										onClick={handleRegenerateLink}
										disabled={sharingLoading}
										className="text-slate-400 hover:text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all"
									>
										<RefreshCw size={14} className={sharingLoading ? 'animate-spin' : ''} />
										Regenerate link
									</button>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Confirmation Dialog */}
				{showConfirmDialog && (
					<div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-2xl p-4">
						<div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-full">
							<h3 className="text-lg font-bold text-white mb-2">
								{pendingPublicState ? 'Make all boards public?' : 'Make all boards private?'}
							</h3>
							<p className="text-sm text-slate-400 mb-6">
								{pendingPublicState
									? 'This will make this board and all child boards (boards linked within) publicly accessible. Anyone with the links will be able to view them.'
									: 'This will make this board and all child boards private. Only people you invite will be able to access them.'}
							</p>
							<div className="flex justify-end gap-3">
								<button
									onClick={handleCancelRecursiveToggle}
									className="px-4 py-2.5 text-slate-300 hover:bg-white/5 rounded-lg font-medium transition-all border border-white/10"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmRecursiveToggle}
									className={`px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg ${
										pendingPublicState
											? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
											: 'bg-slate-700 hover:bg-slate-600 text-white'
									}`}
								>
									{pendingPublicState ? 'Make Public' : 'Make Private'}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}