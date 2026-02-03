# SiteSpector - Frontend Pages

## Overview

SiteSpector uses **Next.js 14 App Router** with file-based routing.

**Pages location**: `frontend/app/`

---

## Page Structure

```
app/
├── layout.tsx              # Root layout (wraps all pages)
├── globals.css             # Global styles
├── page.tsx                # Homepage (/)
├── login/
│   └── page.tsx            # Login page (/login)
├── register/
│   └── page.tsx            # Register page (/register)
├── dashboard/
│   └── page.tsx            # Dashboard (/dashboard)
└── audits/
    └── [id]/
        └── page.tsx        # Audit detail page (/audits/:id)
```

---

## Root Layout (`app/layout.tsx`)

**Purpose**: Wrapper for all pages (HTML, body, providers)

**Features**:
- Global styles
- TanStack Query provider
- Metadata (title, description)

**Code**:
```tsx
import './globals.css'
import type { Metadata } from 'next'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'SiteSpector - SEO & Technical Audit Platform',
  description: 'Automated website auditing with AI-powered recommendations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

---

## Homepage (`app/page.tsx`)

**Route**: `/`

**Purpose**: Landing page (public, redirects to login if not authenticated)

**Status**: Basic implementation (needs design)

**Code**:
```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">SiteSpector</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Automated website auditing platform
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push('/login')}>Login</Button>
        <Button variant="outline" onClick={() => router.push('/register')}>
          Register
        </Button>
      </div>
    </div>
  )
}
```

---

## Login Page (`app/login/page.tsx`)

**Route**: `/login`

**Purpose**: User authentication

**Features**:
- Email + password form
- JWT token storage
- Redirects to dashboard on success
- Error handling

**Code structure**:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, setAuthToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authAPI.login({ email, password })
      setAuthToken(response.access_token)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        
        {error && (
          <Alert variant="destructive">{error}</Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/register" className="text-primary hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

## Register Page (`app/register/page.tsx`)

**Route**: `/register`

**Purpose**: User registration

**Features**: Similar to login + password validation

**Validation**:
- Email: Valid email format
- Password: Min 8 chars, uppercase, lowercase, digit

---

## Dashboard Page (`app/dashboard/page.tsx`)

**Route**: `/dashboard`

**Purpose**: List all audits for authenticated user

**Features**:
- Audit list (paginated)
- Create audit button (opens NewAuditDialog)
- Status badges
- Click to view details
- Logout button

**Code structure**:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI, isAuthenticated, removeAuthToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import NewAuditDialog from '@/components/NewAuditDialog'
import { formatDate, formatScore, getStatusBadgeVariant } from '@/lib/utils'

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

  const { data, isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: auditsAPI.list,
    enabled: isAuth,
  })

  const handleLogout = () => {
    removeAuthToken()
    router.push('/login')
  }

  if (!isAuth) return null

  const audits = data?.items || []

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <NewAuditDialog />
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {isLoading && <p>Loading...</p>}

      <div className="grid gap-4">
        {audits.map((audit) => (
          <Card
            key={audit.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/audits/${audit.id}`)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg break-all">{audit.url}</CardTitle>
                  <CardDescription>{formatDate(audit.created_at)}</CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(audit.status)}>
                  {audit.status}
                </Badge>
              </div>
            </CardHeader>
            {audit.status === 'completed' && (
              <CardContent>
                <div className="flex gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall</p>
                    <p className="text-2xl font-bold">{formatScore(audit.overall_score)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SEO</p>
                    <p className="text-2xl font-bold">{formatScore(audit.seo_score)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="text-2xl font-bold">{formatScore(audit.performance_score)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Content</p>
                    <p className="text-2xl font-bold">{formatScore(audit.content_score)}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {audits.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground">
            No audits yet. Create your first audit!
          </p>
        )}
      </div>
    </div>
  )
}
```

---

## Audit Detail Page (`app/audits/[id]/page.tsx`)

**Route**: `/audits/:id`

**Purpose**: Display detailed audit results

**Features**:
- Back button
- Status badge
- Score overview (4 cards)
- Tabs: Overview, SEO, Performance, Content, Competition
- Download PDF button
- Download raw data (ZIP)
- Retry button
- Delete button (with confirmation)
- Polling (every 5s if processing)

**Tabs**:

1. **Overview**:
   - Local business detection
   - AI summary

2. **SEO**:
   - Title, meta description
   - H1 tags
   - Status code, load time, word count, page size
   - **IMPLEMENTED**: `renderSeoResults()`

3. **Performance**:
   - Core Web Vitals (FCP, LCP, TBT, CLS, SI, TTFB)
   - Desktop + mobile scores
   - **IMPLEMENTED**: `renderPerformanceResults()`

4. **Content**:
   - Quality score, readability score, word count
   - AI recommendations
   - **IMPLEMENTED**: `renderContentResults()`

5. **Competition**:
   - Competitor list
   - Competitor results (if completed)

**Key functions**:

```tsx
// Render SEO data (IMPLEMENTED)
const renderSeoResults = (results: any) => {
  const crawl = results?.crawl
  if (!crawl) return <p>No crawl data</p>
  
  return (
    <div className="space-y-6">
      {/* Title, meta, H1, metrics */}
    </div>
  )
}

// Render performance data (IMPLEMENTED)
const renderPerformanceResults = (results: any) => {
  const lh = results?.lighthouse?.desktop
  if (!lh) return <p>No Lighthouse data</p>
  
  return (
    <div className="space-y-6">
      {/* Core Web Vitals, metrics */}
    </div>
  )
}

// Render content data (IMPLEMENTED)
const renderContentResults = (results: any) => {
  const content = results?.content_analysis
  if (!content) return <p>No content analysis</p>
  
  return (
    <div className="space-y-6">
      {/* Quality score, recommendations */}
    </div>
  )
}
```

**Status**: ✅ **FULLY IMPLEMENTED** (rendering functions exist)

---

## Client-Side vs Server-Side

### Client Components (`'use client'`)

All pages use `'use client'` because:
- React hooks (useState, useEffect)
- TanStack Query (useQuery, useMutation)
- Browser APIs (localStorage, router)

### Future: Server Components

**Potential optimization** (not needed for MVP):
- Render public pages server-side
- Pre-fetch initial data
- Better SEO (though app is behind auth)

---

## Navigation Patterns

### Redirect after action

```tsx
const createMutation = useMutation({
  mutationFn: auditsAPI.create,
  onSuccess: (audit) => {
    router.push(`/audits/${audit.id}`)  // Navigate to detail page
  }
})
```

### Back button

```tsx
<Link href="/dashboard">
  <Button variant="ghost">
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back
  </Button>
</Link>
```

---

## Authentication Guards

**Pattern used in all protected pages**:

```tsx
'use client'

export default function ProtectedPage() {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const authStatus = isAuthenticated()
    setIsAuth(authStatus)
    if (!authStatus) {
      router.push('/login')
    }
  }, [router])

  if (!isAuth) return null  // Prevent flash of protected content

  return <div>{/* Protected content */}</div>
}
```

**Future improvement**: Middleware or layout-level auth check

---

## Loading States

### Page-level loading

```tsx
const { data, isLoading } = useQuery(...)

if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}
```

### Inline loading (buttons)

```tsx
<Button disabled={isLoading}>
  {isLoading ? <Loader2 className="animate-spin" /> : 'Submit'}
</Button>
```

---

## Error Handling

```tsx
const { data, isError, error } = useQuery(...)

if (isError) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}
```

---

**Last Updated**: 2025-02-03  
**Framework**: Next.js 14 (App Router)  
**Pages**: 5 (homepage, login, register, dashboard, audit detail)  
**Status**: Fully functional, rendering functions implemented
