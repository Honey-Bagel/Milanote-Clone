'use client';

import { ShareModalProps } from '@/lib/types';
import { X, Link as LinkIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
	const modalRef = useRef<HTMLDivElement | null>(null);

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
	}, [isOpen, onClose])

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
				<div className="p-6 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-bold text-gray-800">Share Board</h2>
						<button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>
				
				<div className="p-6">
					{/* Share with people */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">Add people</label>
						<div className="flex space-x-2">
							<input 
								type="email" 
								placeholder="Enter email address" 
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
								Invite
							</button>
						</div>
					</div>
					
					{/* Current collaborators */}
					<div className="mb-6">
						<h3 className="text-sm font-medium text-gray-700 mb-3">People with access</h3>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
										JD
									</div>
									<div>
										<p className="text-sm font-medium text-gray-800">John Doe</p>
										<p className="text-xs text-gray-500">john@example.com</p>
									</div>
								</div>
								<span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Owner</span>
							</div>
							
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
										AM
									</div>
									<div>
										<p className="text-sm font-medium text-gray-800">Alice Miller</p>
										<p className="text-xs text-gray-500">alice@example.com</p>
									</div>
								</div>
								<select className="text-xs border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option>Can edit</option>
									<option>Can view</option>
									<option>Remove</option>
								</select>
							</div>
						</div>
					</div>
					
					{/* Link sharing */}
					<div>
						<h3 className="text-sm font-medium text-gray-700 mb-3">Share link</h3>
						<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
							<LinkIcon className="text-gray-400 w-4 h-4" />
							<input 
								type="text" 
								value="https://milanote.com/board/abc123" 
								readOnly 
								className="flex-1 bg-transparent text-sm text-gray-600 focus:outline-none"
							/>
							<button className="text-blue-500 hover:text-blue-600 font-medium text-sm">
								Copy
							</button>
						</div>
						<div className="mt-3 flex items-center justify-between">
							<span className="text-sm text-gray-600">Anyone with the link can view</span>
							<button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
								Change
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}