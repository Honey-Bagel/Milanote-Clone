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
	isOpen: boolean;
	onClose: () => void;
}

export interface AddElementModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export interface ContextMenuProps {
	isOpen: boolean;
	position: { x: number; y: number };
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

export type NoteCard = {
	id: string;
	board_id: string;
	card_type: "note";
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	z_index: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	note_cards: {
		content: string;
		color: "yellow" | "blue" | "green" | "pink" | "purple";
	};
};

export type ImageCard = {
	id: string;
	board_id: string;
	card_type: "image";
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	z_index: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	image_cards: {
		image_url: string;
		caption: string | null;
		alt_text: string | null;
	};
};

export type TextCard = {
	id: string;
	board_id: string;
	card_type: "text";
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	z_index: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	text_cards: {
		title: string | null;
		content: string;
	};
};

export type TaskListCard = {
	id: string;
	board_id: string;
	card_type: "task_list";
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	z_index: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	task_list_cards: {
		title: string;
		tasks: Array<{
			id: string;
			text: string;
			completed: boolean;
			position: number;
		}>;
	};
};

export type LinkCard = {
	id: string;
	board_id: string;
	card_type: "link";
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	z_index: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	link_cards: {
		title: string;
		url: string;
		favicon_url: string | null;
	};
};

export type FileCard = {
	id: string;
	board_id: string;
	card_type: "file";
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	z_index: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	file_cards: {
		file_name: string;
		file_url: string;
		file_size: number | null;
		file_type: string | null;
		mime_type: string | null;
	};
};

export type ColorPaletteCard = {
	id: string;
	board_id: string;
	card_type: "color_palette";
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	z_index: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	color_palette_cards: {
		title: string;
		description: string | null;
		colors: string[];
	};
};

export type ColumnCard = {
	id: string;
	board_id: string;
	card_type: "column";
	position_x: number;
	position_y: number;
	width: number;
	height: number | null;
	z_index: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	column_cards: {
		title: string;
		background_color: string;
		column_items: Array<{
			card_id: string;
			position: number;
		}>;
	};
};

export type Card =
	| NoteCard
	| ImageCard
	| TextCard
	| TaskListCard
	| LinkCard
	| FileCard
	| ColorPaletteCard
	| ColumnCard;

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
	: never;