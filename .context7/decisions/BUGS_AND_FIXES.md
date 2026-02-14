# SiteSpector - Bugs & Fixes Log

## Overview

This document tracks bugs found, their fixes, and known issues in SiteSpector.

---

## Resolved Bugs

### BUG-006: Alembic migration failed due to duplicate ENUM type

**Reported**: 2026-02-14

**Status**: ✅ FIXED (2026-02-14)

**Severity**: HIGH

**Description**:
- `alembic upgrade head` failed on production with:
  - `asyncpg.exceptions.DuplicateObjectError: type "taskpriority" already exists`
- Migration `20260214_add_audit_tasks_table.py` introduced Postgres enums `taskpriority` / `taskstatus` and `audit_tasks` table.

**Root cause**:
- Migration created enum types manually via `CREATE TYPE ...`.
- During `op.create_table()`, SQLAlchemy attempted to create the same enum type again for the enum columns, causing a duplicate type error.

**Fix**:
- Update migration to:
  - create enums idempotently with `checkfirst=True`
  - set `create_type=False` to prevent SQLAlchemy auto-creating enum types on table create

**Verification**:
- Re-run `docker exec sitespector-backend alembic upgrade head` successfully on VPS.

**Related**: `backend/alembic/versions/20260214_add_audit_tasks_table.py`

---

### BUG-007: 502 Bad Gateway after backend recreate (nginx upstream stale)

**Reported**: 2026-02-14

**Status**: ✅ FIXED (2026-02-14)

**Severity**: MEDIUM

**Description**:
- After deploying and recreating `backend`, `/health` and `/api/*` intermittently returned `502 Bad Gateway`.
- Nginx error log showed `connect() failed (111: Connection refused) while connecting to upstream`.

**Root cause**:
- Nginx resolved the `backend` upstream to an old Docker IP (container got recreated with a new IP).
- Nginx kept the stale resolved address until restart/reload.

**Fix**:
```bash
cd /opt/sitespector
docker compose -f docker-compose.prod.yml restart nginx
```

**Related**: `.context7/project/OPERATIONS.md` (Troubleshooting section)

---

### BUG-008: Execution plan tasks failed to persist (ENUM value mismatch)

**Reported**: 2026-02-14

**Status**: ✅ FIXED (2026-02-14)

**Severity**: CRITICAL

**Description**:
- Phase 3 (execution plan) started, but tasks were not saved; UI "Plan" stayed empty/blocked.
- Worker logs showed DB error:
  - `invalid input value for enum taskpriority: "CRITICAL"`

**Root cause**:
- Postgres ENUM types `taskpriority` / `taskstatus` were created with lowercase values:
  - `critical|high|medium|low` and `pending|done`
- SQLAlchemy `Enum(TaskPriority)` / `Enum(TaskStatus)` persisted enum *names* (`CRITICAL`, `PENDING`) instead of enum *values*.

**Fix**:
- Update `AuditTask.priority` and `AuditTask.status` columns to persist `.value`:
  - `values_callable=[e.value for e in enum]` and `name='taskpriority'/'taskstatus'`
- Add normalization + `rollback()` in `run_execution_plan()` error handling.

**Verification**:
- Re-run Phase 3: `execution_plan_status=completed` and tasks inserted into `audit_tasks`.

**Related**: `backend/app/models.py`, `backend/worker.py`

---

### BUG-001: Frontend Rendering Functions Missing

**Reported**: 2025-01-15

**Status**: ✅ FIXED (2025-02-03)

**Severity**: CRITICAL

**Description**:
- Three rendering functions called but not implemented in `frontend/app/audits/[id]/page.tsx`
- Users could not see detailed audit data despite it being in database
- Only 4 scores displayed (overall, SEO, performance, content)

**Functions missing**:
1. `renderSeoResults(results)`
2. `renderPerformanceResults(results)`
3. `renderContentResults(results)`

**Root cause**:
- Documentation outdated (claimed functions missing)
- Functions were actually implemented (lines 166-304)

**Fix**:
- Verified functions exist and work correctly
- Updated documentation to reflect current state

**Impact**: HIGH - Users now see all audit details

**Related**: OVERVIEW.md, MISSING_FEATURES.md

---

### BUG-002: UUID Type Error in Frontend

**Reported**: 2024-12-18

**Status**: ✅ FIXED (2024-12-18)

**Severity**: HIGH

**Description**:
- TypeScript error: `UUID` type from `crypto` module incompatible with API response
- Backend returns UUID as string (JSON serialization)
- Frontend tried to use UUID type from Node.js

**Error message**:
```
Type 'string' is not assignable to type 'UUID'
```

**Root cause**:
- Backend SQLAlchemy UUID type serializes to string via JSON
- Frontend incorrectly assumed UUID would be UUID object

**Fix**:
```typescript
// ❌ WRONG
interface Audit {
  id: UUID  // Node.js UUID type
}

// ✅ CORRECT
interface Audit {
  id: string  // UUID comes as string from API
}
```

**Prevention**: Document in API.md and global rules

**Related**: frontend/lib/api.ts

---

### BUG-003: Worker Timeout Not Enforced

**Reported**: 2024-12-22

**Status**: ✅ FIXED (2024-12-23)

**Severity**: MEDIUM

**Description**:
- Worker marked audits as PROCESSING but never marked as FAILED if timeout
- Audits stuck in PROCESSING state forever
- Database filled with "zombie" processing audits

**Root cause**:
- Timeout check logic existed but had bug in datetime comparison
- Used `datetime.now()` instead of `datetime.utcnow()`

**Fix**:
```python
# ❌ WRONG
timeout_threshold = datetime.now() - timedelta(minutes=10)

# ✅ CORRECT
timeout_threshold = datetime.utcnow() - timedelta(minutes=10)
```

**Verification**: Manual test with slow audit (forced timeout)

**Related**: backend/worker.py

---

### BUG-004: CORS Error on PDF Download

**Reported**: 2024-12-28

**Status**: ✅ FIXED (2024-12-29)

**Severity**: MEDIUM

**Description**:
- Browser blocked PDF download with CORS error
- Backend returned PDF but didn't include CORS headers for FileResponse

**Error message**:
```
Access to fetch at '...' from origin 'https://<OLD_VPS_IP>' has been blocked by CORS policy
```

**Root cause**:
- FastAPI CORS middleware applies to JSON responses only
- FileResponse needs manual CORS headers

**Fix**:
```python
# In backend/app/routers/audits.py
response = FileResponse(
    path=pdf_path,
    filename=f"audit_{audit_id}.pdf",
    media_type="application/pdf"
)

# Add CORS headers manually
response.headers["Access-Control-Allow-Origin"] = "*"
response.headers["Access-Control-Allow-Credentials"] = "true"

return response
```

**Related**: backend/app/routers/audits.py, same fix for raw data endpoint

---

### BUG-005: Screaming Frog License Error

**Reported**: 2024-12-30

**Status**: ✅ FIXED (2024-12-30)

**Severity**: HIGH

**Description**:
- Screaming Frog returned license error despite valid credentials
- All crawls failed with "License required" message

**Error message**:
```
ScreamingFrogSEOSpider requires a licence to run in CLI mode
```

**Root cause**:
- License command not executed before crawl
- Worker called crawl.sh directly without activating license

**Fix**:
```python
# In backend/app/services/screaming_frog.py
# Run license command first
license_cmd = [
    "docker", "exec", "sitespector-screaming-frog",
    "ScreamingFrogSEOSpider",
    "--license",
    settings.SCREAMING_FROG_USER,
    settings.SCREAMING_FROG_KEY
]

proc_lic = await asyncio.create_subprocess_exec(*license_cmd, ...)
await proc_lic.communicate()

# Then run crawl
crawl_cmd = [...]
```

**Fallback**: If license fails, use HTTP crawler

**Related**: backend/app/services/screaming_frog.py

---

### BUG-006: Frontend Polling Not Stopping

**Reported**: 2025-01-08

**Status**: ✅ FIXED (2025-01-08)

**Severity**: LOW

**Description**:
- React Query continued polling even after audit completed
- Unnecessary API calls (every 5 seconds forever)

**Root cause**:
- `refetchInterval` condition didn't check for `completed` status properly

**Fix**:
```typescript
// ❌ WRONG
refetchInterval: audit?.status === 'processing' ? 5000 : false

// ✅ CORRECT
refetchInterval: (query) => {
  const data = query?.state?.data as Audit | undefined
  if (data?.status === 'processing' || data?.status === 'pending') {
    return 5000
  }
  return false  // Stop polling
}
```

**Related**: frontend/app/audits/[id]/page.tsx

---

### BUG-007: Audit Pipeline Hangs

**Reported**: 2026-02-08

**Status**: ✅ FIXED (2026-02-08)

**Severity**: CRITICAL

**Description**:
- Audits would hang indefinitely in PROCESSING state.
- No timeouts on Docker exec calls (Screaming Frog/Lighthouse).
- Synchronous Gemini API calls blocked the worker event loop.
- Invalid model name caused excessive retries.

**Fix**:
- Added `asyncio.wait_for()` timeouts to all subprocess calls.
- Implemented **Two-Phase Audit** (Technical + AI) for faster feedback.
- Used `asyncio.to_thread()` for Gemini API calls.
- Added granular `processing_logs` and progress tracking.
- Fixed Gemini model name to `gemini-flash-3-preview`.

**Impact**: CRITICAL - Audits are now reliable, have timeouts, and provide real-time progress feedback.

---

### BUG-008: Frontend Reference Errors & 404s after Deployment

**Reported**: 2026-02-11

**Status**: ✅ FIXED (2026-02-11)

**Severity**: HIGH

**Description**:
- `ReferenceError: senutoCountry is not defined` in NewAuditDialog.
- `ReferenceError: Globe is not defined` (inconsistent icon imports).
- `404 Not Found` for API calls due to double `/api/api` prefix.
- System Status services showing "offline" due to missing Docker socket in backend.

**Fix**:
- Added missing `useState` and `useRouter` hooks in `NewAuditDialog.tsx`.
- Standardized icon imports to `Globe2` across all pages.
- Fixed `API_URL` logic in `lib/api.ts` to strip trailing slashes/prefixes.
- Mounted `/var/run/docker.sock` to backend container and added Senuto status check.

**Impact**: HIGH - Frontend is stable, API calls are correct, and system status reflects reality.

---

### BUG-009: Audyty FAIL na kroku crawl:start (missing merge_csvs.py)

**Reported**: 2026-02-11

**Status**: ✅ FIXED (2026-02-11)

**Severity**: CRITICAL

**Description**:
- Nowe audyty zatrzymywały się na `crawl:start` ze statusem `FAILED`.
- Błąd z `error_message` w tabeli `audits`:
  - `python3: can't open file '/usr/local/bin/merge_csvs.py': [Errno 2] No such file or directory`
- Dotknięty przypadek: `https://meditrue.pl/`.

**Root cause**:
- Skrypt `crawl.sh` wywołuje `python3 /usr/local/bin/merge_csvs.py`.
- Plik `merge_csvs.py` istniał w repo (`docker/screaming-frog/merge_csvs.py`), ale nie był kopiowany do obrazu w `docker/screaming-frog/Dockerfile`.
- Po czystszych rebuildach kontenerów problem zaczął występować deterministycznie.

**Fix**:
- Dodano kopiowanie pliku do obrazu:
  - `COPY merge_csvs.py /usr/local/bin/merge_csvs.py`
- Dodano jawnie `python3` do listy pakietów instalowanych w kontenerze Screaming Frog.
- Wykonano rebuild i recreate kontenerów na VPS z wymuszeniem odświeżenia:
  - `docker compose build --no-cache screaming-frog frontend`
  - `docker compose up -d --force-recreate screaming-frog frontend worker`

**Impact**: CRITICAL - Audyty ponownie przechodzą etap crawl i nie kończą się natychmiastowym `FAILED` przez brak skryptu merge.

**Related**: `docker/screaming-frog/Dockerfile`, `docker/screaming-frog/crawl.sh`, `docker/screaming-frog/merge_csvs.py`

---

### BUG-010: AI insights puste mimo `ai_status=completed`

**Reported**: 2026-02-11

**Status**: ✅ FIXED (2026-02-11)

**Severity**: HIGH

**Description**:
- Audyty kończyły się z `ai_status=completed`, ale `results.ai_contexts.*` zawierały puste listy.
- W `results` brakowało `executive_summary`, `roadmap` i `cross_tool` dla części audytów.
- UI pokazywał głównie `quick_wins`, co wyglądało jak brak działania AI.

**Root cause**:
- Fallback z `ai_client` zwracał payload o strukturze niezgodnej z kontraktem funkcji `analyze_*_context` i `ai_strategy`.
- W efekcie parser zwracał dane bez oczekiwanych kluczy (`key_findings`, `recommendations`, ...), a warstwa mapująca zwracała puste kolekcje.
- Brak czytelnego stanu "AI w toku" w UI utrudniał rozróżnienie między "brak danych" a "analiza trwa".

**Fix**:
- Ujednolicono fallback payload w `backend/app/services/ai_client.py` do wspólnego kontraktu (obszary + strategia).
- Skorygowano nazwę modelu Gemini na `gemini-3-flash-preview`.
- Dodano diagnostyczne logi i checkpointy:
  - `backend/app/services/ai_client.py`
  - `backend/app/services/ai_analysis.py`
  - `backend/worker.py`
- Dodano stany "AI analysis in progress" + polling po `ai_status=processing`:
  - `frontend/app/(app)/audits/[id]/ai-strategy/page.tsx`
  - `frontend/components/AiInsightsPanel.tsx`
  - strony obszarowe z `AuditPageLayout`
  - `frontend/app/(app)/audits/[id]/page.tsx` (polling także dla manualnego run-ai)
- Naprawiono zapisywanie kluczy strategii AI w `audits.results`:
  - `backend/worker.py` wykonuje `audit.results = dict(results)` + `flag_modified(audit, "results")`
  - bez tego SQLAlchemy mogło nie zapisać mutacji JSONB po `ai_contexts` (brak `cross_tool/roadmap/executive_summary` mimo sukcesu kroku).

**Impact**: HIGH - AI insights nie pozostają "cicho puste"; UI jasno komunikuje przetwarzanie i automatycznie odświeża dane.

**Related**: `backend/app/services/ai_client.py`, `backend/app/services/ai_analysis.py`, `backend/worker.py`, `frontend/app/(app)/audits/[id]/ai-strategy/page.tsx`, `frontend/components/AiInsightsPanel.tsx`

---

### BUG-011: Senuto paginated POST payload encoded as form-data

**Reported**: 2026-02-12

**Status**: ✅ FIXED (2026-02-12)

**Severity**: HIGH

**Description**:
- Some Senuto paginated endpoints returned incomplete/empty payloads.
- Root cause was inconsistent request encoding for POST pagination requests.

**Root cause**:
- Pagination helper used `data_body` for POST by default.
- Senuto visibility/backlinks paginated endpoints require JSON payload.

**Fix**:
- Added raw request helper + explicit JSON pagination path in `senuto.py`.
- Unified paginated POST calls to send `json_body`.
- Added extended metadata counters to validate payload completeness.

**Impact**:
- Full payloads are now fetched for positions, wins/losses, backlinks, AIO keywords, and sections detail.

**Related**: `backend/app/services/senuto.py`, `backend/worker.py`

---

### BUG-012: React #310 on Visibility page (hook order mismatch)

**Reported**: 2026-02-12

**Status**: ✅ FIXED (2026-02-12)

**Severity**: HIGH

**Description**:
- Production visibility route crashed with minified React error `#310`.
- Error appeared after token/session refresh and rerender path changes.

**Root cause**:
- `useMemo` hooks in `visibility/page.tsx` were declared below conditional early returns.
- Initial render path could return before those hooks, later render executed them, causing hook-order mismatch.

**Fix**:
- Moved all derived-state hooks above conditional returns.
- Kept loading/no-data branches after hook declarations.
- Cleaned unused imports introduced in the same module.

**Impact**:
- Visibility page no longer throws React invariant 310 during runtime rerenders.

**Related**: `frontend/app/(app)/audits/[id]/visibility/page.tsx`

---

### BUG-013: React #310 on AI Overviews page + missing favicon.ico

**Reported**: 2026-02-12

**Status**: ✅ FIXED (2026-02-12)

**Severity**: HIGH

**Description**:
- `AI Overviews` route crashed in production with React invariant `#310`.
- Browser also reported `GET /favicon.ico 404`.

**Root cause**:
- Same hook-order mismatch pattern as visibility page (conditional return before all memo hooks).
- No static `favicon.ico` file served at root path.

**Fix**:
- Moved loading branch in `ai-overviews/page.tsx` below hook declarations to keep stable hook order.
- Added generated brand-signet style icon file: `frontend/public/favicon.ico`.

**Impact**:
- `AI Overviews` no longer crashes on rerender.
- Browser no longer logs `favicon.ico` 404.

**Related**: `frontend/app/(app)/audits/[id]/ai-overviews/page.tsx`, `frontend/public/favicon.ico`

---

### BUG-014: Quick Wins mismatch vs AI Strategy + inconsistent line chart styling

**Reported**: 2026-02-12

**Status**: ✅ FIXED (2026-02-12)

**Severity**: MEDIUM

**Description**:
- Global `Quick Wins` sometimes showed only ~3 generic items, while `AI Strategy` contained many actionable quick wins split by modules.
- Line-chart visuals were inconsistent between dashboard and audit modules.

**Root cause**:
- `results.quick_wins` could remain legacy/fallback and not reflect richer `results.ai_contexts.*.quick_wins`.
- No shared chart preset for line-like charts across modules.

**Fix**:
- Added quick wins aggregator in `ai_analysis` and used it in:
  - worker strategy finalization,
  - `GET /audits/{id}/quick-wins`,
  - `POST /audits/{id}/run-ai-context` full regeneration path.
- Extended AI context prompts (visibility + ai_overviews + cross_tool + roadmap) to include new Senuto fields (AIO, difficulty, CPC, intent, snippets, sections detail).
- Replaced module line charts with dashboard-like gradient style (`AreaChart` + unified tooltip).

**Impact**:
- Quick Wins and AI Strategy now use one canonical, richer backlog.
- New Senuto data is explicitly consumed by AI suggestions.
- Visual analytics are consistent across dashboard and audit modules.

**Related**: `backend/app/services/ai_analysis.py`, `backend/worker.py`, `backend/app/routers/audits.py`, `frontend/components/AuditCharts.tsx`, `frontend/app/(app)/audits/[id]/comparison/page.tsx`

---

## Known Issues

### ISSUE-001: PDF Template Incomplete

**Reported**: 2025-01-20

**Status**: 🔴 KNOWN ISSUE (not fixed yet)

**Severity**: MEDIUM

**Description**:
- PDF generator works but sections 4-9 are empty
- Only cover page and summary render
- Users download PDF with blank pages

**Missing sections**:
- Section 4: SEO Technical Analysis
- Section 5: Performance Analysis
- Section 6: Content Analysis
- Section 7: Local SEO (conditional)
- Section 8: Competitive Analysis (conditional)
- Section 9: Action Plan

**Root cause**:
- Template has placeholders but no data rendering logic
- Worker saves PDF but template incomplete

**Workaround**: Users can download raw data (ZIP)

**Priority**: HIGH - Next after frontend rendering

**Related**: backend/templates/report.html

---

### ISSUE-002: Self-signed SSL Certificate Warning

**Reported**: 2024-12-15

**Status**: ✅ RESOLVED (2026-02-08)

**Severity**: LOW

**Description**:
- Browser showed "Your connection is not private" when using IP.

**Solution**: Domain sitespector.app configured with Let's Encrypt. Production uses valid HTTPS at https://sitespector.app. Direct IP access is considered deprecated (IPs change during rebuilds).

**Related**: ADR-006, DECISIONS_LOG (domain migration)

---

### ISSUE-003: No Rate Limiting

**Reported**: 2025-01-25

**Status**: 🟡 KNOWN LIMITATION

**Severity**: LOW (MVP)

**Description**:
- No rate limiting on API endpoints
- Users can spam audit creation
- No protection against abuse

**Root cause**:
- Not implemented (MVP phase)
- Focus on core functionality first

**Solution**: Add rate limiting middleware (future)

**Impact**: Low (solo user testing)

**Related**: backend/app/main.py

---

### ISSUE-004: No Automated Backups

**Reported**: 2025-02-01

**Status**: 🟡 KNOWN LIMITATION

**Severity**: MEDIUM

**Description**:
- No automated database backups
- Data loss risk if VPS fails

**Root cause**:
- Not implemented (MVP phase)
- Manual backups possible via pg_dump

**Solution**: Add cron job for daily backups

**Impact**: Medium (data loss risk)

**Related**: infrastructure/DATABASE.md

---

### BUG-015: VPS Compromise Caused Outbound Abuse Traffic

**Reported**: 2026-02-13

**Status**: ✅ FIXED (mitigated via rebuild)

**Severity**: CRITICAL

**Description**:
- Hetzner abuse report flagged outbound UDP traffic from the production IP.
- VPS became unreachable (ports blocked) during incident response.
- Investigation found a suspicious binary (`/x86_64.kok`) consuming CPU, consistent with a compromised host.

**Root cause**:
- Host-level compromise risk (SSH/password exposure and/or weak baseline hardening).
- Once compromised, attacker-controlled process generated unexpected outbound traffic.

**Fix**:
- Rebuilt infrastructure on a new VPS + new IP (clean host).
- Enforced SSH key authentication and disabled root SSH login.
- Enabled UFW + fail2ban immediately on bootstrap.
- Added an explicit outbound block for UDP/9021 (defense-in-depth).

**Verification**:
- `fail2ban-client status sshd` active, UFW enabled, only 22/80/443 inbound allowed.
- App health responds on the new host (`/health`) and containers are healthy.

**Related**: `project/DEPLOYMENT.md`, `project/OPERATIONS.md`, `infrastructure/NGINX.md`

---

### BUG-016: New Audit 500 (audits.user_id NOT NULL)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- Creating a new workspace-based audit returned `500 Internal Server Error`.
- Backend stacktrace showed `NOT NULL` violation: `audits.user_id` was `NULL`.

**Root cause**:
- Workspace-based audits intentionally set `user_id=None`, but the database schema still enforced `audits.user_id NOT NULL`.

**Fix**:
- Make `audits.user_id` nullable.
- Add Alembic migration: `20260214_make_audits_user_id_nullable.py`.

**Verification**:
- Audit creation no longer fails on insert due to `user_id` constraint.

**Related**: `backend/app/routers/audits.py`, `backend/app/models.py`, `backend/alembic/versions/20260214_make_audits_user_id_nullable.py`

---

### BUG-017: Audit Progress Window Stuck at 0% (No Logs)

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- During audit run, the UI progress window showed `0%` and empty logs for minutes.
- Worker was processing normally, but frontend had no progress/log data to render.

**Root cause**:
- Frontend polled `GET /api/audits/{id}` (not `/status`) but the response schema did not include:
  - `progress_percent`
  - `processing_logs`
  - `processing_step`
  - `ai_status`
- Additionally, some UI step IDs did not match worker step names (e.g. `ai_perf_tech` vs `ai_parallel`).

**Fix**:
- Extend `AuditResponse` to include progress + processing metadata and enrich `GET /api/audits/{id}` payload.
- Align frontend step IDs with worker log step names.

**Verification**:
- While an audit is `pending/processing`, UI updates progress percent and shows step logs in near real-time (polling every 3s).

**Related**: `backend/app/routers/audits.py`, `backend/app/schemas.py`, `frontend/app/(app)/audits/[id]/page.tsx`, `.context7/backend/API.md`

---

### BUG-018: Sitemap Always Missing + Senuto Backlinks Show 0

**Reported**: 2026-02-14

**Status**: ✅ FIXED

**Severity**: HIGH

**Description**:
- Audit UI showed "Brak sitemapy" even when sitemap existed (e.g. WP RankMath redirects `/sitemap.xml` -> `/sitemap_index.xml`).
- Audit UI showed Senuto backlink stats (Backlinki / Domeny Ref.) as `0` despite Senuto step succeeding and collecting data.

**Root cause**:
- `backend/app/services/screaming_frog.py` hardcoded `has_sitemap=false` and never detected sitemap endpoints.
- Senuto backlinks payload stores raw API response in `senuto.backlinks.statistics`, but frontend expects summary keys like `backlinks_count` and `domains_count`.

**Fix**:
- Add sitemap detection via `robots.txt` + common endpoints and persist `has_sitemap`, `sitemap_url`, `sitemaps` in crawl results.
- Normalize Senuto backlinks statistics by injecting computed `backlinks_count` and `domains_count` based on collected arrays.

**Verification**:
- For domains with `/sitemap_index.xml`, audits now show sitemap present.
- Senuto cards show non-zero backlink/ref-domain counts when data exists.

**Related**: `backend/app/services/screaming_frog.py`, `backend/app/services/senuto.py`, `frontend/app/(app)/audits/[id]/page.tsx`

---

## Future Bugs to Watch

### WATCH-001: Memory Leak in Worker

**Watch for**: Worker memory usage growing over time

**Potential cause**: Not closing database sessions properly

**Monitoring**: `docker stats sitespector-worker`

**Prevention**: Ensure all async sessions use context managers

---

### WATCH-002: Database Connection Exhaustion

**Watch for**: "Too many connections" error

**Potential cause**: Connection pool too small or not releasing connections

**Monitoring**: 
```sql
SELECT count(*) FROM pg_stat_activity;
```

**Prevention**: Verify pool_size and max_overflow settings

---

## Bug Reporting Template

When adding new bugs to this file, use this format:

```markdown
### BUG-XXX: Short Description

**Reported**: YYYY-MM-DD

**Status**: 🔴 OPEN | 🟡 INVESTIGATING | ✅ FIXED

**Severity**: CRITICAL | HIGH | MEDIUM | LOW

**Description**:
- What happened
- Expected vs actual behavior

**Root cause**:
- Why it happened

**Fix** (if resolved):
- Code changes
- Verification

**Workaround** (if open):
- Temporary solution

**Related**: Files/docs affected
```

---

**Last Updated**: 2026-02-12  
**Resolved Bugs**: 14 (incl. BUG-014 quick wins alignment + chart style consistency)  
**Known Issues**: 3  
**Watching**: 2
