import type { WebhookEvent } from "@clerk/nextjs/server";

// Clerk webhook event types we handle
export type ClerkWebhookEventType =
	| 'user.created'
	| 'user.updated'
	| 'user.deleted'
	| 'session.created'
	| 'session.ended';

// Profile update payload
export interface ProfileUpdate {
	display_name?: string;
	avatar_url?: string | null;
	clerk_user_id?: string;
	last_active?: number;
	deleted_at?: number | null;
	subscription_tier?: string;
	subscription_status?: string | null;
	stripe_subscription_id?: string | null;
};

// User preferences defaults
export interface UserPreferencesDefaults {
	defaultBoardColor: string;
	autoSaveEnabled: boolean;
	gridSnapEnabled: boolean;
	emailNotifications: boolean;
	boardActivityNotifications: boolean;
	shareNotifications: boolean;
	weeklyDigest: boolean;
	allowCommenting: boolean;
	showPresenceIndicators: boolean;
	created_at: number;
	updated_at: number;
};

// Webhook context for logging/debugging
export interface ClerkWebhookContext {
	eventId: string;
	eventType: string;
	timestamp: number;
};

// Re-export Clerk types for convenience
export type { WebhookEvent };