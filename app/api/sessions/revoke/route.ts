import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	try {
		// Authenticate the request
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			);
		}

		// Parse request body
		const body = await req.json();
		const { sessionId } = body;

		if (!sessionId) {
			return NextResponse.json(
				{ error: 'Session ID is required' },
				{ status: 400 }
			);
		}

		// Revoke the session using Clerk's API
		const client = await clerkClient();
		await client.sessions.revokeSession(sessionId);

		return NextResponse.json({
			success: true,
			message: 'Session revoked successfully',
		});
	} catch (error: any) {
		console.error('Error revoking session:', error);

		return NextResponse.json(
			{ error: error.message || 'Failed to revoke session' },
			{ status: 500 }
		);
	}
}
