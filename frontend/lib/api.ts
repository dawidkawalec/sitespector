/**
 * API client for SiteSpector backend
 * 
 * Version 2.0: Uses Supabase Auth tokens and workspace-based API
 */

import { supabase } from './supabase'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api$/, '')

// Get Supabase session token (with auto-refresh)
async function getSupabaseToken(): Promise<string | null> {
  try {
    // Try to refresh session first to ensure token is valid
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    
    // If session exists but might be expired, try to refresh
    if (session) {
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)
      
      // If token expires in less than 5 minutes, refresh it
      if (expiresAt && (expiresAt - now) < 300) {
        console.log('🔄 Token expiring soon, refreshing...')
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Error refreshing session:', refreshError)
          return session.access_token
        }
        
        if (newSession) {
          console.log('✅ Token refreshed successfully')
          return newSession.access_token
        }
      }
      
      return session.access_token
    }
    
    return null
  } catch (err) {
    console.error('Error in getSupabaseToken:', err)
    return null
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// API helper with Supabase token
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getSupabaseToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    try {
      const parsed = errorText ? JSON.parse(errorText) : null
      const detail = parsed?.detail
      throw new Error(detail || `HTTP ${response.status}`)
    } catch {
      throw new Error(errorText || `HTTP ${response.status}`)
    }
  }

  // Many endpoints (e.g. DELETE) return 204 No Content.
  if (response.status === 204) {
    return undefined as unknown as T
  }

  const bodyText = await response.text()
  if (!bodyText) {
    return undefined as unknown as T
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return JSON.parse(bodyText) as T
  }

  // Fallback for non-JSON success responses (rare in this app).
  try {
    return JSON.parse(bodyText) as T
  } catch {
    return bodyText as unknown as T
  }
}

// Legacy token management (deprecated, kept for backward compatibility)
const TOKEN_KEY = 'sitespector_token'
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// Types
export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  subscription_tier: string
  audits_count: number
  created_at: string
  updated_at?: string
}

export interface Audit {
  id: string
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  ai_status?: 'processing' | 'completed' | 'failed' | 'skipped' | null
  processing_step?: string | null
  processing_logs?: Array<Record<string, any>> | null
  created_at: string
  started_at?: string | null
  completed_at: string | null
  error_message?: string | null
  overall_score?: number | null
  seo_score?: number | null
  performance_score?: number | null
  content_score?: number | null
  is_local_business?: boolean
  results?: any
  screaming_frog_data?: any
  lighthouse_desktop_data?: any
  lighthouse_mobile_data?: any
  ai_analysis?: any
  pdf_url: string | null
  competitors?: any[]
  senuto_country_id?: number | null
  senuto_fetch_mode?: string | null
}

export interface CreateAuditData {
  url: string
  competitors?: string[]
  senuto_country_id?: number
  senuto_fetch_mode?: string
  run_ai_pipeline?: boolean
}

export interface AuditListResponse {
  items: Audit[]
  total: number
  page: number
  page_size: number
}

// Auth API (Supabase Auth - most operations done via supabase client)
export const authAPI = {
  // Legacy endpoints (deprecated, kept for migration period)
  login: (data: LoginData) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterData) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => apiRequest<User>('/api/auth/me'),
}

// Audits API (Workspace-based)
export const auditsAPI = {
  list: (workspaceId: string) => 
    apiRequest<AuditListResponse>(`/api/audits?workspace_id=${workspaceId}`),

  get: (id: string) => 
    apiRequest<Audit>(`/api/audits/${id}`),

  create: (workspaceId: string, data: CreateAuditData) =>
    apiRequest<Audit>(`/api/audits?workspace_id=${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/audits/${id}`, {
      method: 'DELETE',
    }),

  downloadPDF: async (id: string): Promise<Blob> => {
    const token = await getSupabaseToken()
    const headers: Record<string, string> = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/api/audits/${id}/pdf`, {
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to download PDF')
    }

    return response.blob()
  },
  
  downloadRaw: async (id: string): Promise<Blob> => {
    const token = await getSupabaseToken()
    const headers: Record<string, string> = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/api/audits/${id}/raw`, {
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to download raw data')
    }

    return response.blob()
  },

  getHistory: (workspaceId: string, url: string) =>
    apiRequest<Audit[]>(`/api/audits/history?workspace_id=${workspaceId}&url=${encodeURIComponent(url)}`),
  
  getFixSuggestion: (auditId: string, issueType: string, urls: string[]) =>
    apiRequest<any>(`/api/audits/${auditId}/fix-suggestion`, {
      method: 'POST',
      body: JSON.stringify({ issue_type: issueType, urls }),
    }),

  analyzePages: (auditId: string, pageIndices: number[]) =>
    apiRequest<Record<number, any>>(`/api/audits/${auditId}/analyze-pages`, {
      method: 'POST',
      body: JSON.stringify({ page_indices: pageIndices }),
    }),

  getQuickWins: (auditId: string) =>
    apiRequest<any[]>(`/api/audits/${auditId}/quick-wins`),

  generateAlt: (auditId: string, imageUrl: string) =>
    apiRequest<{ alt_text: string }>(`/api/audits/${auditId}/generate-alt`, {
      method: 'POST',
      body: JSON.stringify({ image_url: imageUrl }),
    }),

  runAi: (auditId: string) =>
    apiRequest<{ status: string; message: string }>(`/api/audits/${auditId}/run-ai`, {
      method: 'POST',
    }),

  runAiContext: (auditId: string, area?: string) =>
    apiRequest<{ status: string; areas_analyzed: string[]; message: string }>(
      `/api/audits/${auditId}/run-ai-context${area ? `?area=${area}` : ''}`,
      { method: 'POST' }
    ),

  // Schedules
  listSchedules: (workspaceId: string) =>
    apiRequest<any[]>(`/api/schedules?workspace_id=${workspaceId}`),
  createSchedule: (data: any) =>
    apiRequest<any>('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id: string, data: any) =>
    apiRequest<any>(`/api/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSchedule: (id: string) =>
    apiRequest<void>(`/api/schedules/${id}`, { method: 'DELETE' }),
}

// System API
export const systemAPI = {
  getStatus: () => apiRequest<any>('/api/system/status'),
}
