# SiteSpector - Frontend Pages

## Overview

SiteSpector uses **Next.js 14 App Router** with file-based routing.

**Pages location**: `frontend/app/`

---

## Gap Analysis — Faza 2 wdrozona (2026-03-08)

### Zmiany w stronach audytu

- `frontend/app/(app)/audits/[id]/performance/page.tsx`
  - opportunities/diagnostics sa teraz grupowane po kategoriach Lighthouse:
    - Performance, Accessibility, Best Practices, SEO (+ badge count).
  - dodano rozszerzony komponent `CWVGapAnalysis`:
    - porownanie Desktop vs Mobile dla LCP/CLS/TBT/FCP/SI/TTFB/TTI/Bootup/ByteWeight/DOM,
    - sortowanie po najwiekszej luce metryki,
    - status `good / needs-improvement / poor` dla mobile.

- `frontend/app/(app)/audits/[id]/seo/page.tsx`
  - dodano tab `Quick Wins`:
    - filtr Senuto positions: pozycje 11-20, `searches >= 100`, `difficulty <= 40`,
    - tabela z `estimated_traffic_gain` (model CTR), sort malejaco po potencjale.

- `frontend/app/(app)/audits/[id]/links/page.tsx`
  - dodano taby:
    - `Orphan Pages` (inlinks == 0, filtr indexable/all, high-value badge),
    - `Dystrybucja` (histogram inlinkow + crawl depth chart + deep pages > 3).
  - w `Przychodzace` dodano:
    - TLD distribution pie (`.pl/.com/.org/.edu/.gov/other`),
    - anchor type classification (`brand`, `exact-match`, `naked-url`, `generic`) z tabela przykladow.

- `frontend/app/(app)/audits/[id]/visibility/page.tsx`
  - `Kanibalizacja` rozszerzona o:
    - summary card: liczba fraz kanibalizowanych i liczba par URL,
    - grupowanie po parach URL z sortowaniem po lacznym search volume.

### Reuzywalne komponenty wykresow

- `frontend/components/AuditCharts.tsx`
  - dodano:
    - `InternalLinkDistributionChart`,
    - `CrawlDepthDistributionChart`.
  - oba wykresy uzywaja wspolnego stylu dashboardowego (`GradientLineAreaChart`).

---

## Gap Analysis — Faza 3A wdrozona (2026-03-08)

### Overview (`/audits/[id]`)

- `frontend/app/(app)/audits/[id]/page.tsx`:
  - Health card przebudowany do **Technical Health Index**:
    - preferuje `results.technical_health_index.score`,
    - fallback do starej kalkulacji (LH avg + issue quality) dla starszych audytow,
    - pokazuje `grade` i breakdown 5 filarow.
  - dodano card **Visibility Momentum**:
    - score -100..100 z `results.visibility_momentum`,
    - status (`Silny wzrost/Wzrost/Stabilnie/Spadek/Silny spadek`),
    - top wins/losses (SV-weighted).
  - dodano summary card **AI Search Readiness**:
    - score + status + pass/warn/fail counters,
    - skrót: blocked citation bots + llms.txt presence,
    - CTA do pelnej strony `/ai-readiness`.

### New page: AI readiness

- `frontend/app/(app)/audits/[id]/ai-readiness/page.tsx` (new):
  - dedykowany dashboard gotowosci pod AI search:
    - score/status cards,
    - checklist pass/warn/fail,
    - tabela botow (training/citation),
    - llms.txt preview + issues,
    - recommendations i breakdown komponentow score.

### Competitors radar

- `frontend/app/(app)/audits/[id]/competitors/page.tsx`:
  - dodano **Competitive Performance Radar** (Recharts) dla danych z `audit.competitors[*].results.lighthouse`,
  - porownanie: Twoja strona vs konkurenci DB na osiach:
    - Performance, SEO, Accessibility, Best Practices,
  - dodano tabele porownawcza score'ow pod wykresem radar.

### Navigation and IA

- `frontend/components/layout/AuditSidebar.tsx`:
  - dodano link `AI Readiness` w grupie "Widocznosc i AI".
- `frontend/components/layout/Breadcrumbs.tsx`:
  - dodano etykiete breadcrumb dla `ai-readiness`.

---

## Gap Analysis — Faza 3B wdrozona (2026-03-08)

### Comparison (`/audits/[id]/comparison`)

- `frontend/app/(app)/audits/[id]/comparison/page.tsx`:
  - trend chart rozszerzony o metryki 3A:
    - `technical_health_index.score`,
    - `crawl.ai_readiness.score`,
    - `visibility_momentum` (normalizowany do skali wykresu).
  - dodano ROI summary card (delta THI, delta Momentum, delta AI Readiness, frazy do TOP10).
  - dodano nowy tab `Pozycje`:
    - porownanie keywordow miedzy 2 audytami (`results.senuto.visibility.positions`),
    - klasyfikacja `improved / declined / new / lost`,
    - tabela: old/new position, delta, search volume, URL.

### Visibility + Overview traffic impact

- `frontend/app/(app)/audits/[id]/visibility/page.tsx`:
  - dodano tab `Traffic Impact`:
    - summary KPI (`total_estimated_monthly`, `potential_monthly`, `potential_gain`),
    - distribution by position bracket,
    - tabele: top traffic keywords, top traffic URLs, top opportunities.
  - fallback dla starszych audytow bez `results.traffic_estimation` liczony po stronie frontendu.

- `frontend/app/(app)/audits/[id]/page.tsx`:
  - dodano summary card `Estimated Traffic` na overview:
    - total estimate,
    - potential gain,
    - mini breakdown per position bracket,
    - top traffic keywords preview.

### Content Quality Index

- `frontend/app/(app)/audits/[id]/content-quality/page.tsx` (new):
  - dedykowana strona CQI:
    - site score + grade + status,
    - distribution A/B/C/D/F,
    - top issues,
    - component breakdown,
    - per-page tabela z filtrem grade.

- `frontend/app/(app)/audits/[id]/page.tsx`:
  - dodano summary card `Content Quality` na overview:
    - `results.content_quality_index.site_score`,
    - distribution preview,
    - top issues preview,
    - CTA do `/audits/[id]/content-quality`.

### Navigation and IA

- `frontend/components/layout/AuditSidebar.tsx`:
  - dodano link `Content Quality` w grupie "SEO i Tresc".
- `frontend/components/layout/Breadcrumbs.tsx`:
  - dodano etykiete breadcrumb dla `content-quality`.

---

## Gap Analysis — Faza 3C wdrozona (2026-03-08)

### Architecture (`/audits/[id]/architecture`)

- `frontend/app/(app)/audits/[id]/architecture/page.tsx`:
  - strona przebudowana na 2 taby:
    - `Mapa serwisu` (nowa warstwa),
    - `Stack technologiczny` (dotychczasowy widok, zachowany).
  - dodano interaktywny force graph (biblioteka `react-force-graph-2d`) oparty o:
    - `results.crawl.all_pages` (nodes),
    - `results.crawl.link_graph` (edges).
  - kodowanie wizualne:
    - color by: crawl depth / status code / link score,
    - size by: inlinks / word count,
    - homepage jako wyróżniony node.
  - panel kontrolny:
    - filtr depth range,
    - status bucket filters (2xx/3xx/4xx/5xx/other),
    - search URL/title,
    - limit `max nodes` (top N po inlinks).
  - panel szczegółów klikniętego noda:
    - URL, title, status, depth, inlinks/outlinks, link_score, word_count,
    - tryb focus "pokaż tylko połączone".
  - optymalizacje dla dużych crawlów:
    - deduplikacja krawędzi source→target + `count`,
    - warning dla dużych grafów (>500 nodes),
    - przycisk `Dopasuj widok` (`zoomToFit`).

### Content Quality duplicates (`/audits/[id]/content-quality`)

- `frontend/app/(app)/audits/[id]/content-quality/page.tsx`:
  - dodano nowy tab `Duplikaty` (3.9-lite scope) oparty o istniejące pola crawl:
    - `title` + `title_occurrences`,
    - `meta_description` + `meta_desc_occurrences`,
    - `h1` + `h1_occurrences`.
  - grupowanie duplikatów po identycznej wartości i lista URL-i w grupie.
  - summary cards: liczba grup i liczba URL-i dla Title/Meta/H1.
  - eksport CSV per typ duplikatu:
    - `duplicate_titles.csv`,
    - `duplicate_meta_descriptions.csv`,
    - `duplicate_h1.csv`.

### Dependencies

- `frontend/package.json`:
  - dodano `react-force-graph-2d` do wizualizacji mapy serwisu.

---

## Navigation Redesign (TopBar + Context Sidebars) (2026-03-07)

- Replaced monolithic app navigation (`UnifiedSidebar` + `MobileSidebar`) with a context-driven shell:
  - global `TopBar` for primary navigation and account/workspace actions,
  - dedicated `ProjectSidebar` only on `/projects/[projectId]/*`,
  - dedicated `AuditSidebar` only on `/audits/[id]/*`,
  - `MobileMenu` with route-context sections in a sheet.
- New components:
  - `frontend/components/layout/TopBar.tsx`
  - `frontend/components/layout/Breadcrumbs.tsx`
  - `frontend/components/layout/UserMenu.tsx`
  - `frontend/components/layout/ProjectSidebar.tsx`
  - `frontend/components/layout/AuditSidebar.tsx`
  - `frontend/components/layout/MobileMenu.tsx`
- Removed legacy components:
  - `frontend/components/layout/UnifiedSidebar.tsx`
  - `frontend/components/layout/MobileSidebar.tsx`
- App shell changes:
  - `frontend/app/(app)/layout.tsx` now composes TopBar + contextual sidebar + content + ChatPanel.
  - Admin routes (`/admin/*`) keep their own layout and are not wrapped with the new top bar.
  - Impersonation mode still hides sidebars/chat and keeps an explicit warning banner.
- Settings navigation:
  - `frontend/app/(app)/settings/layout.tsx` now has its own local settings sidebar.
- Verification:
  - `next lint --file ...` run for changed navigation files — no warnings/errors.

### Navigation UX Polish (Microinteractions + Density) (2026-03-07)

- Refined interaction quality across all new navigation surfaces:
  - tighter top bar density (`52px`) with sticky behavior and smoother active/hover states,
  - improved icon/text motion feedback in `NavItem` / `NavSection`,
  - stronger focus-visible rings for keyboard navigation,
  - better spacing rhythm in project/audit sidebars and settings local nav.
- Workspace switcher was adapted from dark-sidebar styling to top-bar styling:
  - lighter control, improved popover readability, smoother hover/focus.
- Mobile sheet got route-aware active states for global links (`Dashboard`, `Projekty`) to keep parity with desktop feedback.
- Updated files:
  - `frontend/components/WorkspaceSwitcher.tsx`
  - `frontend/components/layout/TopBar.tsx`
  - `frontend/components/layout/Breadcrumbs.tsx`
  - `frontend/components/layout/UserMenu.tsx`
  - `frontend/components/layout/NavItem.tsx`
  - `frontend/components/layout/NavSection.tsx`
  - `frontend/components/layout/AuditSidebar.tsx`
  - `frontend/components/layout/ProjectSidebar.tsx`
  - `frontend/components/layout/MobileMenu.tsx`
  - `frontend/app/(app)/layout.tsx`
  - `frontend/app/(app)/settings/layout.tsx`

### Navigation Visual Consistency Pass (Colors + Settings parity) (2026-03-07)

- Removed green/teal-heavy visual tone from context sidebars and unified them with a neutral dark palette:
  - `frontend/components/layout/AuditSidebar.tsx`
  - `frontend/components/layout/ProjectSidebar.tsx`
  - `frontend/components/layout/MobileMenu.tsx`
- Top bar and user menu active states now use the shared accent language instead of primary/teal emphasis.
- Workspace switcher hover/selected states were refined to eliminate harsh/ugly row feedback in the dropdown:
  - smoother selected row contrast,
  - accent checkmark consistency,
  - clearer top-bar matching control style.
- Settings sidebar now uses the same visual system as project/audit sidebars (dark shell + consistent active/hover states):
  - `frontend/app/(app)/settings/layout.tsx`

### Navigation Contrast Hotfix (Workspace hover + Audit select) (2026-03-07)

- Fixed workspace dropdown contrast issue where selected/hovered rows could render white text on a light gray background:
  - switched row state styling to explicit `aria-selected` overrides in:
    - `frontend/components/WorkspaceSwitcher.tsx`
- Removed remaining green-toned surface from audit switcher dropdown:
  - `frontend/components/layout/AuditSidebar.tsx` select content now uses neutral dark surface.

### Sidebar Parity + Theme Split (Light/Dark) (2026-03-07)

- Unified visual structure of all contextual sidebars so they look and behave identically:
  - `ProjectSidebar`
  - `AuditSidebar`
  - `settings/layout` local sidebar
- Settings sidebar now uses the same left-attached shell model as project/audit:
  - no floating card layout,
  - fixed 292px rail on desktop,
  - shared nav item/section styling primitives.
- Added explicit light/dark variants for sidebar surfaces:
  - light mode: light gradient + slate text + soft borders,
  - dark mode: existing dark gradient preserved.
- Updated nav primitives to be theme-aware:
  - `frontend/components/layout/NavItem.tsx`
  - `frontend/components/layout/NavSection.tsx`
- Updated select styling in audit sidebar to support both themes without contrast regressions.

### Warm Light Navigation Palette (2026-03-07)

- Aligned light-mode sidebar/navigation surfaces with app-wide warm background (`--background: #fff9f5`) to remove cold-looking rail contrast.
- Updated light palette tokens in contextual nav components:
  - `frontend/components/layout/AuditSidebar.tsx`
  - `frontend/components/layout/ProjectSidebar.tsx`
  - `frontend/app/(app)/settings/layout.tsx`
  - `frontend/components/layout/NavItem.tsx`
  - `frontend/components/layout/NavSection.tsx`
  - `frontend/components/layout/MobileMenu.tsx`
- Dark mode kept unchanged (existing dark gradient remains the default dark rail visual).

### TopBar Readability Pass (Breadcrumb size + user identity) (2026-03-07)

- Unified breadcrumb typography so route labels keep consistent visual weight/size across project and audit contexts:
  - `frontend/components/layout/Breadcrumbs.tsx` now uses one shared text size baseline.
- Added explicit user identity label next to avatar trigger in top bar (desktop) to better use available header space:
  - `frontend/components/layout/UserMenu.tsx`
  - displays `full_name` fallbacking to `email` when profile name is missing.
- Existing popover profile block remains unchanged; this pass only improves trigger readability/context.

### Navigation Polish Follow-up (Tokenized warm hover + home-return icon) (2026-03-07)

- Replaced hardcoded warm hover shade usage in nav primitives with semantic theme tokens:
  - `frontend/components/layout/NavItem.tsx`
  - `frontend/components/layout/NavSection.tsx`
  - hover/open states now use `bg-muted/*` in light mode for maintainable, system-based theming.
- Restored top-bar "return to marketing home" affordance near the logo:
  - `frontend/components/layout/TopBar.tsx`
  - added icon button linking to `/` with tooltip (`Strona glowna`) and keyboard focus styling.

---

## Branding Rollout (SVG) (2026-03-06)

- Replaced legacy `RiSearchEyeFill + SiteSpector` brand rendering with unified full logotype SVG in app/public UI:
  - `frontend/components/brand/SiteSpectorLogo.tsx`
  - `frontend/components/layout/PublicNavbar.tsx`
  - `frontend/components/layout/PublicFooter.tsx`
  - `frontend/components/layout/UnifiedSidebar.tsx`
  - `frontend/app/(app)/layout.tsx` (mobile header)
  - `frontend/app/(public)/login/page.tsx`
  - `frontend/app/(public)/page.tsx`
  - `frontend/app/(public)/sitemap/page.tsx`
  - `frontend/app/(app)/audits/[id]/client-report/page.tsx` (header + footer in printable report)
- Added shared static asset for frontend runtime: `frontend/public/sitespector_logo_transp.svg`.
- Kept small icons (`frontend/app/icon.tsx`, `frontend/app/apple-icon.tsx`) as emblem-only by design.
- Frontend lint still reports pre-existing unrelated errors in admin/schema pages; logo rollout introduced no new lint errors.

### Contrast hotfix (2026-03-06)

- Improved readability of the full SVG logotype on dark surfaces (especially mobile):
  - `frontend/components/layout/PublicFooter.tsx` -> logo wrapped in light rounded background.
  - `frontend/components/layout/UnifiedSidebar.tsx` -> logo wrapped in light rounded background.
  - `frontend/app/(app)/layout.tsx` -> mobile header logo now has light rounded background.
- Goal: keep full logotype everywhere while preserving visual contrast on dark UI blocks.

---

## Pricing Placeholder Rollout (UI-only) (2026-03-06)

- Applied temporary pricing placeholder across selected marketing and app UI surfaces:
  - landing components:
    - `landing/src/component/Pricing.tsx`
    - `landing/src/component/Faq.tsx`
    - `landing/src/component/Cta.tsx`
  - landing pages:
    - `landing/src/app/cennik/page.tsx`
    - `landing/src/app/page.tsx`
    - `landing/src/app/o-nas/page.tsx`
    - `landing/src/app/porownanie/PorownanieClient.tsx`
    - `landing/src/app/dla-freelancerow/page.tsx`
    - `landing/src/app/dla-agencji-seo/page.tsx`
  - landing nav/sitemap labels:
    - `landing/src/component/layout/Topbar/page.tsx`
    - `landing/src/component/layout/Footer/page.tsx`
    - `landing/src/app/sitemap/page.tsx`
  - frontend app:
    - `frontend/app/(app)/pricing/page.tsx`
    - `frontend/app/(app)/settings/billing/page.tsx`
    - `frontend/components/NewAuditDialog.tsx`
- UX intent:
  - remove hardcoded prices/plan upsell copy from these views,
  - keep route structure intact (`/cennik`, `/pricing` stay available),
  - replace plan/checkout wording with "Wkrótce / Skontaktuj się z nami".
- Technical note:
  - This is copy/UI-only; backend billing flows were intentionally left unchanged in this iteration.

---

## Pricing Copy Cleanup — Marketing Second Pass (2026-03-06)

- Performed a second full pass on marketing surfaces to remove remaining price mentions from user-facing copy.
- Updated additional landing pages/components and content entries to neutral "oferta w przygotowaniu / kontakt" language:
  - landing app pages and components (e.g. `case-study`, `docs`, `jak-to-dziala`, `sprawdz-agencje-seo`, `dla-managerow`, `dla-ecommerce`, `integracje`, `funkcje`, `blog`, `polityka-cookies`, `porownanie`, nav labels).
  - selected marketing content markdown used by rendered pages:
    - `landing/content/case-studies/*.md`
    - `landing/content/blog/raporty-pdf-dla-klientow.md`
    - `landing/content/blog/roi-audyt-seo.md`
    - `landing/content/blog/porownanie-narzedzi-seo-2026.md`
- Preserved route structure (`/cennik` kept for IA/SEO continuity) but shifted visible labels/copy toward "Oferta".
- Legal terms page (`landing/src/app/regulamin/page.tsx`) was intentionally left unchanged as legal content scope.
- Added centralized copy token for placeholder management:
  - `landing/src/lib/offerPlaceholder.ts`
  - contains token metadata (`id`, `what`, `where`, `how`) and shared copy labels used by marketing UI.

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
│   │   ├── audits/page.tsx        # All audits with filters + "Wejdz jako klient" (impersonation start)
│   │   │   └── [auditId]/page.tsx # Read-only admin inspector (single-page audit payload view)
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

## Admin Audit Inspector (`app/(app)/admin/audits/[auditId]/page.tsx`)

**Route**: `/admin/audits/[auditId]`

**Purpose**: Single-page read-only diagnostic view for super admins. Displays metadata, scoring, AI sections, processing logs, and full raw `results` JSON without tabs and without mutating actions.

**Data source**:
- `adminAPI.getAudit(auditId)` -> `GET /api/admin/audits/{audit_id}`
- Optional direct route for diagnostics: `/admin/audits/[auditId]`

---

## Admin Impersonation Flow (Single Audit)

**Start point**: `app/(app)/admin/audits/page.tsx`

- Admin can start impersonation for one audit via `adminAPI.startImpersonationSession(...)`.
- Frontend stores session in `sessionStorage` (`frontend/lib/impersonation.ts`).
- App shell (`app/(app)/layout.tsx`) shows a global impersonation banner with "Wyjdz" action.
- During impersonation:
  - app opens standard client route `/audits/[id]`,
  - chat UI (`ChatPanel`, `ChatToggleButton`) is hidden,
  - desktop/mobile sidebar is hidden to reduce blocked calls outside scoped allowlist.

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

### Mar 2026 additions (Schema-first rollout)
- Added dedicated route: `app/(app)/audits/[id]/schema/page.tsx`:
  - executive-style schema summary for non-technical users,
  - readiness score + priority gaps + detected schema types,
  - raw tab exposing `structured_data_v2`, `render_nojs`, `soft_404`, `directives_hreflang`, `semantic_html`.
- `UnifiedSidebar` audit navigation now includes direct `Schema.org` entry (`/audits/[id]/schema`).
- PDF selector page (`/audits/[id]/pdf`) now explicitly communicates Schema-first scope in all report types:
  - Executive: Schema summary + critical gaps,
  - Standard: Schema + render/no-JS + soft404/directives,
  - Full: complete schema validation and technical appendices.
- Visibility and competitors pages now show business-oriented AI interpretation blocks:
  - non-technical summary,
  - metrics legends,
  - recommended next steps for management.

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

# SiteSpector - Frontend Components

## Overview

SiteSpector frontend uses **shadcn/ui** components built on **Radix UI** primitives, styled with **Tailwind CSS**.

**Component location**: `frontend/components/ui/`

**Custom components**: `frontend/components/`

---

## UI Component Library (shadcn/ui)

### Installation Method

Components are **copy-pasted** (not npm installed):
- Full control over code
- No dependency on external package
- Customizable with Tailwind classes

### Components Used

#### 1. Button (`ui/button.tsx`)

**Usage**:
```tsx
import { Button } from '@/components/ui/button'

<Button>Click me</Button>
<Button variant="outline">Outlined</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Trash className="h-4 w-4" /></Button>
```

**Variants**:
- `default` - Primary button (blue)
- `destructive` - Danger button (red)
- `outline` - Outlined button
- `secondary` - Secondary button (gray)
- `ghost` - No background
- `link` - Link style

**Sizes**: `default`, `sm`, `lg`, `icon`

---

#### 2. Card (`ui/card.tsx`)

**Usage**:
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

**Use cases**:
- Score cards (overall, SEO, performance, content)
- Audit list items
- Result sections

---

#### 3. Badge (`ui/badge.tsx`)

**Usage**:
```tsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outlined</Badge>
```

**Use cases**:
- Audit status (pending, processing, completed, failed)
- Subscription tiers

---

#### 4. Dialog (`ui/dialog.tsx`)

**Usage**:
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

**Use cases**:
- Create audit form (NewAuditDialog)
- Confirmation modals

---

#### 5. Alert Dialog (`ui/alert-dialog.tsx`)

**Usage**:
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Use cases**:
- Delete audit confirmation
- Destructive actions

---

#### 6. Input (`ui/input.tsx`)

**Usage**:
```tsx
import { Input } from '@/components/ui/input'

<Input 
  type="email" 
  placeholder="Email" 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<Input type="password" placeholder="Password" />
```

**Styling**: Tailwind classes for focus, border, etc.

---

#### 7. Label (`ui/label.tsx`)

**Usage**:
```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

---

#### 8. Tabs (`ui/tabs.tsx`)

**Usage**:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="overview">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="seo">SEO</TabsTrigger>
    <TabsTrigger value="performance">Performance</TabsTrigger>
    <TabsTrigger value="content">Content</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* Overview content */}
  </TabsContent>

  <TabsContent value="seo">
    {/* SEO content */}
  </TabsContent>
</Tabs>
```

**Use cases**:
- Audit detail page (5 tabs: Overview, SEO, Performance, Content, Competition)

---

#### 9. Scroll Area (`ui/scroll-area.tsx`)

**Usage**:
```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className="h-96">
  {/* Long content that needs scrolling */}
</ScrollArea>
```

**Use cases**:
- Long audit lists
- Large result sections

---

#### 10. Alert (`ui/alert.tsx`)

**Usage**:
```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>

<Alert variant="destructive">
  {/* Danger alert */}
</Alert>
```

**Use cases**:
- Error messages
- Info notifications (local business detected)

---

## Custom Components

### Senuto Visualization Components (Feb 2026)

`frontend/components/AuditCharts.tsx` now includes additional charts:
- `CompetitorsDualBarChart`
- `DifficultyDistributionChart`
- `SearchVolumeDistributionChart`
- `SerpFeaturesChart`
- `WordCountDistributionChart`
- `TrendsPeakChart`
- `IntentDistributionPieChart`
- `AIOPositionDistributionChart`
- `AIOCompetitorsChart`
- `PositionSparkline` / `TrendsSparkline`

Chart style rule (current product preference):
- Prefer line-like charts with **dashboard gradient style**: `AreaChart` + monotone stroke + soft vertical gradient fill + rounded tooltip card.
- Apply one visual preset across modules (`AuditCharts` + comparison trend) for consistency.
- Keep `BarChart` only for category comparisons where interpolation is misleading (e.g. grouped competitor comparisons, horizontal rank lists).

### New Shared UI Components

- `frontend/components/ui/intent-badge.tsx` - intent + journey stage badges
- `frontend/components/ui/difficulty-badge.tsx` - color-coded difficulty ranges
- `frontend/components/ui/serp-tags.tsx` - snippet tags for SERP features
- `frontend/components/KeywordFeaturesTable.tsx` - reusable feature distribution table

### DataExplorerTable Large Dataset Handling

`frontend/components/DataExplorerTable.tsx` supports:
- search + sorting + exports (existing behavior)
- optional row virtualization for large pages via `@tanstack/react-virtual`
- configurable thresholds (`virtualizeThreshold`, `virtualHeight`)

### NewAuditDialog (`components/NewAuditDialog.tsx`)

**Purpose**: Create new audit with URL and optional competitors

**Usage**:
```tsx
import NewAuditDialog from '@/components/NewAuditDialog'

<NewAuditDialog />
```

**Features**:
- URL input with validation
- Up to 3 competitor URLs
- Auto-prepends `https://` if missing
- React Hook Form validation
- TanStack Query mutation
- Redirects to audit detail page on success

**Code structure**:
```tsx
export default function NewAuditDialog() {
  const [open, setOpen] = useState(false)
  const [competitorCount, setCompetitorCount] = useState(0)
  
  const form = useForm<FormData>({
    defaultValues: {
      url: '',
      competitors: []
    }
  })
  
  const createMutation = useMutation({
    mutationFn: (data) => auditsAPI.create(data),
    onSuccess: (audit) => {
      router.push(`/audits/${audit.id}`)
      setOpen(false)
    }
  })
  
  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ New Audit</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Form fields */}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Providers (`components/Providers.tsx`)

**Purpose**: Wrap app with TanStack Query provider

**Usage** (in `app/layout.tsx`):
```tsx
import Providers from '@/components/Providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Code**:
```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

## Utility Functions

**Location**: `frontend/lib/utils.ts`

### Format Date

```typescript
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

**Output**: "3 lutego 2025, 10:30"

---

### Format Score

```typescript
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A'
  // Scores are always shown with 2 decimals to avoid long floats in UI.
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(score)
}
```

**Output**: "85,00" or "N/A"

---

### Format Number (Max 2 Decimals)

Use for general metrics/statistics to avoid long floats while keeping integers readable.

```typescript
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A'
  return new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: 2,
  }).format(num)
}
```

---

### Get Score Color

```typescript
export function getScoreColor(score: number | null | undefined): string {
  if (!score) return 'text-muted-foreground'
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}
```

**Returns**: Tailwind class for score color

---

### Get Status Badge Variant

```typescript
export function getStatusBadgeVariant(
  status: 'pending' | 'processing' | 'completed' | 'failed'
): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'processing':
      return 'default'
    case 'completed':
      return 'success'  // Custom variant (need to add)
    case 'failed':
      return 'destructive'
  }
}
```

---

## Icons

**Library**: Lucide React

**Installation**: `npm install lucide-react`

**Usage**:
```tsx
import { ArrowLeft, Download, Loader2, RefreshCw, Trash, AlertCircle, FileJson } from 'lucide-react'

<Button>
  <Download className="mr-2 h-4 w-4" />
  Download PDF
</Button>

<Loader2 className="h-8 w-8 animate-spin" />
```

**Common icons**:
- `ArrowLeft` - Back button
- `Download` - Download PDF
- `FileJson` - Download raw data
- `RefreshCw` - Refresh/restart
- `Trash` - Delete
- `Loader2` - Loading spinner
- `AlertCircle` - Error/warning

---

## Styling Patterns

### Container Queries (App RWD with persistent ChatPanel)

The authenticated app (`frontend/app/(app)/*`) uses a **persistent ChatPanel** that reduces available width of the content area. Viewport-based breakpoints (`md:`, `lg:`, `xl:`) can look "too wide" when the chat is open, causing layouts to squish.

**Decision**: Prefer **container-query breakpoints** inside the app shell:
- Mark the scrollable content area as a container (`@container`) in `frontend/app/(app)/layout.tsx`
- Use `@md:`, `@lg:`, `@xl:` (instead of `md:`, `lg:`, `xl:`) in pages/components that should adapt to the *content container width*

**Tailwind config**:
- Plugin: `@tailwindcss/container-queries` enabled in `frontend/tailwind.config.ts`
- Custom container breakpoints are mapped to the familiar sizes (`sm`, `md`, `lg`, `xl`, `2xl`)

### Responsive Grid

```tsx
<div className="grid gap-4 @md:grid-cols-2 @lg:grid-cols-4">
  {/* 1 column by default, then adapts to container width */}
</div>
```

### Spacing

```tsx
<div className="space-y-4">  {/* Vertical spacing between children */}
  <Card />
  <Card />
</div>

<div className="flex gap-2">  {/* Horizontal gap */}
  <Button />
  <Button />
</div>
```

### Container

```tsx
<div className="container mx-auto py-8 px-4">
  {/* Centered container with padding */}
</div>
```

If you want children to use `@md:` / `@lg:` etc, ensure the parent is a container:

```tsx
<main className="flex-1 overflow-y-auto relative @container">
  {children}
</main>
```

### Text Colors

```tsx
<p className="text-muted-foreground">  {/* Muted text */}
<p className="text-destructive">       {/* Error text */}
<p className="text-primary">           {/* Primary color */}
```

---

## Component Best Practices

### 1. Always Use Proper Types

```tsx
// ✅ GOOD
interface AuditCardProps {
  audit: Audit
  onDelete: (id: string) => void
}

// ❌ BAD
function AuditCard({ audit, onDelete }: any)
```

### 2. Handle Loading and Error States

```tsx
const { data, isLoading, isError, error } = useQuery(...)

if (isLoading) return <Loader2 className="animate-spin" />
if (isError) return <Alert variant="destructive">{error.message}</Alert>
if (!data) return <p>No data</p>

return <div>{/* Render data */}</div>
```

### 3. Use Optional Chaining

```tsx
// ✅ GOOD
const title = audit.results?.crawl?.title ?? 'No title'

// ❌ BAD
const title = audit.results.crawl.title  // Can crash
```

### 4. Extract Reusable Components

If a component pattern is used 3+ times, extract it:

```tsx
// Reusable metric card
function MetricCard({ label, value, unit }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
      </CardContent>
    </Card>
  )
}
```

---

## Dark Mode Support

**Status**: ✅ **IMPLEMENTED** (2025-02-04)

**Package**: `next-themes` installed

**Config** (`tailwind.config.ts`):
```typescript
export default {
  darkMode: ['class'],
  // ...
}
```

**Provider** (`app/layout.tsx`):
```tsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <Providers>{children}</Providers>
</ThemeProvider>
```

**Usage**:
```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>
```

---

## Audit Navigation Components

### UnifiedSidebar (`components/layout/UnifiedSidebar.tsx`)

**Purpose**: Single sidebar for the entire application, context-aware.

**Features**:
- **Logo + Strona główna**: Logotyp linkuje do /dashboard; przycisk (strzałka wstecz) obok logotypu kieruje na stronę główną (/) z tooltipem „Strona główna”.
- **Main Navigation**: Dashboard, Projekty (/projects).
- **Project Context**: When pathname is `/projects/[projectId]/*`, shows project sub-nav: Przegląd, Audyty, Porównanie, Harmonogram, Zespół.
- **Audit Context**: When on `/audits/[id]`, shows audit selector and audit-specific sections (Dane audytu, Strategia AI, Raporty). "Wróć do projektu" / "Lista audytów projektu" when audit has `project_id`.
- **Collapsible Sections**: Uses `NavSection` with smooth CSS grid animations for expanding/collapsing.
- **Visual Indicators**: Active state with a vertical primary-color indicator and subtle background highlights.
- **Mobile Support**: Integration with `MobileSidebar` using an `onAction` callback to close the drawer on navigation.
- **System Status Polling Guardrail (Mar 2026)**:
  - uses `systemAPI.getStatus()` (authenticated API client),
  - `refetchInterval`: 30s normally, 120s when query is in error state,
  - `retry: 1` to reduce request floods during backend incidents.

### System Status Widgets (Mar 2026 hardening)

- `frontend/components/SystemStatus.tsx` now uses `systemAPI.getStatus()` (same auth path as app API calls), not raw `fetch`.
- Dashboard and sidebar share query key `['system-status']` and both apply error backoff (30s -> 120s) with `retry: 1`.
- Admin system page (`/admin/system`) keeps endpoint `/api/admin/system` active but follows the same polling guardrail.

---

### NavSection (`components/layout/NavSection.tsx`)

**Purpose**: Collapsible navigation group.

**Features**:
- **Smooth Animations**: Uses CSS `grid-template-rows` for height transitions.
- **Accessibility**: Semantic button trigger with chevron indicator.
- **Variants**: Supports 'default' and 'audit' styling.

---

### NavItem (`components/layout/NavItem.tsx`)

**Purpose**: Individual navigation link.

**Features**:
- **Active State**: Visual indicator bar and primary color text.
- **Badges**: Small, uppercase tracking-wider badges for status or counts.
- **Disabled State**: Muted styling for upcoming features.

---

### MobileSidebar (`components/layout/MobileSidebar.tsx`)

**Purpose**: Mobile slide-in menu using `UnifiedSidebar`.

---

### ThemeToggle (`components/ThemeToggle.tsx`)

**Purpose**: Toggle between light and dark mode

**Usage**:
```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

<ThemeToggle />
```

**Features**:
- Uses `next-themes` for theme management
- Prevents hydration mismatch
- Shows current theme (Jasny/Ciemny)
- Icon changes based on theme

---

### AuditMenuItem (`components/audit/AuditMenuItem.tsx`)

**Purpose**: Single menu item for audit navigation

**Usage**:
```tsx
import { AuditMenuItem } from '@/components/audit/AuditMenuItem'
import { FileText } from 'lucide-react'

<AuditMenuItem 
  href="/audits/123"
  icon={FileText}
  label="Podsumowanie"
  badge="5"
  disabled={false}
/>
```

**Features**:
- Active route highlighting
- Optional badge
- Disabled state for coming soon features
- Icon support

---

### AuditSidebar (`components/audit/AuditSidebar.tsx`)

**Purpose**: Main sidebar navigation for audit pages

**Usage**:
```tsx
import { AuditSidebar } from '@/components/audit/AuditSidebar'

<AuditSidebar auditId="123" />
```

**Features**:
- 3 sections: Aktualny audyt, Narzędzia, System
- Theme toggle at bottom
- Scrollable sidebar
- Disabled items for future features

---

### AuditMobileSidebar (`components/audit/AuditMobileSidebar.tsx`)

**Purpose**: Mobile slide-in menu for audit pages

**Usage**:
```tsx
import { AuditMobileSidebar } from '@/components/audit/AuditMobileSidebar'

<AuditMobileSidebar auditId="123" />
```

**Features**:
- Sheet component (slide from left)
- Hamburger menu trigger
- Hidden on desktop (lg+)
- Contains full AuditSidebar

---

**Last Updated**: 2026-02-16  
**Component library**: shadcn/ui  
**Icon library**: Lucide React  
**Styling**: Tailwind CSS 3.x  
**Theme**: next-themes

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
    const errorText = await response.text().catch(() => '')
    // Prefer JSON { detail } but tolerate empty/non-JSON bodies.
    try {
      const parsed = errorText ? JSON.parse(errorText) : null
      throw new Error(parsed?.detail || `HTTP ${response.status}`)
    } catch {
      throw new Error(errorText || `HTTP ${response.status}`)
    }
  }

  // Some endpoints (e.g. DELETE) return 204 No Content.
  if (response.status === 204) {
    return undefined as unknown as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as unknown as T
  }

  return JSON.parse(text) as T
}
```

**Features**:
- Auto-adds `Authorization` header if token exists
- Auto-parses JSON response and handles `204 No Content`
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

# SiteSpector - Missing Frontend Features & TODO List

## ✅ COMPLETED - Priority 1: Detail Rendering Functions

**Location**: `frontend/app/audits/[id]/page.tsx`

**Status**: ✅ **COMPLETED** (2025-02-03)

All three rendering functions have been implemented:

### Function 1: `renderSeoResults(results)` ✅
**Lines**: 166-222  
**Displays**: Title, meta description, H1 tags, status code, load time, word count, page size  
**Status**: Fully implemented

### Function 2: `renderPerformanceResults(results)` ✅  
**Lines**: 225-257  
**Displays**: Core Web Vitals (FCP, LCP, TBT, CLS, SI, TTFB), desktop metrics  
**Status**: Fully implemented

### Function 3: `renderContentResults(results)` ✅
**Lines**: 259-304  
**Displays**: Quality score, readability score, word count, AI recommendations  
**Status**: Fully implemented

**Impact**: HIGH - Users can now see all detailed audit data  
**Effort**: 4-6 hours (COMPLETED)  
**Date completed**: 2025-02-03

---

## ✅ COMPLETED - Priority 2: PDF Generator

**Location**: `backend/templates/report.html` + `backend/app/services/pdf_generator.py`

**Status**: ✅ **FULLY COMPLETED** (2025-02-03)

### What was completed:

#### 1. Removed ALL Fallbacks ✅
- **screaming_frog.py**: Deleted 200+ lines of HTTP fallback code
- **pdf_generator.py**: Removed all `or {}` and fake default data
- **data_exporter.py**: Removed `or {}` fallbacks
- **report.html**: Removed ALL `|default()` filters

**Result**: System now fails explicitly - NO silent fallbacks!

#### 2. Completed PDF Sections (3-8) ✅

**Section 3 - SEO Technical Analysis**:
- Full crawl data display: pages_crawled, internal_links_count, total_images, images_without_alt
- Meta tags table with title/meta_description + length validation
- H1 structure with content display
- Technical metrics: status_code, load_time, size_bytes, word_count

**Section 4 - Performance Analysis**:
- Complete desktop Core Web Vitals table (7 metrics: Performance Score, FCP, LCP, CLS, TTFB, Speed Index, TBT)
- Complete mobile Core Web Vitals table (7 metrics)
- Performance recommendations from AI with color-coding
- Performance impact level display

**Section 5 - Content Analysis**:
- Detailed metrics table: quality_score, readability_score, word_count, has_title, has_meta_description, has_h1
- AI summary display
- Color-coded recommendations by emoji prefix (✅, ⚠️, ❌, 🤖)

**Section 6 - Local SEO**:
- Updated conditional logic (checks both audit.is_local_business and local_seo.is_local_business)
- Visual indicators for has_schema_markup, has_nap
- Color-coded recommendations

**Section 7 - Competitive Analysis**:
- Handles "no competitors" case (competitors_analyzed == 0)
- Color-coded boxes: Strengths (green), Weaknesses (red), Opportunities (blue), Recommendations (yellow)

**Section 8 - Action Plan**:
- Dynamic priority lists based on actual scores
- High priority: performance_score < 50, seo_score < 50, images_without_alt > 50%
- Medium priority: content_score < 70, missing local SEO
- Aggregated recommendations from all sections
- AI recommendations section

**Impact**: CRITICAL - PDF generator now displays real data with NO fallbacks  
**Effort**: 8-10 hours (COMPLETED)  
**Date completed**: 2025-02-03

---

## 🎯 All Priorities COMPLETED

✅ Frontend rendering - DONE  
✅ PDF generator - DONE  
✅ Fallback removal - DONE

**No missing features remaining in core functionality!**

---

## UI Template Stabilization (2026-03-03)

### Scope delivered

- App shell/content width hardening:
  - `frontend/app/(app)/layout.tsx`
  - `frontend/lib/chat-store.ts`
- Client report responsive refactor (container-query-first):
  - `frontend/app/(app)/audits/[id]/client-report/page.tsx`
- Shared frontend logo component:
  - `frontend/components/brand/SiteSpectorLogo.tsx`
  - adopted in `UnifiedSidebar`, `PublicNavbar`, `PublicFooter`
- Global typography/wrapping + public style conflict reduction:
  - `frontend/app/globals.css`
- Landing visual cleanup:
  - `landing/src/component/layout/Topbar/page.tsx`
  - `landing/src/component/layout/Footer/page.tsx`
  - `landing/src/assets/scss/_general.scss`
  - `landing/src/assets/scss/_menu.scss`
  - `landing/src/assets/scss/_mega-menu.scss`
- PDF readability/wrapping pass:
  - `backend/app/services/pdf/styles.py`
  - `backend/templates/pdf/sections/cover.html`

### QA notes

- Frontend (changed files only): `next lint --file ...` passed with no warnings/errors.
- Landing full lint: passed with no warnings/errors.
- Full frontend lint still reports pre-existing unrelated issues in admin and selected audit pages.

### Regression checklist used

- Breakpoints: 360 / 390 / 768 / 1024 / 1280 / 1440.
- App shell states: chat open/closed and resized.
- Long content: URLs, long Polish labels, long custom notes.
- Logo consistency: sidebar + public navbar + public footer + landing topbar/footer + PDF cover.

---

## PDF ↔ UI Parity Refresh (2026-03-06)

### Scope delivered

- `frontend/app/(app)/audits/[id]/visibility/page.tsx`
  - Added robust metric helpers for Senuto stats (`current`/`recent_value` fallback).
  - Aligned KPI cards with PDF mapping (TOP3/TOP10/TOP50/visibility/domain rank/ads equivalent).
  - Added explicit AIO citations card and corrected AIO position distribution source to `ai_overviews.keywords`.
- `frontend/app/(app)/audits/[id]/competitors/page.tsx`
  - Unified metric normalization for competitor statistics.
  - Excluded `is_main_domain=true` row from competitor chart/table.
  - Sorted rows by shared keywords for clearer business comparison.
- `frontend/app/(app)/audits/[id]/schema/page.tsx`
  - Added practical JSON-LD snippet cards (matching PDF educational layer).
  - Added implementation and validation checklist for non-technical users.

### Outcome

- UI now mirrors PDF critical metrics more closely.
- Better consistency for business interpretation between app and report output.
- Reduced chance of zeroed/empty KPI confusion in visibility and competition views.

**Last Updated**: 2026-03-06  
**Status**: Core template stabilization delivered; visual unification baseline in place

---

## Gap Analysis — Faza 1 wdrożona (2026-03-08)

### Zakres dostarczony

- `frontend/app/(app)/audits/[id]/page.tsx`
  - Dodano **Health Score widget** (single 0-100%) oparty o agregację Lighthouse + klasyfikację problemów z crawla.
  - Dodano **Issue Severity Dashboard**: Error/Warning/Notice counts + top 5 krytycznych problemów z deeplinkami do modułów.
  - Sekcja problemów została przebudowana z prostych hardcoded bloków do klasyfikacji severity.

- `frontend/app/(app)/audits/[id]/technical/page.tsx` (NOWA STRONA)
  - Dodano nowy route `/audits/[id]/technical` z 3-phase pattern (`Dane/Analiza/Plan`).
  - W trybie `Dane` wdrożono 6 paneli z istniejących danych `results.crawl`:
    - Robots.txt
    - Sitemap analysis
    - Domain config
    - Render without JS
    - Soft 404 / Low content
    - Directives / Hreflang
  - Każdy panel ma KPI + listę problemów i/lub tabelę próbek (DataExplorerTable).

- `frontend/components/layout/AuditSidebar.tsx`
  - Dodano link nawigacyjny do nowego modułu: `Technical SEO` (`/audits/[id]/technical`) w grupie `Technikalia`.

- `frontend/app/(app)/audits/[id]/links/page.tsx`
  - Rozbudowano backlinks:
    - `ref_domains`: z top 6 do pełnej tabeli paginowanej (`DataExplorerTable`).
    - `anchors`: z top 6 do pełnej wizualizacji (word cloud) + tabela pełnych anchorów.

- `frontend/app/(app)/audits/[id]/visibility/page.tsx`
  - Dodano **positions sampling indicator** na zakładce `Pozycje`:
    - komunikat: „Pokazujesz X z Y fraz (Z%)”
    - oparty o `senuto._meta.positions_count` oraz `senuto._meta.positions_total`.

### Efekt biznesowy

- Domknięto wszystkie 6 braków z Tier 1/Faza 1 wskazanych w `docs/gap-analysis-report.md`.
- Użytkownik widzi dane, które wcześniej były tylko w backendzie/raw (technical extras, pełne backlinks, metadata samplingu).
- Audit overview ma teraz table-stakes KPI (`Health Score` + severity breakdown) zgodne z oczekiwaniami rynku SEO tools.

