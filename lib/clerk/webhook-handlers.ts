import { adminDB } from '@/lib/instant/adminDb';
import { stripe } from '@/lib/billing/stripe';
import { id } from '@instantdb/admin';
import type { ProfileUpdate, UserPreferencesDefaults } from '@/lib/types/clerk-webhook';

// Types from Clerk webhook payloads
interface ClerkUserData {
	id: string;
	email_addresses: Array<{
		id: string;
		email_address: string;
	}>;
	primary_email_address_id: string | null;
	username: string | null;
	first_name: string | null;
	last_name: string | null;
	image_url: string;
	created_at: number;
	updated_at: number;
}

interface ClerkDeletedObject {
	id: string;
	object: string;
	deleted: boolean;
}

interface ClerkSessionData {
	id: string;
	user_id: string;
	created_at: number;
	updated_at: number;
}

// Default user preferences
const DEFAULT_PREFERENCES: Omit<UserPreferencesDefaults, 'created_at' | 'updated_at'> = {
	defaultBoardColor: '#6366f1',
	autoSaveEnabled: true,
	gridSnapEnabled: true,
	emailNotifications: true,
	boardActivityNotifications: true,
	shareNotifications: true,
	weeklyDigest: false,
	allowCommenting: true,
	showPresenceIndicators: true,
};

/**
 * Wait for InstantDB $users entry to be created (by client auth)
 * Uses exponential backoff retry
 */
export async function waitForInstantUser(
	email: string,
	options = { maxRetries: 5, initialDelayMs: 500 }
): Promise<{ id: string; email: string }> {
	for (let i = 0; i < options.maxRetries; i++) {
		const data = await adminDB.query({
			$users: { $: { where: { email } } },
		});

		if (data.$users.length > 0) {
			return data.$users[0] as { id: string; email: string };
		}

		if (i < options.maxRetries - 1) {
			const delay = options.initialDelayMs * Math.pow(2, i);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw new Error(`INSTANT_USER_NOT_FOUND: ${email}`);
}

/**
 * Find profile by Clerk user ID
 */
export async function findProfileByClerkId(clerkUserId: string): Promise<{
	id: string;
	stripe_subscription_id?: string | null;
	stripe_customer_id?: string | null;
} | null> {
	const data = await adminDB.query({
		profiles: {
			$: { where: { clerk_user_id: clerkUserId } },
		},
	});

	if (data.profiles.length > 0) {
		return data.profiles[0] as {
			id: string;
			stripe_subscription_id?: string | null;
			stripe_customer_id?: string | null;
		};
	}

	return null;
}

/**
 * Find InstantDB user by email
 */
export async function findInstantUserByEmail(email: string): Promise<{
	id: string;
	email: string;
	profile?: { id: string };
} | null> {
	const data = await adminDB.query({
		$users: {
			$: { where: { email } },
			profile: {},
		},
	});

	if (data.$users.length > 0) {
		return data.$users[0] as { id: string; email: string; profile?: { id: string } };
	}

	return null;
}

/**
 * Get primary email from Clerk user data
 */
function getPrimaryEmail(user: ClerkUserData): string | null {
	if (user.primary_email_address_id) {
		const primaryEmail = user.email_addresses.find(
			(e) => e.id === user.primary_email_address_id
		);
		if (primaryEmail) return primaryEmail.email_address;
	}
	// Fallback to first email
	return user.email_addresses[0]?.email_address || null;
}

/**
 * Get display name from Clerk user data
 */
function getDisplayName(user: ClerkUserData): string {
	if (user.username) return user.username;
	if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
	if (user.first_name) return user.first_name;
	return 'Unknown';
}

/**
 * Handle user.created event
 * Creates profile and user_preferences in InstantDB
 */
export async function handleUserCreated(user: ClerkUserData): Promise<void> {
	const email = getPrimaryEmail(user);
	if (!email) {
		throw new Error('MISSING_EMAIL: No email address found');
	}

	console.log(`[Clerk Webhook] Processing user.created for ${email}`);

	// Wait for InstantDB $users entry (created by client auth)
	const instantUser = await waitForInstantUser(email);
	const userId = instantUser.id;

	// Check if profile already exists (idempotency)
	const existingProfile = await adminDB.query({
		profiles: { $: { where: { id: userId } } },
	});

	if (existingProfile.profiles.length > 0) {
		console.log(`[Clerk Webhook] Profile already exists for ${userId}, updating clerk_user_id`);
		// Ensure clerk_user_id is set even if profile exists
		await adminDB.transact([
			adminDB.tx.profiles[userId].update({
				clerk_user_id: user.id,
				last_active: Date.now(),
			}),
		]);
		return;
	}

	// Create profile and user_preferences in a single transaction
	const now = Date.now();

	await adminDB.transact([
		// Create profile
		adminDB.tx.profiles[userId].update({
			display_name: getDisplayName(user),
			avatar_url: user.image_url || null,
			clerk_user_id: user.id,
			is_admin: false,
			created_at: now,
			last_active: now,
			// Billing defaults
			subscription_tier: 'free',
			subscription_status: null,
			storage_flagged: false,
			// Usage counters
			board_count: 0,
			card_count: 0,
			storage_bytes_used: 0,
			counters_last_reconciled: now,
			pending_storage_bytes: 0,
		}),
		// Link profile to $users
		adminDB.tx.$users[userId].link({ profile: userId }),

		// Create user_preferences
		adminDB.tx.user_preferences[userId].update({
			...DEFAULT_PREFERENCES,
			created_at: now,
			updated_at: now,
		}),
		// Link preferences to $users
		adminDB.tx.$users[userId].link({ preferences: userId }),
	]);

	console.log(`[Clerk Webhook] Created profile and preferences for ${userId} (clerk: ${user.id})`);
}

/**
 * Handle user.updated event
 * Syncs profile data and handles email changes
 */
export async function handleUserUpdated(user: ClerkUserData): Promise<void> {
	const newEmail = getPrimaryEmail(user);
	if (!newEmail) {
		throw new Error('MISSING_EMAIL: No email address found');
	}

	console.log(`[Clerk Webhook] Processing user.updated for clerk_user_id: ${user.id}`);

	// Find profile by clerk_user_id (reliable even if email changed)
	const profile = await findProfileByClerkId(user.id);

	if (!profile) {
		// Profile not found - user may have been created before webhook was set up
		// Try to find by email and update clerk_user_id
		const instantUser = await findInstantUserByEmail(newEmail);
		if (instantUser?.profile) {
			console.log(`[Clerk Webhook] Found profile by email, updating clerk_user_id`);
			await adminDB.transact([
				adminDB.tx.profiles[instantUser.profile.id].update({
					clerk_user_id: user.id,
					display_name: getDisplayName(user),
					avatar_url: user.image_url || null,
					last_active: Date.now(),
				}),
			]);
			return;
		}

		console.warn(`[Clerk Webhook] No profile found for user.updated: ${user.id}`);
		return;
	}

	// Build update payload
	const updates: ProfileUpdate = {
		display_name: getDisplayName(user),
		avatar_url: user.image_url || null,
		last_active: Date.now(),
	};

	// Check for email change - need to handle $users migration
	const currentUserData = await adminDB.query({
		profiles: {
			$: { where: { id: profile.id } },
			user: {},
		},
	});

	const currentProfile = currentUserData.profiles[0];
	const currentUser = currentProfile?.user as { id: string; email: string } | undefined;
	const currentEmail = currentUser?.email;

	if (currentEmail && currentEmail !== newEmail) {
		console.log(`[Clerk Webhook] Email change detected: ${currentEmail} -> ${newEmail}`);

		// Check if new email $users entry exists
		const newInstantUser = await findInstantUserByEmail(newEmail);

		if (newInstantUser) {
			// New email already has a $users entry - migrate profile link
			console.log(`[Clerk Webhook] Migrating profile to new $users entry: ${newInstantUser.id}`);

			await adminDB.transact([
				// Unlink from old $users
				adminDB.tx.$users[currentUser!.id].unlink({ profile: profile.id }),
				// Link to new $users
				adminDB.tx.$users[newInstantUser.id].link({ profile: profile.id }),
				// Update profile
				adminDB.tx.profiles[profile.id].update(updates),
			]);

			// Also migrate user_preferences if exists
			const prefsData = await adminDB.query({
				user_preferences: { $: { where: { id: profile.id } } },
			});

			if (prefsData.user_preferences.length > 0) {
				await adminDB.transact([
					adminDB.tx.$users[currentUser!.id].unlink({ preferences: profile.id }),
					adminDB.tx.$users[newInstantUser.id].link({ preferences: profile.id }),
				]);
			}

			console.log(`[Clerk Webhook] Email migration complete for ${profile.id}`);
		} else {
			// New email doesn't have $users entry yet
			// This will be created when user logs in with new email via client
			// For now, just update the profile
			console.log(`[Clerk Webhook] New email $users not found, will be created on next login`);
			await adminDB.transact([
				adminDB.tx.profiles[profile.id].update(updates),
			]);
		}
	} else {
		// No email change, just update profile
		await adminDB.transact([
			adminDB.tx.profiles[profile.id].update(updates),
		]);
	}

	console.log(`[Clerk Webhook] Updated profile for ${profile.id}`);
}

/**
 * Handle user.deleted event
 * Soft deletes profile and cancels Stripe subscription
 */
export async function handleUserDeleted(deleted: ClerkDeletedObject): Promise<void> {
	console.log(`[Clerk Webhook] Processing user.deleted for clerk_user_id: ${deleted.id}`);

	// Find profile by clerk_user_id
	const profile = await findProfileByClerkId(deleted.id);

	if (!profile) {
		console.warn(`[Clerk Webhook] No profile found for deleted user: ${deleted.id}`);
		return;
	}

	// Cancel Stripe subscription if exists
	if (profile.stripe_subscription_id) {
		try {
			await stripe.subscriptions.cancel(profile.stripe_subscription_id, {
				prorate: true,
			});
			console.log(`[Clerk Webhook] Cancelled Stripe subscription: ${profile.stripe_subscription_id}`);
		} catch (error) {
			// Log but don't fail - subscription may already be cancelled
			console.error(`[Clerk Webhook] Failed to cancel Stripe subscription:`, error);
		}
	}

	// Soft delete profile
	await adminDB.transact([
		adminDB.tx.profiles[profile.id].update({
			deleted_at: Date.now(),
			subscription_tier: 'free',
			subscription_status: 'canceled',
			stripe_subscription_id: null,
		}),
	]);

	console.log(`[Clerk Webhook] Soft-deleted profile: ${profile.id}`);
}

/**
 * Handle session.created event
 * Updates last_active timestamp
 */
export async function handleSessionCreated(session: ClerkSessionData): Promise<void> {
	console.log(`[Clerk Webhook] Processing session.created for clerk_user_id: ${session.user_id}`);

	const profile = await findProfileByClerkId(session.user_id);

	if (!profile) {
		// Profile may not exist yet if user.created hasn't been processed
		console.log(`[Clerk Webhook] No profile found for session, skipping last_active update`);
		return;
	}

	await adminDB.transact([
		adminDB.tx.profiles[profile.id].update({
			last_active: Date.now(),
		}),
	]);

	console.log(`[Clerk Webhook] Updated last_active for ${profile.id}`);
}

/**
 * Handle session.ended event
 * Updates last_active timestamp
 */
export async function handleSessionEnded(session: ClerkSessionData): Promise<void> {
	// Same logic as session.created
	await handleSessionCreated(session);
}