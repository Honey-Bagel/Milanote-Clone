'use client';

import { db } from '@/lib/instant/db';

export function useIsAdmin() {
	const { user } = db.useAuth();

	const { data, isLoading } = db.useQuery(user ? {
		profiles: {
			$: { where: { id: user.id } },
		},
	} : null);

	const profile = data?.profiles?.[0];
	const isAdmin = profile?.is_admin || false;

	return {
		isAdmin,
		loading: isLoading,
	};
}
