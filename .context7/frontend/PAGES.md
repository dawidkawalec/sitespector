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
│   │   ├── seo/page.tsx       # SEO Analysis (Overview + RAW)
│   │   ├── performance/page.tsx # Performance Analysis (Overview + RAW)
│   │   ├── visibility/page.tsx  # Visibility Analysis (Overview + Keywords + RAW)
│   │   ├── links/page.tsx       # Links Analysis (Internal + Incoming + RAW)
│   │   ├── images/page.tsx      # Images Analysis (Overview + RAW)
│   │   ├── ux-check/page.tsx    # UX Analysis
│   │   ├── security/page.tsx    # Security Analysis
│   │   ├── ai-strategy/page.tsx # AI Strategy + Roadmap
│   │   ├── quick-wins/page.tsx
│   │   ├── comparison/page.tsx
│   │   ├── client-report/page.tsx
│   │   ├── pdf/
│   │   ├── architecture/
│   │   ├── competitors/
│   │   ├── benchmark/
│   │   ├── debug/
│   │   └── layout.tsx
│   ├── pricing/page.tsx
│   ├── settings/              # Profile, Team, Billing, Appearance, Notifications, Schedules
│   └── invite/[token]/page.tsx
└── auth/callback/page.tsx     # OAuth callback (Supabase)
```

---

## Information Architecture (IA)

The application follows a tool-agnostic IA where data from multiple sources (Screaming Frog, Lighthouse, Senuto) is consolidated into logical SEO areas:

1.  **SEO**: Technical on-page data, titles, meta tags, indexability.
2.  **Wydajność**: Core Web Vitals, Lighthouse scores, performance diagnostics.
3.  **Widoczność**: Keyword rankings, visibility trends, competitors (from Senuto).
4.  **Linki**: Internal linking structure (Crawl) and Backlinks profile (Senuto).
5.  **Obrazy**: Image optimization, ALT tags, file sizes.
6.  **Użyteczność & Bezpieczeństwo**: UX and security diagnostics.

### RAW Data Access
Each major section contains a **Surowe dane (RAW)** tab providing access to the underlying datasets with search, sort, and export (CSV/JSON) capabilities.

---

## Root Layout (`app/layout.tsx`)

**Purpose**: Wrapper for all pages (HTML, body, providers)

**Features**:
- Global styles
- TanStack Query provider
- Metadata (title, description)

---

## Homepage (`app/(public)/page.tsx`)

**Route**: `/`

**Purpose**: Public landing; redirects to `/dashboard` when authenticated. Otherwise shows landing content.

---

## Login Page (`app/(public)/login/page.tsx`)

**Route**: `/login`

**Purpose**: User authentication (Supabase Auth).

---

## Dashboard Page (`app/(app)/dashboard/page.tsx`)

**Route**: `/dashboard`

**Purpose**: Workspace-scoped audit list and analytics. Uses `useWorkspace()` for current workspace.

**UX Notes**:
- Destructive actions (delete audit) show explicit user feedback:
  - loading toast ("Usuwanie audytu..."),
  - disabled controls + spinner on the delete action,
  - success/error toast and list refresh.

---

## Audit Detail Page (`app/(app)/audits/[id]/page.tsx`)

**Route**: `/audits/:id`

**Purpose**: Display detailed audit results (overview). Subpages under same layout.

---

## Client-Side vs Server-Side

### Client Components (`'use client'`)

All pages use `'use client'` because:
- React hooks (useState, useEffect)
- TanStack Query (useQuery, useMutation)
- Browser APIs (localStorage, router)

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

---

## Loading States

### Page-level loading

```tsx
const { data, isLoading } = useQuery(...)

if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
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

**Last Updated**: 2026-02-11  
**Framework**: Next.js 14 (App Router)  
**Status**: Tool-agnostic IA implemented with RAW data explorers.
