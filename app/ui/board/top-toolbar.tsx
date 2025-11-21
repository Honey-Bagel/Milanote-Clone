'use client';

import { ChevronDown, Minus, Plus, Maximize2, Share2, MoreHorizontal, Settings, Home } from 'lucide-react';
import ShareModal from './share-modal';
import { Fragment, useState, useMemo } from 'react';
import SettingsModal from '../home/settings-modal';
import Link from 'next/link';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	BreadcrumbEllipsis
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
	initialBreadcrumbs?: BreadcrumbItemType[];
};

export default function TopToolbar({
	boardId,
	boardTitle,
	boardColor,
	initialBreadcrumbs = []
}: TopToolbarProps) {
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const { viewport, zoomIn, zoomOut, zoomToFit } = useCanvasStore();

	const { breadcrumbs } = useBreadcrumbs(boardId, initialBreadcrumbs);

	const { displayBreadcrumbs, isBreadcrumbsCondensed } = useMemo(() => {
		if (breadcrumbs.length > 4) {
			const temp = [...breadcrumbs];
			temp.splice(1, temp.length - 4);
			return { displayBreadcrumbs: temp, isBreadcrumbsCondensed: true };
		}
		return { displayBreadcrumbs: breadcrumbs, isBreadcrumbsCondensed: false };
	}, [breadcrumbs]);

	return (
		<>
			<header className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
				{/* Left Side */}
				<div className="flex items-center space-x-4 flex-1 min-w-0">
					{/* Breadcrumb Navigation */}
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink	asChild>
									<Link
										href="/dashboard"
										className="flex items-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
									>
										<Home className="w-5 h-5" />
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>

							{/* Parent Boards */}
							{displayBreadcrumbs.map((crumb: BreadcrumbItemType, index: number) => {
								const isLast = index === displayBreadcrumbs.length - 1;

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
													<span className="text-[var(--foreground)] font-semibold truncate max-w-[200px]">
														{crumb.title}
													</span>
												</BreadcrumbPage>
											) : (
												// Parent boards - clickable
												<BreadcrumbLink asChild>
													<Link
														href={`/board/${crumb.id}`}
														className="flex items-center space-x-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
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
										{isBreadcrumbsCondensed && index === 0 && (
											<>
												<BreadcrumbSeparator />
												<BreadcrumbEllipsis />
											</>
										)}
									</Fragment>
								);
							})}
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{/* Right Side */}
				<div className="flex items-center space-x-3">
					{/* Zoom Controls */}
					<div className="flex items-center space-x-1 bg-[var(--input)] rounded-lg px-2 py-1">
						<button onClick={zoomOut} className="p-1.5 hover:bg-[var(--card-hover)] rounded text-[var(--muted)]">
							<Minus className="w-3 h-3" />
						</button>
						<span className="px-3 text-sm text-[var(--foreground)] font-medium">{(viewport.zoom * 100).toPrecision(4)}%</span>
						<button onClick={zoomIn} className="p-1.5 hover:bg-[var(--card-hover)] rounded text-[var(--muted)]">
							<Plus className="w-3 h-3" />
						</button>
					</div>

					{/* View Mode */}
					<button onClick={zoomToFit} className="p-2 hover:bg-[var(--card-hover)] rounded-lg text-[var(--muted)]">
						<Maximize2 className="w-4 h-4" />
					</button>

					{/* Collaborators */}
					<RealtimeAvatarStack roomName={boardId}/>

					{/* Share Button */}
					<button
						onClick={() => setIsShareModalOpen(true)}
						className="px-4 py-2 rounded-lg font-medium text-sm transition-colors inline-flex items-center hover:opacity-90"
						style={{
							background: `linear-gradient(to right, var(--primary), var(--accent))`,
							color: 'var(--foreground)'
						}}
					>
						<Share2 className="w-4 h-4 mr-2" />
						Share
					</button>

					{/* More Options */}
					<button className="p-2 hover:bg-[var(--card-hover)] rounded-lg text-[var(--muted)]">
						<MoreHorizontal className="w-4 h-4" />
					</button>

					<button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-lg transition-colors">
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
