'use client';

import { useUser, useAuth } from "@clerk/nextjs";
import { db } from "@/lib/instant/db";
import { useMemo } from "react";

export function useCurrentUser() {
	// Get the clerk user
	const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
	const { userId } = useAuth();

	// Get InstantDB User
	const { data: dbData, isLoading: dbLoading } = db.useQuery(
		userId
			? {
				users: {
					$: {
						where: {
							clerkId: userId,
						},
					},
				},
			} : null
	);

	const dbUser = dbData?.users[0];

	// Combined loading state
	const isLoading = !clerkLoaded || dbLoading;

	// Memoize combined user object
	const user = useMemo(() => {
		if (!clerkUser || !dbUser) return null;

		return {
			// Clerk data (auth & identity)
			id: clerkUser.id,
			email: clerkUser.emailAddresses[0]?.emailAddress,
			username: clerkUser.username,
			imageUrl: clerkUser.imageUrl,

			createdAt: clerkUser.createdAt,

			// InstantDB data (app-specific)
			
		};
	}, [clerkUser, dbUser]);

	return {
		user,
		clerkUser,
		dbUser,
		isLoading,
		isSignedIn: !!userId,
	};
}