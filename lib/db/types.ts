/**
 * Type definitions for the thin wrapper layer
 */

export type EntityType = 'cards' | 'boards' | 'profiles' | 'board_collaborators' | '$users';

/**
 * Base entity data (all entities have timestamps)
 */
export interface BaseEntityData {
  created_at?: number;
  updated_at?: number;
}

/**
 * Card entity data (constrained to actual card fields)
 */
export interface CardEntityData extends BaseEntityData {
  board_id?: string;
  card_type?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  order_key?: string;
  is_position_locked?: boolean;
  [key: string]: unknown; // Allow card-type-specific fields
}

/**
 * Board entity data
 */
export interface BoardEntityData extends BaseEntityData {
  title?: string;
  color?: string;
  parent_board_id?: string;
  is_public?: boolean;
  share_token?: string;
}

/**
 * Union type for all entity data
 */
export type EntityData = CardEntityData | BoardEntityData | BaseEntityData;

export interface BatchCreateItem {
  id: string;
  data: EntityData;
}

export interface BatchUpdateItem {
  id: string;
  data: Partial<EntityData>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
}

/**
 * Transaction object type (from InstantDB)
 * Note: The actual type is opaque, so we use unknown
 */
export type TransactionObject = unknown;
