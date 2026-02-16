import { supabase } from './supabase'
import type { ChatAgent, ChatConversation, ChatMessage } from './chat-store'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api$/, '')

async function getSupabaseToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  if (!data.session) return null

  const expiresAt = data.session.expires_at
  const now = Math.floor(Date.now() / 1000)
  if (expiresAt && expiresAt - now < 300) {
    const refreshed = await supabase.auth.refreshSession()
    return refreshed.data.session?.access_token ?? data.session.access_token
  }
  return data.session.access_token
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getSupabaseToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    try {
      const parsed = text ? JSON.parse(text) : null
      throw new Error(parsed?.detail || `HTTP ${res.status}`)
    } catch {
      throw new Error(text || `HTTP ${res.status}`)
    }
  }
  if (res.status === 204) return undefined as unknown as T
  const body = await res.text()
  return body ? (JSON.parse(body) as T) : (undefined as unknown as T)
}

async function uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = await getSupabaseToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  const body = await res.text()
  return body ? (JSON.parse(body) as T) : (undefined as unknown as T)
}

export interface ConversationWithMessages {
  conversation: ChatConversation
  agent: ChatAgent
  messages: ChatMessage[]
}

export const chatAPI = {
  listAgents: (workspaceId?: string) =>
    apiRequest<ChatAgent[]>(`/api/chat/agents${workspaceId ? `?workspace_id=${workspaceId}` : ''}`),

  createAgent: (input: {
    workspace_id: string
    name: string
    description?: string | null
    icon?: string | null
    system_prompt: string
    tools_config: string[]
    sort_order?: number | null
  }) =>
    apiRequest<ChatAgent>('/api/chat/agents', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateAgent: (
    agentId: string,
    workspaceId: string,
    patch: {
      name?: string | null
      description?: string | null
      icon?: string | null
      system_prompt?: string | null
      tools_config?: string[] | null
      sort_order?: number | null
    }
  ) =>
    apiRequest<ChatAgent>(`/api/chat/agents/${agentId}?workspace_id=${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  deleteAgent: (agentId: string, workspaceId: string) =>
    apiRequest<void>(`/api/chat/agents/${agentId}?workspace_id=${workspaceId}`, { method: 'DELETE' }),

  updateAgentOrder: (input: { workspace_id: string; items: Array<{ id: string; sort_order: number }> }) =>
    apiRequest<void>('/api/chat/agents/order', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  uploadAttachment: async (conversationId: string, file: File) => {
    const fd = new FormData()
    fd.set('conversation_id', conversationId)
    fd.set('file', file)
    return uploadRequest<{
      id: string
      filename: string
      mime_type: string
      size_bytes: number
      created_at: string
    }>('/api/chat/attachments/upload', fd)
  },

  leaveMessageFeedback: (messageId: string, rating: 1 | -1) =>
    apiRequest<void>(`/api/chat/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    }),

  createConversation: (input: { audit_id: string; workspace_id: string; agent_slug: string }) =>
    apiRequest<ChatConversation>('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  listConversations: (input: { workspace_id: string; audit_id?: string; agent_slug?: string }) => {
    const params = new URLSearchParams()
    params.set('workspace_id', input.workspace_id)
    if (input.audit_id) params.set('audit_id', input.audit_id)
    if (input.agent_slug) params.set('agent_slug', input.agent_slug)
    return apiRequest<ChatConversation[]>(`/api/chat/conversations?${params.toString()}`)
  },

  getConversation: (conversationId: string) =>
    apiRequest<ConversationWithMessages>(`/api/chat/conversations/${conversationId}`),

  updateConversation: (
    conversationId: string,
    patch: {
      title?: string | null
      is_shared?: boolean
      verbosity?: 'concise' | 'balanced' | 'detailed'
      tone?: 'technical' | 'professional' | 'simple'
    }
  ) =>
    apiRequest<ChatConversation>(`/api/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteConversation: (conversationId: string) =>
    apiRequest<void>(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' }),

  shareConversation: (conversationId: string, input: { shared_with_user_id: string; permission?: 'read' | 'write' }) =>
    apiRequest(`/api/chat/conversations/${conversationId}/share`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  revokeShare: (conversationId: string, sharedWithUserId: string) =>
    apiRequest<void>(`/api/chat/conversations/${conversationId}/share/${sharedWithUserId}`, { method: 'DELETE' }),

  reindexAuditRag: (auditId: string) =>
    apiRequest<{ status: string }>(`/api/audits/${auditId}/reindex-rag`, {
      method: 'POST',
    }),

  getUsage: (workspaceId: string) => apiRequest(`/api/chat/usage?workspace_id=${workspaceId}`),
}

