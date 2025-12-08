/**
 * Board Service - High-level board operations
 *
 * Handles board CRUD, sharing, and collaboration
 */

import { db, generateId, updateEntity } from '@/lib/db/client';
import { BOARD_DEFAULTS } from '@/lib/constants/defaults';

// ============================================================================
// BOARD CREATION
// ============================================================================

export interface CreateBoardParams {
  ownerId: string;
  title?: string;
  parentId?: string;
  color?: string;
  isPublic?: boolean;
  boardId?: string; // Optional pre-generated ID for parallel operations
}

/**
 * Create a new board
 *
 * @example
 * const boardId = await BoardService.createBoard({
 *   ownerId: userId,
 *   title: 'My Board',
 *   color: '#3B82F6',
 * });
 */
export async function createBoard(params: CreateBoardParams): Promise<string> {
  const boardId = params.boardId || generateId();
  const now = Date.now();

  console.log('[BoardService] Creating board with params:', {
    boardId,
    ownerId: params.ownerId,
    title: params.title,
    parentId: params.parentId,
    color: params.color,
  });

  const transactions = [
    db.tx.boards[boardId].update({
      title: params.title || 'New Board',
      parent_board_id: params.parentId || null,
      color: params.color || BOARD_DEFAULTS.color,
      is_public: params.isPublic || BOARD_DEFAULTS.is_public,
      created_at: now,
      updated_at: now,
    }),
    // Link board to the owner
    db.tx.$users[params.ownerId].link({ owned_boards: boardId }),
  ];

  // If parentId is provided, also set up the relationship using the link
  if (params.parentId) {
    transactions.push(
      db.tx.boards[boardId].link({ parent: params.parentId })
    );
  }

  await db.transact(transactions);

  console.log('[BoardService] Board created successfully:', boardId);

  return boardId;
}

// ============================================================================
// BOARD UPDATES
// ============================================================================

/**
 * Update board settings
 *
 * @example
 * await BoardService.updateBoard('board-123', {
 *   title: 'Updated Title',
 *   color: '#FF0000',
 * });
 */
export async function updateBoard(
  boardId: string,
  updates: Partial<{
    title: string;
    color: string;
    is_public: boolean;
    share_token: string | null;
  }>
): Promise<void> {
  await db.transact([updateEntity('boards', boardId, updates)]);
}

// ============================================================================
// PUBLIC SHARING
// ============================================================================

/**
 * Generate and set share token for public board
 *
 * @example
 * const shareToken = await BoardService.enablePublicSharing('board-123');
 * // Share URL: /board/public/${shareToken}
 */
export async function enablePublicSharing(boardId: string): Promise<string> {
  const shareToken = generateId(); // Use InstantDB's id() for unique tokens

  await updateBoard(boardId, {
    is_public: true,
    share_token: shareToken,
  });

  return shareToken;
}

/**
 * Disable public sharing
 */
export async function disablePublicSharing(boardId: string): Promise<void> {
  await updateBoard(boardId, {
    is_public: false,
    share_token: null,
  });
}

// ============================================================================
// BOARD DELETION
// ============================================================================

/**
 * Delete a board
 *
 * Note: This will also delete all cards in the board due to cascade behavior
 */
export async function deleteBoard(boardId: string): Promise<void> {
  await db.transact([db.tx.boards[boardId].delete()]);
}

// ============================================================================
// BOARD DUPLICATION
// ============================================================================

/**
 * Duplicate a board (including all its cards)
 *
 * @param sourceBoardId - The board to duplicate
 * @param ownerId - Owner of the new board
 * @returns The ID of the new board
 */
export async function duplicateBoard(sourceBoardId: string, ownerId: string): Promise<string> {
  // TODO: Implement board duplication with cards
  // This is complex and would require:
  // 1. Query source board with all cards
  // 2. Create new board
  // 3. Create copies of all cards with new IDs
  // 4. Update any linked references (e.g., board cards linking to other boards)

  console.warn('Board duplication not yet implemented');
  throw new Error('Board duplication not yet implemented');
}

// ============================================================================
// EXPORTS
// ============================================================================

export const BoardService = {
  createBoard,
  updateBoard,
  enablePublicSharing,
  disablePublicSharing,
  deleteBoard,
  duplicateBoard,
};
