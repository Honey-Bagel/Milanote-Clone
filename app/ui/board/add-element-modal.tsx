'use client';

import { AddElementModalProps } from '@/lib/types';
import { X, StickyNote, Image, Link, CheckSquare, Paperclip, Columns } from 'lucide-react';

export default function AddElementModal({ isOpen, onClose }: AddElementModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
				<div className="p-6 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-bold text-gray-800">Add to Board</h2>
						<button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>
				
				<div className="p-6">
					<div className="grid grid-cols-3 gap-4">
						{/* Note */}
						<button className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
							<div className="w-12 h-12 bg-yellow-100 group-hover:bg-yellow-200 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors">
								<StickyNote className="text-yellow-600 w-6 h-6" />
							</div>
							<h3 className="font-semibold text-gray-800 mb-1">Note</h3>
							<p className="text-xs text-gray-500">Add a text note</p>
						</button>
						
						{/* Image */}
						<button className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
							<div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors">
								<Image className="text-purple-600 w-6 h-6" />
							</div>
							<h3 className="font-semibold text-gray-800 mb-1">Image</h3>
							<p className="text-xs text-gray-500">Upload or paste</p>
						</button>
						
						{/* Link */}
						<button className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
							<div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors">
								<Link className="text-blue-600 w-6 h-6" />
							</div>
							<h3 className="font-semibold text-gray-800 mb-1">Link</h3>
							<p className="text-xs text-gray-500">Add a web link</p>
						</button>
						
						{/* Task List */}
						<button className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
							<div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors">
								<CheckSquare className="text-green-600 w-6 h-6" />
							</div>
							<h3 className="font-semibold text-gray-800 mb-1">Task List</h3>
							<p className="text-xs text-gray-500">Create checklist</p>
						</button>
						
						{/* File */}
						<button className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
							<div className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors">
								<Paperclip className="text-red-600 w-6 h-6" />
							</div>
							<h3 className="font-semibold text-gray-800 mb-1">File</h3>
							<p className="text-xs text-gray-500">Upload document</p>
						</button>
						
						{/* Column */}
						<button className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
							<div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors">
								<Columns className="text-indigo-600 w-6 h-6" />
							</div>
							<h3 className="font-semibold text-gray-800 mb-1">Column</h3>
							<p className="text-xs text-gray-500">Organize items</p>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}