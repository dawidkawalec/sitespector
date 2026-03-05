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
    try {
      return JSON.parse(bodyText) as T
    } catch (error) {
      console.error('Failed to parse JSON response:', error)
      throw new Error(`Invalid JSON response from server: ${bodyText.substring(0, 100)}`)
    }
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
  workspace_id?: string | null
  project_id?: string | null
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  ai_status?: 'processing' | 'completed' | 'failed' | 'skipped' | null
  execution_plan_status?: 'processing' | 'completed' | 'failed' | 'skipped' | null
  processing_step?: string | null
  processing_logs?: Array<Record<string, any>> | null
  progress_percent?: number | null
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
  crawler_user_agent?: string | null
  crawl_blocked?: boolean
}

export interface CreateAuditData {
  url: string
  competitors?: string[]
  senuto_country_id?: number
  senuto_fetch_mode?: string
  run_ai_pipeline?: boolean
  run_execution_plan?: boolean
  crawler_user_agent?: string | null
}

export interface AuditListResponse {
  items: Audit[]
  total: number
  page: number
  page_size: number
}

// Project types
export interface ProjectStats {
  audits_count: number
  latest_audit_score?: number | null
  latest_audit_at?: string | null
  schedule_active: boolean
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  url: string
  description?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  stats?: ProjectStats
}

export interface CreateProjectData {
  name: string
  url: string
  description?: string | null
}

export interface UpdateProjectData {
  name?: string
  url?: string
  description?: string | null
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'manager' | 'member' | 'viewer'
  email?: string | null
  full_name?: string | null
  created_at: string
}

export interface AddProjectMemberData {
  user_id: string
  role: 'manager' | 'member' | 'viewer'
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

// Projects API
export const projectsAPI = {
  list: (workspaceId: string) =>
    apiRequest<Project[]>(`/api/projects?workspace_id=${workspaceId}`),

  get: (projectId: string) =>
    apiRequest<Project>(`/api/projects/${projectId}`),

  create: (workspaceId: string, data: CreateProjectData) =>
    apiRequest<Project>(`/api/projects?workspace_id=${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, data: UpdateProjectData) =>
    apiRequest<Project>(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (projectId: string) =>
    apiRequest<void>(`/api/projects/${projectId}`, {
      method: 'DELETE',
    }),

  listMembers: (projectId: string) =>
    apiRequest<ProjectMember[]>(`/api/projects/${projectId}/members`),

  addMember: (projectId: string, data: AddProjectMemberData) =>
    apiRequest<ProjectMember>(`/api/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMember: (projectId: string, memberId: string, data: { role: 'manager' | 'member' | 'viewer' }) =>
    apiRequest<ProjectMember>(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  removeMember: (projectId: string, memberId: string) =>
    apiRequest<void>(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    }),
}

// Audits API (Workspace-based)
export const auditsAPI = {
  list: (workspaceId: string, projectId?: string) =>
    apiRequest<AuditListResponse>(
      `/api/audits?workspace_id=${workspaceId}${projectId ? `&project_id=${projectId}` : ''}`
    ),

  get: (id: string) => 
    apiRequest<Audit>(`/api/audits/${id}`),

  create: (workspaceId: string, data: CreateAuditData, projectId?: string) =>
    apiRequest<Audit>(
      `/api/audits?workspace_id=${workspaceId}${projectId ? `&project_id=${projectId}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  delete: (id: string) =>
    apiRequest<void>(`/api/audits/${id}`, {
      method: 'DELETE',
    }),

  assignProject: (auditId: string, projectId: string | null) =>
    apiRequest<Audit>(
      `/api/audits/${auditId}/assign-project${projectId ? `?project_id=${projectId}` : ''}`,
      { method: 'PATCH' }
    ),

  downloadPDF: async (id: string, reportType: 'executive' | 'standard' | 'full' = 'standard'): Promise<Blob> => {
    const token = await getSupabaseToken()
    const headers: Record<string, string> = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/api/audits/${id}/pdf?report_type=${reportType}`, {
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

  getHistory: (workspaceId: string, url: string, projectId?: string) =>
    apiRequest<Audit[]>(
      `/api/audits/history?workspace_id=${workspaceId}&url=${encodeURIComponent(url)}${projectId ? `&project_id=${projectId}` : ''}`
    ),
  
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

  runExecutionPlan: (auditId: string) =>
    apiRequest<{ status: string; message: string }>(`/api/audits/${auditId}/run-execution-plan`, {
      method: 'POST',
    }),

  // Tasks
  getTasks: (auditId: string, params?: { module?: string; priority?: string; status?: string; is_quick_win?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.module) query.set('module', params.module)
    if (params?.priority) query.set('priority', params.priority)
    if (params?.status) query.set('status', params.status)
    if (params?.is_quick_win !== undefined) query.set('is_quick_win', String(params.is_quick_win))
    
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<{ total: number; items: any[] }>(`/api/audits/${auditId}/tasks${queryString}`)
  },

  getTaskSummary: (auditId: string) =>
    apiRequest<{
      total: number
      pending: number
      done: number
      quick_wins_total: number
      quick_wins_done: number
      by_module: Record<string, { total: number; pending: number; done: number }>
      by_priority: Record<string, number>
    }>(`/api/audits/${auditId}/tasks/summary`),

  updateTask: (auditId: string, taskId: string, data: { status?: string; notes?: string; priority?: string }) =>
    apiRequest<any>(`/api/audits/${auditId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  bulkUpdateTasks: (auditId: string, data: { task_ids: string[]; status?: string; priority?: string }) =>
    apiRequest<{ updated: number }>(`/api/audits/${auditId}/tasks/bulk`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Schedules
  listSchedules: (workspaceId: string, projectId?: string) =>
    apiRequest<any[]>(
      `/api/schedules?workspace_id=${workspaceId}${projectId ? `&project_id=${projectId}` : ''}`
    ),
  createSchedule: (data: { workspace_id: string; project_id?: string; url: string; frequency: string; include_competitors?: boolean; competitors_urls?: string[] }) =>
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

// ─── Admin API (super admin only) ────────────────────────────────────────────

export interface AdminStats {
  users: { total: number; new_7d: number; new_30d: number }
  workspaces: { total: number }
  projects: { total: number }
  audits: {
    total: number
    today: number
    this_month: number
    pending_queue: number
    by_status: Record<string, number>
    per_day_30d: Array<{ date: string; count: number }>
    avg_processing_minutes: number | null
    avg_overall_score: number | null
    avg_seo_score: number | null
    avg_performance_score: number | null
    avg_content_score: number | null
  }
  reports: { pdf_generated: number }
  billing: { plan_distribution: Record<string, number>; total_revenue_usd: number }
}

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  is_super_admin: boolean
  created_at: string | null
  last_sign_in_at: string | null
  workspace_count: number
  plan: string
  audit_limit: number
  audits_used_this_month: number
  total_audits: number
}

export interface AdminUserDetail extends AdminUser {
  avatar_url: string | null
  confirmed_at: string | null
  workspaces: Array<{
    id: string
    name: string
    slug: string
    type: string
    role: string
    created_at: string | null
    subscription?: {
      plan: string
      status: string
      audit_limit: number
      audits_used_this_month: number
    } | null
  }>
  projects_count: number
  total_audits: number
  audits: Array<{
    id: string
    url: string
    status: string | null
    overall_score: number | null
    seo_score: number | null
    performance_score: number | null
    content_score: number | null
    workspace_id: string | null
    project_id: string | null
    created_at: string | null
    completed_at: string | null
    pdf_url: string | null
  }>
  chat_messages_count: number
}

export interface AdminWorkspace {
  id: string
  name: string
  slug: string
  type: string
  owner_id: string | null
  owner_email: string
  created_at: string | null
  member_count: number
  project_count: number
  audit_count: number
  plan: string
  subscription_status: string
  audit_limit: number
  audits_used_this_month: number
}

export interface AdminAudit {
  id: string
  url: string
  status: string | null
  overall_score: number | null
  seo_score: number | null
  performance_score: number | null
  content_score: number | null
  workspace_id: string | null
  workspace_name: string
  project_id: string | null
  created_at: string | null
  started_at: string | null
  completed_at: string | null
  pdf_url: string | null
  ai_status: string | null
}

export interface AdminAuditDetail {
  id: string
  user_id: string | null
  workspace_id: string | null
  project_id: string | null
  url: string
  status: string | null
  ai_status: string | null
  execution_plan_status: string | null
  processing_step: string | null
  processing_logs: Array<Record<string, any>> | null
  progress_percent: number | null
  overall_score: number | null
  seo_score: number | null
  performance_score: number | null
  content_score: number | null
  is_local_business: boolean | null
  results: Record<string, any>
  pdf_url: string | null
  error_message: string | null
  created_at: string | null
  started_at: string | null
  completed_at: string | null
  competitors: Array<{
    id: string
    audit_id: string | null
    url: string
    status: string | null
    results: Record<string, any>
    created_at: string | null
  }>
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  per_page: number
  items: T[]
}

export interface AdminAuditsResponse extends PaginatedResponse<AdminAudit> {
  aggregate: {
    success_rate: number | null
    avg_processing_minutes: number | null
    avg_overall_score: number | null
    avg_seo_score: number | null
    avg_performance_score: number | null
    completed: number
    failed: number
  }
}

export const adminAPI = {
  getStats: () => apiRequest<AdminStats>('/api/admin/stats'),

  listUsers: (params?: { page?: number; per_page?: number; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.per_page) q.set('per_page', String(params.per_page))
    if (params?.search) q.set('search', params.search)
    const qs = q.toString() ? `?${q.toString()}` : ''
    return apiRequest<PaginatedResponse<AdminUser>>(`/api/admin/users${qs}`)
  },

  getUser: (userId: string) =>
    apiRequest<AdminUserDetail>(`/api/admin/users/${userId}`),

  changeUserPlan: (userId: string, data: { workspace_id: string; plan: string; audit_limit?: number }) =>
    apiRequest<{ success: boolean; workspace_id: string; plan: string }>(
      `/api/admin/users/${userId}/plan`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),

  listWorkspaces: (params?: { page?: number; per_page?: number; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.per_page) q.set('per_page', String(params.per_page))
    if (params?.search) q.set('search', params.search)
    const qs = q.toString() ? `?${q.toString()}` : ''
    return apiRequest<PaginatedResponse<AdminWorkspace>>(`/api/admin/workspaces${qs}`)
  },

  listAudits: (params?: {
    page?: number
    per_page?: number
    status?: string
    date_from?: string
    date_to?: string
  }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.per_page) q.set('per_page', String(params.per_page))
    if (params?.status) q.set('status', params.status)
    if (params?.date_from) q.set('date_from', params.date_from)
    if (params?.date_to) q.set('date_to', params.date_to)
    const qs = q.toString() ? `?${q.toString()}` : ''
    return apiRequest<AdminAuditsResponse>(`/api/admin/audits${qs}`)
  },

  getAudit: (auditId: string) =>
    apiRequest<AdminAuditDetail>(`/api/admin/audits/${auditId}`),

  getSystem: () => apiRequest<any>('/api/admin/system'),

  resetWorkspaceUsage: (workspaceId: string) =>
    apiRequest<{ success: boolean; workspace_id: string; audits_used_this_month: number }>(
      `/api/admin/workspaces/${workspaceId}/reset-usage`,
      { method: 'POST' }
    ),
}
