import { db } from "@/lib/instant/db";
import { id } from "@instantdb/react";
import { initializeCounters } from "@/lib/billing/atomic-counter-service";

export async function syncUserToInstantDB(clerkUser: {
	id: string;
	emailAddresses: { emailAddress: string }[];
	username: string | null;
}) {
	const email = clerkUser.emailAddresses[0].emailAddress;

	// Check if user already exists in InstantDB
	const existingData = await db.queryOnce({
		$users: {
			$: {
				where: {
					email: email,
				},
			},
			profile: {},
		},
	});

	const existingUser = existingData.data.$users?.[0];
	const existingProfile = existingUser?.profile;

	// If user doesn't exist, create the user
	if (!existingProfile) {
		const userId = existingUser?.id;

		if (userId) {
			await db.transact([
				db.tx.profiles[userId].update({
					display_name: clerkUser.username || 'Unknown',
					created_at: Date.now(),
					last_active: Date.now(),
					subscription_tier: 'free',
					subscription_status: null,
					storage_flagged: false,
				}),
				db.tx.$users[userId].link({ profile: userId })
			]);

			console.log("Creted new user in InstantDB:", userId);
			return userId;
		}
	}

	initializeCounters(existingData.data.$users[0].id);

	console.log('User already exists in InstantDB');
	return existingProfile?.id;
}