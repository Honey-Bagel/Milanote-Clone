'use client';

export default function LoadingSkeleton() {
	return (
		<div className="fixed inset-0 bg-white z-50">
			<div className="flex h-screen">
				{/* Sidebar Skeleton */}
				<aside className="w-64 bg-white border-r border-gray-200 p-4">
					<div className="skeleton h-8 w-32 rounded mb-6"></div>
					<div className="skeleton h-10 w-full rounded-lg mb-4"></div>
					<div className="skeleton h-10 w-full rounded-lg mb-4"></div>
					<div className="space-y-3 mb-6">
						<div className="skeleton h-10 w-full rounded-lg"></div>
						<div className="skeleton h-10 w-full rounded-lg"></div>
						<div className="skeleton h-10 w-full rounded-lg"></div>
					</div>
					<div className="skeleton h-4 w-20 rounded mb-3"></div>
					<div className="space-y-2">
						<div className="skeleton h-10 w-full rounded-lg"></div>
						<div className="skeleton h-10 w-full rounded-lg"></div>
						<div className="skeleton h-10 w-full rounded-lg"></div>
					</div>
				</aside>
				
				{/* Main Content Skeleton */}
				<main className="flex-1 flex flex-col">
					{/* Header Skeleton */}
					<header className="bg-white border-b border-gray-200 px-6 py-4">
						<div className="flex items-center justify-between">
							<div className="skeleton h-6 w-48 rounded"></div>
							<div className="flex items-center space-x-3">
								<div className="skeleton h-8 w-24 rounded-lg"></div>
								<div className="skeleton h-8 w-8 rounded-full"></div>
								<div className="skeleton h-8 w-8 rounded-full"></div>
							</div>
						</div>
					</header>
					
					{/* Toolbar Skeleton */}
					<div className="bg-white border-b border-gray-200 px-6 py-3">
						<div className="flex items-center space-x-2">
							<div className="skeleton h-9 w-20 rounded-lg"></div>
							<div className="skeleton h-9 w-9 rounded-lg"></div>
							<div className="skeleton h-9 w-9 rounded-lg"></div>
							<div className="skeleton h-9 w-9 rounded-lg"></div>
						</div>
					</div>
					
					{/* Canvas Skeleton */}
					<div className="flex-1 overflow-auto bg-gray-50 p-12">
						<div className="skeleton h-12 w-96 rounded-lg mb-12"></div>
						<div className="grid grid-cols-12 gap-6">
							<div className="col-span-3">
								<div className="skeleton h-48 w-full rounded-lg"></div>
							</div>
							<div className="col-span-4">
								<div className="skeleton h-64 w-full rounded-lg"></div>
							</div>
							<div className="col-span-3">
								<div className="skeleton h-56 w-full rounded-lg"></div>
							</div>
							<div className="col-span-5">
								<div className="skeleton h-48 w-full rounded-lg"></div>
							</div>
							<div className="col-span-3">
								<div className="skeleton h-40 w-full rounded-lg"></div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
