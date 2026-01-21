/**
 * Collaboration Service - Board sharing and permissions
 *
 * Handles adding/removing collaborators and managing permissions
 */

import { db, generateId } from '@/lib/db/client';
import { ActivityTrackingService } from './activity-tracking-service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface AddCollaboratorParams {
  boardId: string;
  userId: string;
  role: CollaboratorRole;
}

// ============================================================================
// ADD COLLABORATOR
// ============================================================================

/**
 * Add a collaborator to a board
 *
 * @example
 * await CollaborationService.addCollaborator({
 *   boardId: 'board-123',
 *   userId: 'user-456',
 *   role: 'editor',
 * });
 */
export async function addCollaborator(params: AddCollaboratorParams): Promise<string> {
  const collaboratorId = generateId();
  const now = Date.now();

  await db.transact([
    db.tx.board_collaborators[collaboratorId].update({
      role: params.role,
      created_at: now,
      updated_at: now,
    }),
    // Link collaborator to board
    db.tx.board_collaborators[collaboratorId].link({ board: params.boardId }),
    // Link collaborator to user
    db.tx.board_collaborators[collaboratorId].link({ user: params.userId }),
  ]);

  // Log activity
  const { user } = db.useAuth();
  if (user) {
	// Fetch collaborator email from user profile
	// Wil be implemented in NotificationService
	ActivityTrackingService.logCollaboratorAdded({
		actor_id: user.id,
		board_id: params.userId,
		collaborator_id: params.userId,
		collaborator_email: '',
		role: params.role,
	}).catch(console.error);
  }

  return collaboratorId;
}

// ============================================================================
// REMOVE COLLABORATOR
// ============================================================================

/**
 * Remove a collaborator from a board
 */
export async function removeCollaborator(collaboratorId: string): Promise<void> {
  await db.transact([db.tx.board_collaborators[collaboratorId].delete()]);
}

// ============================================================================
// UPDATE COLLABORATOR ROLE
// ============================================================================

/**
 * Update a collaborator's role
 *
 * @example
 * await CollaborationService.updateCollaboratorRole('collab-123', 'viewer');
 */
export async function updateCollaboratorRole(
  collaboratorId: string,
  newRole: CollaboratorRole
): Promise<void> {
  const now = Date.now();
  await db.transact([
    db.tx.board_collaborators[collaboratorId].update({
      role: newRole,
      updated_at: now,
    }),
  ]);
}

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Check if a user can edit a board
 *
 * Note: This is a client-side check - server-side permissions
 * should be enforced via InstantDB permission rules
 */
export function canEdit(role: CollaboratorRole): boolean {
  return role === 'owner' || role === 'editor';
}

/**
 * Check if a user can manage collaborators (add/remove/change roles)
 */
export function canManageCollaborators(role: CollaboratorRole): boolean {
  return role === 'owner';
}

/**
 * Check if a user can delete the board
 */
export function canDelete(role: CollaboratorRole): boolean {
  return role === 'owner';
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CollaborationService = {
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  canEdit,
  canManageCollaborators,
  canDelete,
};
