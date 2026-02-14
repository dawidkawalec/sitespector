# SiteSpector - Worker Process

## Overview

The **Worker** is a background Python process that polls for pending audits and processes them asynchronously.

**Location**: `backend/worker.py`

**Container**: `sitespector-worker` (shares backend codebase)

**Command**: `python worker.py`

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
