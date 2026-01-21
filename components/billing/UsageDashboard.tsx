'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface UsageData {
	usage: {
		boards: number;
		cards: number;
		storageBytes: number;
	};
	limits: {
		boards: number | 'unlimited';
		cards: number | 'unlimited';
		storageBytes: number | 'unlimited';
	};
	tier: string;
}

export function UsageDashboard() {
	const [data, setData] = useState<UsageData | null>(null);
	const router = useRouter();

	useEffect(() => {
		fetch('/api/billing/usage')
			.then((res) => res.json())
			.then(setData);
	}, []);

	if (!data) {
		return (
			<div className="animate-pulse space-y-4">
				<div className="h-4 bg-gray-200 rounded w-3/4"></div>
				<div className="h-4 bg-gray-200 rounded w-1/2"></div>
			</div>
		);
	}

	const formatBytes = (bytes: number) => {
		const units = ['B', 'KB', 'MB', 'GB'];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(2)} ${units[unitIndex]}`;
	};

	const getPercentage = (current: number, limit: number | 'unlimited') => {
		if (limit === 'unlimited') return 0;
		return Math.min((current / limit) * 100, 100);
	};

	const isOverLimit = (current: number, limit: number | 'unlimited') => {
		return limit !== 'unlimited' && current >= limit;
	};

	const isNearLimit = (current: number, limit: number | 'unlimited') => {
		if (limit === 'unlimited') return false;
		return current / limit >= 0.8;
	};

	const resources = [
		{
			name: 'Boards',
			current: data.usage.boards,
			limit: data.limits.boards,
		},
		{
			name: 'Cards',
			current: data.usage.cards,
			limit: data.limits.cards,
		},
		{
			name: 'Storage',
			current: data.usage.storageBytes,
			limit: data.limits.storageBytes,
			format: formatBytes,
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold">Usage Overview</h2>
				<p className="text-gray-500 capitalize">Current plan: {data.tier}</p>
			</div>

			{resources.map((resource) => {
				const percentage = getPercentage(resource.current, resource.limit);
				const overLimit = isOverLimit(resource.current, resource.limit);
				const nearLimit = isNearLimit(resource.current, resource.limit);
				const format = resource.format || ((n: number) => n.toString());

				return (
					<div key={resource.name}>
						<div className="flex justify-between mb-2">
							<span className="font-medium">{resource.name}</span>
							<span className={overLimit ? 'text-red-600 font-bold' : ''}>
								{format(resource.current)} /{' '}
								{resource.limit === 'unlimited' ? '∞' : format(resource.limit)}
							</span>
						</div>

						{resource.limit !== 'unlimited' && (
							<Progress
								value={percentage}
								className={
									overLimit
										? '[&>div]:bg-red-500'
										: nearLimit
										? '[&>div]:bg-yellow-500'
										: '[&>div]:bg-green-500'
								}
							/>
						)}

						{overLimit && (
							<p className="text-red-500 text-sm mt-2">
								{resource.name} limit reached. Upgrade to create more {resource.name.toLowerCase()}.
							</p>
						)}

						{!overLimit && nearLimit && (
							<p className="text-yellow-600 text-sm mt-2">
								You're using {Math.round(percentage)}% of your {resource.name.toLowerCase()} limit.
							</p>
						)}
					</div>
				);
			})}

			{data.tier === 'free' && (
				<Button onClick={() => router.push('/pricing')} className="w-full">
					Upgrade Plan
				</Button>
			)}
		</div>
	);
}
