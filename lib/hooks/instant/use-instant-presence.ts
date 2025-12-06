'use client'

import { db } from '@/lib/instant/db'
import { useUser } from '@clerk/nextjs'
import { useMemo, useEffect } from 'react'

export type RealtimeUser = {
	id: string
	name: string
	image: string
}

export const useInstantPresence = (boardId: string) => {
	const { user: clerkUser } = useUser();

	// Get the room for this board
	const room = db.room('board', boardId);

	// Prepare initial presence data
	const initialPresence = useMemo(() => {
		if (!clerkUser) return { name: 'Anonymous', image: '' }

		return {
			name: clerkUser.fullName || clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'Anonymous',
			image: clerkUser.imageUrl,
		}
	}, [clerkUser]);

	// Use presence hook with initial presence data
	const { user: myPresence, peers, publishPresence } = db.rooms.usePresence(room, {
		keys: ['name', 'image'], // Only listen to changes to these fields
	});

	// Update presence when user data changes
	useEffect(() => {
		if (clerkUser && initialPresence) {
			publishPresence(initialPresence)
		}
	}, [clerkUser, initialPresence, publishPresence]);

	// Transform peers into the expected format
	const users = useMemo(() => {
		const users = [];

		// Add current user if present
		if (myPresence) {
			users.push({ name: myPresence.name, image: myPresence.image })
		}

		users.push(...Object.entries(peers));

		return users;
	}, [myPresence, peers]);

	return { users };
}
