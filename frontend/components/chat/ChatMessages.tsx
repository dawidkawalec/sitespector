'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Search, Sparkles, MessageSquare, ThumbsDown, ThumbsUp, Zap, CheckCircle, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { actionCardsAPI } from '@/lib/api'

import type { ChatMessage } from '@/lib/chat-store'
import { useChatStore } from '@/lib/chat-store'
import { supabase } from '@/lib/supabase'
import { chatAPI } from '@/lib/chat-api'

const PHASE_LABELS: Record<string, { label: string; icon: typeof Search }> = {
  searching: { label: 'Szukam w raporcie...', icon: Search },
  indexing: { label: 'Indeksuje raport (RAG)...', icon: Search },
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
                  <AssistantContent content={m.content} />
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

// ---- Action Block Parsing ----

interface ParsedActionBlock {
  type: string
  title?: string
  description?: string
  priority?: string
  category?: string
  card_id?: string
  status?: string
}

function parseActionBlocks(content: string): Array<{ type: 'text'; value: string } | { type: 'action'; value: ParsedActionBlock }> {
  const parts: Array<{ type: 'text'; value: string } | { type: 'action'; value: ParsedActionBlock }> = []
  const regex = /:::action\n([\s\S]*?):::/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }

    // Parse action block fields
    const block: Record<string, string> = {}
    for (const line of match[1].split('\n')) {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim()
        const val = line.slice(colonIdx + 1).trim()
        if (key && val) block[key] = val
      }
    }
    parts.push({ type: 'action', value: block as unknown as ParsedActionBlock })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return parts
}

function AssistantContent({ content }: { content: string }) {
  const parts = useMemo(() => parseActionBlocks(content), [content])
  const hasActions = parts.some((p) => p.type === 'action')

  if (!hasActions) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  }

  return (
    <div className="space-y-2">
      {parts.map((part, i) =>
        part.type === 'text' ? (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {part.value.trim()}
          </ReactMarkdown>
        ) : (
          <ChatActionBlock key={i} action={part.value} />
        )
      )}
    </div>
  )
}

function ChatActionBlock({ action }: { action: ParsedActionBlock }) {
  const queryClient = useQueryClient()
  const activeAuditId = useChatStore((s) => s.activeAuditId)

  const createCard = useMutation({
    mutationFn: () => {
      if (!activeAuditId) throw new Error('No active audit')
      return actionCardsAPI.create(activeAuditId, {
        title: action.title || 'Nowa akcja',
        description: action.description || '',
        category: action.category,
        priority: action.priority,
        source: 'chat_created',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-cards', activeAuditId] })
    },
  })

  const updateCard = useMutation({
    mutationFn: () => {
      if (!activeAuditId || !action.card_id) throw new Error('Missing data')
      return actionCardsAPI.update(activeAuditId, action.card_id, {
        status: action.status,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-cards', activeAuditId] })
    },
  })

  if (action.type === 'create_card') {
    return (
      <div className="my-2 rounded-lg border border-teal-200 bg-teal-50/50 p-3 dark:border-teal-800 dark:bg-teal-950/20">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 dark:text-white">{action.title}</p>
            {action.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              {action.priority && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800">{action.priority}</span>
              )}
              {action.category && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800">{action.category}</span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => createCard.mutate()}
          disabled={createCard.isPending || createCard.isSuccess}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {createCard.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : createCard.isSuccess ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Zap className="h-3 w-3" />
          )}
          {createCard.isSuccess ? 'Dodano!' : 'Dodaj do dashboardu'}
        </button>
      </div>
    )
  }

  if (action.type === 'update_card') {
    return (
      <div className="my-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
        <p className="text-xs text-muted-foreground">
          Aktualizacja karty: <span className="font-medium">{action.status}</span>
        </p>
        <button
          type="button"
          onClick={() => updateCard.mutate()}
          disabled={updateCard.isPending || updateCard.isSuccess || !action.card_id}
          className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {updateCard.isSuccess ? 'Zaktualizowano!' : 'Aktualizuj karte'}
        </button>
      </div>
    )
  }

  return null
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

