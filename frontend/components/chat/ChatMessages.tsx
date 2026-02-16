'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Search, Sparkles, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react'

import type { ChatMessage } from '@/lib/chat-store'
import { useChatStore } from '@/lib/chat-store'
import { supabase } from '@/lib/supabase'
import { chatAPI } from '@/lib/chat-api'

const PHASE_LABELS: Record<string, { label: string; icon: typeof Search }> = {
  searching: { label: 'Szukam w raporcie...', icon: Search },
  generating: { label: 'Generuję odpowiedź...', icon: Sparkles },
  streaming: { label: 'Piszę odpowiedź...', icon: MessageSquare },
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api$/, '')

export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement | null>(null)
  const streamingPhase = useChatStore((s) => s.streamingPhase)
  const isStreaming = useChatStore((s) => s.isStreaming)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, streamingPhase])

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      {messages.map((m) => {
        const isUser = m.role === 'user'
        const isEmptyAssistant = m.role === 'assistant' && !m.content
        const attachments = m.attachments ?? []
        return (
          <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={[
                'max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                isUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground border border-border',
              ].join(' ')}
            >
              {attachments.length > 0 ? (
                <div className="mb-2 space-y-2">
                  {attachments.map((a) =>
                    a.mime_type?.startsWith('image/') ? (
                      <ChatImageAttachment key={a.id} attachmentId={a.id} filename={a.filename} />
                    ) : (
                      <ChatFileAttachment
                        key={a.id}
                        attachmentId={a.id}
                        filename={a.filename}
                        mimeType={a.mime_type}
                      />
                    )
                  )}
                </div>
              ) : null}
              {isEmptyAssistant && isStreaming && streamingPhase ? (
                <StreamingIndicator phase={streamingPhase} />
              ) : m.role === 'assistant' ? (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  <AssistantActions messageId={m.id} content={m.content} />
                </>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}

function StreamingIndicator({ phase }: { phase: string }) {
  const config = PHASE_LABELS[phase] ?? PHASE_LABELS.searching
  const Icon = config.icon
  return (
    <div className="flex items-center gap-2 text-muted-foreground animate-pulse py-1">
      <Icon className="h-4 w-4" />
      <span className="text-xs">{config.label}</span>
    </div>
  )
}

function AssistantActions({ messageId, content }: { messageId: string; content: string }) {
  const [busy, setBusy] = useState(false)
  const isLocal = messageId.startsWith('local-')
  const canAct = !isLocal && content.trim().length > 0

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {}
  }

  const rate = async (rating: 1 | -1) => {
    if (!canAct) return
    setBusy(true)
    try {
      await chatAPI.leaveMessageFeedback(messageId, rating)
    } finally {
      setBusy(false)
    }
  }

  if (!content.trim()) return null

  return (
    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs hover:opacity-80"
        onClick={() => void copy()}
      >
        <Copy className="h-3.5 w-3.5" />
        Kopiuj
      </button>
      {canAct ? (
        <>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs hover:opacity-80 disabled:opacity-50"
            onClick={() => void rate(1)}
            disabled={busy}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs hover:opacity-80 disabled:opacity-50"
            onClick={() => void rate(-1)}
            disabled={busy}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </>
      ) : null}
    </div>
  )
}

async function getSupabaseToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session?.access_token ?? null
}

function ChatImageAttachment({ attachmentId, filename }: { attachmentId: string; filename: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    ;(async () => {
      try {
        const token = await getSupabaseToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fetch(`${API_URL}/api/chat/attachments/${attachmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) setUrl(objectUrl)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load image')
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachmentId])

  if (error) {
    return <div className="text-xs text-destructive">Nie udalo sie zaladowac obrazka: {filename}</div>
  }
  if (!url) {
    return <div className="text-xs text-muted-foreground">Ladowanie obrazka...</div>
  }

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={filename} className="max-h-48 w-auto object-contain bg-black/5" />
    </div>
  )
}

function ChatFileAttachment({
  attachmentId,
  filename,
  mimeType,
}: {
  attachmentId: string
  filename: string
  mimeType: string
}) {
  const label = useMemo(() => {
    if (!mimeType) return filename
    return `${filename} (${mimeType})`
  }, [filename, mimeType])

  const download = async () => {
    const token = await getSupabaseToken()
    if (!token) throw new Error('Not authenticated')
    const res = await fetch(`${API_URL}/api/chat/attachments/${attachmentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  return (
    <button
      type="button"
      className="text-left text-xs underline underline-offset-2 hover:opacity-80"
      onClick={() => void download().catch(() => {})}
    >
      {label}
    </button>
  )
}

