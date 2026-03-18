'use client'

import { Badge } from '@/components/ui/badge'

export function ChatUsageBadge({
  messagesSent,
  limit,
  creditBalance,
}: {
  messagesSent: number
  limit: number | null
  creditBalance?: number | null
}) {
  // Credit-based display (new system)
  if (creditBalance !== undefined && creditBalance !== null) {
    return (
      <Badge variant={creditBalance < 10 ? 'destructive' : 'secondary'}>
        {creditBalance} kr
      </Badge>
    )
  }

  // Legacy fallback
  if (limit === null) return <Badge variant="secondary">Unlimited</Badge>
  return (
    <Badge variant={messagesSent >= limit ? 'destructive' : 'secondary'}>
      {messagesSent}/{limit}
    </Badge>
  )
}
