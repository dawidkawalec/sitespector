# SiteSpector - API Client

## Overview

Frontend API client for communicating with SiteSpector backend.

**Location**: `frontend/lib/api.ts`

**Base URL**: `https://sitespector.app` (production, from `NEXT_PUBLIC_API_URL`) or `http://localhost:8000` (local - not used)

---

## Configuration

### API URL

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

**Environment variable**: `NEXT_PUBLIC_API_URL=https://sitespector.app`

---

## Token Management

### Store Token

```typescript
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sitespector_token', token)
  }
}
```

### Get Token

```typescript
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sitespector_token')
  }
  return null
}
```

### Remove Token (Logout)

```typescript
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sitespector_token')
  }
}
```

### Check Authentication

```typescript
export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}
```

---

## Generic API Request Helper

```typescript
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
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
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}
```

**Features**:
- Auto-adds `Authorization` header if token exists
- Auto-parses JSON response
- Throws error if response not OK
- Type-safe with TypeScript generics

---

## TypeScript Types

### User

```typescript
export interface User {
  id: string  // UUID
  email: string
  full_name: string | null
  is_active: boolean
  subscription_tier: string  // 'free' | 'pro' | 'enterprise'
  audits_count: number
  created_at: string  // ISO 8601
  updated_at?: string  // ISO 8601
}
```

### Audit

```typescript
export interface Audit {
  id: string  // UUID
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string  // ISO 8601
  started_at?: string | null
  completed_at: string | null
  error_message?: string | null
  overall_score?: number | null  // 0-100
  seo_score?: number | null  // 0-100
  performance_score?: number | null  // 0-100
  content_score?: number | null  // 0-100
  is_local_business?: boolean
  results?: any  // JSONB from database
  pdf_url: string | null
  competitors?: any[]
}
```

**Note**: `results` is `any` because structure varies by audit

### Auth Responses

```typescript
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
```

### Audit Operations

```typescript
export interface CreateAuditData {
  url: string
  competitors?: string[]  // Max 3 URLs
}

export interface AuditListResponse {
  items: Audit[]  // Backend returns "items", not "audits"
  total: number
  page: number
  page_size: number
}
```

---

## Auth API

### Login

```typescript
export const authAPI = {
  login: (data: LoginData) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
```

**Usage**:
```typescript
const response = await authAPI.login({
  email: 'user@example.com',
  password: 'password123'
})

setAuthToken(response.access_token)  // Store token
router.push('/dashboard')  // Redirect to dashboard
```

### Register

```typescript
export const authAPI = {
  register: (data: RegisterData) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
```

**Usage**: Same as login

### Get Current User

```typescript
export const authAPI = {
  me: () => apiRequest<User>('/api/auth/me'),
}
```

**Usage**:
```typescript
const user = await authAPI.me()
console.log(user.email, user.audits_count)
```

---

## Audits API

### List Audits

```typescript
export const auditsAPI = {
  list: () => apiRequest<AuditListResponse>('/api/audits'),
}
```

**Returns**:
```typescript
{
  items: Audit[],
  total: 42,
  page: 1,
  page_size: 20
}
```

**Usage with React Query**:
```typescript
const { data } = useQuery({
  queryKey: ['audits'],
  queryFn: auditsAPI.list
})

const audits = data?.items || []
```

### Get Audit

```typescript
export const auditsAPI = {
  get: (id: string) => apiRequest<Audit>(`/api/audits/${id}`),
}
```

**Usage with polling**:
```typescript
const { data: audit } = useQuery({
  queryKey: ['audit', auditId],
  queryFn: () => auditsAPI.get(auditId),
  refetchInterval: audit?.status === 'processing' ? 5000 : false,
})
```

### Create Audit

```typescript
export const auditsAPI = {
  create: (data: CreateAuditData) =>
    apiRequest<Audit>('/api/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
```

**Usage with mutation**:
```typescript
const createMutation = useMutation({
  mutationFn: auditsAPI.create,
  onSuccess: (audit) => {
    router.push(`/audits/${audit.id}`)
  }
})

createMutation.mutate({
  url: 'https://example.com',
  competitors: ['https://competitor.com']
})
```

### Delete Audit

```typescript
export const auditsAPI = {
  delete: (id: string) =>
    apiRequest<void>(`/api/audits/${id}`, {
      method: 'DELETE',
    }),
}
```

**Usage**:
```typescript
const deleteMutation = useMutation({
  mutationFn: auditsAPI.delete,
  onSuccess: () => {
    router.push('/dashboard')
  }
})

deleteMutation.mutate(auditId)
```

### Download PDF

```typescript
export const auditsAPI = {
  downloadPDF: async (id: string): Promise<Blob> => {
    const token = getAuthToken()
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
}
```

**Usage**:
```typescript
const downloadPDF = async () => {
  try {
    const blob = await auditsAPI.downloadPDF(auditId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_${auditId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Error downloading PDF:', error)
  }
}
```

---

## Error Handling

### API Request Errors

```typescript
try {
  const audit = await auditsAPI.get(auditId)
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)  // "Audit not found" or "HTTP 404"
  }
}
```

### React Query Error Handling

```typescript
const { data, isError, error } = useQuery({
  queryKey: ['audit', auditId],
  queryFn: () => auditsAPI.get(auditId),
})

if (isError) {
  return <Alert variant="destructive">{error.message}</Alert>
}
```

---

## Authentication Flow

### Login Flow

```typescript
// 1. User submits login form
const { email, password } = formData

// 2. Call API
const response = await authAPI.login({ email, password })

// 3. Store token
setAuthToken(response.access_token)

// 4. Redirect to dashboard
router.push('/dashboard')
```

### Logout Flow

```typescript
// 1. Remove token
removeAuthToken()

// 2. Redirect to login
router.push('/login')
```

### Protected Pages

```typescript
'use client'

export default function DashboardPage() {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const authStatus = isAuthenticated()
    setIsAuth(authStatus)
    if (!authStatus) {
      router.push('/login')
    }
  }, [router])

  if (!isAuth) return null

  return <div>Dashboard content</div>
}
```

---

## React Query Configuration

**Provider**: `frontend/components/Providers.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## Common Patterns

### Polling for Audit Status

```typescript
const { data: audit } = useQuery({
  queryKey: ['audit', auditId],
  queryFn: () => auditsAPI.get(auditId),
  refetchInterval: (query) => {
    const data = query?.state?.data as Audit | undefined
    // Poll every 5 seconds if processing
    if (data?.status === 'processing' || data?.status === 'pending') {
      return 5000
    }
    return false  // Stop polling
  },
  enabled: !!auditId,
})
```

### Mutation with Invalidation

```typescript
const deleteMutation = useMutation({
  mutationFn: auditsAPI.delete,
  onSuccess: () => {
    // Invalidate audits list to refetch
    queryClient.invalidateQueries({ queryKey: ['audits'] })
    router.push('/dashboard')
  },
})
```

---

## Future Improvements

### 1. Retry Logic

```typescript
const { data } = useQuery({
  queryKey: ['audit', auditId],
  queryFn: () => auditsAPI.get(auditId),
  retry: 3,  // Retry 3 times on failure
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

### 2. Request Cancellation

```typescript
const abortController = new AbortController()

fetch(url, { signal: abortController.signal })

// Cancel request
abortController.abort()
```

### 3. Optimistic Updates

```typescript
const updateMutation = useMutation({
  mutationFn: auditsAPI.update,
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['audit', auditId] })

    // Snapshot previous value
    const previousAudit = queryClient.getQueryData(['audit', auditId])

    // Optimistically update
    queryClient.setQueryData(['audit', auditId], newData)

    return { previousAudit }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['audit', auditId], context?.previousAudit)
  },
})
```

---

**Last Updated**: 2025-02-03  
**HTTP Client**: Native Fetch API  
**State Management**: TanStack Query (React Query)  
**Authentication**: JWT Bearer Token (localStorage)
