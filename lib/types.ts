import { BoardCard } from "@/app/ui/dashboard/board-card";

export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	initials: string;
}

export interface Board {
	id: string;
	title: string;
	color: string;
	updatedAt: Date;
	createdAt: Date;
	ownerId: string;
	shared: boolean;
	favorite: boolean;
	isPublic?: boolean;
	shareToken?: string | null;
}

// Board collaboration types
export type BoardRole = 'owner' | 'editor' | 'viewer';

export interface BoardCollaborator {
	id: string;
	boardId: string;
	userId: string;
	role: BoardRole;
	createdAt: Date;
	updatedAt: Date;
	// User details (joined from auth.users)
	user?: {
		id: string;
		email: string;
		display_name: string | null;
		avatar_url: string | null;
	};
}

export interface NoteCardProps {
	id?: string;
	title: string;
	content: string;
	timestamp: string;
	color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
	position?: { x: number; y: number };
}

export interface ImageCardProps {
	id?: string;
	src: string;
	alt: string;
	caption: string;
	timestamp: string;
	position?: { x: number; y: number };
}

export interface TaskListCardProps {
	id?: string;
	title: string;
	tasks: Task[];
	timestamp: string;
	position?: { x: number; y: number };
}

export interface Task {
	id: string;
	text: string;
	completed: boolean;
}

export interface TextCardProps {
	id?: string;
	title: string;
	content: string;
	timestamp: string;
	position?: { x: number; y: number };
}

export interface LinkCardProps {
	id?: string;
	title: string;
	url: string;
	timestamp: string;
	position?: { x: number; y: number };
}

export interface FileCardProps {
	id?: string;
	fileName: string;
	fileSize: string;
	fileType?: 'pdf' | 'doc' | 'xls' | 'ppt' | 'zip';
	timestamp: string;
	position?: { x: number; y: number };
}

export interface ColorPaletteCardProps {
	id?: string;
	title: string;
	colors: string[];
	description: string;
	timestamp: string;
	position?: { x: number; y: number };
}

export interface ColumnCardProps {
	id?: string;
	title: string;
	children: React.ReactNode;
	position?: { x: number; y: number };
}

export interface ShareModalProps {
	boardId: string;
	isOpen: boolean;
	onClose: () => void;
}

export interface AddElementModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export interface ContextMenuProps {
	isOpen: boolean;
	data: {
		card: Card | null;
		position: {
			x: number;
			y: number;
		};
	};
	onClose: () => void;
}

export interface CanvasProps {
	boardId: string;
	initialCards: Card[];
}

export interface LayoutProps {
	children: React.ReactNode;
	showSidebar?: boolean;
}

export type BaseCard = {
	id: string;
	board_id: string;
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	order_key: string;
	is_position_locked?: boolean;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

export type NoteCard = BaseCard & {
	card_type: "note";
	note_content: string;
	note_color: "default" | "yellow" | "blue" | "green" | "pink" | "purple";
};

export type ImageCard = BaseCard & {
	card_type: "image";
	image_url: string;
	image_caption: string | null;
	image_alt_text: string | null;
};

export type TextCard = BaseCard & {
	card_type: "text";
	text_title: string | null;
	text_content: string;
};

export type TaskListCard = BaseCard & {
	card_type: "task_list";
	task_list_title: string;
	tasks: Array<{
		id?: string;
		text: string;
		completed: boolean;
		position: number;
	}>;
};

export type LinkCard = BaseCard & {
	card_type: "link";
	link_title: string;
	link_url: string;
	link_favicon_url: string | null;
};

export type FileCard = BaseCard & {
	card_type: "file";
	file_name: string;
	file_url: string;
	file_size: number | null;
	file_type: string | null;
	file_mime_type: string | null;
};

export type ColorPaletteCard = BaseCard & {
	card_type: "color_palette";
	palette_title: string;
	palette_description: string | null;
	palette_colors: string[];
};

export type ColumnCard = BaseCard & {
	card_type: "column";
	column_title: string;
	column_background_color: string;
	column_is_collapsed: boolean;
	column_items: Array<{
		card_id: string;
		position: number;
	}>;
};

// Reroute node for line breaks (like UE5 Blueprint reroute nodes)
export interface RerouteNode {
	id: string;
	x: number; // relative to card position
	y: number;
	// Control point offset for the segment BEFORE this node (from previous point to this node)
	control_offset?: number;
}

export type LineCard = BaseCard & {
	card_type: "line";
	// Start and end points (relative to card position)
	line_start_x: number;
	line_start_y: number;
	line_end_x: number;
	line_end_y: number;
	// Styling
	line_color: string;
	line_stroke_width: number;
	line_style: "solid" | "dashed" | "dotted";
	// End caps
	line_start_cap: "none" | "arrow" | "dot" | "diamond";
	line_end_cap: "none" | "arrow" | "dot" | "diamond";
	// New 2-DOF control model (replaces legacy control_point_offset)
	// Curvature: controls bend magnitude in pixels (unrestricted), 0 = straight
	line_curvature: number;
	// Directional bias: controls curve asymmetry (unrestricted), 0 = symmetric
	line_directional_bias: number;
	// Legacy: Control point offset (perpendicular distance from midpoint, can be negative)
	// Kept for backward compatibility, will be converted to curvature/bias
	line_control_point_offset?: number;
	// Reroute nodes - intermediate points for line routing
	line_reroute_nodes: RerouteNode[] | null;
	// Optional card attachments - center-based dynamic attachment
	// When attached to a card, the endpoint is computed as the intersection
	// of a ray from the card's center toward the other endpoint with the card's edge
	line_start_attached_card_id: string | null;
	line_end_attached_card_id: string | null;
};

export type Card =
	| NoteCard
	| ImageCard
	| TextCard
	| TaskListCard
	| LinkCard
	| FileCard
	| ColorPaletteCard
	| ColumnCard
	| BoardCard
	| LineCard;

// Type-specific data for creating cards
export type NoteCardData = {
	title?: string;
	content: string;
	color?: "yellow" | "blue" | "green" | "pink" | "purple";
};

export type ImageCardData = {
	image_url: string;
	caption?: string;
	alt_text?: string;
};

export type TextCardData = {
	title?: string;
	content: string;
};

export type TaskListCardData = {
	title: string;
};

export type LinkCardData = {
	title: string;
	url: string;
	favicon_url?: string;
};

export type FileCardData = {
	file_name: string;
	file_url: string;
	file_size?: number;
	file_type?: string;
	mime_type?: string;
};

export type ColorPaletteCardData = {
	title: string;
	description?: string;
	colors: string[];
};

export type ColumnCardData = {
	title: string;
	background_color?: string;
	is_collapsed?: boolean;
	column_items?: Array<{
		card_id: string;
		position: number;
	}>;
};

export type LineCardData = {
	start_x?: number;
	start_y?: number;
	end_x?: number;
	end_y?: number;
	color?: string;
	stroke_width?: number;
	line_style?: "solid" | "dashed" | "dotted";
	start_cap?: "none" | "arrow" | "dot" | "diamond";
	end_cap?: "none" | "arrow" | "dot" | "diamond";
	curvature?: number;
	start_attached_card_id?: string | null;
	start_attached_side?: "top" | "right" | "bottom" | "left" | null;
	end_attached_card_id?: string | null;
	end_attached_side?: "top" | "right" | "bottom" | "left" | null;
};

// Union type for all card-specific data
export type CardTypeData<T extends Card["card_type"]> = T extends "note"
	? NoteCardData
	: T extends "image"
	? ImageCardData
	: T extends "text"
	? TextCardData
	: T extends "task_list"
	? TaskListCardData
	: T extends "link"
	? LinkCardData
	: T extends "file"
	? FileCardData
	: T extends "color_palette"
	? ColorPaletteCardData
	: T extends "column"
	? ColumnCardData
	: T extends "board"
	? BoardCardData
	: T extends "line"
	? LineCardData
	: never;

export type BoardCard = BaseCard & {
	card_type: "board";
	linked_board_id: string;
	board_title: string;
	board_color: string;
	board_card_count: string;
};

export type BoardCardData = {
	linked_board_id: string;
	board_title: string;
	board_color: string;
	card_count?: number;
};

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * For components that only need ordering information
 */
export interface CardWithOrder {
	id: string;
	order_key: string;
	z_index: number;
};

/**
 * For the order key manager functions
 */
export interface CardOrderKey {
	id: string;
	order_key: string;
};

// ============================================================================
// CONNECTION / LINE TYPES
// ============================================================================

export type ConnectionSide = 'top' | 'right' | 'bottom' | 'left';

export type ConnectionEndStyle = 'none' | 'arrow' | 'dot' | 'diamond';

export type ConnectionLineStyle = 'solid' | 'dashed' | 'dotted';

export interface ConnectionAnchor {
	cardId: string;
	side: ConnectionSide;
	offset: number; // 0-1, position along the edge (0.5 = center)
}

export interface Connection {
	id: string;
	board_id: string;

	// Source and target anchors
	fromAnchor: ConnectionAnchor;
	toAnchor: ConnectionAnchor;

	// Styling
	color: string;
	lineStyle: ConnectionLineStyle;
	strokeWidth: number;

	// End caps
	startEndStyle: ConnectionEndStyle;
	endEndStyle: ConnectionEndStyle;

	// Curvature: 0 = straight line, 1 = full bezier curve
	curvature: number;

	// Metadata
	created_at: string;
	updated_at: string;
}

export type ConnectionData = Omit<Connection, 'id' | 'created_at' | 'updated_at'>;

// ============================================================================
// USER SETTINGS TYPES
// ============================================================================

export interface UserProfile {
	id: string;
	email: string;
	display_name: string | null;
	avatar_url: string | null;
}

export interface UserPreferences {
	// General Preferences
	defaultBoardColor: string;
	autoSaveEnabled: boolean;
	gridSnapEnabled: boolean;

	// Notification Preferences
	emailNotifications: boolean;
	boardActivityNotifications: boolean;
	shareNotifications: boolean;
	weeklyDigest: boolean;

	// Collaboration Preferences
	allowCommenting: boolean;
	showPresenceIndicators: boolean;
}

export interface UserSettings {
	profile: UserProfile;
	preferences: UserPreferences;
}

export type CardData = {
	id: string;
	board_id: string;
	card_type: 'note' | 'image' | 'text' | 'task_list' | 'link' | 'file' | 'color_palette' | 'column' | 'board' | 'line';
	position_x: number;
	position_y: number;
	width: number;
	height?: number;
	order_key: string;
	is_position_locked?: boolean;
	created_by?: string;

	// All type-specific fields as optional
	note_content?: string;
	note_color?: string;
	image_url?: string;
	image_caption?: string;
	text_title?: string;
	text_content?: string;
	task_list_title?: string;
	tasks?: Array<{ text: string; completed: boolean; position: number }>;
	link_title?: string;
	link_url?: string;
	file_name?: string;
	file_url?: string;
	palette_title?: string;
	palette_colors?: string[];
	column_title?: string;
	column_background_color?: string;
	column_is_collapsed?: boolean;
	column_items?: Array<{ card_id: string; position: number }>;
	linked_board_id?: string;
	board_title?: string;
	line_start_x?: number;
	line_start_y?: number;
	line_end_x?: number;
	line_end_y?: number;
	line_color?: string;
	line_stroke_width?: number;
	line_style?: string;
	line_start_cap?: string;
	line_end_cap?: string;
	line_curvature?: number;
	line_control_point_offset?: number;
	line_reroute_nodes?: JSON;
	line_start_attached_card_id?: string;
	line_start_attached_side?: string;
	line_end_attached_card_id?: string;
	line_end_attached_side?: string;

	created_at: number;
	updated_at: number;
};

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

// OAuth Providers
export type OAuthProvider = 'google_drive' | 'pinterest';

export interface LinkedAccount {
	id: string;
	provider: OAuthProvider;
	provider_user_id: string;
	provider_email: string;
	provider_name?: string;
	scopes: string[];
	connected_at: number;
	last_synced_at?: number;
	is_active: boolean;
	// Note: tokens not exposed to frontend
};