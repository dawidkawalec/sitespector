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

**Status**: ✅ **FULLY REBUILT** (2026-02-25) — Modular, multi-type system

### Architecture

```
backend/app/services/pdf/
  __init__.py          → exports generate_pdf()
  generator.py         → orchestrator (main entry point)
  config.py            → ReportTypeConfig for executive/standard/full
  charts.py            → matplotlib SVG chart generators
  styles.py            → WeasyPrint CSS (A4, header/footer)
  utils.py             → helpers (score_color, fmt_ms, cwv_status, etc.)
  sections/            → per-section data extractors (25+ modules)
    executive_summary.py, technical_overview.py, on_page_seo.py,
    internal_links.py, performance.py, lighthouse_detail.py,
    accessibility.py, visibility_overview.py, keywords.py,
    position_changes.py, organic_competitors.py, backlinks.py,
    ai_overviews.py, content.py, ux_mobile.py, security.py,
    tech_stack.py, ai_insights.py, cross_tool.py, quick_wins.py,
    roadmap.py, execution_plan.py, benchmark.py,
    appendix_pages.py, appendix_images.py, appendix_keywords.py, appendix_backlinks.py

backend/templates/pdf/
  base.html            → WeasyPrint base with @page running header/footer
  macros.html          → Jinja2 reusable macros (score cards, badges, alerts, etc.)
  sections/            → 25+ section templates
```

### 3 Report Types

| Type | Pages | Audience | Key additions |
|------|-------|----------|--------------|
| `executive` | 15–25 | C-level, presentations | Scores, TOP metrics, TOP 5 QW |
| `standard` | 50–80 | Marketing teams | Full SEO, Perf, Senuto TOP 50, AI strategy |
| `full` | 80–150+ | SEO agencies | All raw data, ALL pages, TOP 200 keywords |

### API Endpoint

```
GET /api/audits/{audit_id}/pdf?report_type=standard
# report_type: executive | standard | full (default: standard)
```

### 25+ PDF Sections (Full report)

**PART I** — Executive Summary
**PART II** — SEO Techniczne (Technical Overview, On-Page SEO, Internal Links)
**PART III** — Wydajność (Performance CWV, Lighthouse Detail, Accessibility)
**PART IV** — Widoczność Organiczna (Visibility, Keywords, Changes, Competitors, Backlinks, AIO)
**PART V** — Treść & UX (Content, UX/Mobile, Security, Tech Stack)
**PART VI** — Strategia AI (AI Insights x9, Cross-Tool, Quick Wins, Roadmap, Execution Plan, Benchmark)
**PART VII** — Załączniki (All Pages, Images, Keywords TOP 200, Backlinks TOP 100)

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

**Last Updated**: 2026-02-15  
**AI Provider**: Google Gemini  
**Model**: gemini-3-flash  
**Status**: Rule-based (AI integration ready but disabled)
