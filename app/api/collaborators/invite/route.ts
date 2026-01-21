import { adminDB } from "@/lib/instant/adminDb";
import { NextResponse } from "next/server";
import { withRateLimitedAuth } from "@/lib/rate-limit/with-rate-limit";
import { id } from "@instantdb/admin";
import { RATE_LIMITS } from "@/lib/rate-limit/configs";

export const POST = withRateLimitedAuth(
	async (user, req) => {
		try {
			const { email, boardId, role } = await req.json();

			const userData = await adminDB.query({
				$users: {
					$: {
						where: {
							email: email,
						},
					},
				},
			});

			const user = userData.$users[0];


			if (!user) {
				return NextResponse.json(
					{ error: 'User not foudn' },
					{ status: 404 }
				);
			}

			const collaboratorId = id();

			await adminDB.transact([
				adminDB.tx.board_collaborators[collaboratorId].update({
					role: role,
					created_at: Date.now(),
					updated_at: Date.now(),
				}),
				adminDB.tx.board_collaborators[collaboratorId].link({
					board: boardId,
				}),
				adminDB.tx.board_collaborators[collaboratorId].link({
					user: user.id
				})
			]);

			return NextResponse.json({ success: true });
		} catch (error) {
			console.error('[Collaborators Invite] Error:', error);
			return NextResponse.json(
				{ error: 'Failed to add collaborator' },
				{ status: 500 },
			);
		}
	},
	RATE_LIMITS.COLLABORATORS_INVITE,
	'collaborators-invite'
);