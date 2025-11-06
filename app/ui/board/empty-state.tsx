'use client';

import { Plus } from 'lucide-react';

export default function EmptyState() {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-gray-50">
			<div className="text-center max-w-md px-6">
				<div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<Plus className="text-gray-400 w-12 h-12" />
				</div>
				<h2 className="text-2xl font-bold text-gray-800 mb-3">Start creating</h2>
				<p className="text-gray-600 mb-8">Add notes, images, tasks, and more to your board. Click the + button or use the toolbar above to get started.</p>
				<button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors inline-flex items-center">
					<Plus className="w-4 h-4 mr-2" />
					Add your first element
				</button>
			</div>
		</div>
	);
}