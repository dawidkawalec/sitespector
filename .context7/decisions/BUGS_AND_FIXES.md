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

**Status**: 🟡 EXPECTED (design decision)

**Severity**: LOW

**Description**:
- Browser shows "Your connection is not private" warning
- Users must manually accept certificate

**Root cause**:
- Self-signed certificate (not trusted by browsers)
- No domain registered yet

**Solution**: Replace with Let's Encrypt certificate when domain ready

**Workaround**: Accept certificate warning (safe for internal use)

**Related**: ADR-006 (Architectural Decisions)

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

**Last Updated**: 2025-02-03  
**Resolved Bugs**: 6  
**Known Issues**: 4  
**Watching**: 2
