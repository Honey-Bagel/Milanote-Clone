'use client'

import { AvatarStack } from '@/components/avatar-stack'
import { useRealtimePresenceRoom } from '@/lib/hooks/supabase/use-realtime-presence-room'
import { useMemo } from 'react'

export const RealtimeAvatarStack = ({ roomName }: { roomName: string }) => {
  const { users: usersMap } = useRealtimePresenceRoom(roomName)
  console.log(usersMap);
  const avatars = useMemo(() => {
    return Object.values(usersMap).map((user) => ({
      name: user.name,
      image: user.image,
    }))
  }, [usersMap])

  return <AvatarStack avatars={avatars} />
}
