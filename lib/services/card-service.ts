/**
 * Card Service - High-level card operations with business logic
 *
 * Provides type-specific card handling, undo support, and validation
 */

import { db, generateId, withBoardUpdate, updateEntity, deleteEntity } from '@/lib/db/client';
import { useUndoStore } from '@/lib/stores/undo-store';
import type { CardData } from '@/lib/types';
import {
  bringToFront as orderKeyBringToFront,
  sendToBack as orderKeySendToBack,
  cardsToOrderKeyList,
  getOrderKeyForNewCard,
} from '@/lib/utils/order-key-manager';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CreateCardParams {
  boardId: string;
  cardType: CardData['card_type'];
  position: { x: number; y: number };
  dimensions: { width: number; height?: number };
  data?: Record<string, any>; // Type-specific data
  orderKey?: string;
  withUndo?: boolean;
}

export interface UpdateCardTransformParams {
  cardId: string;
  boardId: string;
  transform: {
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
  };
  withUndo?: boolean;
  previousTransform?: {
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
  };
}

export interface UpdateCardContentOptions {
  withUndo?: boolean;
  previousContent?: Record<string, any>;
}

// ============================================================================
// CARD CREATION
// ============================================================================

/**
 * Generate a new order_key for a card using fractional indexing
 * This needs to query existing cards to find the highest order key
 */
async function generateOrderKey(boardId: string): Promise<string> {
  // Query existing cards in the board to find the highest order key
  const { data } = await db.queryOnce({
    cards: {
      $: {
        where: { board_id: boardId },
      },
    },
  });

  const existingCards = data?.cards || [];
  const orderKeyCards = existingCards.map(card => ({
    id: card.id,
    order_key: card.order_key,
  }));

  return getOrderKeyForNewCard(orderKeyCards);
}

/**
 * Validate and apply defaults for type-specific card data
 */
function validateCardData(
  cardType: CardData['card_type'],
  data: Record<string, any> = {}
): Record<string, any> {
  switch (cardType) {
    case 'note':
      return {
        note_content: data.note_content || '',
        note_color: data.note_color || 'yellow',
      };
    case 'image':
      if (!data.image_url && !data.image_url) {
        // Allow creation without URL (will be set later for file uploads)
      }
      return {
        image_url: data.image_url || '',
        image_caption: data.image_caption || '',
        image_alt_text: data.image_alt_text || '',
      };
    case 'task_list':
      return {
        task_list_title: data.task_list_title || 'Task List',
        tasks: data.tasks || [],
      };
    case 'link':
      return {
        link_title: data.link_title || 'New Link',
        link_url: data.link_url || '',
        link_favicon_url: data.link_favicon_url || '',
      };
    case 'file':
      return {
        file_name: data.file_name || 'file',
        file_url: data.file_url || '',
        file_size: data.file_size || 0,
        file_mime_type: data.file_mime_type || '',
      };
    case 'color_palette':
      return {
        palette_title: data.palette_title || 'Color Palette',
        palette_description: data.palette_description || '',
        palette_colors: data.palette_colors || ['#FF0000', '#00FF00', '#0000FF'],
      };
    case 'column':
      return {
        column_title: data.column_title || 'Column',
        column_background_color: data.column_background_color || '#f3f4f6',
        column_is_collapsed: data.column_is_collapsed || false,
        column_items: data.column_items || [],
      };
    case 'board':
      return {
        linked_board_id: data.linked_board_id || '',
        board_title: data.board_title || 'New Board',
        board_color: data.board_color || '#3B82F6',
        board_card_count: data.board_card_count || '0',
      };
    case 'line':
      return {
        line_start_x: data.line_start_x ?? 0,
        line_start_y: data.line_start_y ?? 50,
        line_end_x: data.line_end_x ?? 200,
        line_end_y: data.line_end_y ?? 50,
        line_color: data.line_color || '#6b7280',
        line_stroke_width: data.line_stroke_width || 2,
        line_style: data.line_style || 'solid',
        line_start_cap: data.line_start_cap || 'none',
        line_end_cap: data.line_end_cap || 'arrow',
        line_curvature: data.line_curvature || 0,
        line_control_point_offset: data.line_control_point_offset || 0,
        line_reroute_nodes: data.line_reroute_nodes || null,
        line_start_attached_card_id: data.line_start_attached_card_id || null,
        line_start_attached_side: data.line_start_attached_side || null,
        line_end_attached_card_id: data.line_end_attached_card_id || null,
        line_end_attached_side: data.line_end_attached_side || null,
      };
    default:
      return data;
  }
}

/**
 * Create a new card with type-specific defaults and validation
 *
 * @example
 * const cardId = await CardService.createCard({
 *   boardId: 'board-123',
 *   cardType: 'note',
 *   position: { x: 100, y: 100 },
 *   dimensions: { width: 300, height: 200 },
 *   data: { note_content: 'Hello', note_color: 'yellow' },
 *   withUndo: true,
 * });
 */
export async function createCard(params: CreateCardParams): Promise<string> {
  const cardId = generateId();
  const orderKey = params.orderKey || await generateOrderKey(params.boardId);

  // Validate and apply defaults for type-specific data
  const validatedData = validateCardData(params.cardType, params.data);

  const cardData: Partial<CardData> = {
    board_id: params.boardId,
    card_type: params.cardType,
    position_x: params.position.x,
    position_y: params.position.y,
    width: params.dimensions.width,
    height: params.dimensions.height,
    order_key: orderKey,
    ...validatedData,
  };

  const now = Date.now();
  await db.transact([
    db.tx.cards[cardId].update({
      ...cardData,
      created_at: now,
      updated_at: now,
    }),
    db.tx.boards[params.boardId].update({ updated_at: now }),
    db.tx.cards[cardId].link({ board: params.boardId }),
  ]);

  // Add undo action
  if (params.withUndo) {
    useUndoStore.getState().addAction({
      type: 'card_create',
      timestamp: now,
      description: `Create ${params.cardType} card`,
      do: async () => {
        // Already created
      },
      undo: () => deleteCard(cardId, params.boardId, { withUndo: false }),
    });
  }

  return cardId;
}

// ============================================================================
// CARD TRANSFORM (Position & Size)
// ============================================================================

/**
 * Update card order key for z-ordering
 *
 * @example
 * await CardService.updateCardOrderKey('card-123', 'board-123', 'a5');
 */
export async function updateCardOrderKey(
  cardId: string,
  boardId: string,
  orderKey: string
): Promise<void> {
  await withBoardUpdate(boardId, [
    updateEntity('cards', cardId, { order_key: orderKey }),
  ]);
}

/**
 * Update card position and/or size
 *
 * @example
 * await CardService.updateCardTransform({
 *   cardId: 'card-123',
 *   boardId: 'board-123',
 *   transform: { position_x: 200, position_y: 300 },
 *   withUndo: true,
 *   previousTransform: { position_x: 100, position_y: 100 },
 * });
 */
export async function updateCardTransform(params: UpdateCardTransformParams): Promise<void> {
  console.log('[CardService] updateCardTransform called:', {
    cardId: params.cardId,
    boardId: params.boardId,
    transform: params.transform,
  });

  await withBoardUpdate(params.boardId, [
    updateEntity('cards', params.cardId, params.transform),
  ]);

  console.log('[CardService] Transform update complete');

  if (params.withUndo && params.previousTransform) {
    useUndoStore.getState().addAction({
      type: 'card_move',
      timestamp: Date.now(),
      description: 'Move/resize card',
      do: () =>
        updateCardTransform({
          ...params,
          withUndo: false,
        }),
      undo: () =>
        updateCardTransform({
          cardId: params.cardId,
          boardId: params.boardId,
          transform: params.previousTransform!,
          withUndo: false,
        }),
    });
  }
}

// ============================================================================
// CARD CONTENT UPDATES (Type-Specific)
// ============================================================================

/**
 * Update card content (generic - works for any card type)
 *
 * @example
 * await CardService.updateCardContent('card-123', 'board-123', 'note', {
 *   note_content: 'Updated content',
 * });
 */
export async function updateCardContent(
  cardId: string,
  boardId: string,
  cardType: string,
  content: Record<string, any>,
  options?: UpdateCardContentOptions
): Promise<void> {
  await withBoardUpdate(boardId, [updateEntity('cards', cardId, content)]);

  if (options?.withUndo && options.previousContent) {
    useUndoStore.getState().addAction({
      type: 'card_content',
      timestamp: Date.now(),
      description: `Edit ${cardType} card`,
      do: () => updateCardContent(cardId, boardId, cardType, content, { withUndo: false }),
      undo: () =>
        updateCardContent(cardId, boardId, cardType, options.previousContent!, { withUndo: false }),
    });
  }
}

/**
 * Update note card content
 */
export async function updateNoteCard(
  cardId: string,
  boardId: string,
  updates: { note_content?: string; note_color?: string },
  options?: UpdateCardContentOptions
): Promise<void> {
  return updateCardContent(cardId, boardId, 'note', updates, options);
}

/**
 * Update task list
 */
export async function updateTaskList(
  cardId: string,
  boardId: string,
  tasks: Array<{ text: string; completed: boolean; position: number }>,
  options?: UpdateCardContentOptions
): Promise<void> {
  return updateCardContent(cardId, boardId, 'task_list', { tasks }, options);
}

/**
 * Update image card
 */
export async function updateImageCard(
  cardId: string,
  boardId: string,
  updates: { image_url?: string; image_caption?: string; image_alt_text?: string },
  options?: UpdateCardContentOptions
): Promise<void> {
  return updateCardContent(cardId, boardId, 'image', updates, options);
}

/**
 * Update column items
 */
export async function updateColumnItems(
  columnId: string,
  boardId: string,
  items: Array<{ card_id: string; position: number }>
): Promise<void> {
  await withBoardUpdate(boardId, [updateEntity('cards', columnId, { column_items: items })]);
}

// ============================================================================
// CARD DELETION
// ============================================================================

/**
 * Delete a single card
 *
 * If the card is a board card with a linked board, also delete the linked board
 *
 * @example
 * await CardService.deleteCard('card-123', 'board-123', { withUndo: true });
 */
export async function deleteCard(
  cardId: string,
  boardId: string,
  options?: { withUndo?: boolean; cardData?: CardData }
): Promise<void> {
  console.log('[CardService] Deleting card:', {
    cardId,
    boardId,
    cardType: options?.cardData?.card_type,
    linkedBoardId: options?.cardData && 'linked_board_id' in options.cardData ? (options.cardData as { linked_board_id?: string }).linked_board_id : undefined,
  });

  // If this is a board card, also delete the linked board
  if (options?.cardData?.card_type === 'board') {
    const boardCard = options.cardData as { linked_board_id?: string };
    const linkedBoardId = boardCard.linked_board_id;
    console.log('[CardService] Board card detected, linked_board_id:', linkedBoardId);
    if (linkedBoardId) {
      // Import BoardService to avoid circular dependency
      const { BoardService } = await import('./board-service');
      try {
        console.log('[CardService] Deleting linked board:', linkedBoardId);
        await BoardService.deleteBoard(linkedBoardId);
        console.log('[CardService] Successfully deleted linked board');
      } catch (error) {
        console.error('Failed to delete linked board:', error);
      }
    }
  }

  console.log('[CardService] Deleting card from database');
  await withBoardUpdate(boardId, [deleteEntity('cards', cardId)]);

  // Note: Undo for delete would require storing full card data before deletion
  // This is complex and may not be needed for MVP
  if (options?.withUndo && options.cardData) {
    useUndoStore.getState().addAction({
      type: 'card_delete',
      timestamp: Date.now(),
      description: 'Delete card',
      do: () => deleteCard(cardId, boardId, { withUndo: false }),
      undo: () => {
        // Re-creating a deleted card is complex - would need to preserve ID
        // For now, we'll skip undo for delete operations
        console.warn('Undo for card deletion not yet implemented');
      },
    });
  }
}

/**
 * Delete multiple cards
 */
export async function deleteCards(cardIds: string[], boardId: string): Promise<void> {
  const transactions = cardIds.map(id => deleteEntity('cards', id));
  await withBoardUpdate(boardId, transactions);
}

// ============================================================================
// CARD DUPLICATION
// ============================================================================

/**
 * Duplicate a card
 *
 * @example
 * const newCardId = await CardService.duplicateCard(sourceCard, { x: 20, y: 20 });
 */
export async function duplicateCard(
  sourceCard: CardData,
  offset: { x: number; y: number } = { x: 20, y: 20 }
): Promise<string> {
  const newCardId = generateId();
  const { id: _, created_at: __, updated_at: ___, ...cardData } = sourceCard as any;

  const now = Date.now();
  const orderKey = await generateOrderKey(sourceCard.board_id);

  await db.transact([
    db.tx.cards[newCardId].update({
      ...cardData,
      position_x: sourceCard.position_x + offset.x,
      position_y: sourceCard.position_y + offset.y,
      created_at: now,
      updated_at: now,
      order_key: orderKey,
    }),
    db.tx.boards[sourceCard.board_id].update({ updated_at: now }),
  ]);

  return newCardId;
}

// ============================================================================
// Z-ORDERING
// ============================================================================

/**
 * Bring cards to front
 */
export async function bringCardsToFront(
  cardIds: string[],
  boardId: string,
  allCards: CardData[]
): Promise<void> {
  const updates = orderKeyBringToFront(cardIds, cardsToOrderKeyList(allCards));

  if (updates.size === 0) return;

  const now = Date.now();
  const transactions = Array.from(updates.entries()).map(([cardId, orderKey]) =>
    db.tx.cards[cardId].update({ order_key: orderKey, updated_at: now })
  );

  await withBoardUpdate(boardId, transactions);
}

/**
 * Send cards to back
 */
export async function sendCardsToBack(
  cardIds: string[],
  boardId: string,
  allCards: CardData[]
): Promise<void> {
  const updates = orderKeySendToBack(cardIds, cardsToOrderKeyList(allCards));

  if (updates.size === 0) return;

  const now = Date.now();
  const transactions = Array.from(updates.entries()).map(([cardId, orderKey]) =>
    db.tx.cards[cardId].update({ order_key: orderKey, updated_at: now })
  );

  await withBoardUpdate(boardId, transactions);
}

// ============================================================================
// ALIGNMENT
// ============================================================================

/**
 * Align cards to top edge
 */
export async function alignCardsTop(cards: CardData[], boardId: string): Promise<void> {
  if (cards.length === 0) return;

  const minY = Math.min(...cards.map(c => c.position_y));
  const now = Date.now();

  const transactions = cards.map(card =>
    db.tx.cards[card.id].update({
      position_y: minY,
      updated_at: now,
    })
  );

  await withBoardUpdate(boardId, transactions);
}

/**
 * Align cards to bottom edge
 */
export async function alignCardsBottom(cards: CardData[], boardId: string): Promise<void> {
  if (cards.length === 0) return;

  const maxY = Math.max(...cards.map(c => c.position_y + (c.height ?? 0)));
  const now = Date.now();

  const transactions = cards.map(card =>
    db.tx.cards[card.id].update({
      position_y: maxY - (card.height ?? 0),
      updated_at: now,
    })
  );

  await withBoardUpdate(boardId, transactions);
}

/**
 * Align cards to left edge
 */
export async function alignCardsLeft(cards: CardData[], boardId: string): Promise<void> {
  if (cards.length === 0) return;

  const minX = Math.min(...cards.map(c => c.position_x));
  const now = Date.now();

  const transactions = cards.map(card =>
    db.tx.cards[card.id].update({
      position_x: minX,
      updated_at: now,
    })
  );

  await withBoardUpdate(boardId, transactions);
}

/**
 * Align cards to right edge
 */
export async function alignCardsRight(cards: CardData[], boardId: string): Promise<void> {
  if (cards.length === 0) return;

  const maxX = Math.max(...cards.map(c => c.position_x + (c.width ?? 0)));
  const now = Date.now();

  const transactions = cards.map(card =>
    db.tx.cards[card.id].update({
      position_x: maxX - (card.width ?? 0),
      updated_at: now,
    })
  );

  await withBoardUpdate(boardId, transactions);
}

// ============================================================================
// COLUMN OPERATIONS
// ============================================================================

export interface AddCardToColumnParams {
	cardId: string;
	boardId: string;
	columnId: string;
	position: number;
};

export async function addCardToColumn(params: AddCardToColumnParams): Promise<void> {
	const { cardId, boardId, columnId, position } = params;

	// Fetch current column
	const { data } = await db.queryOnce({
		cards: {
			$: { where: { id: columnId } },
		},
	});

	const column = data?.cards[0];
	if (!column || column.card_type !== 'column') {
		throw new Error('Column not found');
	}

	// Prevent adding column cards to columns (no nesting)
	const cardToAdd = await db.queryOnce({
		cards: { $: { where: { id: cardId } } },
	});

	if (cardToAdd?.data?.cards[0]?.card_type === 'column') {
		throw new Error("Cannot add column cards to columns");
	}

	// Add card to column_items
	const updatedItems = [
		...(column.column_items || []),
		{ card_id: cardId, position },
	];

	// Reindex positions
	const reindexedItems = updatedItems.map((item, index) => ({
		...item,
		position: index,
	}));

	const now = Date.now();

	// Transaction: update column and clear card position
	await db.transact([
		db.tx.cards[columnId].update({
			column_items: reindexedItems,
			updated_at: now,
		}),
		db.tx.cards[cardId].update({
			position_x: null,
			position_y: null,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({ updated_at: now }),
	]);
}

export interface ExtractCardFromColumnParams {
	cardId: string;
	boardId: string;
	columnId: string;
	position: { x: number; y: number; };
};

export async function extractCardFromColumn(params: ExtractCardFromColumnParams): Promise<void> {
	const { cardId, boardId, columnId, position } = params;

	// Fetch current column
	const { data } = await db.queryOnce({
		cards: {
			$: { where: { id: columnId } },
		},
	});

	const column = data?.cards[0];
	if (!column || column.card_type !== 'column') {
		throw new Error('Column not found');
	}

	// Remove card from column_items
	const updatedItems = (column.column_items || [])
		.filter(item => item.card_id !== cardId)
		.map((item, index) => ({ ...item, position: index }));

	const now = Date.now();

	// Transaction: update column and set card position
	await db.transact([
		db.tx.cards[columnId].update({
			column_items: updatedItems,
			updated_at: now,
		}),
		db.tx.cards[cardId].update({
			position_x: position.x,
			position_y: position.y,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({ updated_at: now }),
	]);
}

export interface TransferCardBetweenColumnsParams {
	cardId: string;
	boardId: string;
	fromColumnId: string;
	toColumnId: string;
	toIndex: number;
};

export async function transferCardBetweenColumns(params: TransferCardBetweenColumnsParams): Promise<void> {
	const { cardId, boardId, fromColumnId, toColumnId, toIndex } = params;

	// Fetch both columns
	const { data } = await db.queryOnce({
		cards: {
			$: {
				where: {
					id: { in: [fromColumnId, toColumnId] },
				},
			},
		},
	});

	const columns = data?.cards || [];
	const fromColumn = columns.find(c => c.id === fromColumnId);
	const toColumn = columns.find(c => c.id === toColumnId);

	if (!fromColumn || !toColumn) {
		throw new Error("Columns not found");
	}

	// Remove from source
	const fromItems = (fromColumn.column_items || [])
		.filter(item => item.card_id !== cardId)
		.map((item, index) => ({ ...item, position: index }));

	// Add to target at specifiedindex
	const toItems = [...(toColumn.column_items || [])];
	toItems.splice(toIndex, 0, { card_id: cardId, position: toIndex });
	const reindexedItems = toItems.map((item, index) => ({
		...item,
		position: index,
	}));

	const now = Date.now();

	// Transaction
	await db.transact([
		db.tx.cards[fromColumnId].update({
			column_items: fromItems,
			updated_at: now,
		}),
		db.tx.cards[toColumnId].update({
			column_items: reindexedItems,
			updated_at: now,
		}),
		db.tx.boards[boardId].update({ updated_at: now }),
	]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CardService = {
  createCard,
  updateCardTransform,
  updateCardContent,
  updateNoteCard,
  updateTaskList,
  updateImageCard,
  updateColumnItems,
  deleteCard,
  deleteCards,
  duplicateCard,
  bringCardsToFront,
  sendCardsToBack,
  alignCardsTop,
  alignCardsBottom,
  alignCardsLeft,
  alignCardsRight,
  updateCardOrderKey,
  addCardToColumn,
  extractCardFromColumn,
  transferCardBetweenColumns,
};
