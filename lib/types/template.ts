/**
 * Template System Types
 *
 * Defines the structure for board templates that can be instantiated
 * into new boards with all cards and nested boards.
 */

export interface TemplateData {
	version: string; // e.g., '1.0.0' for future compatibility

	// Root board configuration
	board: {
		title: string;
		color: string;
	};

	// All cards in root board
	cards: TemplateCard[];

	// Nested board hierarchy
	nested_boards: NestedBoardTemplate[];
}

export interface TemplateCard {
	// Temporary ID used within template for relationships
	template_id: string; // e.g., 'card_1', 'card_2'

	card_type:
		| 'note'
		| 'image'
		| 'task_list'
		| 'link'
		| 'file'
		| 'color_palette'
		| 'column'
		| 'board';

	// Position & layout
	position_x: number;
	position_y: number;
	width: number;
	height?: number;
	order_index: number; // Numeric index for recreating order_keys

	// Note card fields
	note_content?: string;
	note_color?: string;

	// Image card fields
	image_url?: string;
	image_caption?: string;
	image_alt_text?: string;

	// Task list card fields
	task_list_title?: string;
	tasks?: Array<{ text: string; completed: boolean; position: number }>;

	// Link card fields
	link_title?: string;
	link_url?: string;
	link_favicon_url?: string;

	// File card fields
	file_name?: string;
	file_url?: string;
	file_size?: number;
	file_mime_type?: string;

	// Color palette card fields
	palette_title?: string;
	palette_description?: string;
	palette_colors?: string[];

	// Column card fields
	column_title?: string;
	column_background_color?: string;
	column_items?: Array<{
		card_template_id: string; // Reference to other card's template_id
		position: number;
	}>;

	// Board card fields (references nested board by template_id)
	linked_board_template_id?: string;
	board_title?: string;
	board_color?: string;
}

export interface NestedBoardTemplate {
	template_id: string; // e.g., 'board_1', 'board_2'
	title: string;
	color: string;

	// Cards in this nested board
	cards: TemplateCard[];

	// Further nested boards (recursive)
	nested_boards?: NestedBoardTemplate[];
}

// Template metadata (stored in database)
export interface TemplateMetadata {
	id: string;
	name: string;
	description?: string;
	category: string;
	preview_url?: string;
	is_public: boolean;
	is_featured?: boolean;
	usage_count?: number;
	created_at: number;
	updated_at: number;
}

// Template categories
export const TEMPLATE_CATEGORIES = [
	'project',
	'personal',
	'creative',
	'business',
	'education',
	'health',
	'travel',
	'other',
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

// Parameters for creating a template
export interface CreateTemplateParams {
	sourceBoardId: string;
	name: string;
	description?: string;
	category: TemplateCategory;
	preview_url?: string;
	is_featured?: boolean;
	creatorId: string;
}

// Instantiation context for ID mapping
export interface InstantiationContext {
	templateIdToRealId: Map<string, string>; // Maps template IDs to generated IDs
	ownerId: string;
	rootBoardId: string;
}
