# SiteSpector - Worker Process

## Overview

The **Worker** is a background Python process that polls for pending audits and processes them asynchronously.

**Location**: `backend/worker.py`

**Container**: `sitespector-worker` (shares backend codebase)

**Command**: `python worker.py`

---

## Gap Analysis — Faza 2 Data Enrichment (2026-03-08)

### Screaming Frog: transform + eksport tabow

- `backend/app/services/screaming_frog.py`
  - rozszerzono per-page transform o:
    - `crawl_depth`, `text_ratio`, `link_score`,
    - `title_pixel_width`, `meta_desc_pixel_width`,
    - `title_2`, `h1_2`, `meta_desc_2`,
    - `has_multiple_titles`, `has_multiple_h1`, `has_multiple_meta_desc`,
    - `title_occurrences`, `meta_desc_occurrences`, `h1_occurrences`.
  - dodano agregaty crawl-level:
    - `avg_crawl_depth`, `max_crawl_depth`, `pages_deep`,
    - `pages_with_multiple_titles`, `pages_with_multiple_h1`, `pages_with_multiple_meta_desc`,
    - `pages_with_duplicate_titles`, `pages_with_duplicate_meta`, `pages_with_duplicate_h1`.
  - dodano transformacje dla nowych tabow:
    - `external_all` -> `external_links` (`total`, `broken`, `by_domain`),
    - `links_all` -> `link_graph` (internal source->target, anchor, follow, type),
    - rozszerzono `links` o `broken_outbound` i `graph_edges`.
  - dodano normalizacje nazw tabow, aby mapowanie CSV dzialalo stabilnie mimo roznych formatow nazw.

- `docker/screaming-frog/crawl.sh`
  - `--export-tabs` rozszerzone o `External:All` i `Links:All`.

### Lighthouse: named fields do trendow

- `backend/app/services/lighthouse.py`
  - dodano metryki:
    - `interactive`,
    - `total_byte_weight`,
    - `dom_size`,
    - `bootup_time`.
  - rozszerzono `categories_detail.*` o `audit_refs`, co wspiera frontendowe grupowanie audytow per kategoria.

---

## PDF Branding Rollout (SVG) (2026-03-06)

- Unified PDF brand source to a single full logotype asset: `backend/templates/pdf/assets/sitespector_logo_transp.svg`.
- Updated generator defaults:
  - `backend/app/services/pdf/generator.py` now uses `DEFAULT_BRAND_LOGO_SRC = "assets/sitespector_logo_transp.svg"` when `PDF_COVER_LOGO_SRC` is not configured.
  - `brand_logo_src` is passed to `base.html` for running header/footer branding.
- Updated templates:
  - `backend/templates/pdf/base.html` now renders logo image in running header and running footer elements (instead of icon + separate text).
  - `backend/templates/pdf/sections/cover.html` now always renders full logotype and removes legacy icon/text fallback.
- Updated CSS:
  - `backend/app/services/pdf/styles.py` now uses `element(footer-brand)` in `@bottom-left`.
  - Added dedicated classes for running header/footer logo sizing and cover footer logo.
- Python syntax check passed for updated modules (`generator.py`, `styles.py`).

### Footer readability hotfix (2026-03-06)

- Adjusted running footer brand sizing in `backend/app/services/pdf/styles.py`:
  - larger `running-footer-logo-image`,
  - improved spacing in `#running-footer-brand`,
  - `white-space: nowrap` for contact string.
- Result: footer branding is no longer micro-sized and remains legible in generated PDFs.

### Footer left/right layout hotfix (2026-03-06)

- Reworked running footer layout for deterministic alignment:
  - logo rendered via `footer-brand` in `@bottom-left`,
  - contact text rendered via `footer-text` in `@bottom-right`,
  - page numbering moved to `@bottom-center`.
- Files:
  - `backend/templates/pdf/base.html`
  - `backend/app/services/pdf/styles.py`

---

## Audit Access Hardening (Mar 2026)

### Unified ACL helper for audit-scoped endpoints

- New shared helper: `backend/app/services/audit_access.py` -> `get_audit_with_access(...)`
- Used by:
  - `backend/app/routers/audits.py` for `/{audit_id}` endpoints (`get`, `status`, `rag-status`, `raw`, `pdf`, AI triggers, quick wins, etc.)
  - `backend/app/routers/tasks.py` via `_verify_audit_access(...)`
- Access policy enforced consistently:
  - workspace audit -> require `verify_workspace_access(...)`,
  - if `project_id` exists -> also require `verify_project_access(...)`,
  - legacy audit (no workspace) -> owner fallback (`audit.user_id`).

### Admin read-only audit inspector endpoint

- New endpoint: `GET /api/admin/audits/{audit_id}` in `backend/app/routers/admin.py`
- Guard: `verify_super_admin`
- Purpose: return full audit payload for operational diagnostics (read-only), consumed by admin UI `/admin/audits/[auditId]`.

### Admin impersonation session (single-audit scope)

- Token issuing endpoint: `POST /api/admin/impersonation/sessions` in `backend/app/routers/admin.py`.
- Auth policy is enforced centrally in `backend/app/auth_supabase.py`:
  - reads `X-Impersonation-Token`,
  - verifies signature + expiry,
  - enforces deny-by-default allowlist for read/export endpoints only.
- During impersonation, only these audit-scoped GET paths are allowed:
  - `/api/audits/{audit_id}`
  - `/api/audits/{audit_id}/status`
  - `/api/audits/{audit_id}/pdf`
  - `/api/audits/{audit_id}/raw`
- `/api/chat/*` and all mutating methods are blocked (`403`) while impersonation token is active.

---

## Monitoring Auth Hardening (Mar 2026)

### `/api/system/status` dual-auth flow

- Endpoint dependency `verify_admin_or_user` accepts:
  - `X-Admin-Token` (external monitoring),
  - or Supabase Bearer JWT (dashboard/admin UI).
- Bearer verification now delegates directly to canonical `get_current_user(request, credentials, x_impersonation_token)` flow.
- This removed the previous risk of manually invoking auth dependency with mismatched arguments.

### Failure-mode expectations

- Invalid/missing auth now returns `401` (no accidental `500` from auth path).
- Service checks in status endpoint remain per-service (`online|offline|error`) and should degrade gracefully if a single probe fails.

---

## Worker Architecture

### Main Loop

```python
async def worker_loop():
    """Main worker loop that polls for pending audits every 10 seconds."""
    
    processing_audits = set()  # Track currently processing audit IDs
    
    while True:
        # 1. Fetch PENDING audits (max 3)
        pending_audits = await get_pending_audits(limit=3)
        
        # 2. Process each in parallel (asyncio.gather)
        for audit in pending_audits:
            if audit.id not in processing_audits:
                processing_audits.add(audit.id)
                asyncio.create_task(
                    process_audit_with_cleanup(audit.id, processing_audits)
                )
        
        # 3. Check for timeout audits (> 10 minutes processing)
        timeout_audits = await get_timeout_audits()
        for audit in timeout_audits:
            await mark_audit_failed(audit.id, "Audit timed out")
        
        # 4. Sleep before next poll
        await asyncio.sleep(10)  # Poll interval: 10 seconds
```

---

## Audit Processing Flow

### Step-by-Step Process (Three-Phase)

**Function**: `async def process_audit(audit_id: str)`

The worker uses a **three-phase architecture** to provide faster feedback and a concrete implementation plan.

#### Phase 1: Technical Analysis
Runs technical tools and saves results immediately.
1. **Screaming Frog Crawl** (timeout: 300s) - Now exports multiple tabs (Internal, Response Codes, Titles, Meta, H1, H2, Images, Canonicals, Directives, Hreflang). Also performs **Sitemap Detection** via `robots.txt` and common endpoints.
2. **Lighthouse Audits** (Desktop & Mobile, timeout: 90s) - Now saves full raw JSON (excluding screenshots).
3. **Senuto Analysis** (Visibility, Backlinks, AI Overviews) - Fetches comprehensive data from Senuto API (20 endpoints). Normalizes backlink summary counts.
4. **Competitor Analysis** (Parallel Lighthouse)
5. **Technical Scoring** (SEO & Performance)

#### Phase 2: AI Analysis
Enriches technical results with AI insights using Gemini 3.0 Flash.
1. **AI Content Analysis**
2. **AI Performance & Tech Stack**
3. **Strategic AI Analysis** (Security, Local SEO, Competitive)

#### Phase 3: Execution Plan (Tasks)
Generates an actionable implementation plan as structured tasks (`audit_tasks` table).
1. **8 module task generators in parallel** (seo, performance, visibility, ai_overviews, backlinks, links, images, security/ux as applicable)
2. **Synthesis**: deduplication, sorting by priority, quick-win tagging
3. **Persistence**: bulk insert tasks and set `audit.execution_plan_status`

### Progress Tracking & Logs

The worker maintains a granular log of each step in the `processing_logs` (JSONB) column of the `Audit` model.

**Log Entry Format**:
```json
{
  "timestamp": "ISO-8601",
  "step": "step_id",
  "status": "running | success | error",
  "message": "Human readable message",
  "duration_ms": 1234
}
```

**Step IDs**: `crawl`, `lighthouse`, `senuto`, `senuto_extended`, `competitors`, `ai_content`, `ai_parallel`, `ai_contexts`, `ai_strategy`.

---

## Worker Configuration

**Location**: `backend/app/config.py`

```python
# Worker settings
WORKER_POLL_INTERVAL = 10  # seconds
WORKER_MAX_CONCURRENT_AUDITS = 3  # max parallel audits
AUDIT_TIMEOUT_MINUTES = 10  # mark as failed after 10 minutes
```

---

## Concurrency Strategy

### Parallel Processing

**3 audits at once**:
- Worker fetches max 3 PENDING audits
- Each processed in separate asyncio task
- Tasks run concurrently (non-blocking I/O)

**Within each audit**:
- Desktop + Mobile Lighthouse: Parallel
- Competitors: Parallel
- AI calls: Sync calls wrapped in `asyncio.to_thread` with 30s timeout.

**Why 3?** - Balance between throughput and VPS resources (8GB RAM)

---

## Error Handling

### Audit-Level Errors

If any step fails in Phase 1, the audit is marked as FAILED. If Phase 2 (AI) fails, the audit is still marked as COMPLETED but with `ai_status="failed"`.

### AI Pipeline Toggle

The `run_ai_pipeline` flag on audit controls whether AI runs automatically:
- `True` (default): Full pipeline with contextual AI analyses
- `False`: Only technical analysis, audit completes after Phase 1 with `ai_status="skipped"`

The `run_execution_plan` flag controls whether Phase 3 runs automatically:
- `True` (default): Phase 3 generates tasks after Phase 2
- `False`: Phase 3 is skipped unless triggered on-demand (API)

### Phase 2 Extensions (AI Contexts + Strategy)

After existing AI analyses, the worker now runs:
1. **Contextual AI** (`ai_contexts:start/done`): Parallel per-area AI (seo, performance, visibility, ai_overviews, backlinks, links, images)
2. **Strategy** (`ai_strategy:start/done`): Cross-tool analysis, roadmap, executive summary

#### Cross-Module Consistency (Global Snapshot)

To reduce contradictory AI outputs between modules, the worker injects a compact, canonical `GLOBAL_SNAPSHOT`
into AI prompts (Phase 2 + Phase 3). The snapshot includes cross-module facts like:
- `ai_overviews.has_aio` + canonical AIO stats from `results.senuto.visibility.ai_overviews`
- basic lighthouse scores and visibility toplines

If module-local metrics conflict with `GLOBAL_SNAPSHOT`, AI is instructed to treat the snapshot as canonical
and avoid claims like "brak AIO" when AIO data exists.

Results stored in `audit.results`:
- `results.ai_contexts.{area}` - per-area contextual insights
- `results.cross_tool` - cross-tool correlations
- `results.roadmap` - priority roadmap (immediate/short/medium/long term)
- `results.executive_summary` - health score, strengths, critical issues
- `results.quick_wins` - unified prioritized backlog aggregated from all AI contexts + roadmap immediate actions + content ROI actions

### Senuto Expansion (Feb 2026)

Worker now persists full Senuto payload (no low caps) with:
- Visibility positions/wins/losses fetched in full pagination windows (up to high limits)
- New AI Overviews payload: `results.senuto.visibility.ai_overviews.{statistics,keywords,competitors}`
- New sections detail payloads: `results.senuto.visibility.sections_subdomains`, `results.senuto.visibility.sections_urls`
- Extended processing log `senuto_extended` with payload counts for diagnostics

### AI Diagnostics (Feb 2026 update)

Worker now emits additional diagnostics for AI pipeline troubleshooting:
- Start checkpoint: `run_ai_analysis started (audit_id, tech_keys, run_ai_pipeline)`
- Post-context checkpoint: shape summary for `results.ai_contexts` (counts per area)
- Post-strategy checkpoint: presence flags for `cross_tool`, `roadmap`, `executive_summary`

This helps identify cases where:
- AI becomes unavailable (Gemini errors / quota / misconfiguration),
- parsed JSON schema does not match expected keys,
- strategy keys are missing from final persisted `results`.

### Gemini Multi-Key Fallback

AI client supports multiple Gemini keys to reduce outages when a single key is blocked or out of quota:
- `GEMINI_API_KEY` (primary)
- `GEMINI_API_KEY_FALLBACK` (secondary)
- optional `GEMINI_API_KEYS` (comma-separated)

Worker does not need special handling for this; `ai_client` rotates keys per call and logs `key_index` without exposing secrets.

---

## Monitoring

### Check Worker Status

```bash
# Is worker running?
docker ps | grep worker

# View logs
docker logs sitespector-worker --tail 100 -f
```

---

**Last Updated**: 2026-02-11  
**Container**: sitespector-worker  
**Poll interval**: 10 seconds  
**Max concurrent**: 3 audits  
**Timeout**: 10 minutes
# SiteSpector - AI Services

## Overview

SiteSpector uses **Google Gemini API** (gemini-3-flash) for AI-powered content analysis and recommendations.

**Location**: `backend/app/services/ai_analysis.py`

**API**: Google Generative AI (`google-generativeai` Python library)

---

## AI Availability and Fallbacks

SiteSpector prioritizes transparency and continuity:
- Technical phase failures (crawl/performance tools) are treated as critical.
- AI phase failures should be visible and diagnosable; audits may still complete with AI placeholders when the model is unavailable.

The UI explicitly shows when data comes from fallback (and why), instead of silently returning empty insights.

---

## Cross-Module Consistency

Some AI modules run with different subsets of input data (e.g. Visibility vs AI Overviews). To prevent
contradictory conclusions (like "brak AIO" in Visibility while AI Overviews has data), the backend uses:

- **Global snapshot injection**: a compact `GLOBAL_SNAPSHOT` JSON block appended to AI prompts (Phase 2 + Phase 3).
  It contains canonical cross-module facts (AIO presence, topline visibility metrics, lighthouse scores).
- **Canonical AIO source**: AIO metrics are treated as canonical only when read from
  `results.senuto.visibility.ai_overviews` (not from generic visibility statistics).

---

## AI Model Configuration

### Model

**Name**: `gemini-3-flash-preview`

**Why Gemini?**
- Very cheap (~10x cheaper than GPT-4)
- Fast responses (~1-3s per call)
- Good quality for structured analysis
- 1M tokens/minute rate limit (sufficient for MVP)

### API Client

**Location**: `backend/app/services/ai_client.py`

The client supports multiple API keys to improve resilience when:
- primary key is out of quota / billing (429),
- primary key is blocked (403 leaked/permission),
- transient network issues occur.

Environment variables (VPS only, never commit secrets):
- `GEMINI_API_KEY` (primary)
- `GEMINI_API_KEY_FALLBACK` (secondary)
- `GEMINI_API_KEYS` (optional comma-separated extra keys)

Behavior:
- `call_claude()` attempts keys in order and switches automatically on quota/permission errors.
- If all keys fail, the backend marks AI as **unavailable** and returns empty AI insights (no fabricated "mock" quick wins).
- UI should show a clear banner like **"AI jest chwilowo niedostepne"** and keep technical results intact.

---

## Agent Chat + RAG (Feb 2026)

SiteSpector now supports an **audit-scoped agent chat** powered by RAG:
- Each chat conversation is attached to exactly one `audit_id` (no cross-audit leakage).
- Knowledge base is built from that audit's stored results + AI analyses + execution plan tasks.

### Embeddings
- Provider: Google Generative AI (`google-generativeai`)
- Models: `models/gemini-embedding-001` (only)
- Location: `backend/app/services/embedding_client.py`
- Indexing uses `batchEmbedContents` (REST) for chunk batches of **10** texts at a time with **3-second pauses** between batches to stay well under Tier 1 TPM limits (1M tokens/min).
- Embed calls use throttling + exponential backoff on quota errors (429 / ResourceExhausted) and rotate API keys.
- Frontend polls `GET /api/audits/{audit_id}/rag-status` and shows an amber banner when RAG is not yet ready (pending/indexing).

### Vector Store
- Store: Qdrant
- Location: `backend/app/services/qdrant_client.py`
- Collection: `audit_rag_chunks`
- Filter: always by `audit_id` + agent `section_type` allowlist
- `top_k`: 12 (increased from 8 after smart chunking)

### Smart Semantic Chunking (ADR-034)
Instead of storing AI analyses as monolithic JSON blobs, each item is stored as an individual chunk:
- **ai_contexts_{area}**: Each `key_finding`, `recommendation`, `quick_win`, `priority_issue` is a separate point with `[Analiza AI — {area}]` prefix.
- **executive_summary**: Core summary + each strength/critical issue as separate chunks.
- **roadmap**: Each action item per phase (`immediate_actions`, `short_term`, `medium_term`, `long_term`) with `[Roadmapa — {phase}] Punkt #{n}` prefix.
- **cross_tool**: Each correlation, synergy, conflict, recommendation as separate chunks.
- **quick_wins**: Each quick win as its own chunk with title, description, impact, effort.
- **tasks**: Batched from `audit_tasks` table (100 per batch).
- Metadata includes: `area`, `field`, `item_index`, `phase` for precise retrieval.

### Indexing Hook
- Location: `backend/worker.py`
- Trigger 1: best-effort indexing after Phase 4 (AI Analysis) — indexes raw data + AI analyses
- Trigger 2: re-indexing after Phase 5 (Execution Plan) — adds task data
- Failure behavior: indexing failure must never block audit completion
- Idempotent: always deletes existing points for `audit_id` before re-inserting
- Manual recovery: `POST /api/audits/{audit_id}/reindex-rag` (see `backend/API.md`)

### RAG Status / Observability
- `audits.rag_indexed_at` is set on successful indexing (best-effort) to help diagnose "brak danych" cases.

### Chat Attachments + Multimodal (Feb 2026)
- Upload endpoint: `POST /api/chat/attachments/upload` (multipart/form-data)
- Storage: persisted on VPS volume mounted to `settings.CHAT_ATTACHMENTS_PATH`
- Chat message stream body supports `attachment_ids`
- Gemini calls can include:
  - images as `genai.protos.Blob(mime_type, data)`
  - PDFs/CSVs as uploaded files via `genai.upload_file(path, mime_type=...)`

### True Streaming (Feb 2026)
- Backend uses `GenerativeModel.generate_content(..., stream=True)` and forwards deltas via SSE
- Fallback: if streaming fails, backend falls back to non-streaming call and chunks the full text

---

## PDF Generator (v2)

**Location**: `backend/app/services/pdf/` (new package) + `backend/templates/pdf/`

**Legacy**: `backend/app/services/pdf_generator.py` + `backend/templates/report.html` (kept for reference)

**Status**: ✅ **MEGA UPGRADE** (2026-02-28) — 35+ sections, rich data, full professional reports

### Architecture

```
backend/app/services/pdf/
  __init__.py          → exports generate_pdf()
  generator.py         → orchestrator (main entry point)
  config.py            → ReportTypeConfig for executive/standard/full
  charts.py            → matplotlib SVG chart generators
  styles.py            → WeasyPrint CSS (A4, header/footer, info-box)
  utils.py             → helpers (score_color, fmt_ms, cwv_status, etc.)
  sections/            → per-section data extractors (35+ modules)
    executive_summary.py, technical_overview.py, on_page_seo.py,
    internal_links.py, performance.py, lighthouse_detail.py,
    accessibility.py, visibility_overview.py, keywords.py,
    position_changes.py, organic_competitors.py, backlinks.py,
    ai_overviews.py, content.py, ux_mobile.py, security.py,
    tech_stack.py, ai_insights.py, cross_tool.py, quick_wins.py,
    roadmap.py, execution_plan.py, benchmark.py,
    appendix_pages.py, appendix_images.py, appendix_keywords.py, appendix_backlinks.py,
    heading_analysis.py, url_structure.py, redirect_analysis.py,
    cannibalization.py, anchor_text.py,
    structured_data.py, robots_sitemap.py

backend/app/services/
  technical_seo_extras.py  → async HTTP collector for Schema.org, robots.txt,
                              sitemap, domain variants, HTML semantics

backend/templates/pdf/
  base.html            → WeasyPrint base with @page running header/footer
  macros.html          → Jinja2 reusable macros (score cards, badges, alerts, etc.)
  sections/            → 35+ section templates
```

### 3 Report Types

| Type | Pages | Audience | Key additions |
|------|-------|----------|--------------|
| `executive` | 15–25 | C-level, presentations | Scores, TOP metrics, TOP 5 QW + Schema Executive + skrót render/no-JS/soft404 |
| `standard` | 50–90 | Marketing teams | Full SEO, Perf, Senuto TOP 50, AI strategy + Schema Standard + directives/hreflang |
| `full` | 150–250+ | SEO agencies | All raw data, ALL pages, ALL keywords + Schema Full + render/no-JS + semantyka + soft404 |

### Schema-first Full Program (Mar 2026)

- `structured_data` was expanded to `structured_data_v2` with:
  - `@graph` and nested JSON-LD parsing,
  - priority model (`critical/high/medium/low`),
  - required/recommended fields validation,
  - AI/SEO readiness score + missing priority types.
- New crawl-level technical payloads saved in `results.crawl`:
  - `render_nojs` (content availability without JS),
  - `soft_404` (status 200 pages with error-like patterns + low-content summary),
  - `directives_hreflang` (noindex/nofollow/X-Robots/hreflang summary).
- PDF part II (Technical SEO) now starts with Schema and includes dedicated sections:
  - `structured_data`,
  - `render_nojs`,
  - `semantic_html`,
  - `soft404_low_content`,
  - `directives_hreflang`,
  - `robots_sitemap`.
- AI contexts were extended:
  - SEO context now consumes Schema/render/soft404/semantic/directives signals,
  - visibility context now produces non-technical summary, metric legend, and management next steps.

### API Endpoint

```
GET /api/audits/{audit_id}/pdf?report_type=standard
# report_type: executive | standard | full (default: standard)
```

### 35+ PDF Sections (Full report)

**PART I** — Executive Summary
**PART II** — SEO Techniczne
  - Technical Overview (404s, redirects, missing canonicals, HTTPS, crawl depth)
  - Structured Data v2 (Schema.org priorities, completeness, AI/SEO readiness)
  - Render without JavaScript (SSR/no-JS accessibility heuristics)
  - Semantic HTML Structure (header/nav/main/article/etc)
  - Soft 404 + Low Content Detection
  - Directives / Hreflang / Nofollow
  - Robots.txt & Sitemap & Domain Config
  - On-Page SEO (title/description/H1 per-page analysis, thin content, alt text)
  - Heading Hierarchy Analysis (H1/H2 issues, duplicates, H1=Title)
  - URL Structure Analysis (length, non-ASCII, underscores, depth distribution)
  - Redirect Analysis (301/302 breakdown, HTTP downgrades, external redirects)
  - Internal Links (orphan pages, inlinks distribution, redirect chains)

**PART III** — Wydajność (Performance CWV, Lighthouse Detail, Accessibility)
**PART IV** — Widoczność Organiczna (Visibility, Keywords, Changes, Competitors, Backlinks, AIO)
  - Keyword Cannibalization (Senuto data, competing pages, high-volume keywords)
  - Anchor Text Distribution (branded/exact-match/naked/generic breakdown)

**PART V** — Treść & UX (Content readability, UX/Mobile, Security per-header, Tech Stack)
**PART VI** — Strategia AI (AI Insights x9, Cross-Tool, Quick Wins, Roadmap, Execution Plan, Benchmark)
**PART VII** — Załączniki (All Pages, Images, Keywords TOP 200, Backlinks TOP 100)

### New Data Collection (technical_seo_extras.py)

Called during worker audit pipeline (step "4a") after Screaming Frog crawl:
- **Schema.org v2**: Fetches homepage HTML, extracts JSON-LD (`@graph` included), validates required/recommended fields, computes priorities and AI crawler readiness score
- **Robots.txt**: Downloads and parses robots.txt, identifies blocked paths, crawl-delay, sitemap URLs, full-block detection
- **Sitemap**: Downloads and parses sitemap XML/index, checks coverage vs crawled URLs, detects stale entries (>6 months)
- **Domain variants**: Checks www/non-www + http/https redirect behavior, determines preferred canonical URL
- **HTML semantics**: Analyzes homepage for HTML5 semantic elements (header, nav, main, article, footer)
- **Render no-JS**: estimates content accessibility when JavaScript is not executed
- **Soft404/Low-content**: detects likely soft 404 pages (HTTP 200 + error-like patterns) and thin pages
- **Directives/Hreflang**: aggregates noindex/nofollow/X-Robots/hreflang signals from SF tabs and crawl data

### Charts (matplotlib SVG embedded)

- Score gauges (semi-circle per metric)
- CWV comparison Desktop vs Mobile (grouped horizontal bar + color thresholds)
- HTTP status pie chart
- Keyword distribution (stacked bar TOP 3/10/50)
- Intent distribution pie
- Impact/Effort scatter matrix (Quick Wins)
- Roadmap timeline bar
- Execution plan priority bar
- Seasonality line chart
- Competitor comparison bar

### Header/Footer on every page (WeasyPrint @page)

- **Header**: SiteSpector logo (orange magnifier SVG) | URL | Report type
- **Footer left**: "SiteSpector — Profesjonalny Audyt SEO & AI | sitespector.pl | kontakt@sitespector.pl"
- **Footer right**: "Strona X z Y"

### New dependencies

- `matplotlib==3.9.4` — chart SVG generation
- `numpy==1.26.4` — math for gauge + charts

### Data Aggregation

```python
# Aggregate all recommendations
all_recommendations = []
all_recommendations.extend(content_analysis.get("recommendations", []))
all_recommendations.extend(performance_analysis.get("recommendations", []))
all_recommendations.extend(local_seo.get("recommendations", []))
all_recommendations.extend(competitive_analysis.get("recommendations", []))

# Parse by emoji prefix
critical_issues = [r for r in all_recommendations if r.startswith("❌")]
warnings = [r for r in all_recommendations if r.startswith("⚠️")]
successes = [r for r in all_recommendations if r.startswith("✅")]
ai_recommendations = [r for r in all_recommendations if r.startswith("🤖")]
```

---

## AI Analysis Functions

### 1. Content Analysis

**Function**: `async def analyze_content(content_data: Dict) -> Dict`

**Purpose**: Analyze website content quality and provide SEO recommendations

**Input** (from Screaming Frog):
```python
{
  "title": "Meditrue - Medical Center",
  "title_length": 45,
  "meta_description": "Professional medical services...",
  "meta_description_length": 155,
  "h1_tags": ["Meditrue Medical Center"],
  "h1_count": 1,
  "total_images": 12,
  "images_without_alt": 2,
  "word_count": 850
}
```

**Output**:
```python
{
  "quality_score": 85,  # 0-100
  "readability_score": 75,  # 0-100 (mock for now)
  "recommendations": [
    "✅ Title tag ma optymalną długość",
    "✅ Meta description ma optymalną długość",
    "⚠️ 2 z 12 obrazów bez atrybutu ALT",
    "✅ Strona zawiera 850 słów"
  ],
  "word_count": 850,
  "has_title": True,
  "has_meta_description": True,
  "has_h1": True
}
```

**Scoring logic**:
- Title tag: 20 points (optimal 30-60 chars)
- Meta description: 15 points (optimal 120-160 chars)
- H1 tag: 15 points (exactly 1 H1)
- Images with ALT: 10 points (percentage coverage)
- Word count: 10 points (min 300 words)

**AI prompt** (currently commented out, using rule-based):
```python
system_prompt = "Jesteś ekspertem SEO i copywritingu..."

user_message = f"""
Przeanalizuj poniższe dane ze strony:
- Tytuł: {title}
- Meta Opis: {meta_desc}
- Nagłówki H1: {h1_text}
- Liczba słów: {word_count}

Odpowiedź w formacie JSON:
- "summary": Krótkie podsumowanie jakości treści
- "tone_voice": Ocena tonu wypowiedzi
- "ai_recommendations": Lista 2-3 konkretnych sugestii
"""

# ai_response = await call_gemini(system_prompt, user_message)
```

---

### 2. Local SEO Analysis

**Function**: `async def analyze_local_seo(content_data: Dict) -> Dict`

**Purpose**: Detect if website is a local business and provide local SEO recommendations

**Input**: Same as content analysis

**Output**:
```python
{
  "is_local_business": True,
  "has_nap": False,  # Name, Address, Phone detected
  "has_schema_markup": False,  # Schema.org LocalBusiness
  "recommendations": [
    "✅ Wykryto lokalny biznes - rozważ dodanie:",
    "  • Schema.org LocalBusiness markup",
    "  • Profil Google My Business",
    "  • NAP (Name, Address, Phone) w stopce",
    "  • Mapę Google na stronie kontakt"
  ]
}
```

**Detection logic**:
```python
local_keywords = [
    "warszawa", "kraków", "wrocław", "poznań", "gdańsk",
    "polska", "poland", "city", "miasto",
    "adres", "address", "tel", "phone", "kontakt", "contact"
]

all_text = f"{title} {meta_description} {h1_tags}".lower()
is_local = any(keyword in all_text for keyword in local_keywords)
```

**Future improvement**: Parse HTML for NAP (name, address, phone) and schema markup

---

### 3. Performance Analysis

**Function**: `async def analyze_performance(performance_data: Dict) -> Dict`

**Purpose**: Analyze Core Web Vitals and provide optimization recommendations

**Input** (from Lighthouse):
```python
{
  "desktop": {
    "performance_score": 85,
    "ttfb": 450,  # milliseconds
    "fcp": 1200,
    "lcp": 2100,
    "cls": 0.05,
    "total_blocking_time": 150,
    "speed_index": 1800
  },
  "mobile": {
    "performance_score": 78,
    # ... same metrics
  }
}
```

**Output**:
```python
{
  "issues": [],  # List of critical problems
  "recommendations": [
    "✅ TTFB < 600ms - dobry czas odpowiedzi serwera",
    "✅ LCP < 2.5s - dobry czas renderowania",
    "✅ Dobry wynik wydajności"
  ],
  "ttfb_desktop": 450,
  "lcp_desktop": 2100,
  "performance_score": 85,
  "impact": "low"  # 'low', 'medium', 'high'
}
```

**Scoring thresholds**:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| TTFB   | <600ms | 600-800ms | >800ms |
| LCP    | <2.5s | 2.5-4.0s | >4.0s |
| Performance Score | >80 | 50-80 | <50 |

---

### 4. Competitive Analysis

**Function**: `async def analyze_competitive(main_site_data: Dict, competitor_data: List[Dict]) -> Dict`

**Purpose**: Compare website with competitors and provide insights

**Input**:
```python
main_site_data = {
  "crawl": {...},
  "lighthouse": {
    "desktop": {"performance_score": 85}
  }
}

competitor_data = [
  {
    "lighthouse": {"performance_score": 75}
  },
  {
    "lighthouse": {"performance_score": 90}
  }
]
```

**Output**:
```python
{
  "strengths": [
    "✅ Lepsza wydajność niż 1 z 2 konkurentów"
  ],
  "weaknesses": [
    "❌ Gorsza wydajność niż 1 z 2 konkurentów"
  ],
  "opportunities": [
    "Zoptymalizuj wydajność aby dorównać konkurencji",
    "Przeprowadź szczegółową analizę treści konkurencji"
  ],
  "recommendations": [
    "Zoptymalizuj wydajność aby dorównać konkurencji"
  ],
  "competitors_analyzed": 2
}
```

**Comparison logic**:
```python
main_perf = main_site_data['lighthouse']['desktop']['performance_score']

better_count = 0
worse_count = 0

for comp in competitor_data:
    comp_perf = comp['lighthouse']['performance_score']
    
    if main_perf > comp_perf + 10:  # 10-point margin
        better_count += 1
    elif main_perf < comp_perf - 10:
        worse_count += 1
```

---

## AI Call Pattern (Future)

**Current state**: AI prompt prepared but using rule-based logic

**Reason**: Gemini API key validation needed, rule-based works well for MVP

**Future implementation**:

```python
async def call_gemini(system_prompt: str, user_message: str) -> str:
    """Call Gemini API with system + user prompt."""
    
    response = await model.generate_content_async([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ])
    
    return response.text
```

**Parse JSON response**:
```python
def parse_ai_response(response: str) -> Dict:
    """Parse Gemini JSON response."""
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        # Extract JSON from markdown code block
        match = re.search(r'```json\n(.*?)\n```', response, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise ValueError("Invalid JSON response from AI")
```

---

## Rate Limiting

**Gemini API limits**:
- Free tier: 60 requests/minute
- Paid tier: 1M requests/minute (not needed for MVP)

**Current usage**: 4 calls per audit
- 1 audit/minute = 4 calls/minute (well under limit)
- 3 audits/minute = 12 calls/minute (still under limit)

**No rate limiting implemented** (not needed yet)

---

## Error Handling

```python
try:
    ai_response = await call_gemini(system_prompt, user_message)
    ai_data = parse_ai_response(ai_response)
except Exception as e:
    logger.error(f"AI analysis failed: {e}")
    # Fallback to rule-based recommendations
    ai_data = {
        "summary": "AI analysis unavailable - using rule-based logic",
        "ai_recommendations": []
    }
```

**Result**: Audit continues even if AI fails (graceful degradation)

---

## Cost Estimation

**Gemini 1.5 Flash pricing**:
- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens

**Typical audit**:
- Input tokens: ~500 (content data)
- Output tokens: ~200 (recommendations)
- Cost per audit: ~$0.0001 (0.01 cent)

**1000 audits/month**: ~$0.10 (negligible)

---

## Future Improvements

### 1. Full AI Integration

**Enable Gemini API calls** (currently commented out):
```python
# Uncomment in ai_analysis.py
ai_response = await call_gemini(system_prompt, user_message)
ai_data = parse_ai_response(ai_response)

# Merge AI recommendations with rule-based
recommendations.extend([f"🤖 AI: {rec}" for rec in ai_data["ai_recommendations"]])
```

### 2. Advanced Content Analysis

**Extract full page text** (not just meta):
```python
# Add to Screaming Frog crawl
full_text = extract_visible_text(html)

# Send to Gemini for deeper analysis
ai_response = await call_gemini(
    "Analyze this webpage text for tone, readability, and SEO quality",
    full_text[:10000]  # Limit to 10k chars
)
```

### 3. Readability Scoring

**Use textstat library**:
```python
import textstat

def calculate_readability(text: str) -> Dict:
    return {
        "flesch_score": textstat.flesch_reading_ease(text),
        "fog_index": textstat.gunning_fog(text),
        "interpretation": get_readability_interpretation(score)
    }
```

### 4. Multilingual Support

**Detect language** and provide recommendations in detected language:
```python
from langdetect import detect

language = detect(page_text)

if language == "pl":
    recommendations_in_polish()
elif language == "en":
    recommendations_in_english()
```

---

## Debugging AI Calls

### Test AI Analysis Locally

```python
# In Python shell
import asyncio
from app.services.ai_analysis import analyze_content

crawl_data = {
    "title": "Test Title",
    "title_length": 10,
    "meta_description": "Test description",
    # ...
}

result = asyncio.run(analyze_content(crawl_data))
print(result)
```

### Enable AI Debug Logging

```python
# In ai_analysis.py
logger.setLevel(logging.DEBUG)

logger.debug(f"AI input: {user_message}")
logger.debug(f"AI output: {ai_response}")
```

---

## PDF Data Normalization + Schema Playbooks (2026-03-06)

### Scope delivered

- Unified Senuto metric extraction in PDF backend for nested payloads:
  - supports `current` and `recent_value` consistently,
  - handles domain-keyed backlink attributes.
- Fixed PDF extractor mapping in critical sections:
  - `visibility_overview.py`
  - `executive_summary.py`
  - `keywords.py`
  - `position_changes.py`
  - `organic_competitors.py`
  - `ai_overviews.py`
  - `backlinks.py`
  - `appendix_keywords.py`
  - `security.py`
- Added shared helpers in `backend/app/services/pdf/utils.py`:
  - `pick_first()`
  - `senuto_metric_value()`
- Extended Schema PDF section with practical JSON-LD snippets and deployment checklist:
  - `Organization / LocalBusiness`
  - `WebSite + SearchAction`
  - `BreadcrumbList`
  - `Product`
  - `FAQPage`
- Added security interpretation note when global score diverges from header-based score.

### Validation (audit: `de83bfe4-7d32-4349-818c-51866c098225`)

- Regenerated full PDF with new backend logic.
- Confirmed corrected values:
  - TOP3 `2569`
  - TOP10 `5176`
  - TOP50 `15119`
  - Visibility `291925.0`
  - AIO citations `865`
  - Follow/Nofollow `94% / 6%`

**Last Updated**: 2026-03-06  
**AI Provider**: Google Gemini  
**Model**: gemini-3-flash  
**Status**: Rule-based (AI integration ready but disabled)
