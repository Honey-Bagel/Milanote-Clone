import { i } from "@instantdb/react";

// Define the schema for the Milanote application
const graph = i.schema({
	entities: {

		$users: i.entity({
			email: i.any().unique().indexed(),
		}),

		// User profiles table
		profiles: i.entity({
			display_name: i.string().optional(),
			avatar_url: i.string().optional(),
			favorite_boards: i.json<string[]>().optional(), // Array of board IDs
			created_at: i.number(),
			last_active: i.number().optional(),
		}),

		// User preferences table
		user_preferences: i.entity({
			// General Preferences
			defaultBoardColor: i.string(),
			autoSaveEnabled: i.boolean(),
			gridSnapEnabled: i.boolean(),

			// Notification Preferences
			emailNotifications: i.boolean(),
			boardActivityNotifications: i.boolean(),
			shareNotifications: i.boolean(),
			weeklyDigest: i.boolean(),

			// Collaboration Preferences
			allowCommenting: i.boolean(),
			showPresenceIndicators: i.boolean(),

			// Metadata
			created_at: i.number(),
			updated_at: i.number(),
		}),

		// Boards table
		boards: i.entity({
			title: i.string().indexed(),
			color: i.string(),
			parent_board_id: i.string().optional().indexed(),
			is_public: i.boolean(),
			share_token: i.string().optional().indexed(),
			created_at: i.number().indexed(),
			updated_at: i.number().indexed(),
		}),

		// Board collaborators junction table
		board_collaborators: i.entity({
			role: i.string().indexed(), // 'owner' | 'editor' | 'viewer'
			created_at: i.number(),
			updated_at: i.number(),
		}),

		cards: i.entity({
			board_id: i.string().indexed(),
			card_type: i.string().indexed(),

			// Position & Layout (all cards)
			position_x: i.number().optional(),
			position_y: i.number().optional(),
			width: i.number(),
			height: i.number().optional(),
			order_key: i.string().indexed(),
			is_position_locked: i.boolean().optional(),

			// Note card fields
			note_content: i.string().optional(),
			note_color: i.string().optional(),

			// Image Card fields
			image_url: i.string().optional(),
			image_caption: i.string().optional(),
			image_alt_text: i.string().optional(),

			// Task list card fields
			task_list_title: i.string().optional(),
			tasks: i.json<Array<{ text: string; completed: boolean; position: number; }>>().optional(),

			// Link card fields
			link_title: i.string().optional(),
			link_url: i.string().optional(),
			link_favicon_url: i.string().optional(),

			// File card fields
			file_name: i.string().optional(),
			file_url: i.string().optional(),
			file_size: i.number().optional(),
			file_mime_type: i.string().optional(),

			// Color palette card fields
			palette_title: i.string().optional(),
			palette_description: i.string().optional(),
			palette_colors: i.json<string[]>().optional(),

			// Column card fields
			column_title: i.string().optional(),
			column_background_color: i.string().optional(),
			column_is_collapsed: i.boolean().optional(),
			column_items: i.json<Array<{ card_id: string; position: number }>>().optional(),

			// Board reference card fields
			linked_board_id: i.string().optional().indexed(),
			board_title: i.string().optional(),
			board_color: i.string().optional(),
			board_card_count: i.string().optional(),

			// Line card fields
			line_start_x: i.number().optional(),
			line_start_y: i.number().optional(),
			line_end_x: i.number().optional(),
			line_end_y: i.number().optional(),
			line_color: i.string().optional(),
			line_stroke_width: i.number().optional(),
			line_style: i.string().optional(),
			line_start_cap: i.string().optional(),
			line_end_cap: i.string().optional(),
			line_curvature: i.number().optional(),
			line_control_point_offset: i.number().optional(),
			line_reroute_nodes: i.json<any>().optional(),
			line_start_attached_card_id: i.string().optional(),
			line_start_attached_side: i.string().optional(),
			line_end_attached_card_id: i.string().optional(),
			line_end_attached_side: i.string().optional(),

			created_by: i.string().optional(),
			created_at: i.number().indexed(),
			updated_at: i.number().indexed(),
		}),
	},
	links: {
		// Links $users to profiles (1-1)
		userProfile: {
			forward: {
				on: "$users",
				has: "one",
				label: "profile",
			},
			reverse: {
				on: "profiles",
				has: "one",
				label: "user",
			}
		},

		// Links $users to preferences (1-1)
		userPreferences: {
			forward: {
				on: "$users",
				has: "one",
				label: "preferences",
			},
			reverse: {
				on: "user_preferences",
				has: "one",
				label: "user",
			}
		},

		// Link $users to boards they own
		userBoards: {
			forward: {
				on: "$users",
				has: "many",
				label: "owned_boards",
			},
			reverse: {
				on: "boards",
				has: "one",
				label: "owner",
				onDelete: "cascade",
			},
		},

		// Board relationships
		boardParent: {
			forward: {
				on: "boards",
				has: "one",
				label: "parent",
				onDelete: "cascade",
			},
			reverse: {
				on: "boards",
				has: "many",
				label: "children",
			},
		},

		boardCollaborators: {
			forward: {
				on: "boards",
				has: "many",
				label: "collaborators",
			},
			reverse: {
				on: "board_collaborators",
				has: "one",
				label: "board",
				onDelete: "cascade",
			},
		},

		boardCards: {
			forward: {
				on: "boards",
				has: "many",
				label: "cards",
			},
			reverse: {
				on: "cards",
				has: "one",
				label: "board",
				onDelete: "cascade",
			},
		},

		// Collaborator user relationship
		collaboratorUser: {
			forward: {
				on: "board_collaborators",
				has: "one",
				label: "user",
				onDelete: "cascade",
			},
			reverse: {
				on: "$users",
				has: "many",
				label: "collaborations",
			},
		},
	},
	rooms: {
		board: {
			presence: i.entity({
				name: i.string(),
				image: i.string(),
			}),
		},
	},
});

export default graph;
