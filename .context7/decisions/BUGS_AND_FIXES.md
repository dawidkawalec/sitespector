# SiteSpector - Bugs & Fixes Log

## Overview

This document tracks bugs found, their fixes, and known issues in SiteSpector.

---

## Resolved Bugs

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
Access to fetch at '...' from origin 'https://77.42.79.46' has been blocked by CORS policy
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

**Impact**: HIGH - AI insights nie pozostają "cicho puste"; UI jasno komunikuje przetwarzanie i automatycznie odświeża dane.

**Related**: `backend/app/services/ai_client.py`, `backend/app/services/ai_analysis.py`, `backend/worker.py`, `frontend/app/(app)/audits/[id]/ai-strategy/page.tsx`, `frontend/components/AiInsightsPanel.tsx`

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

**Solution**: Domain sitespector.app configured with Let's Encrypt. Production uses valid HTTPS at https://sitespector.app. IP (77.42.79.46) may still use self-signed if configured.

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

**Last Updated**: 2026-02-11  
**Resolved Bugs**: 10 (incl. BUG-010 AI empty insights, ISSUE-002 SSL)  
**Known Issues**: 3  
**Watching**: 2
