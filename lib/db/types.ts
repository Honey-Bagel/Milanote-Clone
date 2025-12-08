/**
 * Type definitions for the thin wrapper layer
 */

export type EntityType = 'cards' | 'boards' | 'profiles' | 'board_collaborators' | '$users';

export interface BatchCreateItem {
  id: string;
  data: Record<string, any>;
}

export interface BatchUpdateItem {
  id: string;
  data: Record<string, any>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
}
