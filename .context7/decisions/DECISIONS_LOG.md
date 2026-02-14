# Architectural Decisions Log

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

- **sitemap.xml** (landing/sitemap.ts): Pełna mapa stron – static, content, blog, case-study, docs, changelog, pricing, register, sitemap. Next.js generuje XML.
- **robots.txt** (landing/robots.ts): Dyrektywy dla * + GPTBot, ChatGPT-User, Claude-Web, Google-Extended. Disallow: /api/, /dashboard, /audits/, /settings/, /invite/, /auth/, /_next/, /logs.
- **llms.txt** (frontend/public/llms.txt): Standard llmstxt.org – Markdown z opisem SiteSpector i linkami do głównych sekcji. Nginx: location /llms.txt → frontend, Content-Type: text/markdown.

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

**Last Updated**: 2026-02-14
**Total Decisions**: 29 accepted
**Review**: Update when making significant architectural changes.
