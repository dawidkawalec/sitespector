'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Database, Loader2, Plus, RefreshCw, Settings2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useChatStore } from '@/lib/chat-store'
import { chatAPI } from '@/lib/chat-api'
import { streamChatMessage } from '@/lib/chat-sse'

import { AgentSelector } from './AgentSelector'
import { ChatConversationList } from './ChatConversationList'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessages'
import { ChatUsageBadge } from './ChatUsageBadge'

type ExportFormat = 'md' | 'txt' | 'csv'

export function ChatPanel() {
  const { currentWorkspace } = useWorkspace()
  const workspaceId = currentWorkspace?.id ?? null

  const isOpen = useChatStore((s) => s.isPanelOpen)
  const setPanelOpen = useChatStore((s) => s.setPanelOpen)
  const width = useChatStore((s) => s.panelWidth)
  const setWidth = useChatStore((s) => s.setPanelWidth)

  const activeAuditId = useChatStore((s) => s.activeAuditId)
  const setActiveWorkspace = useChatStore((s) => s.setActiveWorkspace)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)

  const agents = useChatStore((s) => s.agents)
  const setAgents = useChatStore((s) => s.setAgents)
  const conversations = useChatStore((s) => s.conversations)
  const setConversations = useChatStore((s) => s.setConversations)
  const upsertConversation = useChatStore((s) => s.upsertConversation)

  const messagesByConversationId = useChatStore((s) => s.messagesByConversationId)
  const setMessages = useChatStore((s) => s.setMessages)
  const appendMessage = useChatStore((s) => s.appendMessage)
  const appendAssistantDelta = useChatStore((s) => s.appendAssistantDelta)
  const suggestionsByConversationId = useChatStore((s) => s.suggestionsByConversationId)
  const setSuggestions = useChatStore((s) => s.setSuggestions)

  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingConversationId = useChatStore((s) => s.streamingConversationId)
  const streamingPhase = useChatStore((s) => s.streamingPhase)
  const setStreaming = useChatStore((s) => s.setStreaming)
  const setStreamingPhase = useChatStore((s) => s.setStreamingPhase)

  const usage = useChatStore((s) => s.usage)
  const setUsage = useChatStore((s) => s.setUsage)

  useEffect(() => {
    setActiveWorkspace(workspaceId)
  }, [workspaceId, setActiveWorkspace])

  // Resizing
  const resizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWRef = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const dx = startXRef.current - e.clientX
      setWidth(startWRef.current + dx)
    }
    const onUp = () => {
      resizingRef.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [setWidth])

  const messages = useMemo(() => {
    if (!activeConversationId) return []
    return messagesByConversationId[activeConversationId] ?? []
  }, [activeConversationId, messagesByConversationId])

  const suggestions = useMemo(() => {
    if (!activeConversationId) return []
    return suggestionsByConversationId[activeConversationId] ?? []
  }, [activeConversationId, suggestionsByConversationId])

  const [selectedAgentSlug, setSelectedAgentSlug] = useState<string | null>(null)
  const [draftVerbosity, setDraftVerbosity] = useState<'concise' | 'balanced' | 'detailed'>('balanced')
  const [draftTone, setDraftTone] = useState<'technical' | 'professional' | 'simple'>('professional')
  const [conversationFilter, setConversationFilter] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isReindexing, setIsReindexing] = useState(false)

  useEffect(() => {
    if (!activeConversationId) return
    const convo = conversations.find((c) => c.id === activeConversationId)
    if (!convo) return
    setDraftVerbosity(convo.verbosity ?? 'balanced')
    setDraftTone(convo.tone ?? 'professional')
  }, [activeConversationId, conversations])

  const agentsQuery = useQuery({
    queryKey: ['chatAgents', workspaceId],
    queryFn: () => chatAPI.listAgents(workspaceId ?? undefined),
    enabled: isOpen,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (agentsQuery.data) {
      setAgents(agentsQuery.data)
      if (!selectedAgentSlug && agentsQuery.data.length > 0) {
        setSelectedAgentSlug(agentsQuery.data[0].slug)
      }
    }
  }, [agentsQuery.data, setAgents, selectedAgentSlug])

  useEffect(() => {
    if (agentsQuery.error) {
      toast.error((agentsQuery.error as any)?.message || 'Failed to load agents')
    }
  }, [agentsQuery.error])

  const conversationsQuery = useQuery({
    queryKey: ['chatConversations', workspaceId, activeAuditId],
    queryFn: () =>
      chatAPI.listConversations({
        workspace_id: workspaceId as string,
        audit_id: activeAuditId as string,
      }),
    enabled: isOpen && Boolean(workspaceId) && Boolean(activeAuditId),
    staleTime: 10_000,
  })

  useEffect(() => {
    if (conversationsQuery.data) {
      setConversations(conversationsQuery.data)
    }
  }, [conversationsQuery.data, setConversations])

  const usageQuery = useQuery({
    queryKey: ['chatUsage', workspaceId],
    queryFn: () => chatAPI.getUsage(workspaceId as string),
    enabled: isOpen && Boolean(workspaceId),
    staleTime: 15_000,
  })

  useEffect(() => {
    if (usageQuery.data) {
      setUsage(usageQuery.data as any)
    }
  }, [usageQuery.data, setUsage])

  const ragStatusQuery = useQuery({
    queryKey: ['ragStatus', activeAuditId],
    queryFn: () => chatAPI.getRagStatus(activeAuditId as string),
    enabled: isOpen && Boolean(activeAuditId),
    staleTime: 10_000,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && data.status !== 'ready') return 5_000
      return false
    },
  })

  const ragStatus = ragStatusQuery.data?.status ?? null
  const ragReady = ragStatus === 'ready'

  // Load messages for active conversation when switching
  useEffect(() => {
    if (!activeConversationId) return
    let cancelled = false
    chatAPI
      .getConversation(activeConversationId)
      .then((data) => {
        if (cancelled) return
        upsertConversation({ ...data.conversation, agent: data.agent })
        setMessages(activeConversationId, data.messages)
      })
      .catch((e) => toast.error(e?.message || 'Failed to load conversation'))
    return () => {
      cancelled = true
    }
  }, [activeConversationId, setMessages, upsertConversation])

  const canChat = Boolean(activeAuditId && workspaceId)

  // Search conversations by title AND message content (client-side)
  const filteredConversations = useMemo(() => {
    const q = conversationFilter.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const titleMatch = (c.title ?? 'Nowa rozmowa').toLowerCase().includes(q)
      if (titleMatch) return true
      const msgs = messagesByConversationId[c.id] ?? []
      return msgs.some((m) => m.content.toLowerCase().includes(q))
    })
  }, [conversations, conversationFilter, messagesByConversationId])

  // --- Export with format selection ---
  const buildExportContent = (fmt: ExportFormat): { content: string; mime: string; ext: string } => {
    const title = conversations.find((c) => c.id === activeConversationId)?.title ?? 'Nowa rozmowa'

    if (fmt === 'csv') {
      const header = 'Role,Content,Timestamp'
      const rows = messages.map((m) => {
        const escaped = m.content.replace(/"/g, '""').replace(/\n/g, '\\n')
        return `"${m.role}","${escaped}","${m.created_at}"`
      })
      return { content: [header, ...rows].join('\n'), mime: 'text/csv;charset=utf-8', ext: 'csv' }
    }

    if (fmt === 'txt') {
      const lines = messages.map((m) => {
        const who = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System'
        return `[${who}]\n${m.content}\n`
      })
      return { content: `${title}\n${'='.repeat(title.length)}\n\n${lines.join('\n')}`, mime: 'text/plain;charset=utf-8', ext: 'txt' }
    }

    // MD (default)
    const md = [
      `# ${title}`,
      '',
      ...messages.map((m) => {
        const who = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System'
        const att =
          (m.attachments ?? []).length > 0
            ? `\n\nAttachments:\n${(m.attachments ?? [])
                .map((a) => `- ${a.filename} (${a.mime_type}, ${a.size_bytes} bytes)`)
                .join('\n')}`
            : ''
        return `## ${who}\n\n${m.content}${att}\n`
      }),
    ].join('\n')
    return { content: md, mime: 'text/markdown;charset=utf-8', ext: 'md' }
  }

  const exportConversation = (fmt: ExportFormat) => {
    if (!activeConversationId) return
    setShowExportMenu(false)
    const { content, mime, ext } = buildExportContent(fmt)
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${activeConversationId}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Keyboard shortcuts (only when panel is open)
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTyping =
        tag === 'input' || tag === 'textarea' || Boolean(target?.getAttribute?.('contenteditable'))
      if (isTyping) return

      if (e.key === 'Escape') {
        setPanelOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, setPanelOpen])

  const createNewConversation = async () => {
    if (!canChat) return
    const agentSlug = selectedAgentSlug ?? agents[0]?.slug
    if (!agentSlug) {
      toast.error('No agents available')
      return
    }
    const convo = await chatAPI.createConversation({
      audit_id: activeAuditId as string,
      workspace_id: workspaceId as string,
      agent_slug: agentSlug,
    })
    let finalConvo = convo
    if (draftVerbosity !== 'balanced' || draftTone !== 'professional') {
      try {
        finalConvo = await chatAPI.updateConversation(convo.id, {
          verbosity: draftVerbosity,
          tone: draftTone,
        })
      } catch {
        // Not fatal
      }
    }
    setConversations([finalConvo, ...conversations])
    setActiveConversation(finalConvo.id)
    return finalConvo
  }

  const reindexRag = async () => {
    if (!activeAuditId) return
    setIsReindexing(true)
    try {
      await chatAPI.reindexAuditRag(activeAuditId)
      toast.success('RAG: reindeksacja zakonczona')
      void ragStatusQuery.refetch()
    } catch (e) {
      toast.error(`RAG: nie udalo sie zrobic reindeksacji (${String(e)})`)
    } finally {
      setIsReindexing(false)
    }
  }

  const sendMessage = async ({ text, files }: { text: string; files: File[] }) => {
    if (!canChat) {
      toast.error('Open an audit report first')
      return
    }

    let convoId = activeConversationId
    if (!convoId) {
      const convo = await createNewConversation()
      convoId = convo?.id ?? null
    }
    if (!convoId) return

    setSuggestions(convoId, [])

    const existing = conversations.find((c) => c.id === convoId)
    if (
      existing &&
      ((existing.verbosity ?? 'balanced') !== draftVerbosity ||
        (existing.tone ?? 'professional') !== draftTone)
    ) {
      try {
        const updated = await chatAPI.updateConversation(convoId, {
          verbosity: draftVerbosity,
          tone: draftTone,
        })
        upsertConversation(updated)
      } catch {
        // Not fatal
      }
    }

    const now = new Date().toISOString()
    const localUserId = `local-user-${Date.now()}`
    const localAssistantId = `local-assistant-${Date.now()}`

    let attachmentIds: string[] = []
    let attachmentMetas: Array<{ id: string; filename: string; mime_type: string; size_bytes: number; created_at: string }> =
      []
    if (files && files.length > 0) {
      try {
        const uploaded = await Promise.all(files.map((f) => chatAPI.uploadAttachment(convoId as string, f)))
        attachmentIds = uploaded.map((u) => u.id)
        attachmentMetas = uploaded
      } catch (e: any) {
        toast.error(e?.message || 'Nie udalo sie przeslac zalacznikow')
        return
      }
    }

    appendMessage(convoId, {
      id: localUserId,
      conversation_id: convoId,
      role: 'user',
      content: text,
      attachments: attachmentMetas,
      created_at: now,
    })
    appendMessage(convoId, {
      id: localAssistantId,
      conversation_id: convoId,
      role: 'assistant',
      content: '',
      created_at: now,
    })

    setStreaming(convoId)

    await streamChatMessage(convoId, text, attachmentIds, {
      onToken: (t) => appendAssistantDelta(convoId as string, t),
      onStatus: (status) => setStreamingPhase(status as any),
      onSuggestions: (next) =>
        setSuggestions(convoId as string, Array.isArray(next) ? next.filter(Boolean).slice(0, 3) : []),
      onDone: async () => {
        setStreaming(null)
        try {
          const data = await chatAPI.getConversation(convoId as string)
          upsertConversation({ ...data.conversation, agent: data.agent })
          setMessages(convoId as string, data.messages)
          void conversationsQuery.refetch()
        } catch {
          // Not fatal
        }
        if (workspaceId) {
          try {
            const u = await chatAPI.getUsage(workspaceId)
            setUsage(u as any)
          } catch {}
        }
      },
      onError: (err) => {
        setStreaming(null)
        toast.error(err.message)
        appendAssistantDelta(convoId as string, `\n\n[error] ${err.message}`)
      },
    })
  }

  if (!isOpen) return null

  const isBusy = isStreaming && streamingConversationId === activeConversationId
  const limitReached =
    usage && usage.limit !== null ? usage.messages_sent >= (usage.limit ?? 0) : false

  return (
    <div
      className="hidden md:flex h-screen border-l border-border bg-background relative"
      style={{ width }}
      aria-label="Chat panel"
    >
      {/* Resize handle */}
      <div
        className="w-1 cursor-col-resize hover:bg-muted/60"
        onMouseDown={(e) => {
          resizingRef.current = true
          startXRef.current = e.clientX
          startWRef.current = width
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="font-medium text-sm truncate">Agent Chat</div>
            {usage ? <ChatUsageBadge messagesSent={usage.messages_sent} limit={usage.limit ?? null} /> : null}
          </div>
          <div className="flex items-center gap-1">
            {/* Export menu */}
            <Popover open={showExportMenu} onOpenChange={setShowExportMenu}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Export conversation"
                  disabled={!activeConversationId || messages.length === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40 p-1">
                <button
                  className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted"
                  onClick={() => exportConversation('md')}
                >
                  Eksport .md
                </button>
                <button
                  className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted"
                  onClick={() => exportConversation('txt')}
                >
                  Eksport .txt
                </button>
                <button
                  className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted"
                  onClick={() => exportConversation('csv')}
                >
                  Eksport .csv
                </button>
              </PopoverContent>
            </Popover>

            {/* Settings popover (verbosity + tone) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Chat settings" disabled={!canChat}>
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 space-y-3 p-3">
                <div className="text-xs font-medium text-muted-foreground uppercase">Styl odpowiedzi</div>
                <Select
                  value={draftVerbosity}
                  onValueChange={(v) => {
                    const next = v as 'concise' | 'balanced' | 'detailed'
                    setDraftVerbosity(next)
                    if (!activeConversationId) return
                    void chatAPI
                      .updateConversation(activeConversationId, { verbosity: next })
                      .then((c) => upsertConversation(c))
                      .catch(() => toast.error('Nie udalo sie zapisac ustawien'))
                  }}
                  disabled={isStreaming}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Gadatliwosc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Krotko</SelectItem>
                    <SelectItem value="balanced">Normalnie</SelectItem>
                    <SelectItem value="detailed">Szczegolowo</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={draftTone}
                  onValueChange={(v) => {
                    const next = v as 'technical' | 'professional' | 'simple'
                    setDraftTone(next)
                    if (!activeConversationId) return
                    void chatAPI
                      .updateConversation(activeConversationId, { tone: next })
                      .then((c) => upsertConversation(c))
                      .catch(() => toast.error('Nie udalo sie zapisac tonu'))
                  }}
                  disabled={isStreaming}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Ton" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Techniczny</SelectItem>
                    <SelectItem value="professional">Profesjonalny</SelectItem>
                    <SelectItem value="simple">Prosty</SelectItem>
                  </SelectContent>
                </Select>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Reindex RAG for audit"
              disabled={!canChat || isStreaming || isReindexing}
              onClick={() => void reindexRag()}
            >
              {isReindexing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <AgentSelector agents={agents} value={selectedAgentSlug} onChange={setSelectedAgentSlug} />
            <ChatConversationList
              conversations={filteredConversations}
              value={activeConversationId}
              onChange={(id) => setActiveConversation(id)}
              disabled={!canChat}
            />
          </div>
          <Input
            className="h-8"
            placeholder="Szukaj rozmowy..."
            value={conversationFilter}
            onChange={(e) => setConversationFilter(e.target.value)}
            disabled={!canChat}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void createNewConversation()}
              disabled={!canChat || isStreaming}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nowa rozmowa
            </Button>
            {conversationsQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>
          {!canChat ? (
            <div className="text-xs text-muted-foreground">
              Przejdz do konkretnego audytu, aby rozmawiac o jego raporcie.
            </div>
          ) : null}
          <Separator />
        </div>

        {/* RAG status banner */}
        {canChat && ragStatus && !ragReady ? (
          <div className="mx-3 mb-2 rounded-md border border-border bg-muted/50 px-3 py-2.5">
            {ragStatus === 'pending' ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    Indeks danych nie jest jeszcze gotowy
                  </span>
                </div>
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => void reindexRag()}
                  disabled={isReindexing}
                >
                  {isReindexing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {isReindexing ? 'Indeksowanie...' : 'Zaindeksuj'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Audyt w trakcie — chat dostepny po zakonczeniu
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* Messages */}
        <ChatMessages messages={messages} />

        {/* Follow-up suggestions */}
        {suggestions.length > 0 && !isStreaming ? (
          <div className="px-3 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="text-xs rounded-full border border-border bg-background px-3 py-1 hover:bg-muted"
                onClick={() => void sendMessage({ text: s, files: [] })}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {/* Input */}
        <ChatInput
          disabled={!canChat || isBusy || Boolean(limitReached)}
          placeholder={limitReached ? 'Limit wiadomosci na ten miesiac zostal wykorzystany' : undefined}
          onSend={sendMessage}
        />
      </div>
    </div>
  )
}
