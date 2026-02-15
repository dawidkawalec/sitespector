'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Search, Sparkles, MessageSquare } from 'lucide-react'

import type { ChatMessage } from '@/lib/chat-store'
import { useChatStore } from '@/lib/chat-store'

const PHASE_LABELS: Record<string, { label: string; icon: typeof Search }> = {
  searching: { label: 'Szukam w raporcie...', icon: Search },
  generating: { label: 'Generuję odpowiedź...', icon: Sparkles },
  streaming: { label: 'Piszę odpowiedź...', icon: MessageSquare },
}

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
              {isEmptyAssistant && isStreaming && streamingPhase ? (
                <StreamingIndicator phase={streamingPhase} />
              ) : m.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
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

