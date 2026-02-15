'use client'

import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ChatInput({
  disabled,
  placeholder,
  onSend,
}: {
  disabled?: boolean
  placeholder?: string
  onSend: (text: string) => Promise<void> | void
}) {
  const [value, setValue] = useState('')
  const [isSending, setIsSending] = useState(false)

  const canSend = !disabled && !isSending && value.trim().length > 0

  const submit = async () => {
    if (!canSend) return
    const text = value.trim()
    setValue('')
    setIsSending(true)
    try {
      await onSend(text)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2">
        <TextareaAutosize
          value={value}
          onChange={(e) => setValue(e.target.value)}
          minRows={1}
          maxRows={6}
          placeholder={placeholder ?? 'Napisz wiadomosc...'}
          disabled={disabled || isSending}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submit()
            }
          }}
        />
        <Button size="icon" onClick={() => void submit()} disabled={!canSend} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Enter wysyla, Shift+Enter nowa linia
      </div>
    </div>
  )
}

