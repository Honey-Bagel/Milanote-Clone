'use client';

import { db } from '@/lib/instant/db';

/**
 * Hook to check if the current user is an admin
 *
 * Admins have the `is_admin` flag set to true in their profile.
 * This flag is used to gate template creation and management features.
 *
 * @returns boolean - true if user is admin, false otherwise
 */
export function useIsAdmin(): { isAdmin: boolean, isLoading: boolean } {
	const { user } = db.useAuth();

	const { data, isLoading } = db.useQuery(
		user
			? {
					profiles: {
						$: {
							where: { id: user.id },
						},
					},
			  }
			: null
	);

	return {
		isAdmin: data?.profiles[0].is_admin === true,
		isLoading
	};
}
