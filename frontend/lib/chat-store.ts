'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatAgent {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  sort_order?: number
  system_prompt?: string | null
  tools_config?: string[]
  is_system: boolean
}

export interface ChatConversation {
  id: string
  audit_id: string
  workspace_id: string
  created_by: string
  agent_type_id: string
  title?: string | null
  is_shared: boolean
  verbosity?: 'concise' | 'balanced' | 'detailed'
  tone?: 'technical' | 'professional' | 'simple'
  created_at: string
  updated_at: string
  agent?: ChatAgent
}

export interface ChatMessage {
  id: string
  conversation_id: string
  role: ChatRole
  content: string
  created_at: string
  tokens_used?: number | null
  attachments?: Array<{
    id: string
    filename: string
    mime_type: string
    size_bytes: number
    created_at: string
  }>
}

interface ChatState {
  isPanelOpen: boolean
  panelWidth: number

  activeAuditId: string | null
  activeWorkspaceId: string | null
  activeConversationId: string | null

  agents: ChatAgent[]
  conversations: ChatConversation[]
  messagesByConversationId: Record<string, ChatMessage[]>
  suggestionsByConversationId: Record<string, string[]>

  isStreaming: boolean
  streamingConversationId: string | null
  streamingPhase: 'searching' | 'indexing' | 'generating' | 'streaming' | null

  usage: { month: string; messages_sent: number; limit: number | null; subscription_tier?: string | null } | null

  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
  setPanelWidth: (width: number) => void

  setActiveAudit: (auditId: string | null) => void
  setActiveWorkspace: (workspaceId: string | null) => void
  setActiveConversation: (conversationId: string | null) => void

  setAgents: (agents: ChatAgent[]) => void
  setConversations: (conversations: ChatConversation[]) => void
  upsertConversation: (conversation: ChatConversation) => void

  setMessages: (conversationId: string, messages: ChatMessage[]) => void
  appendMessage: (conversationId: string, msg: ChatMessage) => void
  appendAssistantDelta: (conversationId: string, delta: string) => void
  setSuggestions: (conversationId: string, suggestions: string[]) => void

  setStreaming: (conversationId: string | null) => void
  setStreamingPhase: (phase: ChatState['streamingPhase']) => void
  setUsage: (usage: ChatState['usage']) => void

  resetForAuditSwitch: (auditId: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      isPanelOpen: true,
      panelWidth: 360,

      activeAuditId: null,
      activeWorkspaceId: null,
      activeConversationId: null,

      agents: [],
      conversations: [],
      messagesByConversationId: {},
      suggestionsByConversationId: {},

      isStreaming: false,
      streamingConversationId: null,
      streamingPhase: null,

      usage: null,

      setPanelOpen: (open) => set({ isPanelOpen: open }),
      togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
      setPanelWidth: (width) => set({ panelWidth: Math.max(300, Math.min(720, width)) }),

      setActiveAudit: (auditId) => {
        const prev = get().activeAuditId
        set({ activeAuditId: auditId })
        if (auditId && prev && auditId !== prev) {
          get().resetForAuditSwitch(auditId)
        }
      },
      setActiveWorkspace: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
      setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

      setAgents: (agents) => set({ agents }),
      setConversations: (conversations) => set({ conversations }),
      upsertConversation: (conversation) =>
        set((s) => {
          const idx = s.conversations.findIndex((c) => c.id === conversation.id)
          if (idx === -1) return { conversations: [conversation, ...s.conversations] }
          const next = [...s.conversations]
          next[idx] = { ...next[idx], ...conversation }
          return { conversations: next }
        }),

      setMessages: (conversationId, messages) =>
        set((s) => ({
          messagesByConversationId: { ...s.messagesByConversationId, [conversationId]: messages },
        })),

      appendMessage: (conversationId, msg) =>
        set((s) => {
          const current = s.messagesByConversationId[conversationId] ?? []
          return {
            messagesByConversationId: {
              ...s.messagesByConversationId,
              [conversationId]: [...current, msg],
            },
          }
        }),

      appendAssistantDelta: (conversationId, delta) =>
        set((s) => {
          const current = s.messagesByConversationId[conversationId] ?? []
          if (current.length === 0) return s
          const last = current[current.length - 1]
          if (last.role !== 'assistant') return s
          const next = [...current]
          next[next.length - 1] = { ...last, content: `${last.content}${delta}` }
          return {
            messagesByConversationId: {
              ...s.messagesByConversationId,
              [conversationId]: next,
            },
          }
        }),

      setSuggestions: (conversationId, suggestions) =>
        set((s) => ({
          suggestionsByConversationId: { ...s.suggestionsByConversationId, [conversationId]: suggestions },
        })),

      setStreaming: (conversationId) =>
        set({
          isStreaming: Boolean(conversationId),
          streamingConversationId: conversationId,
          streamingPhase: conversationId ? 'searching' : null,
        }),

      setStreamingPhase: (phase) => set({ streamingPhase: phase }),

      setUsage: (usage) => set({ usage }),

      resetForAuditSwitch: (auditId) => {
        // Keep panel open/width, but clear conversation selection to avoid leaking context between audits.
        set({
          activeAuditId: auditId,
          activeConversationId: null,
          conversations: [],
          messagesByConversationId: {},
          suggestionsByConversationId: {},
          usage: null,
          isStreaming: false,
          streamingConversationId: null,
          streamingPhase: null,
        })
      },
    }),
    {
      name: 'sitespector_chat_store_v1',
      partialize: (s) => ({
        isPanelOpen: s.isPanelOpen,
        panelWidth: s.panelWidth,
        activeAuditId: s.activeAuditId,
        activeWorkspaceId: s.activeWorkspaceId,
        activeConversationId: s.activeConversationId,
      }),
    }
  )
)

