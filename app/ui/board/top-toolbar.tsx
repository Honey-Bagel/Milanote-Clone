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
	color?: string,
	shareToken?: string | null
};

type TopToolbarProps = {
	boardId: string;
	boardTitle: string;
	boardColor?: string;
	initialBreadcrumbs?: BreadcrumbItemType[];
	isPublicView?: boolean;
	isViewerOnly?: boolean;
};

export default function TopToolbar({
	boardId,
	boardTitle,
	boardColor,
	initialBreadcrumbs = [],
	isPublicView = false,
	isViewerOnly = false
}: TopToolbarProps) {
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const { viewport, zoomIn, zoomOut, zoomToFit } = useCanvasStore();

	const { breadcrumbs } = useBreadcrumbs(boardId, initialBreadcrumbs, isPublicView);

	const { displayBreadcrumbs, isBreadcrumbsCondensed } = useMemo(() => {
		if (breadcrumbs.length > 4) {
			const temp = [...breadcrumbs];
			temp.splice(1, temp.length - 4);
			return { displayBreadcrumbs: temp, isBreadcrumbsCondensed: true };
		}
		return { displayBreadcrumbs: breadcrumbs, isBreadcrumbsCondensed: false };
	}, [breadcrumbs]);

	// return (
	// 	<>
	// 		<header className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
	// 			{/* Left Side */}
	// 			<div className="flex items-center space-x-4 flex-1 min-w-0">
	// 				{/* Breadcrumb Navigation */}
	// 				<Breadcrumb>
	// 					<BreadcrumbList>
	// 						<BreadcrumbItem>
	// 							<BreadcrumbLink	asChild>
	// 								<Link
	// 									href="/dashboard"
	// 									className="flex items-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
	// 								>
	// 									<Home className="w-5 h-5" />
	// 								</Link>
	// 							</BreadcrumbLink>
	// 						</BreadcrumbItem>

	// 						{/* Parent Boards */}
	// 						{displayBreadcrumbs.map((crumb: BreadcrumbItemType, index: number) => {
	// 							const isLast = index === displayBreadcrumbs.length - 1;

	// 							return (
	// 								<Fragment key={`bc-${crumb.id}`}>
	// 									<BreadcrumbSeparator />
	// 									<BreadcrumbItem key={crumb.id}>
	// 										{isLast ? (
	// 											// Current board - not clickable
	// 											<BreadcrumbPage className="flex items-center space-x-2">
	// 												{crumb.color && (
	// 													<div
	// 														className="w-4 h-4 rounded"
	// 														style={{ backgroundColor: crumb.color }}
	// 													/>
	// 												)}
	// 												<span className="text-[var(--foreground)] font-semibold truncate max-w-[200px]">
	// 													{crumb.title}
	// 												</span>
	// 											</BreadcrumbPage>
	// 										) : (
	// 											// Parent boards - clickable
	// 											<BreadcrumbLink asChild>
	// 												<Link
	// 													href={
	// 														isPublicView && crumb.shareToken
	// 															? `/board/public/${crumb.shareToken}`
	// 															: `/board/${crumb.id}`
	// 													}
	// 													className="flex items-center space-x-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
	// 												>
	// 													{crumb.color && (
	// 														<div
	// 															className="w-4 h-4 rounded"
	// 															style={{ backgroundColor: crumb.color }}
	// 														/>
	// 													)}
	// 													<span className="truncate max-w-[150px]">
	// 														{crumb.title}
	// 													</span>
	// 												</Link>
	// 											</BreadcrumbLink>
	// 										)}
	// 									</BreadcrumbItem>
	// 									{isBreadcrumbsCondensed && index === 0 && (
	// 										<>
	// 											<BreadcrumbSeparator />
	// 											<BreadcrumbEllipsis />
	// 										</>
	// 									)}
	// 								</Fragment>
	// 							);
	// 						})}
	// 					</BreadcrumbList>
	// 				</Breadcrumb>
	// 			</div>

	// 			{/* Right Side */}
	// 			<div className="flex items-center space-x-3">
	// 				{/* Zoom Controls */}
	// 				<div className="flex items-center space-x-1 bg-[var(--input)] rounded-lg px-2 py-1">
	// 					<button onClick={zoomOut} className="p-1.5 hover:bg-[var(--card-hover)] rounded text-[var(--muted)]">
	// 						<Minus className="w-3 h-3" />
	// 					</button>
	// 					<span className="px-3 text-sm text-[var(--foreground)] font-medium">{(viewport.zoom * 100).toPrecision(4)}%</span>
	// 					<button onClick={zoomIn} className="p-1.5 hover:bg-[var(--card-hover)] rounded text-[var(--muted)]">
	// 						<Plus className="w-3 h-3" />
	// 					</button>
	// 				</div>

	// 				{/* View Mode */}
	// 				<button onClick={zoomToFit} className="p-2 hover:bg-[var(--card-hover)] rounded-lg text-[var(--muted)]">
	// 					<Maximize2 className="w-4 h-4" />
	// 				</button>

	// 				{/* Collaborators */}
	// 				<RealtimeAvatarStack roomName={boardId}/>

	// 				{/* Share Button */}
	// 				<button
	// 					onClick={() => setIsShareModalOpen(true)}
	// 					className="px-4 py-2 rounded-lg font-medium text-sm transition-colors inline-flex items-center hover:opacity-90"
	// 					style={{
	// 						background: `linear-gradient(to right, var(--primary), var(--accent))`,
	// 						color: 'var(--foreground)'
	// 					}}
	// 				>
	// 					<Share2 className="w-4 h-4 mr-2" />
	// 					Share
	// 				</button>

	// 				<button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-[var(--foreground)] hover:bg-[var(--card-hover)] rounded-lg transition-colors">
	// 					<Settings className="w-5 h-5" />
	// 					<span className="text-sm">Settings</span>
	// 				</button>
	// 			</div>
	// 		</header>

	// 		<SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
	// 		<ShareModal boardId={boardId} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
	// 	</>
	// );

	return (
			<>
				<div className="bg-[#0f172a] border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0 z-50">
					<div className="flex items-center space-x-3">
						{/* Breadcrumb Navigation */}
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink	asChild>
										<Link
											href="/dashboard"
											className="flex items-center hover:bg-white/5 text-slate-400 transition-colors"
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
											<BreadcrumbSeparator className="text-slate-600"/>
											<BreadcrumbItem key={crumb.id}>
												{isLast ? (
													// Current board - not clickable
													<BreadcrumbPage className="flex items-center space-x-2">
														{crumb.color && (
															<div
																className="w-4 h-4 rounded shadow-[0_0_8px_rgba(255,255,255,0.2)]"
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
															href={
																isPublicView && crumb.shareToken
																	? `/board/public/${crumb.shareToken}`
																	: `/board/${crumb.id}`
															}
															className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
														>
															{crumb.color && (
																<div
																	className="w-4 h-4 rounded opacity-70"
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
													<BreadcrumbSeparator className="text-slate-600" />
													<BreadcrumbEllipsis className="text-slate-500" />
												</>
											)}
										</Fragment>
									);
								})}
							</BreadcrumbList>
						</Breadcrumb>
					</div>

					{/* Right side - Controls */}
					<div className="flex items-center space-x-3">
						{/* Zoom Controls */}
							<div className="flex items-center space-x-1 bg-[#020617] border border-white/10 rounded-lg px-1 py-1">
								<button onClick={zoomOut} className="p-1.5 hover:bg-white/10 rounded text-slate-400 transition-colors">
									<Minus size={16} />
								</button>
								<span className="px-2 text-xs text-slate-300 font-mono min-w-[3rem] text-center">{(viewport.zoom * 100).toPrecision(4)}%</span>
								<button onClick={zoomIn} className="p-1.5 hover:bg-white/10 rounded text-slate-400 transition-colors">
									<Plus size={16} />
								</button>
							</div>

							{/* View Mode */}
							<button onClick={zoomToFit} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
								<Maximize2 size={16} />
							</button>

							{/* Collaborators */}
							<div className="mx-2">
								<RealtimeAvatarStack roomName={boardId}/>
							</div>

							{/* Share Button */}
							<button 
								onClick={() => setIsShareModalOpen(true)} 
								className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 border border-indigo-500/50"
							>
								<Share2 size={14}/>
								Share
							</button>

							<button onClick={() => setIsSettingsModalOpen(true)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"><Settings size={20} /></button>
					</div>
				</div>
			<SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
	 		<ShareModal boardId={boardId} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
		</>
	)
}
