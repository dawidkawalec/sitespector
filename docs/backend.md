# SiteSpector - Backend & Worker

## Overview

FastAPI (Python 3.11), SQLAlchemy 2.0 async, Supabase JWT auth.

| Component | Location | Description |
|-----------|----------|-------------|
| API server | `backend/app/` | FastAPI application with routers, services, models |
| Worker | `backend/worker.py` | Background audit processor (994 lines) |
| PDF engine | `backend/app/services/pdf/` + `backend/templates/pdf/` | Jinja2 + WeasyPrint report generation |
| Migrations | `backend/alembic/versions/` | 17 Alembic migration files |

Container: `sitespector-worker` shares the backend codebase; worker runs via `python worker.py`.

---

## Routers (`backend/app/routers/`)

| Router | Prefix | Endpoints |
|--------|--------|-----------|
| `auth.py` | `/auth` | `POST /register`, `POST /login`, `GET /me` (legacy JWT auth) |
| `audits.py` | `/audits` | `POST ""` create, `GET ""` list, `GET /history`, `GET /{id}`, `GET /{id}/status`, `DELETE /{id}`, `PATCH /{id}/assign-project`, `GET /{id}/raw` (ZIP export), `GET /{id}/pdf` (PDF report: executive/standard/full), `POST /{id}/fix-suggestion`, `POST /{id}/analyze-pages`, `GET /{id}/quick-wins`, `POST /{id}/generate-alt`, `POST /{id}/run-ai`, `POST /{id}/run-ai-context`, `POST /{id}/run-execution-plan`, `POST /{id}/reindex-rag`, `GET /{id}/rag-status` |
| `projects.py` | `/projects` | `POST ""` create, `GET ""` list, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`, `GET /{id}/members`, `POST /{id}/members`, `PATCH /{id}/members/{mid}`, `DELETE /{id}/members/{mid}` |
| `chat.py` | `/chat` | **Agents:** `GET /agents`, `POST /agents`, `PUT /agents/{id}`, `DELETE /agents/{id}`, `PATCH /agents/order`. **Conversations:** `POST /conversations`, `GET /conversations`, `GET /conversations/{id}`, `PATCH /conversations/{id}`, `DELETE /conversations/{id}`, `POST /conversations/{id}/share`, `DELETE /conversations/{id}/share/{uid}`. **Messaging:** `POST /conversations/{id}/messages/stream` (SSE). **Attachments:** `POST /attachments/upload`, `GET /attachments/{id}`. **Feedback:** `POST /messages/{id}/feedback`. **Usage:** `GET /usage` |
| `tasks.py` | `/audits/{audit_id}/tasks` | `GET ""` list (filterable by module/priority/status/quick_win), `GET /summary`, `PATCH /{id}`, `PATCH /bulk` |
| `schedules.py` | `/schedules` | `POST ""` create, `GET ""` list, `PATCH /{id}`, `DELETE /{id}` |
| `billing.py` | `/billing` | `POST /create-checkout-session`, `POST /webhook` (Stripe events), `POST /create-portal-session` |
| `public.py` | (no prefix) | `POST /contact`, `POST /newsletter` |
| `admin.py` | `/admin` | `GET /stats`, `GET /users`, `GET /users/{id}`, `PATCH /users/{id}/plan`, `GET /workspaces`, `POST /workspaces/{id}/reset-usage`, `GET /audits`, `GET /audits/{id}`, `POST /impersonation/sessions`, `GET /system` |

---

## Services (`backend/app/services/`)

| Service | Lines | Purpose |
|---------|------:|---------|
| `ai_analysis.py` | 1960 | Claude-powered SEO/content/UX/security analysis; per-area context generators; cross-tool synthesis; quick wins aggregation |
| `ai_client.py` | 393 | Anthropic Claude API wrapper with retry, token counting, prompt templating |
| `ai_execution_plan.py` | 1375 | Task generators per module (SEO, performance, visibility, AI overviews, links, images, schema, content quality, AI readiness, architecture, UX, security) |
| `audit_access.py` | 62 | Unified workspace + project ACL check (`get_audit_with_access`) |
| `chat_service.py` | 1043 | RAG-augmented chat: conversation CRUD, SSE streaming, attachment handling, usage tracking, feedback, sharing |
| `data_exporter.py` | 143 | ZIP export of raw audit JSON data |
| `embedding_client.py` | 220 | Google Gemini embedding API wrapper (text-embedding-004) with key rotation |
| `global_context.py` | 142 | `build_global_snapshot()` -- compact site-wide stats passed to every AI prompt to reduce repetition |
| `health_index.py` | 845 | Composite health indices: technical health, content quality, visibility momentum, traffic estimation |
| `lighthouse.py` | 249 | Docker-based Lighthouse runner (desktop + mobile in parallel) |
| `pdf_generator.py` | 330 | Legacy PDF generator (single-template WeasyPrint) |
| `pdf/` (package) | -- | V2 PDF engine: `generator.py`, `charts.py`, `config.py`, `styles.py`, `utils.py`, `sections/` |
| `qdrant_client.py` | 144 | Qdrant vector DB wrapper (upsert, search, delete by filter) |
| `rag_service.py` | 618 | Audit-to-RAG indexing: chunks audit results into sections, embeds via Gemini, stores in Qdrant |
| `screaming_frog.py` | 572 | Docker-based Screaming Frog CLI runner; per-page transform; crawl-level aggregates |
| `senuto.py` | 447 | Senuto SEO platform integration: visibility, keywords, positions, backlinks, AI Overviews |
| `technical_seo_extras.py` | 1393 | Structured data, robots.txt, sitemap analysis, semantic HTML, render-noJS, soft-404, directives/hreflang, AI readiness |

---

## Worker Pipeline (`backend/worker.py`)

The worker polls for `PENDING` audits every 10s (configurable), processing up to 3 concurrently.

### Orchestration (`process_audit` + `worker_loop`)

```
worker_loop (infinite)
  ├── check_scheduled_audits()          # create audits from AuditSchedule
  ├── poll PENDING audits (up to 3)
  │   └── process_audit(audit_id)
  │       ├── Phase 1: run_technical_analysis()
  │       ├── Phase 2: run_ai_analysis()     # skipped if run_ai_pipeline=false
  │       └── Phase 3: run_execution_plan()  # blocked if Phase 2 != "completed"
  └── timeout check (PROCESSING > 10 min → FAILED)
```

Each phase saves results to DB immediately. If Phase 2 fails, the audit still completes with Phase 1 data. Phase 3 is hard-blocked if Phase 2 did not succeed (`ai_status != "completed"`).

### Phase 1: Technical Analysis (`run_technical_analysis`)

1. **Screaming Frog crawl** -- pages, metadata, on-page SEO signals (max 500 pages)
2. **Lighthouse audit** -- desktop + mobile in parallel
3. **Senuto analysis** -- visibility, keywords, positions, backlinks, AI Overviews (non-fatal)
4. **Competitor analysis** -- parallel crawl of up to 3 competitor URLs
5. **Technical SEO extras** -- structured data, robots.txt, sitemap, semantic HTML, render-noJS, soft-404, directives/hreflang, AI readiness
6. **Score calculation** -- SEO score, performance score, health indices

Results and scores are persisted to DB after this phase. If `run_ai_pipeline` is disabled, the audit completes here.

### Phase 2: AI Analysis (`run_ai_analysis`)

1. **Content analysis** -- AI content quality scoring
2. **Parallel AI batch** -- performance, tech stack detection, UX, local SEO, security, content deep analysis
3. **Strategic analysis** -- competitive analysis, industry benchmarks
4. **Contextual AI analyses** (11 areas in parallel):
   - `seo`, `performance`, `visibility`, `ai_overviews`, `backlinks`, `links`, `images`, `schema`, `content_quality`, `ai_readiness`, `architecture`
   - Plus `security` and `ux` context generators
5. **Cross-module consistency validation**
6. **Strategy generation** -- cross-tool analysis, roadmap, executive summary, unified quick wins
7. **RAG indexing** -- background task (non-blocking) via Qdrant + Gemini embeddings

If AI fails, audit still completes (Phase 1 data is preserved). Crawl-blocked audits skip AI entirely.

### Phase 3: Execution Plan (`run_execution_plan`)

Generates actionable `AuditTask` records from Phase 1+2 results. Runs 12 module generators in parallel:

`seo`, `performance`, `visibility`, `ai_overviews`, `links`, `images`, `schema`, `content_quality`, `ai_readiness`, `architecture`, `ux`, `security`

Each task includes: module, title, description, category, priority, impact, effort, quick_win flag, and AI-generated `fix_data` (current value, suggested value, code snippet).

After generation, `synthesize_execution_plan()` deduplicates tasks, tags quick wins, and sorts by priority. Existing tasks for the audit are deleted before bulk insert. RAG is re-indexed after execution plan completes.

### Scheduled Audits

The worker loop checks `AuditSchedule` records on every tick, creating new `PENDING` audits when `next_run_at` has passed. It also copies competitor URLs from the schedule if `include_competitors=true`.

### Processing Steps (Progress Tracking)

The `processing_step` field on `Audit` tracks granular progress. Frontend polls `GET /audits/{id}/status` to display a progress bar using this mapping:

```
crawl:start(10%) → crawl:done(20%) → lighthouse:start(22%) → lighthouse:done(40%)
→ senuto:start(42%) → senuto:done(48%) → competitors:start(49%) → competitors:done(55%)
→ ai_content:start(57%) → ai_parallel:done(72%) → ai_strategic:done(78%)
→ ai_contexts:done(90%) → ai_strategy:done(97%) → completed(100%)
```

---

## Models (`backend/app/models.py`)

### Enums

| Enum | Values |
|------|--------|
| `SubscriptionTier` | free, pro, enterprise |
| `AuditStatus` | pending, processing, completed, failed |
| `ScheduleFrequency` | daily, weekly, monthly |
| `CompetitorStatus` | pending, completed, failed |
| `TaskStatus` | pending, done |
| `TaskPriority` | critical, high, medium, low |
| `ChatMessageRole` | user, assistant, system |
| `ChatSharePermission` | read, write |

### Tables

| Model | Table | Key Fields |
|-------|-------|------------|
| `User` | `users` | id, email, password_hash, subscription_tier, stripe_customer_id, audits_count |
| `Audit` | `audits` | id, user_id (legacy), workspace_id, project_id, url, status, overall/seo/performance/content_score, results (JSONB), pdf_url, processing_step, processing_logs (JSONB), ai_status, execution_plan_status, run_ai_pipeline, run_execution_plan, crawler_user_agent, crawl_blocked, rag_indexed_at, senuto_country_id, senuto_fetch_mode |
| `Competitor` | `competitors` | id, audit_id (FK), url, status, results (JSONB) |
| `AuditSchedule` | `audit_schedules` | id, user_id (FK), workspace_id, project_id, url, frequency, is_active, competitors_urls (JSONB), last_run_at, next_run_at |
| `ContactSubmission` | `contact_submissions` | id, name, email, subject, message, is_read |
| `NewsletterSubscriber` | `newsletter_subscribers` | id, email, is_active |
| `AuditTask` | `audit_tasks` | id, audit_id (FK), module, title, description, category, priority, impact, effort, is_quick_win, fix_data (JSONB), status, notes, source, sort_order |
| `AgentType` | `agent_types` | id, name, slug, description, icon, sort_order, system_prompt, tools_config (JSONB), is_system, workspace_id, created_by |
| `ChatConversation` | `chat_conversations` | id, workspace_id, audit_id (FK), created_by, agent_type_id (FK), title, is_shared, verbosity, tone |
| `ChatMessage` | `chat_messages` | id, conversation_id (FK), role, content, tokens_used |
| `ChatAttachment` | `chat_attachments` | id, conversation_id (FK), message_id (FK), workspace_id, uploaded_by, filename, mime_type, size_bytes, storage_path |
| `ChatMessageFeedback` | `chat_message_feedback` | id, message_id (FK), user_id, rating (+1/-1). Unique: (message_id, user_id) |
| `ChatShare` | `chat_shares` | id, conversation_id (FK), shared_with_user_id, shared_by_user_id, permission. Unique: (conversation_id, shared_with_user_id) |
| `ChatUsage` | `chat_usage` | id, user_id, month (YYYY-MM), messages_sent. Unique: (user_id, month) |

---

## Configuration (`backend/app/config.py`)

Pydantic `BaseSettings` loaded from `.env`. 155 lines total.

| Category | Key Variables |
|----------|--------------|
| **Database** | `DATABASE_URL` (postgresql+asyncpg) |
| **Auth (Legacy)** | `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRATION_DAYS`, `BCRYPT_COST` |
| **Auth (Supabase)** | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` |
| **AI** | `CLAUDE_API_KEY`, `CLAUDE_MODEL` (claude-sonnet-4-20250514), `CLAUDE_MAX_TOKENS`, `CLAUDE_TEMPERATURE` |
| **Embeddings** | `GEMINI_API_KEY`, `GEMINI_API_KEY_FALLBACK`, `GEMINI_API_KEYS` (comma-separated pool) |
| **RAG** | `QDRANT_HOST`, `QDRANT_PORT`, `QDRANT_URL` |
| **Billing** | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_ENTERPRISE` |
| **External Tools** | `SCREAMING_FROG_CONTAINER`, `SCREAMING_FROG_MAX_PAGES`, `SCREAMING_FROG_USER`, `SCREAMING_FROG_KEY`, `LIGHTHOUSE_CONTAINER`, `LIGHTHOUSE_TIMEOUT` |
| **Senuto** | `SENUTO_EMAIL`, `SENUTO_PASSWORD`, `SENUTO_API_URL`, `SENUTO_DEFAULT_COUNTRY_ID`, `SENUTO_DEFAULT_FETCH_MODE`, `SENUTO_TIMEOUT` |
| **Storage** | `PDF_STORAGE_PATH`, `PDF_CACHE_ENABLED`, `PDF_MAX_SIZE_MB`, `CHAT_ATTACHMENTS_PATH`, `CHAT_ATTACHMENT_MAX_SIZE_MB` |
| **Worker** | `WORKER_POLL_INTERVAL` (10s), `WORKER_MAX_CONCURRENT_AUDITS` (3), `AUDIT_TIMEOUT_MINUTES` (10) |
| **Security** | `ADMIN_API_TOKEN`, `IMPERSONATION_JWT_SECRET`, `IMPERSONATION_TTL_MINUTES` (30) |
| **Application** | `ENVIRONMENT`, `DEBUG`, `API_HOST`, `API_PORT`, `API_WORKERS`, `CORS_ORIGINS`, `FRONTEND_URL` |
| **Rate Limiting** | `RATE_LIMIT_REGISTER`, `RATE_LIMIT_LOGIN`, `RATE_LIMIT_AUDIT_CREATE`, `RATE_LIMIT_GET` |
| **Logging** | `LOG_LEVEL`, `LOG_FORMAT`, `LOG_FILE` |

---

## PDF Reports (`backend/templates/pdf/`)

40 Jinja2 HTML section templates rendered by WeasyPrint. Base layout in `base.html` + `macros.html`.

| Group | Sections |
|-------|----------|
| **Structure** | `cover`, `toc`, `executive_summary` |
| **Technical SEO** | `technical_overview`, `on_page_seo`, `heading_analysis`, `url_structure`, `robots_sitemap`, `directives_hreflang`, `redirect_analysis`, `structured_data`, `semantic_html`, `render_nojs`, `soft404_low_content`, `tech_stack`, `security` |
| **Performance** | `performance`, `lighthouse_detail`, `accessibility` |
| **Content** | `content`, `cannibalization` |
| **Visibility** | `visibility_overview`, `keywords`, `position_changes`, `organic_competitors`, `ai_overviews` |
| **Links** | `internal_links`, `backlinks`, `anchor_text` |
| **UX** | `ux_mobile` |
| **AI Insights** | `ai_insights`, `cross_tool`, `quick_wins`, `benchmark` |
| **Strategy** | `roadmap`, `execution_plan` |
| **Appendices** | `appendix_pages`, `appendix_keywords`, `appendix_images`, `appendix_backlinks` |

Assets directory: `backend/templates/pdf/assets/` (logo SVGs).

---

## Migrations (`backend/alembic/versions/`)

17 migration files (Dec 2025 -- Feb 2026):

| Date | Migration | Change |
|------|-----------|--------|
| 2025-12-05 | `initial_migration` | Users, audits, competitors tables |
| 2026-02-11 | `add_public_tables` | Contact submissions, newsletter subscribers |
| 2026-02-11 | `ai_pipeline_toggle` | `run_ai_pipeline` column on audits |
| 2026-02-11 | `senuto_fields` | Senuto country_id, fetch_mode on audits |
| 2026-02-14 | `add_audit_tasks_table` | AuditTask model for execution plans |
| 2026-02-14 | `fix_competitors_cascade` | ON DELETE CASCADE for competitors |
| 2026-02-14 | `make_audits_user_id_nullable` | Workspace-based audits (user_id optional) |
| 2026-02-14 | `missing_columns_and_schedules` | AuditSchedule, processing_logs, various missing cols |
| 2026-02-15 | `chat_tables` | AgentType, ChatConversation, ChatMessage, ChatShare |
| 2026-02-15 | `update_agent_tools_config` | Agent tools_config JSONB defaults |
| 2026-02-16 | `add_rag_indexed_at` | `rag_indexed_at` timestamp on audits |
| 2026-02-16 | `agent_sort_order` | `sort_order` on agent_types |
| 2026-02-16 | `chat_attachments` | ChatAttachment model |
| 2026-02-16 | `chat_conversation_style` | Verbosity + tone on conversations |
| 2026-02-16 | `chat_feedback` | ChatMessageFeedback + ChatUsage models |
| 2026-02-17 | `add_crawler_ua_and_crawl_blocked` | Custom User-Agent + crawl_blocked flag |
| 2026-02-17 | `add_project_id` | `project_id` on audits and schedules |

---

## Supabase Tables (not in `models.py`)

These tables live in Supabase (managed via Supabase dashboard/migrations, not Alembic). Backend accesses them via the Supabase Python client (`app/lib/supabase.py`):

| Table | Purpose |
|-------|---------|
| `workspaces` | Multi-tenant workspace (id, name, slug, type, owner_id) |
| `workspace_members` | User-workspace membership (user_id, workspace_id, role) |
| `profiles` | User profiles (full_name, avatar_url, is_super_admin) |
| `projects` | Website projects within workspaces (name, url, workspace_id) |
| `project_members` | User-project membership (user_id, project_id, role) |
| `subscriptions` | Workspace subscription (plan, status, audit_limit, audits_used_this_month, stripe_customer_id, stripe_subscription_id) |
| `invoices` | Stripe invoice records (workspace_id, stripe_invoice_id, amount_paid) |

---

## Key Patterns

- **Auth**: All workspace endpoints use Supabase JWT (`verify_workspace_access`, `verify_project_access` in `app/auth_supabase.py`). Legacy JWT auth exists in `auth.py` for the `User` model but is not used for workspace flows.
- **Multi-tenancy**: Audits belong to workspaces (Supabase RLS). Projects and workspace membership live in Supabase; audit/task/chat data lives in VPS PostgreSQL with `workspace_id` columns.
- **Worker polling**: Polls `PENDING` audits every 10s, max 3 concurrent. Uses `asyncio.create_task()` with a processing set for deduplication.
- **AI providers**: Claude (Anthropic) for analysis and generation; Gemini (Google) for text embeddings. Key rotation supported for Gemini via `GEMINI_API_KEYS`.
- **Global context**: `build_global_snapshot()` creates a compact site-wide stats object passed to every AI prompt to reduce redundancy and improve consistency across modules.
- **RAG pipeline**: Non-blocking background task after AI phase and after execution plan. Chunks audit results by section type, embeds with Gemini `text-embedding-004`, stores in Qdrant collection `audit_rag_chunks`. Manual re-indexing available via `POST /audits/{id}/reindex-rag`.
- **Crawl-blocked handling**: If Screaming Frog gets 403/4xx, `crawl_blocked=True` is set. AI analysis and execution plan are skipped with explicit log entries.
- **PDF generation**: V2 engine uses 40 section templates with conditional inclusion based on report type (executive/standard/full). Three report types: executive (summary only), standard (default), full (with appendices).
- **Admin**: Super admin endpoints require `is_super_admin=true` in Supabase profiles table. Includes impersonation sessions (short-lived JWT scoped to a single audit, configurable TTL).
- **Error resilience**: Senuto and technical extras are non-fatal (failures are logged as warnings). AI failures do not block audit completion. Each phase catches exceptions independently.

---

Last updated: 2026-03-17
