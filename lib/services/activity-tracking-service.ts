import { db, generateId } from "@/lib/db/client";

export interface ActivityLogEntry {
	action_type: 'card.created' | 'card.updated' | 'collaborator.added';
	actor_id: string;
	board_id: string;
	card_id?: string;
	card_type?: string;
	metadata?: Record<string, any>;
};

export const ActivityTrackingService = {
	/**
	 * Log a card creation event
	 * fire-and-forget pattern to avoid blocking user operations
	 */
	logCardCreated: async (params: {
		actor_id: string;
		board_id: string;
		card_id: string;
		card_type: string;
	}): Promise<void> => {
		try {
			const activityId = generateId();
			const now = Date.now();

			await db.transact([
				db.tx.activity_log[activityId].update({
					action_type: 'card.created',
					actor_id: params.actor_id,
					board_id: params.board_id,
					card_id: params.card_id,
					card_type: params.card_type,
					created_at: now,
				}),
				db.tx.activity_log[activityId].link({ actor: params.actor_id }),
				db.tx.activity_log[activityId].link({ board: params.board_id }),
			]);
		} catch (error) {
			console.error('[ActivityTracking] Failed to log card creation:', error);
		}
	},

	/**
	 * Log a card update event
	 */
	logCardUpdated: async (params: {
		actor_id: string;
		board_id: string;
		card_id: string;
		card_type: string;
		fields_changed?: string[];
	}): Promise<void> => {
		try {
			const activityId = generateId();
			const now = Date.now();

			await db.transact([
				db.tx.activity_log[activityId].update({
					action_type: 'card.updated',
					actor_id: params.actor_id,
					board_id: params.board_id,
					card_id: params.card_id,
					card_type: params.card_type,
					metadata: params.fields_changed ? { fields_changed: params.fields_changed } : undefined,
					created_at: now,
				}),
				db.tx.activity_log[activityId].link({ actor: params.actor_id }),
				db.tx.activity_log[activityId].link({ board: params.board_id }),
			]);
		} catch (error) {
			console.error('[ActivityTracking] Failed to log card update:', error);
		}
	},

	/**
	 * Log a collaborator addition event
	 */
	logCollaboratorAdded: async (params: {
		actor_id: string;
		board_id: string;
		collaborator_id: string;
		collaborator_email: string;
		role: string;
	}): Promise<void> => {
		try {
			const activityId = generateId();
			const now = Date.now();

			await db.transact([
				db.tx.activity_log[activityId].update({
					action_type: 'collaborator.added',
					actor_id: params.actor_id,
					board_id: params.board_id,
					metadata: {
						collaborator_email: params.collaborator_email,
						role: params.role,
					},
					created_at: now,
				}),
				db.tx.activity_log[activityId].link({ actor: params.actor_id }),
				db.tx.activity_log[activityId].link({ board: params.board_id }),
			]);
		} catch (error) {
			console.error('[ActivityTracking] Failed to log collaborator add:', error);
		}
	},
};