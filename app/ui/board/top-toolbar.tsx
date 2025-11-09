'use client';

import { ChevronDown, Minus, Plus, Maximize2, Share2, MoreHorizontal, Settings, Home } from 'lucide-react';
import ShareModal from './share-modal';
import { Fragment, useState } from 'react';
import SettingsModal from '../home/settings-modal';
import Link from 'next/link';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

type BreadcrumbItemType = {
	id: string,
	title: string,
	color?: string
};

type TopToolbarProps = {
	boardId: string;
	boardTitle: string;
	boardColor?: string;
	breadcrumbs?: BreadcrumbItemType[];
};

export default function TopToolbar({
	boardId,
	boardTitle,
	boardColor,
	breadcrumbs = []
}: TopToolbarProps) {
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const { viewport, zoomIn, zoomOut, zoomToFit } = useCanvasStore();

	console.log(viewport);

	return (
		<>
			<header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
				{/* Left Side */}
				<div className="flex items-center space-x-4 flex-1 min-w-0">
					{/* Breadcrumb Navigation */}
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink	asChild>
									<Link
										href="/dashboard"
										className="flex items-center text-gray-400 hover:text-white transition-colors"
									>
										<Home className="w-5 h-5" />
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>

							{/* Parent Boards */}
							{breadcrumbs.map((crumb, index) => {
								const isLast = index === breadcrumbs.length - 1;

								return (
									<Fragment key={`bc-${crumb.id}`}>
										<BreadcrumbSeparator />
										<BreadcrumbItem key={crumb.id}>
											{isLast ? (
												// Current board - not clickable
												<BreadcrumbPage className="flex items-center space-x-2">
													{crumb.color && (
														<div
															className="w-4 h-4 rounded"
															style={{ backgroundColor: crumb.color }}
														/>
													)}
													<span className="text-white font-semibold truncate max-w-[200px]">
														{crumb.title}
													</span>
												</BreadcrumbPage>
											) : (
												// Parent boards - clickable
												<BreadcrumbLink asChild>
													<Link
														href={`/board/${crumb.id}`}
														className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
													>
														{crumb.color && (
															<div
																className="w-4 h-4 rounded"
																style={{ backgroundColor: crumb.color }}
															/>
														)}
														<span className="truncate max-w-[150px]">
															{crumb.title}
														</span>
													</Link>
												</BreadcrumbLink>
											)}
										</BreadcrumbItem>
									</Fragment>
								);
							})}
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{/* Right Side */}
				<div className="flex items-center space-x-3">
					{/* Zoom Controls */}
					<div className="flex items-center space-x-1 bg-gray-900 rounded-lg px-2 py-1">
						<button onClick={zoomOut} className="p-1.5 hover:bg-gray-700 rounded text-gray-400">
							<Minus className="w-3 h-3" />
						</button>
						<span className="px-3 text-sm text-gray-300 font-medium">{(viewport.zoom * 100).toPrecision(4)}%</span>
						<button onClick={zoomIn} className="p-1.5 hover:bg-gray-700 rounded text-gray-400">
							<Plus className="w-3 h-3" />
						</button>
					</div>

					{/* View Mode */}
					<button onClick={zoomToFit} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
						<Maximize2 className="w-4 h-4" />
					</button>
					
					{/* Collaborators */}
					<div className="flex items-center -space-x-2">
						<div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-semibold">
							JD
						</div>
						<div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-semibold">
							AM
						</div>
						<div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-red-500 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-xs font-semibold">
							SK
						</div>
					</div>

					{/* Share Button */}
					<button onClick={() => setIsShareModalOpen(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors inline-flex items-center">
						<Share2 className="w-4 h-4 mr-2" />
						Share
					</button>

					{/* More Options */}
					<button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
						<MoreHorizontal className="w-4 h-4" />
					</button>

					<button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
						<Settings className="w-5 h-5" />
						<span className="text-sm">Settings</span>
					</button>
				</div>
			</header>

			<SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
			<ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
		</>
	);
}