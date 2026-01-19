'use client';

import { useUserEntitlement } from '@/lib/hooks/billing/use-user-entitlement';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Props {
	resourceType: 'board' | 'card' | 'storage';
	additionalBytes?: number;
	children: (allowed: boolean) => React.ReactNode;
	fallback?: React.ReactNode;
}

export function EntitlementGuard({
	resourceType,
	additionalBytes = 0,
	children,
	fallback,
}: Props) {
	const entitlement = useUserEntitlement();
	const router = useRouter();

	if (entitlement.isLoading) {
		return <div>Loading...</div>;
	}

	let allowed = false;

	switch (resourceType) {
		case 'board':
			allowed = entitlement.canCreateBoard;
			break;
		case 'card':
			allowed = entitlement.canCreateCard;
			break;
		case 'storage':
			allowed = entitlement.canUploadFile(additionalBytes);
			break;
	}

	if (!allowed && fallback) {
		return <>{fallback}</>;
	}

	if (!allowed) {
		return (
			<div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
				<p className="font-bold text-yellow-900">Limit Reached</p>
				<p className="text-yellow-800 mb-3">
					You've reached your {resourceType} limit on the {entitlement.tier} plan.
				</p>
				<Button
					onClick={() => router.push('/pricing')}
					size="sm"
					className="bg-yellow-600 hover:bg-yellow-700"
				>
					Upgrade Now
				</Button>
			</div>
		);
	}

	return <>{children(allowed)}</>;
}
