import { db } from "../instant/db";
import { calculateUserUsage } from "./entitlement-check";

const ADMIN_FLAG_THESHOLD = 100 * 1024 * 1024 * 1024; // 100 GB

export async function updateStorageFlag(userId: string): Promise<void> {
	try {
		// Calculate current storage
		const usage = await calculateUserUsage(userId);
		const shouldFlag = usage.storageBytes >= ADMIN_FLAG_THESHOLD;

		// Update flag
		await db.transact([
			db.tx.profiles[userId].update({
				storage_flagged: shouldFlag,
			}),
		]);

		console.log(`[Storage Flag] User ${userId}: ${shouldFlag ? 'FLAGGED' : 'OK'} (${(usage.storageBytes / 1024 / 1024 / 1024).toFixed(2)} GB)`);
	} catch (error) {
		console.error('[Storage Flag] Error updating flag:', error);
		// Don't throw - this is non-blocking monitoring
	}
}