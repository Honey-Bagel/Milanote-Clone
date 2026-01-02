'use client';

import { db } from '@/lib/instant/db';

export function useLinkedAccounts() {
	const { user } = db.useAuth();

	const { data, isLoading, error } = db.useQuery(
		user ? {
			linked_accounts: {
				$: { where: { 'user.id': user.id } },
				user: {},
			}
		} : null
	);

	return {
		accounts: data?.linked_accounts || [],
		isLoading,
		error,
	};
}