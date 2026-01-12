// instant.perms.ts
import type { InstantRules } from '@instantdb/react';

const rules = {
	boards: {
		allow: {
			view: "data.is_public == true || auth.id in data.ref('owner.id')",
			create: "auth.id != null",
			update: "auth.id != null && auth.id in data.ref('owner.id')",
			delete: "auth.id != null && auth.id in data.ref('owner.id')",
		},
	},
	profiles: {
		allow: {
			view: "auth.id != null",
			create: "auth.id != null && data.id == auth.id",
			update: "auth.id != null && data.id == auth.id",
			delete: "auth.id != null && data.id == auth.id",
		},
	},
	board_collaborators: {
		allow: {
			view: "auth.id in data.ref('board.owner.id') || auth.id in data.ref('user.id')",
			create: "auth.id in data.ref('board.owner.id')",
			update: "auth.id in data.ref('board.owner.id')",
			delete: "auth.id in data.ref('board.owner.id')",
		},
	},
	cards: {
		allow: {
			view: "data.ref('board.is_public')[0] == true || auth.id in data.ref('board.owner.id') || auth.id in data.ref('board.collaborators.user.id')",
			create: "auth.id in data.ref('board.owner.id') || (auth.id in data.ref('board.collaborators.user.id') && 'editor' in data.ref('board.collaborators.role'))",
			update: "auth.id in data.ref('board.owner.id') || (auth.id in data.ref('board.collaborators.user.id') && 'editor' in data.ref('board.collaborators.role'))",
			delete: "auth.id in data.ref('board.owner.id') || (auth.id in data.ref('board.collaborators.user.id') && 'editor' in data.ref('board.collaborators.role'))",
		},
	},
	$users: {
		allow: {
			view: "auth.id == data.id",
			update: "auth.id == data.id",
		},
	},
	linked_accounts: {
		allow: {
			view: "auth.id in data.ref('user.id')",
			create: "false", // Only API routes can create
			update: "false", // Only API routes can update
			delete: "auth.id in data.ref('user.id')",
		},
		bind: [
			// Hide these fields from client-side queries
			"access_token",
			"refresh_token",
		]
	},
	templates: {
		allow: {
			// Anyone can view public templates
			view: "data.is_public == true || auth.id in data.ref('creator.id')",

			// Only admins can create templates
			create: "auth.id != null && auth.id in data.ref('creator.profile.id') && data.ref('creator.profile.is_admin')[0] == true",

			// Only admin creators can update their templates
			update: "auth.id in data.ref('creator.id') && auth.id in data.ref('creator.profile.id') && data.ref('creator.profile.is_admin')[0] == true",

			// Only admin creators can delete
			delete: "auth.id in data.ref('creator.id') && auth.id in data.ref('creator.profile.id') && data.ref('creator.profile.is_admin')[0] == true",
		},
	}
} satisfies InstantRules;

export default rules;