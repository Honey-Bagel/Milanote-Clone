/**
 * Thin wrapper around InstantDB
 *
 * Provides transaction builders and utilities WITHOUT hiding the raw db object.
 * Users can still use db.transact([...]) directly when needed.
 */

import { db } from '@/lib/instant/db';
import { id, tx } from '@instantdb/react';

// ============================================================================
// RE-EXPORT CORE DB FOR DIRECT ACCESS
// ============================================================================

export { db, id, tx };

// ============================================================================
// TYPE HELPERS
// ============================================================================

type EntityType = 'cards' | 'boards' | 'profiles' | 'board_collaborators' | '$users';

// ============================================================================
// TRANSACTION BUILDERS
// ============================================================================

/**
 * Transaction builder for creating entities with timestamps
 *
 * Returns a transaction object (doesn't execute it)
 *
 * @example
 * const cardTx = createEntity('cards', cardId, {
 *   board_id: 'board-123',
 *   card_type: 'note',
 *   note_content: 'Hello',
 * });
 * await db.transact([cardTx]);
 */
export function createEntity(
  entityType: EntityType,
  entityId: string,
  data: Record<string, any>
) {
  const now = Date.now();
  return (db.tx as any)[entityType][entityId].update({
    ...data,
    created_at: now,
    updated_at: now,
  });
}

/**
 * Transaction builder for updating entities with auto-timestamp
 *
 * Returns a transaction object (doesn't execute it)
 *
 * @example
 * const updateTx = updateEntity('cards', cardId, { position_x: 100 });
 * await db.transact([updateTx]);
 */
export function updateEntity(
  entityType: EntityType,
  entityId: string,
  updates: Record<string, any>
) {
  return (db.tx as any)[entityType][entityId].update({
    ...updates,
    updated_at: Date.now(),
  });
}

/**
 * Transaction builder for deleting entities
 *
 * Returns a transaction object (doesn't execute it)
 */
export function deleteEntity(
  entityType: EntityType,
  entityId: string
) {
  return (db.tx as any)[entityType][entityId].delete();
}

/**
 * Transaction builder for linking entities
 *
 * @example
 * const linkTx = linkEntity('cards', cardId, 'board', boardId);
 * await db.transact([linkTx]);
 */
export function linkEntity(
  entityType: EntityType,
  entityId: string,
  linkName: string,
  targetId: string
) {
  return (db.tx as any)[entityType][entityId].link({ [linkName]: targetId });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Create multiple entities in a single transaction
 *
 * @example
 * await batchCreate('cards', [
 *   { id: 'card-1', data: {...} },
 *   { id: 'card-2', data: {...} },
 * ]);
 */
export async function batchCreate(
  entityType: EntityType,
  items: Array<{ id: string; data: Record<string, any> }>
): Promise<void> {
  const transactions = items.map(({ id, data }) =>
    createEntity(entityType, id, data)
  );
  await db.transact(transactions);
}

/**
 * Update multiple entities in a single transaction
 */
export async function batchUpdate(
  entityType: EntityType,
  updates: Array<{ id: string; data: Record<string, any> }>
): Promise<void> {
  const transactions = updates.map(({ id, data }) =>
    updateEntity(entityType, id, data)
  );
  await db.transact(transactions);
}

/**
 * Delete multiple entities in a single transaction
 */
export async function batchDelete(
  entityType: EntityType,
  entityIds: string[]
): Promise<void> {
  const transactions = entityIds.map(id => deleteEntity(entityType, id));
  await db.transact(transactions);
}

// ============================================================================
// BOARD-AWARE TRANSACTION HELPERS
// ============================================================================

/**
 * Execute a transaction that also updates the parent board's timestamp
 *
 * This is a common pattern - most card operations should update the board.
 *
 * @example
 * await withBoardUpdate('board-123', [
 *   updateEntity('cards', 'card-1', { position_x: 100 }),
 *   updateEntity('cards', 'card-2', { position_x: 200 }),
 * ]);
 */
export async function withBoardUpdate(
  boardId: string,
  transactions: any[]
): Promise<void> {
  const now = Date.now();
  await db.transact([
    ...transactions,
    db.tx.boards[boardId].update({ updated_at: now }),
  ]);
}

/**
 * Create a card and update board timestamp in a single transaction
 *
 * @example
 * const cardId = await createCardWithBoard(id(), 'board-123', {
 *   card_type: 'note',
 *   position_x: 100,
 *   position_y: 100,
 *   width: 300,
 *   note_content: 'Hello',
 * });
 */
export async function createCardWithBoard(
  cardId: string,
  boardId: string,
  cardData: Record<string, any>
): Promise<string> {
  const now = Date.now();
  await db.transact([
    db.tx.cards[cardId].update({
      ...cardData,
      created_at: now,
      updated_at: now,
    }),
    db.tx.boards[boardId].update({ updated_at: now }),
    db.tx.cards[cardId].link({ board: boardId }),
  ]);
  return cardId;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get current timestamp (consistent across wrapper)
 */
export function timestamp(): number {
  return Date.now();
}

/**
 * Generate new entity ID using InstantDB's id() function
 */
export function generateId(): string {
  return id();
}
