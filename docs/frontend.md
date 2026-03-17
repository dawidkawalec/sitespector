# SiteSpector — Frontend

## Overview

Next.js 14 App Router, TypeScript strict, Tailwind CSS + shadcn/ui, TanStack Query + Zustand.

Location: `frontend/`

---

## Routes

### Public Routes `(public)/`

| Route | Description |
|-------|-------------|
| `/` | Landing / homepage |
| `/login` | Email + OAuth sign-in |
| `/register` | New account registration |
| `/sitemap` | Public HTML sitemap |
| `/auth/callback` | OAuth / magic-link callback (outside route groups) |

### App Routes `(app)/` — authenticated

| Route | Description |
|-------|-------------|
| `/dashboard` | Workspace overview (recent audits, stats) |
| `/projects` | Project list for current workspace |
| `/projects/[projectId]` | Single project overview |
| `/projects/[projectId]/audits` | Audit history for project |
| `/projects/[projectId]/compare` | Compare audits within project |
| `/projects/[projectId]/schedule` | Scheduled audit config |
| `/projects/[projectId]/team` | Project-level team access |
| `/pricing` | Plan selection / upgrade |
| `/invite/[token]` | Accept workspace invitation |

### Audit Subpages `/audits/[id]/...`

| Subpage | Description |
|---------|-------------|
| *(index)* | Audit overview — scores, status, progress |
| `ai-analysis` | AI-generated analysis summary |
| `ai-content` | AI content assessment |
| `ai-overviews` | AI Overviews / SGE visibility |
| `ai-readiness` | AI readiness score (Dane/Analiza/Plan) |
| `ai-strategy` | AI strategy recommendations |
| `architecture` | Site architecture graph (Dane/Analiza/Plan) |
| `backlinks` | Backlink profile data |
| `benchmark` | Industry benchmark comparison |
| `client-report` | Exportable client report view |
| `comparison` | Side-by-side audit comparison |
| `competitors` | Competitor analysis |
| `content-quality` | Content quality scoring |
| `crawl-data` | Raw crawl data explorer |
| `debug` | Debug / raw results inspector |
| `images` | Image optimization audit |
| `lighthouse-data` | Lighthouse raw metrics |
| `links` | Internal & external link analysis |
| `pages/[pageIndex]` | Single-page detail view |
| `pdf` | PDF report generation |
| `performance` | Core Web Vitals & performance |
| `quick-wins` | Prioritized quick-win tasks |
| `schema` | Structured data / JSON-LD audit |
| `security` | Security headers & HTTPS checks |
| `seo` | On-page SEO analysis |
| `technical` | Technical SEO (canonicals, redirects, etc.) |
| `ux-check` | UX heuristic evaluation |
| `visibility` | Search visibility / keyword data |

**Total: 27 subpages** (including index and `pages/[pageIndex]`)

### Settings `/settings/...`

| Subpage | Description |
|---------|-------------|
| `profile` | User profile & password |
| `appearance` | Theme (light/dark) |
| `billing` | Subscription & invoices (Stripe) |
| `notifications` | Notification preferences |
| `team` | Workspace members & roles |
| `agents` | AI agent configuration |
| `schedules` | Scheduled audits management |

### Admin `/admin/...`

| Subpage | Description |
|---------|-------------|
| *(index)* | Admin dashboard |
| `audits` | All audits across workspaces |
| `audits/[auditId]` | Single audit admin view |
| `users` | User management |
| `users/[userId]` | Single user detail |
| `workspaces` | Workspace management |
| `system` | System health & config |

---

## Components

### `components/ui/` — shadcn/ui primitives (28 files)

accordion, alert, alert-dialog, badge, button, card, checkbox, collapsible,
command, dialog, difficulty-badge, info-tooltip, input, intent-badge, label,
popover, progress, scroll-area, select, separator, serp-tags, sheet, sonner,
switch, table, tabs, textarea, tooltip

### `components/layout/` — shell & navigation

| File | Purpose |
|------|---------|
| `TopBar.tsx` | App top bar with workspace switcher |
| `AuditSidebar.tsx` | Left sidebar for audit subpage navigation |
| `ProjectSidebar.tsx` | Left sidebar for project sections |
| `Breadcrumbs.tsx` | Dynamic breadcrumb trail |
| `NavSection.tsx` | Collapsible sidebar section |
| `NavItem.tsx` | Single sidebar navigation item |
| `MobileMenu.tsx` | Responsive mobile hamburger menu |
| `UserMenu.tsx` | Avatar dropdown (profile, logout) |
| `PublicNavbar.tsx` | Landing page top navigation |
| `PublicFooter.tsx` | Landing page footer |

### `components/chat/` — AI chat panel

| File | Purpose |
|------|---------|
| `ChatPanel.tsx` | Persistent right sidebar panel |
| `ChatMessages.tsx` | Message list with markdown rendering |
| `ChatInput.tsx` | Message composer with send button |
| `ChatConversationList.tsx` | Conversation history selector |
| `AgentSelector.tsx` | AI agent type picker |
| `ChatToggleButton.tsx` | Open/close chat FAB |
| `ChatUsageBadge.tsx` | Token/message usage indicator |

### `components/audit/` — audit-specific widgets

| File | Purpose |
|------|---------|
| `ModeSwitcher.tsx` | Dane / Analiza / Plan tab switcher |
| `AnalysisView.tsx` | AI analysis markdown renderer |
| `TaskListView.tsx` | Execution plan task list |
| `TaskCard.tsx` | Single task card with status/notes |
| `QuickWinBadge.tsx` | Priority/impact badge for quick wins |

### `components/brand/`

| File | Purpose |
|------|---------|
| `SiteSpectorLogo.tsx` | Logo component (SVG, multiple sizes) |

### `components/projects/`

| File | Purpose |
|------|---------|
| `CreateProjectDialog.tsx` | New project creation modal |

### `components/teams/`

| File | Purpose |
|------|---------|
| `CreateTeamDialog.tsx` | New team creation modal |

### Root-level components (`components/`)

| File | Purpose |
|------|---------|
| `AiInsightsPanel.tsx` | AI insights summary card |
| `AuditCharts.tsx` | Score charts (radar, bar, etc.) |
| `AuditPageLayout.tsx` | Shared layout wrapper for audit subpages |
| `DataExplorerTable.tsx` | Generic sortable/filterable data table |
| `JsonLd.tsx` | JSON-LD structured data injector |
| `KeywordFeaturesTable.tsx` | SERP features keyword table |
| `NewAuditDialog.tsx` | Start new audit modal |
| `Providers.tsx` | Root providers (QueryClient, Theme, Workspace) |
| `SystemStatus.tsx` | System status indicator |
| `ThemeToggle.tsx` | Light/dark theme switch |
| `WorkspaceSwitcher.tsx` | Workspace selector dropdown |

---

## Lib Files

| File | Purpose |
|------|---------|
| `api.ts` | Main API client — workspace-scoped, Supabase JWT with auto-refresh |
| `chat-api.ts` | Chat REST endpoints (conversations, messages, agents) |
| `chat-sse.ts` | SSE streaming client for chat responses |
| `chat-store.ts` | Zustand store — conversations, agents, panel state (persisted) |
| `supabase.ts` | Supabase client initialization |
| `impersonation.ts` | Admin user impersonation session management |
| `useAdmin.ts` | Hook to check if current user is admin |
| `WorkspaceContext.tsx` | React context — current workspace, members, role |
| `ProjectContext.tsx` | React context — current project metadata |
| `schema.ts` | JSON-LD schema builders (Organization, WebSite, etc.) |
| `seo.ts` | SEO helpers — `SITE_URL`, `SITE_NAME`, `absoluteUrl()` |
| `tooltips.ts` | Metric tooltip dictionary (descriptions, ranges, sources) |
| `utils.ts` | `cn()` classname merge + general utilities |

---

## State Management

- **TanStack Query** — all server state (audits, projects, users, etc.)
- **Zustand** — `chat-store.ts`: conversations, agents, panel open/close, verbosity/tone preferences (persisted to localStorage)
- **React Context** — `WorkspaceContext` (current workspace, role), `ProjectContext` (current project)

---

## API Client

`frontend/lib/api.ts` — single API client used by all pages.

- Workspace-scoped: reads `workspace_id` from context, passes it as header/param
- Auth: Supabase JWT with automatic token refresh before each request
- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- Admin impersonation: checks `impersonation.ts` session and injects impersonation headers

---

## Configuration

### `tailwind.config.ts`

- Dark mode: class-based (`darkMode: ['class']`)
- Brand colors: `brand-teal` (#0b363d), `brand-orange` (#ff8945)
- Container queries plugin (`@tailwindcss/container-queries`) with sm/md/lg/xl/2xl breakpoints
- Animation plugin (`tailwindcss-animate`) for accordion transitions
- CSS variable-based color system (shadcn/ui pattern)

### `next.config.js`

- `output: 'standalone'` (Docker-optimized)
- `swcMinify: true`
- `reactStrictMode: true`
- Image domains: `localhost`

### `.env.example`

```
NEXT_PUBLIC_API_URL=https://sitespector.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Key Patterns

- **Container queries** (`@container`, `@md:`, `@lg:`) instead of viewport breakpoints — the chat panel narrows main content, so viewport-based breakpoints break
- **All API calls** go through `frontend/lib/api.ts` (workspace-scoped, auto-auth)
- **Audit 3-mode pattern**: most audit subpages use `ModeSwitcher` with Dane (raw data) / Analiza (AI analysis) / Plan (execution tasks) tabs
- **ChatPanel**: persistent right sidebar, SSE streaming via `chat-sse.ts`, per-audit conversations with agent selection
- **Route groups**: `(public)` for unauthenticated pages, `(app)` for authenticated pages with sidebar layout
- **Layouts**: nested layouts — root > (app) with TopBar/Sidebar > audit with AuditSidebar > settings with tabs > admin with admin nav

---

Last updated: 2026-03-17
