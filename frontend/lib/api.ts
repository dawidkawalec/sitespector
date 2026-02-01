/**
 * API client for SiteSpector backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Token management
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

export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}

// API helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
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
  id: number
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
}

export interface Audit {
  id: number
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  error_message?: string | null
  overall_score?: number | null
  screaming_frog_data: any
  lighthouse_desktop_data: any
  lighthouse_mobile_data: any
  ai_analysis: any
  pdf_url: string | null
}

export interface CreateAuditData {
  url: string
}

export interface AuditListResponse {
  audits: Audit[]
  total: number
}

// Auth API
export const authAPI = {
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

// Audits API
export const auditsAPI = {
  list: () => apiRequest<AuditListResponse>('/api/audits'),

  get: (id: number) => apiRequest<Audit>(`/api/audits/${id}`),

  create: (data: CreateAuditData) =>
    apiRequest<Audit>('/api/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/api/audits/${id}`, {
      method: 'DELETE',
    }),

  downloadPDF: async (id: number): Promise<Blob> => {
    const token = getAuthToken()
    const headers: HeadersInit = {}

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
}
