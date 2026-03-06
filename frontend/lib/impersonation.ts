'use client'

export const IMPERSONATION_STORAGE_KEY = 'sitespector_impersonation_session'
export const IMPERSONATION_EVENT = 'sitespector:impersonation-changed'

export interface ImpersonationSession {
  impersonationToken: string
  auditId: string
  workspaceId: string | null
  projectId: string | null
  expiresAt: string
  startedAt: string
}

function emitImpersonationChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(IMPERSONATION_EVENT))
  }
}

export function getImpersonationSession(): ImpersonationSession | null {
  if (typeof window === 'undefined') return null

  const raw = sessionStorage.getItem(IMPERSONATION_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as ImpersonationSession
    if (!parsed?.impersonationToken || !parsed?.auditId || !parsed?.expiresAt) {
      sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY)
      return null
    }

    const expiry = new Date(parsed.expiresAt).getTime()
    if (!Number.isFinite(expiry) || Date.now() >= expiry) {
      sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY)
      emitImpersonationChange()
      return null
    }

    return parsed
  } catch {
    sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY)
    return null
  }
}

export function setImpersonationSession(session: ImpersonationSession): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(session))
  emitImpersonationChange()
}

export function clearImpersonationSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY)
  emitImpersonationChange()
}

export function isImpersonating(): boolean {
  return !!getImpersonationSession()
}
