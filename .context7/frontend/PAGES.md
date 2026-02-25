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
│   ├── register/page.tsx      # Redirect to /login?mode=register
│   └── sitemap/page.tsx       # Mapa strony (human-readable) – pełna struktura linków (bez anchorów typu /#price)
├── (app)/                     # Authenticated app with UnifiedSidebar
│   ├── layout.tsx             # Sidebar layout (workspace switcher)
│   ├── admin/                 # Super admin panel (is_super_admin = true required)
│   │   ├── layout.tsx         # Admin layout + guard (redirects non-admins to /dashboard)
│   │   ├── page.tsx           # Overview: KPIs, charts, plan distribution, status breakdown
│   │   ├── users/
│   │   │   ├── page.tsx       # User list (search, pagination, inline plan change)
│   │   │   └── [userId]/page.tsx  # User detail: profile, workspaces, audits, chat stats
│   │   ├── workspaces/page.tsx    # All workspaces with owner, plan, member/project/audit counts
│   │   ├── audits/page.tsx        # All audits with filters, aggregate stats
│   │   └── system/page.tsx        # Service health cards + worker queue
│   ├── dashboard/page.tsx    # Dashboard + workspace analytics + project cards
│   ├── projects/
│   │   ├── page.tsx           # Project list (create project)
│   │   └── [projectId]/
│   │       ├── layout.tsx     # Project context
│   │       ├── page.tsx       # Project dashboard (latest audit, stats)
│   │       ├── audits/page.tsx    # Audit list for project
│   │       ├── compare/page.tsx   # Compare audits within project
│   │       ├── schedule/page.tsx  # Project schedules
│   │       └── team/page.tsx      # Project members (manager/member/viewer)
│   ├── audits/[id]/           # Audit detail + subpages (URL unchanged for backward compat)
│   │   ├── page.tsx           # Overview (enriched with Senuto stats)
│   │   ├── seo/page.tsx       # SEO Analysis (Overview + RAW)
│   │   ├── performance/page.tsx # Performance Analysis (Overview + RAW)
│   │   ├── visibility/page.tsx  # Visibility Analysis (6+ tabs, features distributions, sections, cannibalization)
│   │   ├── ai-overviews/page.tsx # AI Overviews module (KPI, keywords, competitors)
│   │   ├── links/page.tsx       # Links Analysis (Internal + Incoming + RAW, large-data friendly)
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
│   ├── settings/              # Profile, Team, Billing, Appearance, Notifications, Schedules, Agents
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

**Purpose**: Workspace trends overview — project cards, analytics chart, workspace-level average scores, and read-only recent audits list. **No audit creation here** — users must go to a project to create audits. CTA redirects to `/projects`. Uses `useWorkspace()` and `projectsAPI.list` for project cards.

**Feb 2026 change**: Removed "Nowy Audyt" button and `NewAuditDialog`. Dashboard is read-only analytics. Audit creation flow: Dashboard → Projects → Project page → "Nowy audyt".

## Project Pages (`app/(app)/projects/`)

**Routes**: `/projects`, `/projects/[projectId]`, `/projects/[projectId]/audits`, `/compare`, `/schedule`, `/team`

**Purpose**: Projects = one website per workspace. List projects, open project dashboard (stats, latest audit, schedule, team), list/compare audits, manage schedule and project members. Audit detail stays at `/audits/[id]` for backward compatibility; sidebar shows "Wróć do projektu" when audit has `project_id`.

**UX Notes**:
- Destructive actions (delete audit) show explicit user feedback:
  - loading toast ("Usuwanie audytu..."),
  - disabled controls + spinner on the delete action,
  - success/error toast and list refresh.
- Numeric metrics in dashboard cards/charts are normalized for readability:
  - score values displayed with 2 decimal places,
  - trend chart tooltip uses formatted values (no raw long floats).

---

## Audit Detail Page (`app/(app)/audits/[id]/page.tsx`)

**Route**: `/audits/:id`

**Purpose**: Display detailed audit results (overview). Subpages under same layout.

### Feb 2026 additions
- Expanded Senuto KPI grid with `domain_rank`, `ads_equivalent`, and AIO quick stats.
- Added technology chips section from Senuto domain dashboard payload.
- Added direct quick-link card to `/audits/[id]/ai-overviews`.

## Visibility Page (`app/(app)/audits/[id]/visibility/page.tsx`)

Expanded from basic 3 tabs to multi-module workflow:
- `Przegląd`
- `Pozycje`
- `Wzrosty/Spadki`
- `Pozyskane/Utracone`
- `Cechy fraz`
- `Strony`
- `Kanibalizacja`
- `Surowe dane`

Heavy computations are memoized (`useMemo`) for large keyword datasets.

## AI Overviews Page (`app/(app)/audits/[id]/ai-overviews/page.tsx`)

Dedicated page for Senuto AIO data:
- KPI cards (citations, avg AIO position, wins/losses, visibility loss)
- Position distribution + intent distribution charts
- Keyword-level explorer table
- Competitor comparison chart + table

## AI Strategy + Quick Wins Alignment (Feb 2026)

- `ai-strategy` now consumes a unified `results.quick_wins` list aggregated from all `results.ai_contexts.*.quick_wins`, roadmap immediate actions, and ROI content plan.
- Quick wins include `category` and `source` metadata so module-level actions are visible also in the global quick wins section.
- `quick-wins` page and `ai-strategy` page now read the same canonical quick wins dataset (no 3-item fallback mismatch when richer AI data exists).

---

## Client-Side vs Server-Side

### Client Components (`'use client'`)

All pages use `'use client'` because:
- React hooks (useState, useEffect)
- TanStack Query (useQuery, useMutation)
- Browser APIs (localStorage, router)

---

## Navigation Patterns

### Public navbar consistency

- `frontend/components/layout/PublicNavbar.tsx` is kept **structurally consistent** with the marketing navigation (landing app):
  - no scroll-to-section links (`/#price`, `/#about`, etc.)
  - dropdown/mega-menu structure: Produkt, Dla kogo, Zasoby, Firma + direct `/cennik`

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

---

## Authenticated App Shell (`app/(app)/layout.tsx`)

**Purpose**: Persistent shell for all authenticated pages.

**Key UI blocks**:
- `UnifiedSidebar` on the left
- Scrollable content `<main>` in the middle
- Persistent `ChatPanel` on the right (desktop)

**Responsive rule (important)**:
- The content `<main>` is marked as a container (`@container`) so child pages can use container-query utilities (`@md:`, `@lg:`, `@xl:`) that react to the *available content width* when chat is open.
- Inside app pages, prefer `@md:` / `@lg:` over viewport `md:` / `lg:` when the layout should adapt to the content area.

**Last Updated**: 2026-02-16  
**Framework**: Next.js 14 (App Router)  
**Status**: Tool-agnostic IA implemented with RAW data explorers.
