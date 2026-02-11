# SiteSpector - Frontend Pages

## Overview

SiteSpector uses **Next.js 14 App Router** with file-based routing.

**Pages location**: `frontend/app/`

---

## Page Structure

```
app/
├── layout.tsx                 # Root layout (providers, metadata)
├── globals.css                # Global styles
├── (public)/                  # Route group: PublicNavbar + gradient bg + PublicFooter
│   ├── layout.tsx             # Public layout (navbar, main, footer)
│   ├── page.tsx               # Homepage (/) – redirect to /dashboard when logged in
│   ├── login/page.tsx         # Auth (/login) – tabs: Zaloguj | Zarejestruj (Supabase)
│   └── register/page.tsx      # Redirect to /login?mode=register
├── (app)/                     # Authenticated app with UnifiedSidebar
│   ├── layout.tsx             # Sidebar layout (workspace switcher)
│   ├── dashboard/page.tsx     # Dashboard + workspace analytics
│   ├── audits/[id]/           # Audit detail + subpages
│   │   ├── page.tsx           # Overview (enriched with Senuto stats)
│   │   ├── seo/page.tsx
│   │   ├── performance/page.tsx
│   │   ├── visibility/page.tsx    # Senuto Visibility Analysis (NEW)
│   │   ├── backlinks/page.tsx     # Senuto Backlinks Analysis (NEW)
│   │   ├── quick-wins/page.tsx
│   │   ├── comparison/page.tsx
│   │   ├── client-report/page.tsx
│   │   ├── ai-analysis/, pdf/, links/, images/, etc.
│   │   └── layout.tsx
│   ├── pricing/page.tsx
│   ├── settings/              # Profile, Team, Billing, Appearance, Notifications, Schedules
│   └── invite/[token]/page.tsx
└── auth/callback/page.tsx     # OAuth callback (Supabase)
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

## Homepage (`app/(public)/page.tsx`)

**Route**: `/`

**Purpose**: Public landing; redirects to `/dashboard` when authenticated. Otherwise shows landing content (same layout as login: PublicNavbar, gradient background, PublicFooter with single CTA to `/login`).

---

## Login Page (`app/(public)/login/page.tsx`)

**Route**: `/login`

**Purpose**: User authentication (Supabase Auth). Same visual layout as landing: PublicNavbar, gradient background, PublicFooter.

**Features**:
- Tabs: **Zaloguj się** | **Zarejestruj się** (single page, no separate register route in UI)
- Email + password, OAuth (Google, GitHub), Magic link
- Redirect to `/dashboard` on success; unauthenticated users see CTA in navbar/footer
- Auth state via Supabase; token stored in session, redirect to `auth/callback` for OAuth

---

## Register Page (`app/(public)/register/page.tsx`)

**Route**: `/register`

**Purpose**: Redirects to `/login?mode=register` so registration is handled on the same page with tabs.

---

## Dashboard Page (`app/(app)/dashboard/page.tsx`)

**Route**: `/dashboard`

**Purpose**: Workspace-scoped audit list and analytics. Uses `useWorkspace()` for current workspace.

**Features**:
- Workspace analytics (usage, stats)
- Audit list with status badges
- New Audit button (NewAuditDialog)
- Click to audit detail; sidebar with workspace switcher

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

## Audit Detail Page (`app/(app)/audits/[id]/page.tsx`)

**Route**: `/audits/:id`

**Purpose**: Display detailed audit results (overview). Subpages under same layout for SEO, Performance, Quick Wins, Comparison, Client Report, AI Analysis, PDF, Links, Images, etc.

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

**Last Updated**: 2026-02-09  
**Framework**: Next.js 14 (App Router)  
**Route groups**: `(public)` – landing, login, register; `(app)` – dashboard, audits, pricing, settings, invite  
**Status**: Fully functional; auth + landing unified layout; UnifiedSidebar; audit subpages (SEO, Performance, Quick Wins, Comparison, Client Report, etc.)
