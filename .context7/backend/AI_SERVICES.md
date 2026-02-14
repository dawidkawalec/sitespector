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

## PDF Generator

**Location**: `backend/app/services/pdf_generator.py` + `backend/templates/report.html`

**Status**: ✅ **FULLY COMPLETED** (2025-02-03)

### Architecture

1. **Data Extraction** (`_extract_report_data()`)
   - NO FALLBACKS - raises exceptions if critical data missing
   - Validates: results exist, crawl data exists, lighthouse data exists
   - Aggregates recommendations from all AI sections
   - Parses emoji prefixes (❌, ⚠️, ✅, 🤖) for color-coding

2. **Template Rendering** (`report.html`)
   - All 9 sections fully implemented
   - NO `|default()` filters - shows actual data or explicit errors
   - Color-coded recommendations by emoji
   - Dynamic action plan based on real scores

### PDF Sections

**Section 1 - Executive Summary** ✅
- Overall scores table
- Local business detection

**Section 2 - Table of Contents** ✅
- Dynamic based on data availability

**Section 3 - SEO Technical Analysis** ✅
- Crawl metrics: pages_crawled, internal_links_count, total_images, images_without_alt
- Meta tags table with validation
- H1 structure display
- Technical metrics: status_code, load_time, size_bytes, word_count

**Section 4 - Performance Analysis** ✅
- Desktop Core Web Vitals (7 metrics)
- Mobile Core Web Vitals (7 metrics)
- Performance recommendations with impact level
- Color-coded issues

**Section 5 - Content Analysis** ✅
- Metrics table: quality_score, readability_score, word_count, has_title, has_meta_description, has_h1
- AI summary
- Color-coded recommendations (✅ green, ⚠️ yellow, ❌ red, 🤖 blue)

**Section 6 - Local SEO** ✅ (conditional)
- Shows only if is_local_business = true
- has_schema_markup, has_nap indicators
- Color-coded recommendations

**Section 7 - Competitive Analysis** ✅ (conditional)
- Handles "no competitors" case
- Color-coded boxes: strengths (green), weaknesses (red), opportunities (blue), recommendations (yellow)

**Section 8 - Action Plan** ✅
- **Dynamic priorities** based on real scores:
  - High: performance_score < 50, seo_score < 50, alt_missing > 50%
  - Medium: content_score < 70, missing local SEO
  - Low: continuous improvements
- Aggregated recommendations from all sections
- AI recommendations section

**Section 9 - Appendix** ✅
- Code examples (schema markup)
- Contact information

### Error Handling

```python
# _extract_report_data() validation
if not results:
    raise ValueError(f"Cannot generate PDF - audit has no results")

if not crawl_data:
    raise ValueError("Cannot generate PDF - missing Screaming Frog data")

if not lighthouse_data:
    raise ValueError("Cannot generate PDF - missing Lighthouse data")
```

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

**Last Updated**: 2025-02-03  
**AI Provider**: Google Gemini  
**Model**: gemini-3-flash  
**Status**: Rule-based (AI integration ready but disabled)
