'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Mic, MicOff, Paperclip, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

const FILE_ACCEPT =
  'image/*,.csv,.xlsx,.xls,.json,.md,.txt,.html,.xml,.svg,application/pdf,text/csv,application/json,text/plain,text/markdown,text/html,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Check for SpeechRecognition support (Chrome, Edge, Safari)
function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}

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

  // Voice input
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const hasSpeech = useMemo(() => !!getSpeechRecognitionCtor(), [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    const rec = new Ctor()
    rec.lang = 'pl-PL'
    rec.interimResults = false
    rec.continuous = false
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) {
        setValue((prev) => (prev ? `${prev} ${transcript}` : transcript))
      }
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)

    recognitionRef.current = rec
    rec.start()
    setIsListening(true)
  }

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
        const exists = next.some((p) => p.name === f.name && p.size === f.size && p.type === f.type)
        if (!exists) next.push(f)
      }
      return next.slice(0, 6)
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
          accept={FILE_ACCEPT}
          onChange={(e) => {
            const incoming = Array.from(e.target.files || [])
            addFiles(incoming)
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
        {hasSpeech ? (
          <Button
            size="icon"
            variant={isListening ? 'destructive' : 'secondary'}
            onClick={toggleVoice}
            disabled={disabled || isSending}
            aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        ) : null}
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
        Enter wysyla, Shift+Enter nowa linia{hasSpeech ? ' | Mikrofon: dyktowanie' : ''}
      </div>
    </div>
  )
}

