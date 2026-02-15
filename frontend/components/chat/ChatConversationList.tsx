'use client'

import type { ChatConversation } from '@/lib/chat-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ChatConversationList({
  conversations,
  value,
  onChange,
  disabled,
}: {
  conversations: ChatConversation[]
  value: string | null
  onChange: (conversationId: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8">
        <SelectValue placeholder="Wybierz rozmowe" />
      </SelectTrigger>
      <SelectContent>
        {conversations.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.title ?? 'Nowa rozmowa'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

