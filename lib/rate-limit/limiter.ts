import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Init Redis client
const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitConfig {
	interval: number; // Time window in milli
	maxRequests: number; // Max requests per window
	uniqueTokenPerInterval?: number; // Number of unique tokens to track
};

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
};

/**
 * Sliding window rate limiter using Upstash Redis
 * @param identifier - Unique identifier
 * @param config - Rate limit config
 */
export async function rateLimit(
	identifier: string,
	config: RateLimitConfig,
): Promise<RateLimitResult> {
	const { interval, maxRequests } = config;

	const now = Date.now();
	const window = Math.floor(now / interval);
	const key = `rate-limit:${identifier}:${window}`;

	// Use redis pipeline for atomic operations
	const count = await redis.incr(key);

	// Set expiry on first request
	if (count === 1) {
		await redis.expire(key, Math.ceil(interval / 1000));
	}

	const reset = (window + 1) * interval;

	return {
		success: count <= maxRequests,
		limit: maxRequests,
		remaining: Math.max(0, maxRequests - count),
		reset,
	};
}

/**
 * Apply rate limit and return 429 if exceeded
 */
export async function applyRateLimit(
	identifier: string,
	config: RateLimitConfig,
	logContext?: string
): Promise<RateLimitResult | NextResponse> {
	const result = await rateLimit(identifier, config);

	if (!result.success) {
		// Log rate limit violation
		console.warn(`[RateLimit] ${logContext || identifier} exceeded imit: ${config.maxRequests}/${config.interval}ms`);

		return NextResponse.json(
			{
				error: 'Too many requests. Please try again later.',
				retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
			},
			{
				status: 429,
				headers: {
					'X-RateLimit-Limit': result.limit.toString(),
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': result.reset.toString(),
					'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
				}
			}
		);
	}

	return result;
}

/**
 * Get identifier from request (user ID or IP fallback)
 */
export function getIdentifier(userId?: string, req?: Request): string {
	if (userId) return userId;
	// Fallback to IP for unauthenticated requests
	const forwarded = req?.headers.get('x-forwarded-for');
	const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
	return `ip:${ip}`;
}