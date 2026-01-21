'use client'

import { AvatarStack } from '@/components/avatar-stack'
import { useInstantPresence } from '@/lib/hooks/instant/use-instant-presence'
import { useMemo } from 'react'

export const RealtimeAvatarStack = ({ roomName }: { roomName: string }) => {
	const { users: usersMap } = useInstantPresence(roomName)
	const avatars = useMemo(() => {
		return Object.entries(usersMap).map(([userId, user]) => ({
			name: user.name,
			image: user.image,
		}))
	}, [usersMap])

	return <AvatarStack avatars={avatars} />
}