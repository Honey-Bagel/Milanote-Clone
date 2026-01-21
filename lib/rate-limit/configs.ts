import { RateLimitConfig } from "./limiter";

/**
 * Centralized rate limit configurations for all endpoints
 */
export const RATE_LIMITS = {
	// File Upload Operations (Tier 1 - High Risk)
	UPLOAD_PRESIGNED_URL: {
		interval: 60 * 1000,
		maxRequests: 10,
	} as RateLimitConfig,

	UPLOAD_COMPLETE: {
		interval: 60 * 1000,
		maxRequests: 5,
	} as RateLimitConfig,

	UPLOAD_DELETE: {
		interval: 60 * 1000,
		maxRequests: 20,
	} as RateLimitConfig,

	// Google Drive Import
	GOOGLE_DRIVE_FETCH: {
		interval: 60 * 1000,
		maxRequests: 5,
	} as RateLimitConfig,

	GOOGLE_DRIVE_LIST: {
		interval: 60 * 1000,
		maxRequests: 10,
	} as RateLimitConfig,

	// Billing Operations
	BILLING_CREATE_CHECKOUT: {
		interval: 60 * 1000,
		maxRequests: 3,
	} as RateLimitConfig,

	BILLING_PORTAL: {
		interval: 60 * 1000,
		maxRequests: 10,
	} as RateLimitConfig,

	// Resource creation
	BOARD_CREATE: {
		interval: 60 * 1000,
		maxRequests: 5,
	} as RateLimitConfig,

	// OAuth
	OAUTH_AUTHORIZE: {
		interval: 60 * 1000,
		maxRequests: 10,
	} as RateLimitConfig,

	OAUTH_CALLBACK: {
		interval: 60 * 1000,
		maxRequests: 10,
	} as RateLimitConfig,

	OAUTH_DISCONNECT: {
		interval: 60 * 1000,
		maxRequests: 5,
	} as RateLimitConfig,

	// Session management
	SESSION_REVOKE: {
		interval: 60 * 1000,
		maxRequests: 10,
	} as RateLimitConfig,

	// Read operations
	BILLING_SUBSCRIPTION: {
		interval: 60 * 1000,
		maxRequests: 30,
	} as RateLimitConfig,

	BILLING_USAGE: {
		interval: 60 * 1000,
		maxRequests: 30,
	} as RateLimitConfig,

	// Payment method operations
	BILLING_PAYMENT_METHOD: {
		interval: 60 * 1000,
		maxRequests: 20,
	} as RateLimitConfig,

	BILLING_INVOICES: {
		interval: 60 * 1000,
		maxRequests: 20,
	} as RateLimitConfig,

	BILLING_SETUP_INTENT: {
		interval: 60 * 1000,
		maxRequests: 5,
	} as RateLimitConfig,

	BILLING_UPDATE_PAYMENT_METHOD: {
		interval: 60 * 1000,
		maxRequests: 10,
	} as RateLimitConfig,

	COLLABORATORS_INVITE: {
		interval: 60 * 1000,
		maxRequests: 30,
	} as RateLimitConfig,

} as const;