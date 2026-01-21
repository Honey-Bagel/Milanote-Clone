/**
 * Helper types and utility types for improved type safety across the codebase
 */

import type { CardData, Card, BaseCard } from '@/lib/types';

// ============================================================================
// COLUMN TYPES
// ============================================================================

/**
 * Column item reference (used in column_items arrays)
 */
export interface ColumnItem {
	card_id: string;
	position: number;
}

/**
 * Column card with properly typed column_items
 */
export interface ColumnCardWithItems extends BaseCard {
	card_type: 'column';
	column_title: string;
	column_background_color: string;
	column_is_collapsed: boolean;
	column_items: ColumnItem[];
}

// ============================================================================
// COLLABORATOR TYPES
// ============================================================================

/**
 * User information from auth system
 */
export interface UserInfo {
	id: string;
	email: string;
	display_name: string | null;
	avatar_url: string | null;
}

/**
 * User preferences for notifications and settings
 */
export interface UserPreferencesInfo {
	emailNotifications?: boolean;
	boardActivityNotifications?: boolean;
	shareNotifications?: boolean;
	weeklyDigest?: boolean;
	allowCommenting?: boolean;
	showPresenceIndicators?: boolean;
}

/**
 * User profile information
 */
export interface UserProfileInfo {
	display_name: string | null;
	avatar_url: string | null;
}

/**
 * Collaborator with full user details
 */
export interface CollaboratorWithUser {
	id: string;
	role: 'owner' | 'editor' | 'viewer';
	user: UserInfo & {
		preferences?: UserPreferencesInfo;
		profile?: UserProfileInfo;
	};
}

/**
 * Simplified recipient info for notifications
 */
export interface NotificationRecipient {
	userId: string;
	preferences?: UserPreferencesInfo;
	profile?: UserProfileInfo;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Activity log entry from database
 */
export interface ActivityLogEntry {
	id: string;
	actor_id: string;
	board_id: string;
	action_type: 'card.created' | 'card.updated' | 'card.deleted' | 'collaborator.added' | 'collaborator.removed';
	card_type?: string;
	metadata?: {
		role?: string;
		[key: string]: unknown;
	};
	created_at: number;
	board?: {
		title?: string;
		color?: string;
		collaborators?: CollaboratorWithUser[];
	};
	actor?: {
		profile?: UserProfileInfo;
	};
}

/**
 * Activity summary for grouped notifications
 */
export interface ActivitySummary {
	total_actions: number;
	cards_created?: Record<string, number>;
	cards_updated?: Record<string, number>;
	added_by?: string;
	role?: string;
}

/**
 * Notification entry from database
 */
export interface NotificationEntry {
	id: string;
	recipient_id: string;
	notification_type: string;
	board_id: string;
	board_title?: string;
	board_color?: string;
	actor_ids: string[];
	activity_summary: ActivitySummary;
	is_read: boolean;
	read_at?: number;
	created_at: number;
	updated_at: number;
	group_window_start: number;
	group_window_end: number;
}

// ============================================================================
// CARD DATA HELPER TYPES
// ============================================================================

/**
 * Card data without metadata fields (for duplication/copying)
 */
export type CardDataWithoutMeta = Omit<CardData, 'id' | 'created_at' | 'updated_at'>;

/**
 * Card data for partial updates
 */
export type CardUpdateData = Partial<Pick<CardData,
	'position_x' | 'position_y' | 'width' | 'height' | 'order_key' | 'is_position_locked'
>>;

/**
 * Transform properties for card updates
 */
export interface CardTransform {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	rotation?: number;
}

// ============================================================================
// DND-KIT / COLLISION DETECTION TYPES
// ============================================================================

/**
 * Collision detection arguments from dnd-kit
 */
export interface CollisionDetectionArgs {
	active: {
		id: string;
		data: {
			current?: {
				sortable?: {
					containerId?: string;
					index?: number;
				};
			};
		};
		rect: {
			current: {
				initial: { top: number; left: number; width: number; height: number } | null;
				translated: { top: number; left: number; width: number; height: number } | null;
			};
		};
	};
	droppableContainers: Array<{
		id: string;
		rect: {
			current: { top: number; left: number; width: number; height: number } | null;
		};
		data: {
			current?: unknown;
		};
	}>;
	droppableRects: Map<string, { top: number; left: number; width: number; height: number }>;
	pointerCoordinates: { x: number; y: number } | null;
}

/**
 * Collision result from dnd-kit
 */
export interface Collision {
	id: string;
	data?: {
		droppableContainer?: {
			id: string;
		};
		value?: unknown;
	};
}

/**
 * Modifier arguments from dnd-kit
 */
export interface ModifierArgs {
	active: {
		id: string;
	};
	activeNodeRect: { top: number; left: number; width: number; height: number } | null;
	draggingNodeRect: { top: number; left: number; width: number; height: number } | null;
	over: {
		id: string;
	} | null;
	overlayNodeRect: { top: number; left: number; width: number; height: number } | null;
	scrollableAncestorRects: Array<{ top: number; left: number; width: number; height: number }>;
	transform: {
		x: number;
		y: number;
		scaleX: number;
		scaleY: number;
	};
	windowRect: { top: number; left: number; width: number; height: number } | null;
}

/**
 * Modifier function return type
 */
export interface ModifierTransform {
	x: number;
	y: number;
	scaleX: number;
	scaleY: number;
}

// ============================================================================
// QUERY RESULT TYPES (from InstantDB)
// ============================================================================

/**
 * Generic query result wrapper
 */
export interface QueryResult<T> {
	data: T | null;
	error?: Error;
	isLoading?: boolean;
}

/**
 * Activity log query result
 */
export interface ActivityLogQueryData {
	activity_log?: ActivityLogEntry[];
}

/**
 * Notification query result
 */
export interface NotificationQueryData {
	notifications?: NotificationEntry[];
}
