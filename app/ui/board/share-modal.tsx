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
import { useIsSmallScreen } from '@/lib/hooks/use-media-query';

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
	const isSmallScreen = useIsSmallScreen();

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

		const result = await addCollaborator(boardId, email, selectedRole);

		if (result.success) {
			setEmail('');
			setSelectedRole('viewer');
		}
	};

	const addCollaborator = async (boardId: string, email: string, role: string) => {
		const collaboratorResponse = await fetch('/api/collaborators/invite', {
			method: 'POST',
			body: JSON.stringify({
				boardId,
				email,
				role,
			})
		});

		return await collaboratorResponse.json();
	}

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
		<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-0 sm:p-4">
			<div
				ref={modalRef}
				className={`bg-[#0f172a] border border-white/10 shadow-2xl w-full flex flex-col text-foreground
					${isSmallScreen
						? 'h-full rounded-none max-h-full'
						: 'rounded-2xl max-w-2xl max-h-[85vh]'
					}`}
			>
				{/* Header */}
				<div className="p-4 sm:p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0">
						<div className="p-1.5 sm:p-2 bg-primary rounded-lg flex-shrink-0">
							<UserPlus size={18} className="sm:w-5 sm:h-5 text-white"/>
						</div>
						<h2 className="text-lg sm:text-xl font-bold text-white truncate">Share Board</h2>
					</div>
					<button
						className="text-secondary-foreground hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors flex-shrink-0"
						onClick={onClose}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6 custom-scrollbar">
					{(error || addCollaboratorError) && (
						<div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs sm:text-sm text-red-400 flex items-start gap-2 sm:gap-3">
							<div className="w-1 h-full bg-red-500 rounded-full flex-shrink-0"></div>
							<span>{addCollaboratorError || error}</span>
						</div>
					)}

					{/* Share with people - Only for owner */}
					{isOwner && (
						<div>
							<label className="block text-xs sm:text-sm font-bold text-secondary-foreground uppercase tracking-wider mb-3 sm:mb-4">
								Invite People
							</label>
							<div className="flex flex-col sm:flex-row gap-2">
								<input
									type="email"
									placeholder="Enter email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
									className="flex-1 bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-color min-h-[44px]"
								/>
								<div className="flex gap-2">
									<select
										value={selectedRole}
										onChange={(e) => setSelectedRole(e.target.value as BoardRole)}
										className="flex-1 sm:flex-initial bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer min-h-[44px]"
									>
										<option value="viewer">Can view</option>
										<option value="editor">Can edit</option>
									</select>
									<button
										onClick={handleInvite}
										disabled={isAdding}
										className="bg-primary hover:bg-primary text-white px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-color disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 min-h-[44px]"
									>
										{isAdding ? 'Sending...' : 'Invite'}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Current collaborators */}
					{collaborators.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-3 sm:mb-4">
								<Users size={14} className="sm:w-4 sm:h-4 text-secondary-foreground" />
								<h3 className="text-xs sm:text-sm font-bold text-secondary-foreground uppercase tracking-wider">
									Members ({collaborators.length})
								</h3>
							</div>
							<div className="space-y-2">
								{collaborators.map((collab) => (
									<div
										key={collab.id}
										className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-3 bg-[#020617] border border-white/10 hover:border-white/20 rounded-xl transition-color group"
									>
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
												<AvatarImage src={collab.user?.profile?.avatar_url || undefined} />
												<AvatarFallback className="bg-primary text-white font-medium flex items-center justify-center w-full h-full rounded-full">
													<UserIcon size={18} />
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-white truncate">
													{collab.user?.profile?.display_name || 'Unknown User'}
												</p>
												<p className="text-xs text-muted-foreground truncate">{collab.user?.email}</p>
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
												className="text-xs sm:text-sm text-foreground bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0 cursor-pointer hover:border-white/20 transition-color min-h-[44px] w-full sm:w-auto"
											>
												<option value="editor">Can edit</option>
												<option value="viewer">Can view</option>
												<option value="remove" className="text-red-400">Remove</option>
											</select>
										) : (
											<span className="text-xs text-secondary-foreground bg-white/5 px-3 py-2 rounded-lg border border-white/10 capitalize flex-shrink-0 text-center sm:text-left">
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
						<div className="border-t border-white/10 pt-4 sm:pt-6">
							<div className="flex items-center justify-between p-3 sm:p-4 bg-[#020617] border border-white/10 rounded-xl hover:border-white/20 transition-color min-h-[60px]">
								<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
									<div className={`p-2 sm:p-2.5 rounded-lg transition-color flex-shrink-0 ${
										board?.is_public
											? 'bg-emerald-500/20 text-emerald-400'
											: 'bg-slate-700/50 text-secondary-foreground'
									}`}>
										{board?.is_public ? <Globe size={18} className="sm:w-5 sm:h-5" /> : <Lock size={18} className="sm:w-5 sm:h-5" />}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-semibold text-white truncate">
											{board?.is_public ? 'Public Access' : 'Private Access'}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{board?.is_public ? 'Anyone with the link can view' : 'Only invited members can access'}
										</p>
									</div>
								</div>
								{/* Toggle switch */}
								<button
									onClick={handleTogglePublic}
									disabled={sharingLoading}
									className={`w-14 h-7 sm:w-12 sm:h-6 rounded-full transition-color relative flex-shrink-0 ${
										board?.is_public ? 'bg-primary' : 'bg-slate-700'
									} ${sharingLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
								>
									<div className={`w-6 h-6 sm:w-5 sm:h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-lg ${
										board?.is_public ? 'translate-x-7 sm:translate-x-6' : 'translate-x-0.5'
									}`}></div>
								</button>
							</div>

							{/* Include child boards checkbox */}
							<div className="mt-3 ml-1">
								<label className="flex items-start sm:items-center gap-2 sm:gap-3 cursor-pointer group min-h-[44px]">
									<div className="relative flex-shrink-0 mt-0.5 sm:mt-0">
										<input
											type="checkbox"
											checked={includeChildBoards}
											onChange={(e) => setIncludeChildBoards(e.target.checked)}
											className="sr-only peer"
										/>
										<div className="w-6 h-6 sm:w-5 sm:h-5 border-2 border-white/20 rounded bg-[#020617] peer-checked:bg-primary peer-checked:border-indigo-600 transition-color flex items-center justify-center">
											{includeChildBoards && <Check size={16} className="sm:w-3.5 sm:h-3.5 text-white" />}
										</div>
									</div>
									<span className="text-sm text-secondary-foreground group-hover:text-foreground transition-colors">
										Apply to all child boards (boards linked within this board)
									</span>
								</label>
							</div>
						</div>
					)}

					{/* Link sharing */}
					{board?.is_public && board.share_token && (
						<div>
							<h3 className="text-xs sm:text-sm font-bold text-secondary-foreground uppercase tracking-wider mb-3 sm:mb-4">
								Public Share Link
							</h3>
							<div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 sm:p-4 bg-[#020617] border border-white/10 rounded-xl">
								<LinkIcon className="text-muted-foreground w-4 h-4 flex-shrink-0 hidden sm:block" />
								<input
									type="text"
									value={`${window.location.origin}/board/public/${board.share_token}`}
									readOnly
									className="flex-1 bg-transparent text-xs sm:text-sm text-foreground focus:outline-none truncate min-h-[44px] flex items-center"
								/>
								<button
									onClick={handleCopyLink}
									className="text-primary hover:text-primary font-medium text-sm flex items-center justify-center gap-2 flex-shrink-0 px-4 py-2.5 hover:bg-primary/10 rounded-lg transition-color min-h-[44px] w-full sm:w-auto"
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
										className="text-secondary-foreground hover:text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-color min-h-[44px]"
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
					<div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-none sm:rounded-2xl p-4">
						<div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-full">
							<h3 className="text-base sm:text-lg font-bold text-white mb-2">
								{pendingPublicState ? 'Make all boards public?' : 'Make all boards private?'}
							</h3>
							<p className="text-sm text-secondary-foreground mb-6">
								{pendingPublicState
									? 'This will make this board and all child boards (boards linked within) publicly accessible. Anyone with the links will be able to view them.'
									: 'This will make this board and all child boards private. Only people you invite will be able to access them.'}
							</p>
							<div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
								<button
									onClick={handleCancelRecursiveToggle}
									className="px-4 py-3 sm:py-2.5 text-foreground hover:bg-white/5 rounded-lg font-medium transition-color border border-white/10 min-h-[44px]"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmRecursiveToggle}
									className={`px-4 py-3 sm:py-2.5 rounded-lg font-medium transition-color shadow-lg min-h-[44px] ${
										pendingPublicState
											? 'bg-primary hover:bg-primary text-white shadow-primary/20'
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