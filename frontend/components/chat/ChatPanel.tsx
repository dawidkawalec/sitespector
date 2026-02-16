'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useChatStore } from '@/lib/chat-store'
import { chatAPI } from '@/lib/chat-api'
import { streamChatMessage } from '@/lib/chat-sse'

import { AgentSelector } from './AgentSelector'
import { ChatConversationList } from './ChatConversationList'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessages'
import { ChatUsageBadge } from './ChatUsageBadge'

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

  const filteredConversations = useMemo(() => {
    const q = conversationFilter.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => (c.title ?? 'Nowa rozmowa').toLowerCase().includes(q))
  }, [conversations, conversationFilter])

  const exportConversation = () => {
    if (!activeConversationId) return
    const title = conversations.find((c) => c.id === activeConversationId)?.title ?? 'Nowa rozmowa'
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

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${activeConversationId}.md`
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
    // Apply style defaults if user picked them before creating the conversation.
    if (draftVerbosity !== 'balanced' || draftTone !== 'professional') {
      try {
        finalConvo = await chatAPI.updateConversation(convo.id, {
          verbosity: draftVerbosity,
          tone: draftTone,
        })
      } catch {
        // Not fatal; conversation still exists.
      }
    }
    setConversations([finalConvo, ...conversations])
    setActiveConversation(finalConvo.id)
    return finalConvo
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

    // Clear previous suggestions once the user continues the conversation.
    setSuggestions(convoId, [])

    // Best-effort: ensure style settings are saved before the LLM prompt is built.
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
        // Not fatal; fallback to server defaults.
      }
    }

    const now = new Date().toISOString()
    const localUserId = `local-user-${Date.now()}`
    const localAssistantId = `local-assistant-${Date.now()}`

    // Upload attachments before sending the message so we can reference attachment IDs.
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
        // Refresh messages from DB to replace local IDs.
        try {
          const data = await chatAPI.getConversation(convoId as string)
          upsertConversation({ ...data.conversation, agent: data.agent })
          setMessages(convoId as string, data.messages)
          void conversationsQuery.refetch()
        } catch (e: any) {
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => exportConversation()}
              aria-label="Export conversation"
              disabled={!activeConversationId}
            >
              <Download className="h-4 w-4" />
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
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={draftVerbosity}
              onValueChange={(v) => {
                const next = v as 'concise' | 'balanced' | 'detailed'
                setDraftVerbosity(next)
                if (!activeConversationId) return
                void chatAPI
                  .updateConversation(activeConversationId, { verbosity: next })
                  .then((c) => upsertConversation(c))
                  .catch(() => toast.error('Nie udalo sie zapisac ustawien odpowiedzi'))
              }}
              disabled={!canChat || isStreaming}
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
                  .catch(() => toast.error('Nie udalo sie zapisac tonu komunikacji'))
              }}
              disabled={!canChat || isStreaming}
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
          </div>
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

