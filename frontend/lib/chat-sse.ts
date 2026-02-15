import { supabase } from './supabase'

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

type StreamHandlers = {
  onToken: (token: string) => void
  onDone: () => void
  onError: (err: Error) => void
  onStatus?: (status: string) => void
}

export async function streamChatMessage(
  conversationId: string,
  content: string,
  handlers: StreamHandlers
): Promise<void> {
  const token = await getSupabaseToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/messages/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ content }),
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE events are separated by blank lines
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''

      for (const part of parts) {
        const lines = part.split('\n').map((l) => l.trim())
        const dataLines = lines.filter((l) => l.startsWith('data:'))
        for (const dl of dataLines) {
          const data = dl.replace(/^data:\s*/, '')
          if (!data) continue
          if (data === '[DONE]') {
            handlers.onDone()
            return
          }
          try {
            const parsed = JSON.parse(data) as { token?: string; error?: string; status?: string }
            if (parsed.error) {
              handlers.onError(new Error(parsed.error))
              continue
            }
            if (parsed.status && handlers.onStatus) {
              handlers.onStatus(parsed.status)
              continue
            }
            if (parsed.token) handlers.onToken(parsed.token)
          } catch {
            // Fallback: treat as raw token text
            handlers.onToken(data)
          }
        }
      }
    }
    handlers.onDone()
  } catch (e) {
    handlers.onError(e as Error)
  } finally {
    reader.releaseLock()
  }
}

