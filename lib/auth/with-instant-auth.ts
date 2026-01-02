import { auth, currentUser } from '@clerk/nextjs/server';
import { init } from '@instantdb/admin';
import { NextResponse } from 'next/server';

// Initialize admin DB
const adminDB = init({
	appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
	adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

// Type for InstantDB user
export interface InstantDBUser {
	id: string;
	email: string;
	[key: string]: any;
};

// Auth errors
class AuthError extends Error {
	constructor(
		message: string,
		public code: 'UNAUTHORIZED' | 'NO_EMAIL' | 'USER_NOT_FOUND' | 'INTERNAL_ERROR'
	) {
		super(message);
		this.name = 'AuthError';
	}
};

/**
 * Get the authenticated InstantDB user from Clerk session
 * Throws AuthError if not authenticated or user not found
 */
async function getInstantDBUser(): Promise<InstantDBUser> {
	// 1. Check Clerk auth
	const { userId } = await auth();
	if (!userId) {
		throw new AuthError('Not authenticated', 'UNAUTHORIZED');
	}

	// 2. Get Clerk user email
	const clerkUser = await currentUser();
	const email = clerkUser?.emailAddresses[0]?.emailAddress;

	if (!email) {
		throw new AuthError('No email found', 'NO_EMAIL');
	}

	// 3. Look up InstantDB user by email
	const data = await adminDB.query({
		$users: { $: { where: { email } } },
	});

	const instantUser = data?.$users?.[0];
	if (!instantUser) {
		throw new AuthError('User not found in database', 'USER_NOT_FOUND');
	}

	return instantUser as InstantDBUser;
}

/**
 * Convert AuthError to appropriate HTTP response
 */
function handleAuthError(error: unknown): NextResponse {
	if (error instanceof AuthError) {
		switch (error.code) {
			case 'UNAUTHORIZED':
				return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
			case 'NO_EMAIL':
			case 'USER_NOT_FOUND':
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			default:
				return NextResponse.json({ error: 'Internal server error'}, { status: 500 });
		}
	}

	console.error('Unexpected auth error:', error);
	return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/**
 * Middleware wrapper for API routes that require InstantDB authentication
 * 
 * @example
 * export const GET = withInstantAuth(async (user, req) => {
 * 	const token = await getValidToken(user.id, 'google_drive');
 * 	// ... rest of route logic
 * });
 */
export function withInstantAuth<T = any>(
	handler: (user: InstantDBUser, req: Request) => Promise<Response | NextResponse | T>
): (req: Request) => Promise<Response | NextResponse> {
	return async (req: Request) => {
		try {
			const user = await getInstantDBUser();
			const result = await handler(user, req);

			// If handler returns a Response/NextResponse, return it directly
			if (result instanceof Response || result instanceof NextResponse) {
				return result;
			}

			// Otherwise, wrap in JSON response
			return NextResponse.json(result);
		} catch (error) {
			return handleAuthError(error);
		}
	};
}