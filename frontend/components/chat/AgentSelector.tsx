'use client'

import type { ChatAgent } from '@/lib/chat-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AgentSelector({
  agents,
  value,
  onChange,
  disabled,
}: {
  agents: ChatAgent[]
  value: string | null
  onChange: (slug: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8">
        <SelectValue placeholder="Wybierz agenta" />
      </SelectTrigger>
      <SelectContent>
        {agents.map((a) => (
          <SelectItem key={a.slug} value={a.slug}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

