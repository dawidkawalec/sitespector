# Architectural Decisions Log

## Super Admin Dashboard (2026-02-25)

- **Decision**: Add a full super-admin panel at `/admin/*` accessible only to users with `profiles.is_super_admin = true`.
- **Rationale**: Platform operators need a global view of all users, workspaces, audits, subscriptions, and system health without relying on direct DB access.
- **Implementation**:
  - **DB**: `is_super_admin BOOLEAN DEFAULT FALSE` column added to `public.profiles` (Supabase). Migration SQL in `supabase/schema.sql` comments.
  - **Backend**: `backend/app/routers/admin.py` — new router at `/api/admin/` with `verify_super_admin` dependency. Endpoints: `/stats`, `/users`, `/users/{id}`, `/users/{id}/plan`, `/workspaces`, `/audits`, `/system`.
  - **Guard**: `verify_super_admin` checks `profiles.is_super_admin` via Supabase service role. Returns 403 for non-admins.
  - **Frontend hook**: `frontend/lib/useAdmin.ts` — `useAdmin()` returns `{ isSuperAdmin, isLoading, userId }`.
  - **Frontend API**: `adminAPI` namespace added to `frontend/lib/api.ts` with typed interfaces.
  - **Pages**: `frontend/app/(app)/admin/` — layout + 6 pages (overview, users, users/[id], workspaces, audits, system).
  - **Sidebar**: `UnifiedSidebar` shows "Panel Admina" link (red/shield icon) for super admins only.
  - **Super admin email**: `info@craftweb.pl` — set via migration SQL.
- **Security**: All backend admin endpoints require valid Supabase JWT + `is_super_admin = true`. Frontend layout redirects non-admins to `/dashboard`.
- **Data strategy**: Admin endpoints join Supabase (users, workspaces, subs) + VPS PostgreSQL (audits, chat) in Python.

## PDF Report System v2 — Modular Multi-Type (2026-02-25)

- **Decision**: Replaced the single-file `pdf_generator.py` (~300 lines, ~10 pages) with a full modular PDF system (`backend/app/services/pdf/` package, 25+ section modules, `backend/templates/pdf/` templates, chart generation via matplotlib).
- **Rationale**: Old PDF covered only ~8 sections with no Senuto data, no AI contexts, no charts, no execution plan. New system supports 25+ sections covering all audit data sources (SF crawl, Lighthouse, Senuto, 9 AI contexts, cross-tool analysis, execution plan tasks). Added 3 pre-configured report types for different audiences.
- **Implementation**:
  - `backend/app/services/pdf/__init__.py` — exports `generate_pdf()`
  - `backend/app/services/pdf/generator.py` — main orchestrator
  - `backend/app/services/pdf/config.py` — `ReportTypeConfig` for `executive/standard/full`
  - `backend/app/services/pdf/charts.py` — matplotlib SVG charts (15 chart types)
  - `backend/app/services/pdf/styles.py` — WeasyPrint CSS A4 with `@page` running header/footer
  - `backend/app/services/pdf/utils.py` — shared helpers
  - `backend/app/services/pdf/sections/` — 27 Python data extractors
  - `backend/templates/pdf/base.html` — WeasyPrint base with running elements
  - `backend/templates/pdf/macros.html` — Jinja2 reusable macros
  - `backend/templates/pdf/sections/` — 18 section HTML templates
  - `backend/app/routers/audits.py` — PDF endpoint extended with `?report_type=executive|standard|full`
  - `frontend/app/(app)/audits/[id]/pdf/page.tsx` — new UI with 3-option report type selector
  - `backend/requirements.txt` — added `matplotlib==3.9.4`, `numpy==1.26.4`
- **Header/Footer**: Every page (except cover) shows SiteSpector logo SVG + URL + report type in header, and branding + page numbers in footer via WeasyPrint `@page` margin boxes.
- **Charts**: matplotlib with Agg backend (no GUI), exported as base64 SVG strings, embedded in HTML `<img src="data:image/svg+xml;base64,...">`.
- **Backward compat**: Old `pdf_generator.py` kept in place but no longer called by the API endpoint.
- **Outcome**: Professional 50–150 page reports covering all audit data, usable by different audiences (executive/marketing/technical).

## Mandatory Project Flow + Sidebar Redesign (2026-02-25)

- **Decision**: Enforce `Workspace → Project → Audit` flow. Dashboard no longer creates audits — only shows workspace trends. Audits must always belong to a project (`project_id` required at UI level). Added backend endpoint `PATCH /api/audits/{id}/assign-project` for migrating orphaned audits.
- **Rationale**: Audits created from dashboard had `project_id = NULL` so they never appeared in project views. Users were confused. Clean hierarchy needed for scalability.
- **Implementation**:
  - `dashboard/page.tsx`: Removed "Nowy Audyt" button + `NewAuditDialog`. Now shows workspace trends + read-only recent audits list with CTA to create project.
  - `backend/app/routers/audits.py`: Added `PATCH /{audit_id}/assign-project` endpoint.
  - `frontend/lib/api.ts`: Added `auditsAPI.assignProject()`.
- **Sidebar redesign**: Replaced flat audit dropdown with expandable projects tree. Each project item expands to show its 3 most recent audits + "Nowy audyt" button. Added search bar that filters projects by name/URL. Active project auto-expands. Audit nav sections still show when on `/audits/*` routes.
- **Outcome**: Clear flow enforced. Sidebar scales to 10+ projects without becoming unreadable.

## Projects within Workspaces (2026-02-17)

- **Decision**: Introduce a **Project** entity between Workspace and Audit. One project = one website (e.g. matkaaptekarka.pl). Audits, schedules, and team assignments are scoped to projects. Projects and project_members live in **Supabase**; `project_id` added to VPS `audits` and `audit_schedules` (nullable, no FK).
- **Rationale**: Users need to group audits by site, set schedules per site, compare audits within a site, and assign different teams per project (e.g. agency with 5 projects, different client access per project). Two-tier permissions: workspace owner/admin see all projects; workspace members see only projects they are assigned to (project_members). Project roles: manager, member, viewer (viewer for agency clients).
- **Implementation**: Supabase tables `projects` (workspace_id, name, url, description, created_by), `project_members` (project_id, user_id, role). Backend: `verify_project_access()`, projects router (CRUD + members), audits/schedules optional `project_id`. Frontend: ProjectContext, `/projects`, `/projects/[projectId]/*` (dashboard, audits, compare, schedule, team), sidebar project nav, dashboard project cards, NewAuditDialog project context. Migration script: `scripts/migrate_projects.py` groups existing audits by domain and creates projects.
- **Outcome**: Clear hierarchy (Workspace → Project → Audit), per-project team and schedule, backward compatibility (project_id nullable, `/audits/[id]` unchanged).

## Crawl: Custom User-Agent, 403 Detection, Qdrant Cleanup on Delete (2026-02-17)
- **Decision**: (1) Allow per-audit custom User-Agent for crawler; (2) Detect homepage 4xx/5xx and skip AI/Quick Wins to avoid misleading recommendations; (3) Delete RAG vectors from Qdrant when an audit is deleted.
- **Rationale**: Some sites (e.g. Cloudflare) block default crawler; whitelisting a custom UA unblocks. When crawl returns 403, crawl data is empty and AI would suggest false “add meta title” etc.; skipping AI when `crawl_blocked` avoids that. Orphaned Qdrant vectors were never removed on audit delete.
- **Implementation**: `crawler_user_agent` (Audit + AuditCreate + NewAuditDialog Advanced); passed to Screaming Frog via `crawl.sh` $2 and sitemap detection. `_transform_sf_data` sets `crawl_blocked` / `crawl_blocked_status`; worker sets `audit.crawl_blocked` and skips AI/execution plan when blocked. Frontend: banner in audit layout, notices on SEO/Quick Wins. `delete_audit` calls `delete_points_by_filter` for `audit_rag_chunks` before DB delete.
- **Outcome**: Users can agree custom UA with site owner; blocked crawls no longer produce garbage Quick Wins; audit deletion cleans Qdrant.

## Content Brief System for Landing Expansion (2026-02-14)
- **Decision**: Adopted "creative brief" approach instead of CMS/JSON system. One markdown file per page in `landing/content/briefs/` serves as a complete creative document for an AI agent to build pages from.
- **Rationale**: Gives AI agent full creative freedom to design and build pages. No restrictive schemas or runtime data dependencies. Briefs contain ready copy + design spec + image descriptions — agent reads and creates the actual React components.
- **What was created**: 23 files total — 2 reference docs (`_REFERENCE.md`, `_AGENT_INSTRUCTIONS.md`), 18 page briefs, `_BLOG_IDEAS.md` (27 articles), `_CASE_STUDIES.md` (10 studies).
- **Previous approach (discarded)**: JSON + Markdown CMS system with content.ts helper. Files deleted, only blog posts and case studies markdown kept.
- **Outcome**: AI content agent can now work independently — reads brief, builds page, generates graphics.

## Landing Pages: Server Markup over React-Bootstrap for Metadata (2026-02-14)
- **Decision**: New landing subpages that export `metadata` are implemented as Server Components using plain Bootstrap markup (`div.container`, `div.row`, `div.col-*`) instead of importing components from `react-bootstrap`.
- **Rationale**: In this repo setup, `react-bootstrap` components are treated as client-only during prerender, which breaks `next build` for Server Component pages.
- **Outcome**: Pages can export `metadata` and still use Bootstrap styling without runtime prerender errors.

## Landing: Unified Heading Typography (2026-02-14)
- **Decision**: Enforce consistent heading weights and a responsive font-size scale globally for landing pages.
- **Rationale**: Mixed usage of `fw-*` classes + global SCSS overrides caused inconsistent H1/H2 appearance across subpages (thin vs bold, different rhythm).
- **Implementation**: `landing/src/assets/scss/_general.scss` defines heading weights (`h1-h6`) + responsive `clamp()` scale for `.hero-section` and `.main-title` patterns; remove conflicting overrides in section SCSS.
- **Outcome**: Holistic, predictable typography across the entire landing, while keeping existing hero underline/gradient accents (`text-line`, `text-gradient`).

## Landing Brief Files — 10 Page Refresh Briefs (2026-02-14)

- **o-nas.md**: Strona O nas — Hero, historia (frustracja z narzędziami → SiteSpector), misja (demokratyzacja SEO), 5 punktów różnic (Execution Plan, AI Overviews, PDF, zespoły, EU), technologia (SF, LH, Senuto, Gemini), partnerstwo Senuto, placeholder zespołu, CTA.
- **kontakt.md**: Strona Kontakt — Hero, dane (Warszawa, kontakt@sitespector.pl, pn–pt 9–17 CET), formularz (imię, email, temat dropdown, wiadomość), CTA do darmowego audytu.
- **porownanie.md**: Porównanie SiteSpector vs Screaming Frog vs Ahrefs vs SEMrush — tabela funkcji (Execution Plan, AI Overviews, Senuto, harmonogramy, 3-fazowy audyt), ceny ($29 vs 259 GBP vs $129 vs $139), sekcja „Dlaczego SiteSpector wygrywa”.
- **docs.md**: Centrum pomocy — 10 sekcji (Jak zacząć, Panel audytu, Execution Plan, Raporty PDF, Zespoły, Harmonogramy, Subskrypcje, Integracje, AI Analiza, Bezpieczeństwo), linki do podstron, CTA jeśli brak odpowiedzi.
- **changelog.md**: Changelog — wpisy per miesiąc z ikonami (feature/improvement/fix), luty 2026 (Senuto, AI Overviews, Execution Plan, 3-fazowy audyt, harmonogramy, analiza treści/UX/security, benchmarki).
- **case-study.md**: Indeks case studies — 4–6 kart z kategoriami (Agencja, E-commerce, Freelancer, Weryfikacja), preview wyzwanie + metryka + CTA, link do pełnych studiów.
- **regulamin.md**: Regulamin — 8 sekcji (Postanowienia ogólne, Definicje, Warunki/plany Pro $29 / Enterprise $99, Płatności Stripe, Ochrona danych, Odpowiedzialność, Własność intelektualna, Postanowienia końcowe).
- **polityka-prywatnosci.md**: Polityka prywatności — 8 sekcji (Administrator, Zbierane dane, Cel, Przechowywanie Supabase/VPS EU, Udostępnianie Stripe/Gemini/Senuto, Okres, Prawa RODO, Cookies).
- **polityka-cookies.md**: Polityka cookies — tabela (sb-*, _stripe_mid, next-auth.session), brak tracking cookies, instrukcje ustawień przeglądarki.
- **blog.md**: Indeks bloga — karty z cover, tytuł, data, autor, excerpt, kategoria, czas czytania, filtr kategorii, paginacja, newsletter, CTA.

---

## Landing Brief Files — 4 New Creative Briefs (2026-02-14)

- **dla-agencji-seo.md**: Target SEO agencies. Angle: "Jeden panel dla wszystkich klientów." 13 sekcji: hero, problem, porównanie kosztów, workspace per klient, PDF, harmonogramy, Execution Plan, AI Strategy, Quick Wins, benchmark, case study, cennik, CTA.
- **dla-freelancerow.md**: Target freelancers. Angle: "Profesjonalne audyty bez drogich narzędzi." 9 sekcji: hero, wyzwania, plan Free, raporty, AI asystent, Execution Plan, ścieżka wzrostu, tabela Free vs Pro, CTA.
- **integracje.md**: Target technical audience. Deep-dive: Screaming Frog, Lighthouse, Senuto, Gemini AI, Stripe, Supabase, REST API. Wszystkie opisy po polsku.
- **dla-managerow.md**: Target CEO/menedżerów. Angle: "Monitoruj kondycję SEO bez wiedzy technicznej." 15 sekcji: Executive Summary, benchmark, harmonogramy, PDF, weryfikacja agencji, trendy, AI Overviews, Quick Wins, Execution Plan, security, workspace, koszt, CTA.

---

## SEO & AI Crawler Files (2026-02-14)

- **sitemap.xml** (`landing/src/app/sitemap.ts`): Next.js App Router generuje XML (static pages + blog + case-study + docs). W sitemap uwzględniamy tylko strony publiczne/indexowalne (bez login/register/dashboard).
- **robots.txt** (`landing/src/app/robots.ts`): Dyrektywy dla `*` oraz botów AI (`GPTBot`, `ChatGPT-User`, `Claude-Web`, `Google-Extended`). Blokujemy ścieżki aplikacji i techniczne: `/api/`, `/dashboard/`, `/audits/`, `/settings/`, `/invite/`, `/auth/`, `/_next/`, `/logs/`.
- **llms.txt** (frontend/public/llms.txt): Standard llmstxt.org – Markdown z opisem SiteSpector i linkami do głównych sekcji. Nginx: location /llms.txt → frontend, Content-Type: text/markdown.
- **OpenGraph/Twitter + canonical**: ujednolicone przez helper `buildMetadata()` w `landing/src/lib/seo.ts` + `metadataBase` w `landing/src/app/layout.tsx`.
- **Dynamic OG images**: `/og` generowane przez `landing/src/app/og/route.tsx` (Next `ImageResponse`) i używane jako domyślny `og:image` na wszystkich stronach.
- **Schema.org (JSON-LD)**: globalnie `Organization` + `WebSite` w layout oraz per-typ strony (homepage, blog, case-study, docs) przez `landing/src/lib/schema.ts` + `landing/src/components/JsonLd.tsx`.
- **Schema.org coverage (landing + frontend)**: wszystkie publiczne strony marketingowe w `landing` mają `WebPage` + `BreadcrumbList` (a homepage także `FAQPage`). Dodatkowo `frontend/app/layout.tsx` publikuje globalne `Organization` + `WebSite`, a `/sitemap` (frontend) ma `WebPage` + `BreadcrumbList`.

---

## Public Marketing Navigation Unification (2026-02-15)

- **Decision**: Public/marketing navigation is route-based IA (no scroll-to-section anchors) and stays consistent across both Next.js apps.
- **Why**: Nginx routes `/` and marketing pages to `landing`, but some public pages (e.g. `/sitemap`) are served by `frontend`, which created visible header/footer inconsistency.
- **Implementation**:
  - Landing mega menu: `landing/src/component/layout/Topbar/page.tsx` + styles `landing/src/assets/scss/_mega-menu.scss`.
  - Canonical pricing page: `/cennik` (`landing/src/app/cennik/page.tsx`) + Nginx route `docker/nginx/nginx.conf` + sitemap `landing/src/app/sitemap.ts`.
  - Frontend public shell aligned: `frontend/components/layout/PublicNavbar.tsx` and `frontend/components/layout/PublicFooter.tsx`.

---

## Landing Topbar: Split Login/Signup + Auth-aware Dashboard CTA (2026-02-15)

- **Decision**: Replace the single combined CTA ("Zaloguj się / Załóż konto") with separate "Zaloguj się" + "Załóż konto", and when a Supabase session is present show "Przejdź do panelu" instead.
- **Rationale**: Clearer user intent (login vs signup) and better UX for returning users (direct link to dashboard instead of repeating auth CTAs).
- **Implementation**:
  - Landing topbar checks Supabase session client-side and listens for auth state changes: `landing/src/component/layout/Topbar/page.tsx`.
  - Dashboard link is derived from `NEXT_PUBLIC_APP_URL` (`getAppUrl()`) and points to `/dashboard` on the main app.
- **Notes**:
  - Detection is best-effort and relies on the browser session (Supabase persisted session); if not available, the UI falls back to guest CTAs.

---

## ADR-008: 3-Phase Audit System with Interactive Tasks (2026-02-14)

### Context
Users needed more than just analysis - they needed concrete, actionable execution plans. The existing 2-phase system (Data + AI Analysis) generated recommendations but lacked specific implementation instructions and task tracking.

### Decision
Expand to a 3-phase audit system:
- **Phase 1:** Data Collection (Screaming Frog + Lighthouse + Senuto)
- **Phase 2:** AI Analysis (7 specialist context analyses + strategy synthesis)  
- **Phase 3:** Execution Plan (8 module-specific task generators with concrete fix instructions)

Tasks stored in separate `audit_tasks` table (not JSONB) to enable interactive features: status toggling, notes, priority changes, filtering.

### Implementation

**Backend:** AuditTask model, ai_execution_plan.py service (8 generators + synthesis), tasks router, worker Phase 3  
**Frontend:** ModeSwitcher (3 modes: Dane/Analiza/Plan), AnalysisView, TaskListView, TaskCard components  
**Database:** audit_tasks table with 6 indexes, run_execution_plan flag

### Consequences

**Positive:** Concrete tasks with code snippets, interactive tracking, quick wins auto-tagged, full-width analysis view, scalable  
**Negative:** +30-60s Phase 3 time, +8-12h frontend module refactoring, +$0.001/audit AI cost  
**Mitigation:** Phase 3 optional, pattern documented, costs negligible

### Status
Backend: 100% complete | Frontend foundation: 100% complete | Module refactoring: SEO, Links, Performance, Images, UX-Check, Security, AI Overviews, **Visibility**

### Related Files
`backend/app/models.py`, `backend/app/services/ai_execution_plan.py`, `backend/worker.py`, `frontend/components/audit/`, `frontend/app/(app)/audits/[id]/ai-overviews/page.tsx`, `IMPLEMENTATION_GUIDE_3_PHASE.md`, `3_PHASE_IMPLEMENTATION_SUMMARY.md`

---

## 📜 Content Architecture: Hybrid Markdown + JSON (Feb 2026)
- **Decision**: Adopted Option B (Hybrid) — content stored as JSON (structured data) + Markdown (long-form pages) in `landing/content/`. Components will read from these files via helper functions.
- **Rationale**: Enables separate content agent to manage content without touching React code. JSON for structured/repeatable data (testimonials, pricing, FAQ), Markdown for long-form pages (blog, case studies, legal). Git-friendly, type-safe, zero additional dependencies.
- **Outcome**: 
  - Created `landing/content/` with 14 JSON data files, 13 page markdowns, 23 blog post templates, 4 case studies, 3 changelog entries, 10 docs sections
  - Created `landing/src/lib/content.ts` helper library
  - Created 7 new page route shells (sprawdz-agencje-seo, dla-ecommerce, etc.)
  - Added sitemap.ts, robots.ts for SEO
  - Updated nginx with 7 new routes + sitemap/robots
  - Content agent prompt and update procedure documented
- **Next Phase**: Refactor existing components to read from content files (currently content files exist alongside hardcoded components).

## 📜 Landing Page Expansion & Public API (Feb 2026)
- **Decision**: Expanded the landing page into a full marketing site with blog, documentation, legal pages, and case studies.
- **Decision**: Renamed `demosite/` to `landing/` to match service naming.
- **Decision**: Added public API endpoints for contact and newsletter forms in FastAPI.
- **Rationale**: Improve SEO, build trust, and provide comprehensive information to potential customers.
- **Outcome**: 12 new public routes added, served by the `landing` container. Public API functional with validation.

## 📜 Monorepo Cleanup & Context7 Canonicalization (Feb 2026)
- **Decision**: Moved all architectural plans to `.cursor/plans/` and removed the legacy `docs/` folder.
- **Rationale**: Maintain a clean root directory and ensure `.context7/` is the only source of truth for documentation.
- **Outcome**: Root directory simplified, documentation centralized.

## 📜 Documentation Cleanup (Feb 2026)
- **Decision**: Canonical documentation moved to `.context7/`.
- **Rationale**: Ensure AI agents have a single, up-to-date source of truth.
- **Outcome**: `docs/` folder reduced to public/marketing materials. `.context7/INDEX.md` created.

## 📜 Audit Response Enrichment for Schema Drift (Feb 2026)
- **Decision**: Add best-effort normalization/enrichment in `GET /api/audits/{id}` for older stored `results` payload shapes.
- **Rationale**: Production audits are stored as JSONB and payload shapes evolve; UI must remain correct without forcing re-runs.
- **Outcome**: Response now fills missing Senuto backlink summary counts and can detect sitemap (robots + common endpoints) when crawl payload lacks it.

## 🎨 Unified Context-Aware Sidebar (Feb 2026)
- **Decision**: Implement a single `UnifiedSidebar` that handles all navigation contexts.
- **Rationale**: Improve UX consistency and eliminate duplicate menu items.
- **Outcome**: Replaced separate sidebars for dashboard, settings, and audits.

## 🚀 SaaS Transformation (Feb 2025)
- **Decision**: Use Supabase for Auth, User Management, Teams + Stripe for Billing.
- **Rationale**: Built-in RLS for data isolation and faster development.
- **Outcome**: Dual-database strategy (Supabase for SaaS, VPS for audits).

---

## ADR-001: Use PostgreSQL with JSONB for Audit Results
**Date**: 2024-12-01
**Status**: ✅ Accepted
**Decision**: Use single JSONB column (`audits.results`) to store all audit data.
**Rationale**: Schema flexibility and simpler queries.

---

## ADR-002: Async Python with FastAPI
**Date**: 2024-12-01
**Status**: ✅ Accepted
**Decision**: Use FastAPI with async/await throughout.
**Rationale**: High concurrency for I/O-bound audit processing.

---

## ADR-003: Worker as Polling Loop (Not Queue)
**Date**: 2024-12-05
**Status**: ✅ Accepted
**Decision**: Worker polls database every 10 seconds for PENDING audits.
**Rationale**: Simple infrastructure, sufficient for MVP.

---

## ADR-004: Docker Exec for External Tools
**Date**: 2024-12-05
**Status**: ✅ Accepted
**Decision**: Run Screaming Frog and Lighthouse in separate containers, exec via Docker socket.
**Rationale**: Isolation and resource limits.

---

## ADR-005: Next.js Standalone Build for Frontend
**Date**: 2024-12-10
**Status**: ✅ Accepted
**Decision**: Use Next.js standalone output.
**Rationale**: Optimized for Docker images.

---

## ADR-006: Let's Encrypt SSL (Migration from Self-signed)
**Date**: 2026-02-08
**Status**: ✅ Done
**Decision**: Use Let's Encrypt via Certbot for sitespector.app.
**Rationale**: Production readiness and security.

---

## ADR-007: Google Gemini over OpenAI GPT
**Date**: 2024-12-20
**Status**: ✅ Accepted
**Decision**: Use Google Gemini (gemini-3-flash).
**Rationale**: Cost-effective and fast for structured analysis.

---

## ADR-008: VPS-Only Development (No Local Docker)
**Date**: 2024-12-22
**Status**: ✅ Accepted
**Decision**: All Docker runs on VPS only, code locally in Cursor.
**Rationale**: Simpler setup and production-like testing.

---

## ADR-009: Git Auto-Commit Allowed, Auto-Push Forbidden
**Date**: 2025-01-05
**Status**: ✅ Accepted
**Decision**: Agent can auto-commit, but MUST ask before pushing.
**Rationale**: User control over deployment.

---

## ADR-010: Context7 for Project Documentation
**Date**: 2025-02-01
**Status**: ✅ Accepted
**Decision**: Use `.context7/` folder with structured markdown files.
**Rationale**: Single source of truth for AI agents.

---

## ADR-011: TanStack Query over Redux
**Date**: 2024-12-12
**Status**: ✅ Accepted
**Decision**: Use TanStack Query for server state.
**Rationale**: Automatic caching and polling support.

---

## ADR-012: shadcn/ui over Material UI
**Date**: 2024-12-13
**Status**: ✅ Accepted
**Decision**: Use shadcn/ui components.
**Rationale**: Full control over code and modern design.

---

## ADR-013: Next.js 14 Route Groups for Layout Consistency
**Date**: 2026-02-04
**Status**: ✅ Accepted
**Decision**: Use `(app)` route group for all authenticated pages.
**Rationale**: Consistent sidebar layout across dashboard and audits.

---

## ADR-014: Simple RLS Policies to Avoid Infinite Recursion
**Date**: 2026-02-04
**Status**: ✅ Accepted
**Decision**: Use direct comparisons like `user_id = auth.uid()`.
**Rationale**: Fix performance and recursion issues in Supabase.

---

## ADR-015: Senuto Integration & Enhanced Technical Data
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: Integrate Senuto API for Visibility and Backlinks. Expand Screaming Frog to multi-tab exports. Save raw Lighthouse JSON.
**Rationale**: Provide "complete" technical data set before AI strategy phase.
**Outcome**: 15 new Senuto endpoints in pipeline, 10 SF tabs, full LH raw data, 2 new frontend pages.

---

## ADR-016: Split Layout + Contextual AI per Area
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: Every audit data page uses a split layout (data left, AI insights panel right). AI pipeline generates per-area contextual analyses stored in `results.ai_contexts.*`. New `/ai-strategy` page provides full duplicate of all AI insights + executive summary + roadmap + cross-tool correlations.
**Rationale**: Users need both raw data and AI context visible simultaneously. The AI strategy page aggregates everything for client-facing use.
**Key Components**:
- `AuditPageLayout` - reusable split layout wrapper (collapsible, localStorage state)
- `AiInsightsPanel` - reusable AI panel (key findings, recommendations, quick wins, priority issues)
- `DataExplorerTable` - reusable paginated/searchable/sortable/exportable table
- 9 new AI analysis functions (6 per-area + cross_tool + roadmap + executive_summary)
- AI pipeline toggle (`run_ai_pipeline` column) + manual trigger endpoints
- Sidebar restructured: DANE AUDYTU / STRATEGIA AI / RAPORTY

---

## ADR-017: AI Pipeline Toggle (Option B)
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: AI pipeline runs automatically by default but can be toggled off in New Audit dialog. Manual trigger available via `POST /api/audits/{id}/run-ai` and `POST /api/audits/{id}/run-ai-context`.
**Rationale**: Allows quick technical-only audits when AI budget/time is a concern, while still supporting on-demand AI analysis later.

---

## ADR-018: Tool-Agnostic Information Architecture (IA)
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: Removed all tool-specific names (Screaming Frog, Lighthouse, Senuto) from the UI. Consolidated data into logical SEO areas: SEO, Wydajność, Widoczność, Linki, Obrazy. Every area now includes a "Surowe dane (RAW)" explorer.
**Rationale**: Improve UX by focusing on SEO outcomes rather than tools. Provide "complete" data access via RAW explorers with search, sort, and export.
**Outcome**:
- Sidebar restructured without tool names.
- 5 main areas with Overview + RAW tabs.
- Automated pagination for Senuto datasets (up to 500-1000 items).
- Legacy routes (`/backlinks`, `/lighthouse-data`) redirected to new IA.

---

## ADR-019: Reproducible Screaming Frog Image for Crawl Merge Step
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**: Explicitly copy `merge_csvs.py` into the Screaming Frog image and install `python3` as a declared runtime dependency.
**Rationale**: Prevent non-deterministic `crawl:start` failures caused by missing helper scripts after clean rebuilds.
**Outcome**:
- `docker/screaming-frog/Dockerfile` includes:
  - `COPY merge_csvs.py /usr/local/bin/merge_csvs.py`
  - explicit `python3` in apt packages
- VPS deploy standard now uses `docker compose build --no-cache` for critical crawler/frontend fixes.

---

## ADR-020: AI Fallback Contract + In-Progress UX State
**Date**: 2026-02-11
**Status**: ✅ Done
**Decision**:
- Standardize AI fallback payload schema in `ai_client` so contextual and strategy analyzers receive expected keys.
- Expose and consume `ai_status`/`processing_step` on frontend to show explicit "AI analysis in progress" states.
**Rationale**:
- Audits could appear as `completed` while AI results were effectively empty due to schema mismatch in fallback responses.
- Users need deterministic status visibility instead of ambiguous empty panels.
**Outcome**:
- Added AI diagnostics checkpoints in worker/services logs.
- Updated frontend polling logic to continue while `ai_status="processing"`.
- Added in-progress banners/panel states on `ai-strategy` and area pages.

---

## ADR-021: Senuto Full Data Integration (Visibility + AIO + Sections)
**Date**: 2026-02-12
**Status**: ✅ Done
**Decision**: Expand Senuto ingestion to full high-cap datasets and add AI Overviews + sections detail endpoints; expose data across dedicated frontend modules.
**Rationale**: Existing UI covered only a subset of Senuto capabilities and limited keyword volume, reducing analysis depth.
**Outcome**:
- `backend/app/services/senuto.py` expanded to 20 endpoints and high-cap pagination.
- Added `results.senuto.visibility.ai_overviews` and `sections_subdomains/sections_urls`.
- Added worker log step `senuto_extended` and AI context `ai_overviews`.
- Added new frontend route `/audits/[id]/ai-overviews`.
- Visibility page upgraded with advanced tabs/charts and feature distributions.
- Sidebar + tooltips updated for new metrics.

---

## ADR-022: Unified Quick Wins + Gradient Line Style System
**Date**: 2026-02-12
**Status**: ✅ Done
**Decision**:
- Replace scattered/partial quick wins outputs with a single aggregated `results.quick_wins` list composed from:
  - per-area `results.ai_contexts.*.quick_wins`,
  - `results.roadmap.immediate_actions`,
  - `results.content_analysis.roi_action_plan`.
- Standardize line-like chart styling to dashboard visual language (Area/line with soft gradient fill + unified tooltip).
**Rationale**:
- Users saw mismatch between "Quick Wins" (3 generic items) and richer module-specific AI strategy actions.
- Chart visuals were inconsistent across modules after Senuto expansion.
**Outcome**:
- Backend now ranks/deduplicates quick wins with category/source metadata.
- Worker and `run-ai-context` regeneration persist unified quick wins.
- Frontend pages (`ai-strategy`, `quick-wins`) consume aligned quick wins set.
- `AuditCharts` and comparison trend charts now follow one gradient line style preset.

---

## ADR-023: Production VPS Security Baseline (Key-Only SSH + Firewall + Fail2ban)
**Date**: 2026-02-13
**Status**: ✅ Done
**Decision**:
- Provision production VPS with SSH keys from the start (no password-based SSH).
- Disable root SSH login; use a dedicated `deploy` user with controlled sudo.
- Enable UFW immediately (allow inbound: 22/80/443; default deny incoming).
- Enable fail2ban for SSH brute-force protection.
- Add explicit outbound block for UDP/9021 as defense-in-depth after abuse incident.
**Rationale**:
- Reduce time-to-compromise risk on public IPs.
- Make abuse/compromise less likely and incident response faster.
**Outcome**:
- New VPS deployed with hardened SSH, UFW, fail2ban, and Docker-based app deployment.

---

## ADR-024: HARD BLOCK Phase 2 → Phase 3 (AI Analysis Required)
**Date**: 2026-02-14
**Status**: ✅ Done
**Decision**:
- Phase 3 (Execution Plan) **NIE MOZE** wystartowac jesli Phase 2 (AI Analysis) nie zakonczyla sie sukcesem (`ai_status != "completed"`).
- Jesli AI Analysis zawiodla/zostala skipnięta, `execution_plan_status` dostaje status `"blocked"` zamiast uruchamiac generowanie planu.
**Rationale**:
- Phase 3 potrzebuje `ai_contexts` z Phase 2 do generowania konkretnych taskow z fix_data.
- Generowanie planu "na bazie niczego" (gdy Phase 2 failed) prowadzi do niskiej jakosci/generycznych taskow.
- HARD BLOCK zapewnia ze uzytkownik dostanie albo **pelny plan z AI insights**, albo **jasny komunikat ze plan nie mogl byc wygenerowany**.
**Outcome**:
- `backend/worker.py`: dodano sprawdzenie `audit.ai_status == "completed"` przed wywolaniem `run_execution_plan()`.
- Jesli warunek nie jest spelniony: `execution_plan_status = "blocked"` + log z powodem.
- Frontend widzi `execution_plan_status === "blocked"` i moze wyswietlic odpowiedni komunikat.

---

## ADR-025: Cross-Module Consistency Validator
**Date**: 2026-02-14
**Status**: ✅ Done
**Decision**:
- Dodac `validate_cross_module_consistency()` funkcję do sprawdzania sprzecznosci miedzy modulami AI (np. Visibility mowi "brak AIO" ale AI Overviews ma dane).
- Validator uruchamiany automatycznie po zakonczeniu Phase 2 (po wygenerowaniu `ai_contexts`).
- Wyniki zapisywane w `audit.results.consistency_report` z listami `conflicts` i `warnings`.
**Rationale**:
- AI moduly generuja wnioski niezaleznie -- moga pojawic sie sprzecznosci (np. jeden modul mowi "brak X", drugi modul pokazuje dane X).
- Wykrywanie konfliktow pozwala na debugging promptow AI i poprawe jakosci analiz.
- Logi konfliktow pomagaja identyfikowac problemy z danymi wejsciowymi (np. Senuto zwraca incomplete payload).
**Outcome**:
- `backend/app/services/ai_analysis.py`: dodano `validate_cross_module_consistency()`.
- `backend/worker.py`: wywolanie validatora po `ai_contexts` + logowanie konfliktow.
- `audit.results.consistency_report` zawiera: `conflicts`, `warnings`, `is_consistent`, `checked_at`.

---

## ADR-026: Dedykowane AI Contexts dla Security i UX
**Date**: 2026-02-14
**Status**: ✅ Done
**Decision**:
- Dodac dedykowane `analyze_security_context()` i `analyze_ux_context()` funkcje generujace kontekstowe wnioski AI dla modulow Security i UX.
- Przed tym Security i UX mialy tylko surowe analizy Phase 2 (`results.security`, `results.ux`) -- brakowalo im struktury `ai_contexts.{module}` z `key_findings`, `recommendations`, `quick_wins`, `priority_issues`.
**Rationale**:
- Wszystkie inne moduly (SEO, Performance, Visibility, Links, Images) maja AI contexty -- Security i UX byly "second-class citizens".
- Frontend oczekiwal `ai_contexts.security` i `ai_contexts.ux` (zgodnie z 3-Phase System pattern).
- Dodanie AI contexts dla Security/UX zapewnia spojnosc UX/API i lepsze wnioski dla uzytkownika.
**Outcome**:
- `backend/app/services/ai_analysis.py`: dodano `analyze_security_context()` i `analyze_ux_context()`.
- `backend/worker.py`: dodano wywolania do `context_tasks` w Phase 2.
- Frontend Security/UX pages teraz czytaja `audit.results.ai_contexts.security/ux` zamiast `audit.results.security/ux`.

---

## ADR-027: Zwiększenie max_tokens do 20000 (Gemini 3 Flash Optimization)
**Date**: 2026-02-14
**Status**: ✅ Done
**Decision**:
- Ustawic `max_tokens=20000` (20k) we **wszystkich** wywolaniach AI (zamiast 2048-4096).
- Gemini 3 Flash ma okno kontekstu 1M tokenow -- nie ma powodu oszczedzac na max_tokens.
**Rationale**:
- Obserwowalismy ze niektore odpowiedzi AI (szczegolnie execution plan tasks) byly obcinane przy 2048-4096 tokenach.
- Gemini 3 Flash jest szybki i tani nawet przy 20k output -- bottleneck to czas myslenia modelu, nie liczba tokenow.
- Bogate odpowiedzi AI (z konkretnymi przykladami, code snippets, pelnym fix_data) wymagaja wiecej miejsca.
**Outcome**:
- `backend/app/services/ai_analysis.py`: `_call_ai_context()` teraz uzywa `max_tokens=20000`.
- `backend/app/services/ai_execution_plan.py`: wszystkie `generate_*_tasks()` uzywaja `max_tokens=20000`.
- Execution plan tasks maja teraz wiecej miejsca na szczegoly (np. proposed meta title, JSON-LD schema, instrukcje wdrozenia).

---

## ADR-028: Task Limit 200 (Holistyczne Podejście do Dużych Stron)
**Date**: 2026-02-14
**Status**: ✅ Done
**Decision**:
- Ustawic `MAX_TASKS = 200` w `synthesize_execution_plan()` -- obcinac taski po sortowaniu wg priorytetu (najwazniejsze zostaja).
- Dla duzych stron (np. sklep 70k produktow) taski powinny byc **holistyczne** (np. "Popraw meta title w kategorii Elektronika"), nie **per-produkt** (np. 70k taskow "Popraw meta title produktu #XYZ").
**Rationale**:
- Bez limitu AI moze wygenerowac setki/tysiace taskow dla duzych stron.
- 200 priorytetowych taskow to wiecej niz wystarczy dla wiekszosci klientow (real-world projekty maja 20-50 taskow "do zrobienia").
- Holistyczne taski sa bardziej uzyteczne niz szczegolowe per-item (klient chce znac **co** zrobic, nie dostac 5000 linijek TODO).
**Outcome**:
- `backend/app/services/ai_execution_plan.py`: `synthesize_execution_plan()` obcina do 200 taskow.
- Prompt engineering w `generate_*_tasks()` sugeruje grupowanie taskow (np. "dla kategorii", "dla typu strony") zamiast per-URL.

---

## ADR-029: Global Snapshot Injection (Cross-Module Consistency)
**Date**: 2026-02-14
**Status**: ✅ Done
**Decision**:
- Doklejac do promptow AI maly, kanoniczny "GLOBAL_SNAPSHOT" z najwazniejszymi faktami cross-modulowymi.
- Snapshot jest wstrzykiwany do:
  - Phase 2: contextual AI (`ai_contexts.*`) + strategic AI (cross_tool/roadmap/executive_summary)
  - Phase 3: execution plan task generators (`generate_*_tasks()`)
**Rationale**:
- Moduly AI dzialaja rownolegle i dostaja rozne podzbiory danych, co powodowalo sprzeczne wnioski (np. Visibility: "brak AIO" vs AI Overviews: "jest AIO").
- Snapshot ustala "kanoniczne fakty" (np. `ai_overviews.has_aio=true`) i wymusza na modelu brak sprzecznosci + komunikat "brak danych" zamiast zgadywania.
**Outcome**:
- `backend/app/services/global_context.py`: `build_global_snapshot()` + `format_global_snapshot_for_prompt()`.
- `backend/app/services/ai_analysis.py`: `_call_ai_context(..., global_snapshot=...)` dokleja snapshot do promptu.
- `backend/app/services/ai_execution_plan.py`: `_with_global_snapshot()` dokleja snapshot do promptu task generatorow.
- `backend/worker.py` i `backend/app/routers/audits.py`: przekazuja global snapshot do wszystkich wywolan analiz.

---

## ADR-030: Landing pages metadata + Client Components (Next.js 15)
**Date**: 2026-02-14
**Status**: ✅ Done
**Decision**:
- Dla stron landingu, które muszą być Client Component (np. formularze / elementy interaktywne), `metadata` jest eksportowane w Server Component wrapperze `page.tsx`.
- UI/interakcje są przenoszone do osobnego komponentu `*Client.tsx` z `'use client'` (np. `KontaktClient`, `PorownanieClient`).
- Dla nowych dynamicznych tras w Next.js 15 (`app/.../[slug]/page.tsx`), `params` traktujemy jako `Promise` i obsługujemy przez `await` w `generateMetadata()` i w komponencie strony.
**Rationale**:
- `metadata` nie jest wspierane w Client Components.
- W repo pojawiają się elementy React-Bootstrap / interaktywne UI, które wymagają `'use client'`, a SEO nadal potrzebuje `metadata`.
- Next.js 15 typuje `params` jako `Promise` w PageProps, co w przeciwnym razie łamie `next build` (typecheck).
**Outcome**:
- Landing ma spójny wzorzec: `page.tsx` (server) + `*Client.tsx` (client) dla stron wymagających interakcji.
- `/docs/[slug]` używa `generateStaticParams()` + `async generateMetadata({ params: Promise<...> })`.

---

## ADR-031: Security Hardening (Post-Compromise)
**Date**: 2026-02-15
**Status**: ✅ Done
**Decision**:
- Remove all publicly accessible monitoring/logging endpoints from nginx.
- Require `ADMIN_API_TOKEN` (header-based auth) for `/api/logs/*` and `/api/system/status`.
- Disable Swagger/OpenAPI/ReDoc in production.
- Docker socket mounts must be `:ro` (read-only).
- Pin all third-party Docker images to specific versions (no `:latest`).
- Split Docker networking into `internal` (no internet) + `external` (internet).
- Move all credentials from `docker-compose.prod.yml` to `.env` variables.
- Add security headers and rate limiting in nginx.
**Rationale**:
- VPS was compromised twice by Mirai botnet variant despite clean rebuilds.
- Root cause: 6 infrastructure vulnerabilities allowed attackers to read credentials from public endpoints, map the API via Swagger, and escape containers via R/W Docker socket.
- Full repository audit confirmed no malware in code -- attack vector was purely infrastructure config.
**Outcome**:
- `docker/nginx/nginx.conf`: removed Dozzle proxy, added security headers + rate limiting.
- `backend/app/main.py`: conditional Swagger, admin token auth on monitoring.
- `backend/app/config.py`: added `ADMIN_API_TOKEN` setting.
- `docker-compose.prod.yml`: `:ro` socket, pinned Dozzle, dual networks, env var credentials.
- `.env.example`: added `ADMIN_API_TOKEN`, `POSTGRES_USER/PASSWORD/DB`.
- `SECURITY_HARDENING_PLAN.md`: full remediation plan including VPS bootstrap steps.

---

## ADR-032: New VPS Deployment with Full Hardening
**Date**: 2026-02-15
**Status**: ✅ Done
**Decision**:
- Provision new Hetzner VPS (same IP: 46.225.134.48) with clean Ubuntu 24.04.
- Bootstrap with hardened config from `SECURITY_HARDENING_PLAN.md` Phase 1.
- User `deploy` with SSH key-only auth, root disabled.
- UFW: deny all outbound by default, allow only TCP 80/443 + DNS (blocks all outbound UDP = anti-DDoS).
- fail2ban: SSH jail, maxretry=5, bantime=1h.
- Docker installed via official script, `deploy` in docker group.
- All containers built from repo `release` branch with `--no-cache`.
- Production .env with 64-char random credentials (DB password, ADMIN_API_TOKEN, JWT_SECRET).
- Let's Encrypt SSL (auto-renewal via systemd timer + cron backup).
- Security monitoring script every 5 minutes (processes, /tmp executables, SSH keys, Docker TCP, open ports).
**Rationale**:
- Previous VPS was compromised twice. New server with hardened baseline eliminates all known attack vectors.
- Outbound UDP block is the most critical defense against Mirai-style DDoS botnets.
**Outcome**:
- 9/9 containers running healthy.
- Full security audit passed: SSH hardened, UFW active, fail2ban active, Docker secure, API endpoints protected, SSL valid, no suspicious processes.
- Security monitoring cron active.

---

## ADR-033: Audit-Scoped Agent Chat (RAG + Qdrant)
**Date**: 2026-02-15
**Status**: ✅ Done
**Decision**:
- Add agent chat in the dashboard as a persistent side panel (Cursor-like).
- Conversations are strictly scoped to a single `audit_id` (no cross-audit context leakage).
- Use RAG with Qdrant as the vector store, with hard filtering by `audit_id` and agent section allowlist.
- Use Gemini for both chat (Flash) and embeddings (`text-embedding-004`) to keep a single provider.
- Streaming responses via SSE (POST endpoint + auth header), not WebSocket.
**Rationale**:
- Audit reports can be very large (e.g. e-commerce with tens of thousands of products/keywords). Full prompt injection is not scalable.
- Workspace/team security requirements demand strict access checks per audit/workspace.
**Outcome**:
- Backend: new `/api/chat/*` endpoints, chat tables in VPS Postgres, indexing hook in `backend/worker.py`.
- Frontend: chat panel lives in `frontend/app/(app)/layout.tsx` and keeps state across navigation.

---

## ADR-034: Smart Semantic Chunking for AI Analysis in RAG
**Date**: 2026-02-15
**Status**: ✅ Done
**Decision**:
- Replace monolithic JSON blobs in Qdrant with granular, semantically meaningful chunks for all AI-generated analyses.
- Each key finding, recommendation, quick win, roadmap item, cross-tool correlation is stored as an individual Qdrant point with rich metadata (`area`, `field`, `item_index`, `phase`).
- Human-readable text format with prefixes like `[Roadmapa — Natychmiastowe dzialania] Punkt #2: ...` for better embedding quality.
- Update agent `tools_config` to include `roadmap` and `cross_tool` sections where relevant.
- Increase RAG `top_k` from 8 to 12 to accommodate finer-grained chunks.
**Rationale**:
- AI analyses (strategy, roadmap, executive summary) are very long. Stuffing them as raw text into prompts exceeds token limits.
- Users ask questions like "Why point 2 in your roadmap?" — the agent needs to retrieve that specific item, not a 50KB JSON blob.
- Semantic chunking dramatically improves retrieval precision and answer quality.
**Outcome**:
- `rag_service.py`: 5 new smart chunking functions (`_smart_chunk_ai_contexts`, `_smart_chunk_executive_summary`, `_smart_chunk_roadmap`, `_smart_chunk_cross_tool`, `_smart_chunk_quick_wins`).
- Alembic migration `20260215_update_agent_tools` updates agent tools_config in DB.
- No worker changes needed — existing post-Phase4/Phase5 RAG indexing triggers use the new chunking automatically.

---

## ADR-035: Chat Agent Customization + Attachments + True Streaming
**Date**: 2026-02-16
**Status**: ✅ Done
**Decision**:
- Add ordering and customization controls for chat agents:
  - `agent_types.sort_order` for deterministic default ordering of system agents
  - workspace-scoped custom agents (`is_system=false`, `workspace_id` set)
- Add per-conversation response style controls:
  - `chat_conversations.verbosity` (`concise|balanced|detailed`)
  - `chat_conversations.tone` (`technical|professional|simple`)
- Add file attachments in chat:
  - persisted on VPS volume (`settings.CHAT_ATTACHMENTS_PATH`)
  - `chat_attachments` table + upload/download endpoints
- Upgrade SSE to true streaming from Gemini (`generate_content(..., stream=True)`) with fallback to non-streaming.
**Rationale**:
- Default agent order must match product UX (SEO first), not alphabetical sorting.
- Teams need custom roles without changing system agents.
- Users often need to share screenshots/CSV/PDFs while discussing audit fixes.
- Fake streaming (chunking full text) hides model latency; true streaming improves perceived performance.
**Outcome**:
- Backend: new agent CRUD endpoints, attachment endpoints, conversation style fields, Gemini streaming generator.
- Frontend: settings page for agents, style selectors in chat panel, attachment upload/paste/drop UI, copy/export/search shortcuts.

---

### ADR-036: Chat UX Polish (Export, Search, Settings, Uploads, Voice)
**Date**: 2026-02-16
**Status**: Accepted
**Context**: Chat panel needed several UX refinements: export only had MD, search only checked titles, verbosity/tone selectors cluttered UI, file upload was limited to images/CSV/PDF, no speech input.
**Decision**:
- Export: popover menu with format selection (MD, TXT, CSV).
- Search: filter conversations by title AND message content (client-side).
- Settings: verbosity + tone selectors hidden behind a gear icon popover.
- Uploads: backend accepts xlsx, xls, json, md, txt, html, xml, svg in addition to images/csv/pdf.
- Voice: Web Speech API (`SpeechRecognition`) microphone button in chat input; only shown when browser supports it; default language `pl-PL`.
**Rationale**:
- Users need multiple export formats for different workflows (reports vs data analysis).
- Searching only by title misses conversations where the title hasn't been renamed.
- Verbosity/tone are "set and forget" controls — they don't need permanent screen space.
- Users upload various file types (spreadsheets, JSONs, markdowns) alongside images.
- Speech-to-text is standard UX in modern chat interfaces; we already use Google APIs.
**Outcome**:
- Backend: `ALLOWED_ATTACHMENT_MIME_TYPES` expanded to 15+ types.
- Frontend: `ChatPanel.tsx` refactored (export popover, settings popover, deep search), `ChatInput.tsx` gains voice button + wider accept list.

---

## ADR-037: Container-Query RWD for App Shell with Persistent ChatPanel (2026-02-16)

### Context
The authenticated app uses a persistent ChatPanel on desktop. When the panel is open, the available content width shrinks, but viewport-based Tailwind breakpoints (`md:`, `lg:`, `xl:`) still evaluate against the full window width. This caused grids and split layouts to "squish" and break across many views.

### Decision
Adopt **CSS Container Queries** for app layout responsiveness:
- Mark the scrollable content area in `frontend/app/(app)/layout.tsx` as a container (`@container`)
- Use Tailwind container query prefixes in app pages/components (`@md:`, `@lg:`, `@xl:`) instead of viewport breakpoints where appropriate
- Enable `@tailwindcss/container-queries` plugin and define container breakpoints in `frontend/tailwind.config.ts`

Additionally, simplify `AuditPageLayout` by removing its right-side AI panel (which compounded width pressure when combined with ChatPanel). AI insights are integrated inline as a collapsible section.

### Rationale
- Container queries reflect the real available width of the content area when chat is open/resized.
- This fixes RWD behavior without relying on ad-hoc special cases per page.
- Removing a second persistent side panel (AI) prevents extreme horizontal crowding.

### Outcome
- App pages adapt correctly when ChatPanel is open by default.
- Reduced layout regressions across the audits suite and settings views.

### Related Files
`frontend/app/(app)/layout.tsx`, `frontend/components/AuditPageLayout.tsx`, `frontend/tailwind.config.ts`, `frontend/lib/chat-store.ts`

---

## ADR-038: RAG Index Resilience (Batch Embeddings + Qdrant Dimension Guard + Recovery) (2026-02-16)

### Context
Audit-scoped chat relies on a Qdrant vector index built from audit results. Indexing runs best-effort in the worker and must not block audit completion. In practice, embeddings can fail due to quota (429) or model deprecations, leaving Qdrant empty and the chat unable to answer.

### Decision
- Use `models/gemini-embedding-001` only for embeddings.
- Prefer embedding batches via `batchEmbedContents` (REST) to reduce request count during indexing.
- Add embedding throttling + exponential backoff on 429 errors and rotate API keys.
- Guard against Qdrant vector dimension mismatches by validating collection config and recreating the collection when needed.
- Add a manual recovery endpoint `POST /api/audits/{audit_id}/reindex-rag` plus a UI button.
- Track indexing success via `audits.rag_indexed_at` (nullable).

### Rationale
- Batching reduces pressure on per-minute request limits for large audits.
- Backoff and throttling prevent stampeding the provider when quota is temporarily exhausted.
- Dimension guard prevents silent failures when embedding dimensionality changes across models.
- Manual reindex + self-heal improves supportability and user experience.

### Outcome
- Chat shows an explicit `indexing` phase and can attempt a one-time self-heal when context is empty.
- Support/user can force reindex without SSH access.

### Related Files
`backend/app/services/embedding_client.py`, `backend/app/services/rag_service.py`, `backend/app/services/qdrant_client.py`, `backend/app/services/chat_service.py`, `backend/app/routers/audits.py`, `backend/app/models.py`, `frontend/components/chat/ChatPanel.tsx`

---

## ADR-039: VPS Upgrade to CPX42 (8 cores / 16GB) + Parallel Lighthouse Restored (2026-02-16)

**Context**: The previous 2-core / 4GB VPS could not handle two parallel Chrome (Lighthouse) instances plus the rest of the stack. Audits timed out with load average >30.

**Decision**: Upgrade VPS to Hetzner CPX42 (8 AMD cores, 16GB RAM). Restore parallel Lighthouse execution for both desktop and mobile audits. Keep timeout at 180s for safety.

**Consequences**:
- Lighthouse audits are fast again (~90s total instead of ~180s sequential).
- 8 cores handle Screaming Frog + 2x Lighthouse + all services comfortably.
- 14GB free RAM means no memory pressure.

### Related Files
`backend/app/services/lighthouse.py`, `backend/app/config.py`

---

## ADR-040: Landing Container Memory Limit (512 MB) (2026-02-25)

**Context**: After 8 days uptime, `sitespector-landing` consumed 10.41 GiB (68% of VPS RAM). Next.js standalone server leaks memory through unreturned ISR/SSR child processes. No memory limit was configured, allowing unbounded growth.

**Decision**: Add `mem_limit: 512m` and `memswap_limit: 512m` to the landing service in `docker-compose.prod.yml`. The `restart: unless-stopped` policy will auto-restart the container when it hits the limit.

**Consequences**:
- Landing cannot consume more than 512 MB RAM (normal usage is ~67 MB).
- Auto-restart on OOM prevents the VPS from becoming unresponsive.
- Brief service interruption (~5s) during auto-restart is acceptable for a landing page.

### Related Files
`docker-compose.prod.yml`

---

## ADR-041: Docker System Prune + Repository Cleanup (2026-02-25)

**Context**: VPS disk was at 80% (29GB/38GB) due to accumulated Docker images, build cache, and unused layers. Root directory had 7 stale planning/security markdown files.

**Decision**: 
- Run `docker system prune -af` on VPS (reclaimed 19.34 GB, disk → 31%).
- Move stale files to `.archive/security/` and `.archive/old-plans/`.
- Remove duplicate `agents.md` (lowercase copy of `AGENTS.md`).

**Consequences**:
- VPS disk at healthy 31% usage.
- Root directory contains only `README.md` and `AGENTS.md`.
- Historical docs preserved in `.archive/` for reference.

### Related Files
`.archive/`, `docker-compose.prod.yml`

---

## ADR-042: Cross-System Baseline Data Reset (Projects + Audits + Chat) (2026-02-25)

**Context**: After introducing project-scoped audits and chat features, legacy and test records created during development made end-to-end validation noisy and hard to trust.

**Decision**:
- Perform one-time production-safe data reset for runtime entities while preserving schema, RLS, triggers, users, and workspace structure.
- Reset on VPS Postgres: `audits`, `competitors`, `audit_tasks`, `audit_schedules`, `chat_*`, `chat_usage` + `users.audits_count = 0`.
- Reset on Supabase: `projects`, `project_members` + `subscriptions.audits_used_this_month = 0`.

**Consequences**:
- Clean baseline for full regression testing of project/audit flows.
- No migration or policy changes required.
- Historical audit/project/chat data is intentionally removed.

### Related Files
`backend/app/models.py`, `.context7/infrastructure/DATABASE.md`

---

**Last Updated**: 2026-02-25
**Total Decisions**: 42 accepted
**Review**: Update when making significant architectural changes.
