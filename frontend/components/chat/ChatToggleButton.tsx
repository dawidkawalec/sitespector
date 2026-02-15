'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/lib/chat-store'

export function ChatToggleButton() {
  const isOpen = useChatStore((s) => s.isPanelOpen)
  const toggle = useChatStore((s) => s.togglePanel)

  if (isOpen) return null

  return (
    <div className="hidden md:block fixed bottom-4 right-4 z-50">
      <Button onClick={toggle} className="rounded-full shadow-lg" size="icon" aria-label="Open chat">
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div>
  )
}

