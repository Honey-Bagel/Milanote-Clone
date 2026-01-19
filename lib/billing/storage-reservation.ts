import { init } from "@instantdb/admin";
import { checkBoardOwnerLimits } from "./entitlement-check";

const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

export interface ReservationResult {
	allowed: boolean;
	reservationId?: string;
	reason?: string;
}

/**
 * Reserve storage quota for an upload
 * This creates a "pending" allocation that prevents other uploads from racing
 */
export async function reserveStorage(
	boardId: string,
	fileSize: number,
	expiresInSeconds: number = 3600 // 1 hour to match presigned URL expiry
): Promise<ReservationResult> {
	// 1. Get board owner
	const { boards } = await adminDB.query({
		boards: {
			$: { where: { id: boardId } },
			owner: {},
		},
	});

	const board = boards[0];
	if (!board?.owner) {
		return { allowed: false, reason: "Board not found" };
	}

	const ownerId = board.owner.id;

	// 2. Check if adding fileSize + pending would exceed limits
	const check = await checkBoardOwnerLimits(boardId, "storage", fileSize);

	if (!check.allowed) {
		return { allowed: false, reason: check.reason };
	}

	// 3. Atomically increment pending_storage_bytes
	const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	try {
		const { profiles } = await adminDB.query({
			profiles: { $: { where: { id: ownerId } } },
		});

		const profile = profiles[0];
		const currentPending = profile?.pending_storage_bytes || 0;

		await adminDB.transact([
			adminDB.tx.profiles[ownerId].update({
				pending_storage_bytes: currentPending + fileSize,
				last_storage_sync: Date.now(),
			}),
		]);

		return {
			allowed: true,
			reservationId,
		};
	} catch (error) {
		console.error("[Reservation] Failed to reserve storage:", error);
		return { allowed: false, reason: "Failed to reserve storage" };
	}
}

/**
 * Confirm reservation after successful upload
 * Moves bytes from pending to actual usage
 */
export async function confirmReservation(
	ownerId: string,
	fileSize: number
): Promise<void> {
	try {
		// Decrement pending, actual usage will be updated when card is created
		const { profiles } = await adminDB.query({
			profiles: { $: { where: { id: ownerId } } },
		});

		const profile = profiles[0];
		const currentPending = profile?.pending_storage_bytes || 0;

		await adminDB.transact([
			adminDB.tx.profiles[ownerId].update({
				pending_storage_bytes: Math.max(0, currentPending - fileSize),
				last_storage_sync: Date.now(),
			}),
		]);
	} catch (error) {
		console.error("[Reservation] Failed to confirm:", error);
	}
}

/**
 * Release reservation if upload fails
 */
export async function releaseReservation(
	ownerId: string,
	fileSize: number
): Promise<void> {
	try {
		const { profiles } = await adminDB.query({
			profiles: { $: { where: { id: ownerId } } },
		});

		const profile = profiles[0];
		const currentPending = profile?.pending_storage_bytes || 0;

		await adminDB.transact([
			adminDB.tx.profiles[ownerId].update({
				pending_storage_bytes: Math.max(0, currentPending - fileSize),
				last_storage_sync: Date.now(),
			}),
		]);
	} catch (error) {
		console.error("[Reservation] Failed to release:", error);
	}
}

/**
 * Cleanup stale reservations (older than 2 hours)
 * Should be run periodically via cron
 */
export async function cleanupStaleReservations(): Promise<void> {
	const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

	try {
		const { profiles } = await adminDB.query({
			profiles: {
				$: {
					where: {
						pending_storage_bytes: { $gt: 0 },
						last_storage_sync: { $lt: twoHoursAgo },
					},
				},
			},
		});

		for (const profile of profiles) {
			await adminDB.transact([
				adminDB.tx.profiles[profile.id].update({
					pending_storage_bytes: 0,
				}),
			]);
		}

		console.log(`[Cleanup] Released ${profiles.length} stale reservations`);
	} catch (error) {
		console.error("[Reservation] Cleanup failed:", error);
	}
}
