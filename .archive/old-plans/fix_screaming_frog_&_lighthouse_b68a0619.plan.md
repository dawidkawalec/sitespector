---
name: Fix Screaming Frog & Lighthouse
overview: Fix critical bugs preventing Screaming Frog and Lighthouse from working. Remove ALL remaining fallbacks. Test end-to-end with https://matkaaptekarka.pl/. Verify PDF generation with complete data.
todos:
  - id: fix-sf-crawl-script
    content: Remove --crawl-depth from crawl.sh - invalid SF option causing FATAL error
    status: completed
  - id: remove-lighthouse-fallback
    content: Delete _failed_audit_result() and make lighthouse.py raise exceptions
    status: completed
  - id: test-sf-manually
    content: Test SF crawl manually for example.com and matkaaptekarka.pl
    status: completed
  - id: test-lighthouse-manually
    content: Test Lighthouse directly for both desktop and mobile
    status: completed
  - id: rebuild-containers
    content: Rebuild screaming-frog container on VPS with fixed script
    status: completed
  - id: run-full-test-audit
    content: Create new audit for https://matkaaptekarka.pl/ and monitor in Dozzle
    status: completed
  - id: validate-pdf-data
    content: Download PDF and verify all 8 sections have complete real data
    status: completed
  - id: verify-system-status
    content: Check dashboard shows all services online + verify logs in Dozzle
    status: completed
isProject: false
---

# Fix Screaming Frog & Lighthouse - Complete System Repair

## Root Causes Identified

### 1. Screaming Frog FATAL Error

- **File**: `[docker/screaming-frog/crawl.sh](docker/screaming-frog/crawl.sh)` line 32
- **Issue**: `--crawl-depth 1` option does NOT exist in SF CLI
- **Result**: SF crashes with "FATAL - Unrecognized option: --crawl-depth"
- **Fix**: Remove `--crawl-depth 1` from command

### 2. Lighthouse Silent Fallback

- **File**: `[backend/app/services/lighthouse.py](backend/app/services/lighthouse.py)` lines 62, 132-148
- **Issue**: `_failed_audit_result()` returns fake data (all scores = 0) instead of raising exception
- **Result**: Worker thinks audit succeeded, saves fake data to database, PDF shows empty results
- **Fix**: Remove `_failed_audit_result()` function, raise Exception on Lighthouse failure

### 3. PDF Data Validation

- **File**: `[backend/templates/report.html](backend/templates/report.html)`
- **Issue**: Previous audits may have fake/empty data from fallbacks
- **Fix**: Already implemented - PDF generator now validates data and fails if missing

---

## Implementation Steps

### Phase 1: Fix Screaming Frog (CRITICAL)

**File**: `[docker/screaming-frog/crawl.sh](docker/screaming-frog/crawl.sh)`

Change line 32 from:

```bash
screamingfrogseospider --crawl "$URL" --headless --crawl-depth 1 --output-folder /tmp/crawls --export-tabs "Internal:All" --export-format "csv" --overwrite > /dev/null
```

To:

```bash
screamingfrogseospider --crawl "$URL" --headless --output-folder /tmp/crawls --export-tabs "Internal:All" --export-format "csv" --overwrite > /dev/null
```

**Change**: Remove `--crawl-depth 1` (invalid option)

**Test command** (verify fix works):

```bash
docker exec sitespector-screaming-frog /usr/local/bin/crawl.sh https://example.com
```

Expected: CSV output with crawl data

---

### Phase 2: Remove Lighthouse Fallback

**File**: `[backend/app/services/lighthouse.py](backend/app/services/lighthouse.py)`

**Change 1**: Line 62 - Raise exception instead of returning fallback

```python
if process.returncode != 0:
    error_msg = stderr.decode()
    logger.error(f"❌ Lighthouse failed with code {process.returncode}: {error_msg}")
    raise Exception(f"Lighthouse audit failed: {error_msg[:500]}")  # NO FALLBACK
```

**Change 2**: Line 112 - Raise exception on error

```python
except Exception as e:
    logger.error(f"❌ Lighthouse error: {e}", exc_info=True)
    raise  # Re-raise, NO FALLBACKS
```

**Change 3**: Delete lines 132-148 - Remove `_failed_audit_result()` function entirely

---

### Phase 3: Test Screaming Frog Manually

Run from VPS to verify SF works:

```bash
# Test 1: Simple crawl
docker exec sitespector-screaming-frog /usr/local/bin/crawl.sh https://example.com

# Test 2: Target website
docker exec sitespector-screaming-frog /usr/local/bin/crawl.sh https://matkaaptekarka.pl/

# Test 3: From worker
docker exec sitespector-worker python3 -c '
import asyncio
from app.services.screaming_frog import crawl_url
result = asyncio.run(crawl_url("https://matkaaptekarka.pl/"))
print("Title:", result.get("title"))
print("Pages:", result.get("pages_crawled"))
'
```

Expected results:

- Title: "Strona Główna - Matka Aptekarka"
- Pages: 20+
- No errors

---

### Phase 4: Test Lighthouse Manually

Run from VPS to verify Lighthouse works:

```bash
# Test 1: Direct lighthouse command
docker exec sitespector-lighthouse lighthouse https://example.com --output=json --output-path=stdout --quiet --chrome-flags="--headless --no-sandbox --disable-gpu" | head -50

# Test 2: From worker
docker exec sitespector-worker python3 -c '
import asyncio
from app.services.lighthouse import audit_url
result = asyncio.run(audit_url("https://matkaaptekarka.pl/", "desktop"))
print("Performance Score:", result.get("performance_score"))
print("LCP:", result.get("lcp"))
'
```

Expected results:

- Performance Score: 40-50
- LCP: 30000-35000ms
- No errors, no fake zeros

---

### Phase 5: Run Full End-to-End Test Audit

**Test URL**: [https://matkaaptekarka.pl/](https://matkaaptekarka.pl/)

**Steps**:

1. Create new audit via API or frontend
2. Monitor worker logs in real-time: `docker logs sitespector-worker -f`
3. Watch for:
  - Screaming Frog crawl (should succeed)
  - Lighthouse desktop (should succeed)
  - Lighthouse mobile (should succeed)
  - AI analysis (should succeed)
  - Score calculation (should succeed)
  - PDF generation (should succeed)
4. Verify audit status changes: PENDING → PROCESSING → COMPLETED
5. Download PDF and verify ALL sections have data

**Expected results**:

- Overall Score: ~65-70
- SEO Score: ~70
- Performance Score: ~40-45
- Content Score: ~75-80
- PDF: ALL sections filled with real data
- NO "N/A", NO zeros, NO fake data

---

### Phase 6: Validate PDF Completeness

Download generated PDF and verify each section:

**Section 2 - Overall Results**:

- Overall Score: 66-70
- SEO Score: 70+
- Performance Score: 40-45
- Content Score: 75-80

**Section 3 - SEO Technical**:

- Pages Crawled: 20
- Internal Links: 3449
- Total Images: 1541
- Images without ALT: 984
- Meta title: "Strona Główna - Matka Aptekarka" (31 chars)
- Meta description: "Obserwuj mnie @matkaaptekarka" (29 chars)
- H1: Present (1 tag)

**Section 4 - Performance**:

- Desktop Core Web Vitals table (7 metrics: Performance Score, FCP, LCP, CLS, TTFB, Speed Index, TBT)
- Mobile Core Web Vitals table (7 metrics)
- All values > 0 and realistic

**Section 5 - Content Analysis**:

- Word Count: 1494
- Quality Score: 77
- Readability Score: 75
- AI recommendations visible

**Section 6 - Local SEO**:

- Shows "No local business detected" (correct for this site)

**Section 7 - Competitive Analysis**:

- Shows "No competitors analyzed" (correct - no competitors added)

**Section 8 - Action Plan**:

- High priority items (based on scores)
- Aggregated recommendations from all sections

**Footer**:

- System Version: 2.0.0
- Last Update: 2025-02-03 16:10 UTC
- Generation timestamp

---

### Phase 7: System Status Verification

**Verify in dashboard** ([https://77.42.79.46/dashboard](https://77.42.79.46/dashboard)):

- Screaming Frog: ONLINE
- Lighthouse: ONLINE
- Worker: ONLINE
- Database: ONLINE

**Verify logs access** ([https://77.42.79.46/logs/](https://77.42.79.46/logs/)):

- All containers visible
- Real-time log streaming works
- Can filter by container

---

## Testing Checklist

### Manual Tests (Run on VPS)

1. **SF Crawl Test**:
  ```bash
   docker exec sitespector-screaming-frog /usr/local/bin/crawl.sh https://matkaaptekarka.pl/ | head -5
  ```
   Expected: CSV header + data rows
2. **Lighthouse Desktop Test**:
  ```bash
   docker exec sitespector-lighthouse lighthouse https://matkaaptekarka.pl/ --output=json --output-path=stdout --quiet --chrome-flags="--headless --no-sandbox --disable-gpu" --emulated-form-factor=desktop | jq '.categories.performance.score'
  ```
   Expected: 0.40-0.45 (40-45%)
3. **Worker SF Integration Test**:
  ```bash
   docker exec sitespector-worker python3 -c 'import asyncio; from app.services.screaming_frog import crawl_url; r=asyncio.run(crawl_url("https://matkaaptekarka.pl/")); print(f"Title: {r[\"title\"]}, Pages: {r[\"pages_crawled\"]}")'
  ```
   Expected: Title and pages > 0
4. **Worker Lighthouse Integration Test**:
  ```bash
   docker exec sitespector-worker python3 -c 'import asyncio; from app.services.lighthouse import audit_url; r=asyncio.run(audit_url("https://matkaaptekarka.pl/", "desktop")); print(f"Perf: {r[\"performance_score\"]}, LCP: {r[\"lcp\"]}")'
  ```
   Expected: Performance score > 0, LCP > 0
5. **Full Audit Test** (via API):
  ```bash
   # Get auth token
   TOKEN=$(curl -k -s -X POST https://77.42.79.46/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"info@craftweb.pl","password":"Dawid132?"}' | jq -r '.access_token')

   # Create audit
   AUDIT_ID=$(curl -k -s -X POST https://77.42.79.46/api/audits \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"url":"https://matkaaptekarka.pl/","is_local_business":false}' | jq -r '.id')

   echo "Created audit: $AUDIT_ID"
   echo "Monitor: docker logs sitespector-worker -f"
   echo "View: https://77.42.79.46/audits/$AUDIT_ID"
  ```
6. **PDF Validation**:
  - Wait for audit to complete (2-3 minutes)
  - Download PDF from frontend
  - Verify all sections 2-8 have real data
  - Check footer has system version and update timestamp

### Automated Verification Script

After all fixes deployed, run this comprehensive test:

```bash
#!/bin/bash
echo "=== SiteSpector System Test ==="
echo ""

# 1. Container Status
echo "1. Container Status:"
docker ps --filter name=sitespector --format "table {{.Names}}\t{{.Status}}"
echo ""

# 2. Service Health
echo "2. Service Health:"
curl -s -k https://127.0.0.1/api/system/status | jq '.services | to_entries[] | "\(.key): \(.value.status)"'
echo ""

# 3. SF Test
echo "3. Screaming Frog Test:"
timeout 30 docker exec sitespector-screaming-frog /usr/local/bin/crawl.sh https://example.com 2>&1 | head -2
echo ""

# 4. Lighthouse Test
echo "4. Lighthouse Test:"
timeout 30 docker exec sitespector-lighthouse lighthouse https://example.com --output=json --output-path=stdout --quiet --chrome-flags="--headless --no-sandbox --disable-gpu" | jq '.categories.performance.score'
echo ""

# 5. Database Check
echo "5. Recent Audits:"
docker exec sitespector-postgres psql -U sitespector_user -d sitespector_db -c "SELECT id, url, status, overall_score FROM audits ORDER BY created_at DESC LIMIT 3;"
echo ""

echo "✅ System Test Complete"
```

---

## Files to Modify

1. `[docker/screaming-frog/crawl.sh](docker/screaming-frog/crawl.sh)` - Remove invalid option
2. `[backend/app/services/lighthouse.py](backend/app/services/lighthouse.py)` - Remove fallback, raise exceptions
3. `[docker-compose.prod.yml](docker-compose.prod.yml)` - Already correct
4. `[backend/app/services/screaming_frog.py](backend/app/services/screaming_frog.py)` - Already correct (no fallbacks)

---

## Deployment Steps

1. Commit all fixes locally
2. Push to `release` branch
3. SSH to VPS: `ssh root@77.42.79.46`
4. Pull latest code: `cd /opt/sitespector && git pull origin release`
5. Rebuild SF container: `docker compose -f docker-compose.prod.yml build --no-cache screaming-frog`
6. Restart backend + worker: `docker compose -f docker-compose.prod.yml restart backend worker`
7. Run manual tests (SF, Lighthouse)
8. Create test audit for [https://matkaaptekarka.pl/](https://matkaaptekarka.pl/)
9. Monitor in Dozzle: [https://77.42.79.46/logs/](https://77.42.79.46/logs/)
10. Validate PDF completeness

---

## Success Criteria

- Screaming Frog crawl completes without errors
- Lighthouse desktop + mobile audits complete without errors  
- Worker processes full audit successfully
- PDF contains ALL real data (no N/A, no zeros)
- System Status dashboard shows all services ONLINE
- Dozzle shows clean logs without WARNING/ERROR messages
- Test audit for matkaaptekarka.pl/ completes with score ~66-70

