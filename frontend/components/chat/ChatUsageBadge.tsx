'use client'

import { Badge } from '@/components/ui/badge'

export function ChatUsageBadge({
  messagesSent,
  limit,
}: {
  messagesSent: number
  limit: number | null
}) {
  if (limit === null) return <Badge variant="secondary">Unlimited</Badge>
  return (
    <Badge variant={messagesSent >= limit ? 'destructive' : 'secondary'}>
      {messagesSent}/{limit}
    </Badge>
  )
}

