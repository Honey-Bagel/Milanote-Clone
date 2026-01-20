import { withInstantAuth, InstantDBUser } from "../auth/with-instant-auth";
import { NextResponse } from "next/server";
import { applyRateLimit, getIdentifier, RateLimitConfig } from "./limiter";

/**
 * Wrapper that combines authentication and rate limiting
 * @param handler - Route handler function
 * @param config - Rate limit config
 * @param endpointName - Name for logging
 */
export function withRateLimitedAuth<T = any>(
	handler: (user: InstantDBUser, req: Request) => Promise<Response | NextResponse | T>,
	config: RateLimitConfig,
	endpointName?: string
): (req: Request) => Promise<Response | NextResponse> {
	return withInstantAuth(async (user, req) => {
		// Apply rate limit
		const identifier = getIdentifier(user.id, req);
		const rateLimitResult = await applyRateLimit(
			identifier,
			config,
			`${endpointName || 'unknown'} - ${user.email}`
		);

		// If rate limit exceeded, return 429
		if (rateLimitResult instanceof NextResponse) {
			return rateLimitResult;
		}

		// Execute handler
		const response = await handler(user, req);

		// Add rate limit headers to response
		if (response instanceof NextResponse) {
			response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
			response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
			response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
			return response;
		}

		// Wrap no-Response results
		const jsonResponse = NextResponse.json(response);
		jsonResponse.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
		jsonResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
		jsonResponse.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
		return jsonResponse;
	});
}