'use client'

import { useMemo, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Paperclip, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ChatInput({
  disabled,
  placeholder,
  onSend,
}: {
  disabled?: boolean
  placeholder?: string
  onSend: (payload: { text: string; files: File[] }) => Promise<void> | void
}) {
  const [value, setValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const canSend = !disabled && !isSending && (value.trim().length > 0 || files.length > 0)

  const filesLabel = useMemo(() => {
    if (files.length === 0) return null
    if (files.length === 1) return files[0].name
    return `${files.length} plikow`
  }, [files])

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return
    setFiles((prev) => {
      const next = [...prev]
      for (const f of incoming) {
        // Avoid exact duplicates.
        const exists = next.some((p) => p.name === f.name && p.size === f.size && p.type === f.type)
        if (!exists) next.push(f)
      }
      return next.slice(0, 6) // keep UI simple for now
    })
  }

  const submit = async () => {
    if (!canSend) return
    const text = value.trim()
    const selected = files
    setValue('')
    setFiles([])
    setIsSending(true)
    try {
      await onSend({ text, files: selected })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      className="border-t border-border p-3"
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        if (disabled || isSending) return
        const dropped = Array.from(e.dataTransfer.files || [])
        addFiles(dropped)
      }}
      onPaste={(e) => {
        if (disabled || isSending) return
        const items = Array.from(e.clipboardData?.items || [])
        const pasted: File[] = []
        for (const it of items) {
          if (it.kind === 'file') {
            const f = it.getAsFile()
            if (f) pasted.push(f)
          }
        }
        if (pasted.length > 0) addFiles(pasted)
      }}
    >
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
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,.csv,application/pdf,text/csv"
          onChange={(e) => {
            const incoming = Array.from(e.target.files || [])
            addFiles(incoming)
            // allow selecting same file again
            e.currentTarget.value = ''
          }}
        />
        <Button
          size="icon"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={() => void submit()} disabled={!canSend} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {files.length > 0 ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground truncate">
            Zalaczniki: {filesLabel}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFiles([])}
            disabled={disabled || isSending}
            aria-label="Clear attachments"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <div className="mt-2 text-xs text-muted-foreground">
        Enter wysyla, Shift+Enter nowa linia
      </div>
    </div>
  )
}

