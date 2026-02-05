---
name: PDF Generator Implementation
overview: Complete implementation of missing sections (4-9) in PDF report template with real audit data rendering, proper Jinja2 templating, and comprehensive content display. CRITICAL - Remove ALL fallbacks from system.
todos:
  - id: remove-fallbacks
    content: CRITICAL - Remove ALL fallback logic from screaming_frog.py, pdf_generator.py, data_exporter.py, and report.html - system must fail explicitly when Screaming Frog or Lighthouse fails
    status: completed
  - id: fix-seo-section
    content: Fix Section 3 (SEO Technical) to use correct crawl data fields - show pages_crawled, internal_links_count, total_images, images_without_alt, meta tags, H1 structure
    status: completed
  - id: enhance-performance-section
    content: Enhance Section 4 (Performance) - add complete desktop + mobile Core Web Vitals tables, display performance_analysis.recommendations
    status: completed
  - id: improve-content-section
    content: Improve Section 5 (Content) - add metrics table (word_count, has_title, has_meta_description, has_h1), color-code recommendations by emoji prefix
    status: completed
  - id: fix-local-seo-section
    content: Fix Section 6 (Local SEO) - update conditional logic, display has_schema_markup, has_nap with visual indicators
    status: completed
  - id: enhance-competitive-section
    content: Enhance Section 7 (Competitive) - handle no competitors case, display strengths/weaknesses/opportunities with color-coded boxes
    status: completed
  - id: improve-action-plan
    content: Improve Section 8 (Action Plan) - dynamic priority lists based on actual scores, aggregate all recommendations from all sections
    status: completed
  - id: update-pdf-generator
    content: Update pdf_generator.py _extract_report_data() function - REMOVE all fallback logic, ensure data extraction fails explicitly if data missing
    status: completed
  - id: deploy-and-test
    content: Deploy to VPS, restart backend/worker, test PDF generation with audit 85d6ee6f-8c55-4c98-abd8-60dedfafa9df, validate all sections
    status: completed
  - id: update-context7-docs
    content: Update Context7 documentation - mark PDF generator as complete in MISSING_FEATURES.md, update AI_SERVICES.md with PDF implementation details
    status: completed
isProject: false
---

# PDF Generator - Complete Implementation

## 🔴 CRITICAL: Fallback Analysis & Removal Plan

### Problem Statement

The system currently has **silent fallbacks** that hide failures instead of reporting them explicitly. User requirement: **NO FALLBACKS** - if Screaming Frog fails, say it failed. If Lighthouse fails, say it failed.

### Fallback Locations Found

#### 1. **screaming_frog.py** - MAJOR ISSUE ❌

**File**: [backend/app/services/screaming_frog.py](backend/app/services/screaming_frog.py)

**Lines with fallbacks**:

- Line 80, 91, 107, 112, 116: `return await _http_fallback_crawl(url)`
- Lines 119-209: Entire `_http_fallback_crawl()` function (90+ lines!)
- Lines 240-296: `_parse_html()` helper for fallback
- Lines 299-309: `_empty_crawl_result()` that returns fake data

**What it does**:

- When Screaming Frog fails → silently switches to custom HTTP crawler
- Crawls up to 20 pages using `httpx` + `BeautifulSoup`
- Returns data that looks like Screaming Frog output
- User has NO IDEA Screaming Frog failed

**Required fix**:

```python
# BEFORE (lines 72-80):
if process.returncode != 0:
    error = stderr.decode()
    logger.warning(f"Screaming Frog failed: {error[:200]}")
    logger.info("Falling back to HTTP crawler...")
    return await _http_fallback_crawl(url)

# AFTER:
if process.returncode != 0:
    error = stderr.decode()
    logger.error(f"❌ Screaming Frog crawl FAILED: {error}")
    raise Exception(f"Screaming Frog crawl failed: {error[:500]}")
```

**Delete entirely**:

- `_http_fallback_crawl()` function (lines 119-209)
- `_parse_html()` function (lines 240-296)
- `_empty_crawl_result()` function (lines 299-309)

#### 2. **pdf_generator.py** - MEDIUM ISSUE ⚠️

**File**: [backend/app/services/pdf_generator.py](backend/app/services/pdf_generator.py)

**Lines with fallbacks**:

- Line 89: `results = audit_data.get("results") or {}`
- Lines 92-95: `default_seo` with fake data ("N/A", "No data")
- Line 97: `seo_data = results.get("crawl") or default_seo`
- Lines 99-101: `or {}` for lighthouse, desktop, mobile
- Lines 103-106: `content_analysis` with fake data ("Analysis failed or incomplete")
- Lines 113-115: `or {}` for local_seo, performance_analysis, competitive_analysis

**What it does**:

- If `results` missing → returns empty dict (template shows nothing)
- If `crawl` missing → returns fake "N/A" data
- If `content_analysis` missing → returns fake "Analysis failed" message

**Required fix**:

```python
# AFTER:
def _extract_report_data(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract and structure data for PDF report.
    
    NO FALLBACKS - if data is missing, raise an exception.
    PDF generation should ONLY happen for COMPLETED audits with full results.
    """
    results = audit_data.get("results")
    
    # If audit has no results, we should NOT be generating a PDF
    if not results:
        raise ValueError(f"Cannot generate PDF - audit has no results (status: {audit_data.get('status')})")
    
    # Extract required sections - fail if missing
    crawl_data = results.get("crawl")
    if not crawl_data:
        raise ValueError("Cannot generate PDF - missing Screaming Frog crawl data")
    
    lighthouse_data = results.get("lighthouse")
    if not lighthouse_data:
        raise ValueError("Cannot generate PDF - missing Lighthouse data")
    
    # These sections can be empty (AI analysis might be skipped in some cases)
    # but return the actual data or empty dict, don't fake it
    return {
        "seo_data": crawl_data,
        "performance_desktop": lighthouse_data.get("desktop", {}),
        "performance_mobile": lighthouse_data.get("mobile", {}),
        "content_analysis": results.get("content_analysis", {}),
        "local_seo": results.get("local_seo", {}),
        "performance_analysis": results.get("performance_analysis", {}),
        "competitive_analysis": results.get("competitive_analysis", {}),
    }
```

#### 3. **report.html** - MINOR ISSUE 📄

**File**: [backend/templates/report.html](backend/templates/report.html)

**Lines with fallbacks** (Jinja2 `|default()` filters):

- Line 98: `{{ seo_data.pages_crawled|default(0) }}`
- Line 99: `{{ seo_data.internal_links|default(0) }}`
- Line 100: `{{ seo_data.external_links|default(0) }}`
- Lines 134, 139, 144, 149: Desktop performance metrics with `|default(0)`
- Line 163: Mobile performance score with `|default(0)`
- Lines 172-173: Recommendation title/description with `|default()`
- Lines 188, 191: Content quality/readability with `|default(0)`

**What it does**:

- Shows "0" if data missing
- Shows "Rekomendacja" if title missing
- Hides the fact that data is incomplete

**Required fix**:

- Remove ALL `|default()` filters
- If data missing → Jinja2 will show empty or raise error
- Add explicit checks for missing data with clear error messages:

```jinja2
{% if not seo_data.pages_crawled %}
<div class="error-box">
    <h3>⚠️ Brak danych z Screaming Frog</h3>
    <p>Crawl nie został wykonany lub zakończył się błędem.</p>
</div>
{% else %}
<p>Liczba przeskanowanych stron: {{ seo_data.pages_crawled }}</p>
<!-- ... rest of data -->
{% endif %}
```

#### 4. **data_exporter.py** - MINOR ISSUE 📦

**File**: [backend/app/services/data_exporter.py](backend/app/services/data_exporter.py)

**Lines with fallbacks**:

- Line 44: `results = audit_data.get("results") or {}`
- Line 47: `crawl_data = results.get("crawl") or {}`
- Line 54: `lighthouse = results.get("lighthouse") or {}`
- Line 57: `lh_desktop = lighthouse.get("desktop") or {}`
- Line 61: `lh_mobile = lighthouse.get("mobile") or {}`

**Required fix**:

- Same as pdf_generator.py - fail explicitly if data missing
- Raw data export should show actual state, not fake empty dicts

### Implementation Priority

1. **HIGHEST** - Remove `_http_fallback_crawl()` from screaming_frog.py
2. **HIGH** - Remove fallbacks from pdf_generator.py `_extract_report_data()`
3. **MEDIUM** - Remove `|default()` from report.html, add explicit error messages
4. **LOW** - Fix data_exporter.py fallbacks

### Expected Behavior After Fix

**Scenario 1: Screaming Frog fails**

- Worker logs: `❌ Screaming Frog crawl FAILED: [error message]`
- Audit status: `FAILED`
- Error message: `"Screaming Frog crawl failed: [details]"`
- User sees: Red error box in frontend with exact error

**Scenario 2: Lighthouse fails**

- Worker logs: `❌ Lighthouse audit FAILED: [error message]`
- Audit status: `FAILED`
- Error message: `"Lighthouse audit failed: [details]"`
- User sees: Red error box in frontend with exact error

**Scenario 3: PDF requested for incomplete audit**

- Backend logs: `❌ Cannot generate PDF - audit has no results`
- API response: `400 Bad Request - Cannot generate PDF for incomplete audit`
- User sees: Error toast "Nie można wygenerować PDF - audyt nie został ukończony"

## Current State Analysis

**File**: [backend/templates/report.html](backend/templates/report.html)

**Status**: Template structure exists but sections 4-9 are incomplete or missing critical data rendering.

**Existing sections**:

- ✅ Section 1: Executive Summary (complete)
- ✅ Section 2: Overall Results (complete)
- ⚠️ Section 3: SEO Technical Analysis (incomplete - lines 94-119)
- ⚠️ Section 4: Performance Analysis (incomplete - lines 122-181)
- ⚠️ Section 5: Content Analysis (incomplete - lines 184-202)
- ⚠️ Section 6: Local SEO (conditional, incomplete - lines 205-222)
- ⚠️ Section 7: Competitive Analysis (conditional, incomplete - lines 224-254)
- ⚠️ Section 8: Action Plan (generic, needs enhancement - lines 257-292)
- ✅ Section 9: Appendix (complete - lines 295-321)

## Data Structure Available

From database audit results JSONB:

```json
{
  "crawl": {
    "url": "...",
    "title": "...",
    "title_length": 41,
    "meta_description": "...",
    "meta_description_length": 159,
    "h1_tags": ["..."],
    "h1_count": 1,
    "status_code": 200,
    "load_time": 1.958,
    "word_count": 2985,
    "pages_crawled": 20,
    "total_images": 1100,
    "images_without_alt": 1056,
    "internal_links_count": 1353,
    "has_sitemap": false
  },
  "lighthouse": {
    "desktop": { performance_score, fcp, lcp, cls, ttfb, speed_index, total_blocking_time },
    "mobile": { performance_score, fcp, lcp, cls, ttfb, speed_index, total_blocking_time }
  },
  "content_analysis": {
    "quality_score": 85,
    "readability_score": 75,
    "word_count": 2985,
    "has_title": true,
    "has_meta_description": true,
    "has_h1": true,
    "recommendations": ["...", "..."]
  },
  "local_seo": {
    "is_local_business": false,
    "has_nap": false,
    "has_schema_markup": false,
    "recommendations": ["..."]
  },
  "performance_analysis": {
    "performance_score": 62,
    "lcp_desktop": 3762,
    "ttfb_desktop": 793,
    "impact": "medium",
    "issues": ["..."],
    "recommendations": ["...", "..."]
  },
  "competitive_analysis": {
    "competitors_analyzed": 0,
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."],
    "recommendations": ["..."]
  }
}
```

## Implementation Plan

### Section 3: SEO Technical Analysis (Lines 94-119)

**Current issues**:

- Uses undefined variables like `seo_data.pages_crawled`, `seo_data.internal_links`, `seo_data.broken_links`
- These don't match actual data structure from `results.crawl`

**Fix required**:

- Map `seo_data` (from pdf_generator.py) to use `crawl` data correctly
- Display: pages_crawled, internal_links_count, total_images, images_without_alt
- Add meta tags section: title, title_length, meta_description, meta_description_length
- Add H1 structure: h1_tags list, h1_count
- Add technical files: has_sitemap, status_code, load_time
- Remove broken_links reference (not in data)

### Section 4: Performance Analysis (Lines 122-181)

**Current state**: Partially implemented, but incomplete

**Enhancements needed**:

1. Desktop Core Web Vitals table (exists but incomplete metrics):
  - Add FCP (First Contentful Paint)
  - Add Speed Index
  - Add Total Blocking Time
2. Mobile Core Web Vitals table (only shows performance_score):
  - Expand to show all metrics like desktop
  - Add LCP, CLS, FCP, TTFB, Speed Index, TBT
3. Performance recommendations:
  - Use `performance_analysis.recommendations` from results
  - Display structured list with icons/indicators
  - Add performance_analysis.issues if present
  - Show performance_analysis.impact level

### Section 5: Content Analysis (Lines 184-202)

**Current state**: Basic quality and readability, recommendations list

**Enhancements needed**:

1. Add detailed metrics table:
  - Word count: `content_analysis.word_count`
  - Has title: `content_analysis.has_title` (boolean → ✅/❌)
  - Has meta description: `content_analysis.has_meta_description` (boolean → ✅/❌)
  - Has H1: `content_analysis.has_h1` (boolean → ✅/❌)
2. Improve recommendations display:
  - Parse emoji prefixes (✅, ⚠️, ❌, 🤖)
  - Color-code based on prefix (green/yellow/red)
  - Highlight AI recommendations
3. Add content summary (if available):
  - `content_analysis.summary` (AI-generated text)

### Section 6: Local SEO (Lines 205-222)

**Current state**: Conditional section, basic structure

**Fix required**:

1. Update conditional logic:
  - Currently checks `audit.is_local_business` (top-level field)
  - Should ALSO check `local_seo.is_local_business` from results
2. Enhance data display:
  - Schema markup: `local_seo.has_schema_markup` (boolean)
  - NAP (Name, Address, Phone): `local_seo.has_nap` (boolean)
  - Display recommendations list with proper formatting
3. Add visual indicators:
  - ✅ for present elements
  - ❌ for missing elements
  - Color-coded recommendation boxes

### Section 7: Competitive Analysis (Lines 224-254)

**Current state**: Conditional section, basic structure

**Enhancements needed**:

1. Handle "no competitors" case:
  - Check `competitive_analysis.competitors_analyzed == 0`
  - Show message: "Brak dodanych konkurentów do analizy"
2. Display full competitive data:
  - Strengths: `competitive_analysis.strengths` (list)
  - Weaknesses: `competitive_analysis.weaknesses` (list)
  - Opportunities: `competitive_analysis.opportunities` (list)
  - Recommendations: `competitive_analysis.recommendations` (list)
3. Improve visual hierarchy:
  - Strengths → Green boxes
  - Weaknesses → Red boxes
  - Opportunities → Blue boxes
  - Recommendations → Yellow boxes

### Section 8: Action Plan (Lines 257-292)

**Current state**: Generic template with conditional checks

**Enhancements needed**:

1. Dynamic priority lists based on actual issues:
  - High priority: performance_score < 50, seo_score < 50, images_without_alt > 50% of total_images
  - Medium priority: content_score < 70, missing local SEO elements
  - Low priority: continuous improvements
2. Aggregate all recommendations:
  - Collect from: content_analysis, performance_analysis, local_seo, competitive_analysis
  - Sort by priority/impact
  - Remove duplicates
3. Add estimated effort/impact:
  - Parse AI recommendations for 🤖 prefix
  - Show performance_analysis.impact level
  - Indicate quick wins vs. long-term work

### Backend Changes (pdf_generator.py)

**File**: [backend/app/services/pdf_generator.py](backend/app/services/pdf_generator.py)

**Required updates in `_extract_report_data()` function** (lines 72-116):

1. Fix `seo_data` mapping:
  - Change: `seo_data = results.get("crawl") or default_seo`
  - Ensure all fields from crawl are accessible
2. Enhance data extraction:
  - Add helper function to parse recommendations by emoji prefix
  - Add function to safely extract nested metrics
  - Add aggregation for action plan recommendations
3. Add new context keys:
  - `all_recommendations`: List of all recommendations across sections
  - `critical_issues`: List of high-priority issues
  - `quick_wins`: List of easy improvements

## Testing Strategy

1. **Local testing** (not available - VPS only)
2. **VPS testing** workflow:
  - Deploy changes to VPS
  - SSH into VPS
  - Run: `docker exec sitespector-backend python -m pytest tests/test_pdf.py` (if tests exist)
  - OR manually trigger PDF download via frontend: [https://77.42.79.46/audits/85d6ee6f-8c55-4c98-abd8-60dedfafa9df](https://77.42.79.46/audits/85d6ee6f-8c55-4c98-abd8-60dedfafa9df)
  - Download PDF and verify:
    - All sections contain real data
    - No "N/A" or "No data" placeholders
    - Proper formatting and colors
    - Tables render correctly
    - Emoji indicators display properly
3. **Validation checklist**:
  - Section 3: SEO shows crawl metrics, meta tags, H1 structure
  - Section 4: Performance shows desktop + mobile Core Web Vitals
  - Section 5: Content shows quality metrics + AI recommendations
  - Section 6: Local SEO appears only if `is_local_business == true`
  - Section 7: Competitive shows strengths/weaknesses or "no data" message
  - Section 8: Action plan shows dynamic priorities based on scores
  - No Jinja2 template errors (undefined variables)
  - PDF file size < 5MB

## File Changes Summary

**Files to modify**:

1. [backend/templates/report.html](backend/templates/report.html) - Lines 94-292 (sections 3-8)
2. [backend/app/services/pdf_generator.py](backend/app/services/pdf_generator.py) - Lines 72-116 (_extract_report_data function)

**No new files needed** - all changes are enhancements to existing files.

## Deployment Steps

1. ✅ Make changes locally in Cursor
2. ✅ Commit changes: `git commit -m "feat(pdf): complete sections 4-9 with real audit data"`
3. ❓ Ask user to push to remote
4. SSH to VPS: `ssh root@77.42.79.46`
5. Pull changes: `cd /opt/sitespector && git pull origin release`
6. Restart backend + worker: `docker compose -f docker-compose.prod.yml restart backend worker`
7. Test PDF generation via frontend
8. Update Context7 docs: `.context7/backend/AI_SERVICES.md` (PDF section)

