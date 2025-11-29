'use client';

import { ShareModalProps, BoardCollaborator, BoardRole } from '@/lib/types';
import { X, Link as LinkIcon, Check, Globe, Lock, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
	getBoardCollaborators,
	addBoardCollaborator,
	updateCollaboratorRole,
	removeBoardCollaborator,
	toggleBoardPublic,
	toggleBoardPublicRecursive,
	generateShareToken,
	getBoardInfo,
} from '@/lib/data/boards-client';

export default function ShareModal({ boardId, isOpen, onClose }: ShareModalProps) {
	const modalRef = useRef<HTMLDivElement | null>(null);
	const [collaborators, setCollaborators] = useState<BoardCollaborator[]>([]);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [ownerId, setOwnerId] = useState<string | null>(null);
	const [isPublic, setIsPublic] = useState(false);
	const [shareToken, setShareToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	// Email invite form
	const [email, setEmail] = useState('');
	const [selectedRole, setSelectedRole] = useState<BoardRole>('viewer');
	const [inviteLoading, setInviteLoading] = useState(false);

	// Recursive toggle state
	const [includeChildBoards, setIncludeChildBoards] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [pendingPublicState, setPendingPublicState] = useState(false);

	const supabase = createClient();

	// Fetch current user and board info
	useEffect(() => {
		const fetchData = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				setCurrentUserId(user.id);
			}

			// Fetch board info
			const boardInfo = await getBoardInfo(boardId);
			if (boardInfo) {
				setOwnerId(boardInfo.owner_id);
				setIsPublic(boardInfo.is_public || false);
				setShareToken(boardInfo.share_token);
			}

			// Fetch collaborators
			const collabs = await getBoardCollaborators(boardId);
			setCollaborators(collabs);
		};

		if (isOpen) {
			fetchData();
		}
	}, [isOpen, boardId, supabase]);

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

		setInviteLoading(true);
		setError(null);

		const result = await addBoardCollaborator(boardId, email, selectedRole);

		if (result.success && result.collaborator) {
			setCollaborators([...collaborators, result.collaborator]);
			setEmail('');
			setSelectedRole('viewer');
		} else {
			setError(result.error || 'Failed to add collaborator');
		}

		setInviteLoading(false);
	};

	const handleRoleChange = async (userId: string, newRole: BoardRole) => {
		const result = await updateCollaboratorRole(boardId, userId, newRole);

		if (result.success) {
			setCollaborators(collaborators.map(c =>
				c.userId === userId ? { ...c, role: newRole } : c
			));
		} else {
			setError(result.error || 'Failed to update role');
		}
	};

	const handleRemove = async (userId: string) => {
		const result = await removeBoardCollaborator(boardId, userId);

		if (result.success) {
			setCollaborators(collaborators.filter(c => c.userId !== userId));
		} else {
			setError(result.error || 'Failed to remove collaborator');
		}
	};

	const handleTogglePublic = async () => {
		const newPublicState = !isPublic;

		// If checkbox is checked, show confirmation dialog
		if (includeChildBoards) {
			setPendingPublicState(newPublicState);
			setShowConfirmDialog(true);
			return;
		}

		// Otherwise, toggle only this board
		setLoading(true);
		const result = await toggleBoardPublic(boardId, newPublicState);

		if (result.success) {
			setIsPublic(newPublicState);
			if (result.shareToken) {
				setShareToken(result.shareToken);
			}
		} else {
			setError(result.error || 'Failed to update public status');
		}

		setLoading(false);
	};

	const handleConfirmRecursiveToggle = async () => {
		setShowConfirmDialog(false);
		setLoading(true);

		const result = await toggleBoardPublicRecursive(boardId, pendingPublicState);

		if (result.success) {
			setIsPublic(pendingPublicState);
			// Refresh board info to get new share token if making public
			const boardInfo = await getBoardInfo(boardId);
			if (boardInfo) {
				setShareToken(boardInfo.share_token);
			}
			// Show success message
			setError(null);
		} else {
			setError(result.error || 'Failed to update public status');
		}

		setLoading(false);
	};

	const handleCancelRecursiveToggle = () => {
		setShowConfirmDialog(false);
	};

	const handleRegenerateLink = async () => {
		setLoading(true);
		const result = await generateShareToken(boardId);

		if (result.success && result.shareToken) {
			setShareToken(result.shareToken);
		} else {
			setError(result.error || 'Failed to regenerate link');
		}

		setLoading(false);
	};

	const handleCopyLink = () => {
		const link = shareToken
			? `${window.location.origin}/board/public/${shareToken}`
			: `${window.location.origin}/board/${boardId}`;

		navigator.clipboard.writeText(link);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const getInitials = (name: string | null, email: string) => {
		if (name) {
			return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
		}
		return email.substring(0, 2).toUpperCase();
	};

	const getAvatarColor = (email: string) => {
		const colors = [
			'from-blue-400 to-purple-500',
			'from-green-400 to-blue-500',
			'from-pink-400 to-red-500',
			'from-yellow-400 to-orange-500',
			'from-indigo-400 to-purple-500',
		];
		const index = email.charCodeAt(0) % colors.length;
		return colors[index];
	};

	const isOwner = currentUserId === ownerId;

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdop-blur-sm flex items-center justify-center z-50 p-4">
			<div ref={modalRef} className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-slate-300">
				{/* Header */}
				<div className="p-6 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
						<h2 className="text-xl font-bold text-white flex items-center gap-2">
							<UserPlus size={20} className="text-indigo-400"/>
							Board Access
						</h2>
						<button className="text-slate-400 hover:text-white transitio-colors" onClick={onClose}>
							<X className="w-5 h-5" />
						</button>
				</div>

				<div className="p-6 overflow-y-auto flex-1 space-y-8">
					{error && (
						<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
							{error}
						</div>
					)}

					{/* Share with people - Only for owner */}
					{isOwner && (
						<div>
							<label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Add people</label>
							<div className="flex gap-2">
								<input
									type="email"
									placeholder="Enter email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
									className="flex-1 bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
								/>
								<select
									value={selectedRole}
									onChange={(e) => setSelectedRole(e.target.value as BoardRole)}
									className="bg-[#020617] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
								>
									<option value="viewer">Can view</option>
									<option value="editor">Can edit</option>
								</select>
								<button
									onClick={handleInvite}
									disabled={inviteLoading}
									className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
								>
									{inviteLoading ? 'Sending...' : 'Invite'}
								</button>
							</div>
						</div>
					)}

					{/* Current collaborators */}
					{collaborators.length > 0 && (
						<div>
							<h3 className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Members</h3>
							<div className="space-y-3">
								{collaborators.map((collab) => (
									<div key={collab.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold border border-white/10">
												{getInitials(collab.user?.display_name || null, collab.user?.email || '')}
											</div>
											<div>
												<p className="text-sm font-medium text-white truncate">
													{collab.user?.display_name || 'Unknown User'}
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
														handleRemove(collab.userId);
													} else {
														handleRoleChange(collab.userId, value as BoardRole);
													}
												}}
												className="text-xs text-slate-400 bg-[#020617] border border-white/5 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
											>
												<option value="editor">Can edit</option>
												<option value="viewer">Can view</option>
												<option value="remove">Remove</option>
											</select>
										) : (
											<span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5 capitalize">
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
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className={`p-2 rounded-lg ${isPublic ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
										{isPublic ? <Globe size={18} /> : <Lock size={18} /> }
									</div>
									<div>
										<p className="text-sm font-medium text-white">
											{isPublic ? 'Public Board' : 'Private Board'}
										</p>
										<p className="text-xs text-slate-500">
											{isPublic ? 'Anyone with the link can view' : 'Only invited members can access'}
										</p>
									</div>
								</div>
								{/* Toggle switch */}
								<button
									onClick={handleTogglePublic}
									disabled={loading}
									className={`w-11 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-indigo-600' : 'bg-slate-700'}`}
								>
									<div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isPublic ? 'left-6' : 'left-1'}`}></div>
								</button>
							</div>

							{/* Include child boards checkbox */}
							<div className="mt-3 ml-1">
								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={includeChildBoards}
										onChange={(e) => setIncludeChildBoards(e.target.checked)}
										className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
									/>
									<span className="text-sm text-gray-600">
										Apply to all child boards (boards linked within this board)
									</span>
								</label>
							</div>
						</div>
					)}

					{/* Link sharing */}
					{isPublic && shareToken && (
						<div>
							<h3 className="text-sm font-medium text-gray-700 mb-3">Public share link</h3>
							<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
								<LinkIcon className="text-gray-400 w-4 h-4 flex-shrink-0" />
								<input
									type="text"
									value={`${window.location.origin}/board/public/${shareToken}`}
									readOnly
									className="flex-1 bg-transparent text-sm text-gray-600 focus:outline-none"
								/>
								<button
									onClick={handleCopyLink}
									className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center space-x-1 flex-shrink-0"
								>
									{copied ? (
										<>
											<Check className="w-4 h-4" />
											<span>Copied</span>
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
										disabled={loading}
										className="text-blue-500 hover:text-blue-600 text-sm font-medium disabled:opacity-50"
									>
										Regenerate link
									</button>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Confirmation Dialog */}
				{showConfirmDialog && (
					<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
						<div className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4">
							<h3 className="text-lg font-bold text-gray-800 mb-2">
								{pendingPublicState ? 'Make all boards public?' : 'Make all boards private?'}
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								{pendingPublicState
									? 'This will make this board and all child boards (boards linked within) publicly accessible. Anyone with the links will be able to view them.'
									: 'This will make this board and all child boards private. Only people you invite will be able to access them.'}
							</p>
							<div className="flex justify-end space-x-3">
								<button
									onClick={handleCancelRecursiveToggle}
									className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmRecursiveToggle}
									className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
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
