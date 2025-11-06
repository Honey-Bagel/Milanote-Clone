'use client';

import { ImageCardProps } from '@/lib/types';
import Image from 'next/image';
import { MoreHorizontal, GripVertical } from 'lucide-react';

export default function ImageCard({ 
	src, 
	alt, 
	caption, 
	timestamp 
}: ImageCardProps) {
	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden card-shadow hover:shadow-lg transition-shadow cursor-move">
			<div className="relative">
				<Image
					src={src}
					alt={alt}
					width={600}
					height={400}
					className="w-full image-card"
				/>
				<button className="absolute top-2 right-2 w-8 h-8 bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-lg flex items-center justify-center text-gray-300 shadow-sm">
					<MoreHorizontal className="w-4 h-4" />
				</button>
			</div>
			<div className="p-3">
				<p className="text-sm text-gray-300 font-medium">{caption}</p>
				<div className="mt-2 flex items-center justify-between text-xs text-gray-400">
					<span>{timestamp}</span>
					<GripVertical className="w-4 h-4 text-gray-500" />
				</div>
			</div>
		</div>
	);
}