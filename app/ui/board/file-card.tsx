'use client';

import { FileCardProps } from '@/lib/types';
import { FileText, FileSpreadsheet, FileImage, FileArchive, File, MoreHorizontal, GripVertical } from 'lucide-react';

export default function FileCard({ 
	fileName, 
	fileSize, 
	fileType = 'pdf', 
	timestamp 
}: FileCardProps) {
	const getFileIcon = (type: string) => {
		const icons: Record<string, { icon: React.ReactNode; color: string }> = {
			pdf: { icon: <FileText className="w-6 h-6" />, color: 'text-red-500' },
			doc: { icon: <FileText className="w-6 h-6" />, color: 'text-blue-500' },
			xls: { icon: <FileSpreadsheet className="w-6 h-6" />, color: 'text-green-500' },
			ppt: { icon: <FileImage className="w-6 h-6" />, color: 'text-orange-500' },
			zip: { icon: <FileArchive className="w-6 h-6" />, color: 'text-purple-500' },
			default: { icon: <File className="w-6 h-6" />, color: 'text-gray-500' }
		};
		const result = icons[type] || icons.default;
		return <span className={result.color}>{result.icon}</span>;
	};

	const getFileColor = (type: string): string => {
		const colors: Record<string, string> = {
			pdf: 'bg-red-500/20',
			doc: 'bg-blue-500/20',
			xls: 'bg-green-500/20',
			ppt: 'bg-orange-500/20',
			zip: 'bg-purple-500/20',
			default: 'bg-gray-500/20'
		};
		return colors[type] || colors.default;
	};

	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 card-shadow hover:shadow-lg transition-shadow cursor-move">
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1">
					<div className={`w-12 h-12 ${getFileColor(fileType)} rounded-lg flex items-center justify-center mb-3`}>
						{getFileIcon(fileType)}
					</div>
					<h3 className="font-semibold text-white mb-1 truncate">{fileName}</h3>
					<p className="text-xs text-gray-400">{fileSize}</p>
				</div>
				<button className="text-gray-400 hover:text-gray-300">
					<MoreHorizontal className="w-4 h-4" />
				</button>
			</div>
			<div className="mt-4 flex items-center justify-between text-xs text-gray-400">
				<span>{timestamp}</span>
				<GripVertical className="w-4 h-4 text-gray-500" />
			</div>
		</div>
	);
}