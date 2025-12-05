# AI Prompts - Claude Sonnet 4
## SiteSpector.app Analysis Templates

**Model:** `claude-sonnet-4-20250514`  
**Last Updated:** 2025-12-04

---

## 🎯 Prompt Design Philosophy

**Key Principles:**
1. **Specific & Structured** - Clear output format (JSON)
2. **Context-Rich** - Include all relevant data
3. **Action-Oriented** - Focus on concrete recommendations
4. **Code-Ready** - Generate copy-paste snippets
5. **Prioritized** - HIGH/MEDIUM/LOW priorities

---

## 📋 System Prompt (Base)

```
You are an expert SEO and web performance analyst with 15+ years of experience. Your specialty is analyzing websites and providing actionable, technical recommendations that non-technical clients can understand and implement.

Your analysis must be:
- **Specific**: Never say "improve meta tags" - say exactly what to change
- **Practical**: Include ready-to-use code snippets
- **Prioritized**: Mark recommendations as HIGH, MEDIUM, or LOW priority
- **Quantified**: Estimate impact (e.g., "+15 SEO points", "reduce LCP by 1s")
- **Concise**: Get to the point, avoid fluff

Always respond in valid JSON format matching the provided schema.
```

---

## 🔍 Prompt 1: Main Content Analysis

**Purpose:** Analyze website content, readability, keyword usage

**Input Data:**
- Scraped HTML text
- Meta tags (title, description)
- Headers (H1-H6)
- Lighthouse scores
- Word count

**Template:**

```python
CONTENT_ANALYSIS_PROMPT = """
Analyze this website and provide SEO/content recommendations.

## Website Data:
URL: {url}
Title: {meta_title}
Description: {meta_description}
H1: {h1_text}
Body Text (first 2000 chars): {body_text}
Word Count: {word_count}

## Readability Metrics:
Flesch Score: {flesch_score}
Fog Index: {fog_index}
Avg Sentence Length: {avg_sentence_length}

## Lighthouse Scores:
Performance: {performance_score}/100
SEO: {seo_score}/100
Accessibility: {accessibility_score}/100

## Instructions:
1. Evaluate content quality (tone, professionalism, engagement)
2. Assess readability - is it too complex for target audience?
3. Analyze keyword usage - are primary keywords present and well-distributed?
4. Check meta tags - are they optimized for CTR?
5. Review header structure - logical and keyword-rich?

Return JSON:
{{
  "content_quality": {{
    "score": 0-100,
    "tone": "description",
    "readability_assessment": "too difficult / just right / too simple",
    "word_count_assessment": "too short / optimal / too long",
    "keyword_analysis": {{
      "primary_keyword_detected": "keyword or null",
      "primary_density": 0.0,
      "missing_keywords": ["keyword1", "keyword2"],
      "keyword_stuffing_detected": false
    }}
  }},
  "recommendations": [
    {{
      "id": "rec_001",
      "category": "SEO|Content|Performance",
      "priority": "HIGH|MEDIUM|LOW",
      "issue": "Clear problem statement",
      "current_value": "what's wrong now",
      "impact": "Quantified impact (e.g., 'Lost ~20% CTR')",
      "fix_description": "Exact steps to fix",
      "code_snippet": "Ready-to-use code or null",
      "estimated_time_minutes": 15
    }}
  ]
}}

CRITICAL: Return ONLY valid JSON, no markdown code blocks, no preamble.
"""
```

**Expected Output:**
```json
{
  "content_quality": {
    "score": 68,
    "tone": "Professional but uses medical jargon without explanations",
    "readability_assessment": "too difficult",
    "word_count_assessment": "too short",
    "keyword_analysis": {
      "primary_keyword_detected": "dentysta",
      "primary_density": 1.2,
      "missing_keywords": ["bezbolesne", "stomatolog", "mokotów"],
      "keyword_stuffing_detected": false
    }
  },
  "recommendations": [
    {
      "id": "rec_001",
      "category": "SEO",
      "priority": "HIGH",
      "issue": "Missing meta description",
      "current_value": null,
      "impact": "Lost ~20% potential CTR from search results",
      "fix_description": "Add meta description (155 chars max) with CTA and location",
      "code_snippet": "<meta name=\"description\" content=\"Dentysta w Warszawie Mokotów. Implanty, protetyka, stomatologia estetyczna. ✨ Bezbolesne zabiegi. Umów wizytę: 📞 +48 123 456 789\">",
      "estimated_time_minutes": 15
    },
    {
      "id": "rec_002",
      "category": "Content",
      "priority": "MEDIUM",
      "issue": "Content too technical (Flesch score 42 - academic level)",
      "current_value": "Uses terms like 'endodoncja', 'preparacja protetyczna'",
      "impact": "Confuses layperson readers, increases bounce rate",
      "fix_description": "Simplify language: replace jargon with common terms, add explanations in parentheses",
      "code_snippet": "<!-- Example: 'endodoncja (leczenie kanałowe)' instead of just 'endodoncja' -->",
      "estimated_time_minutes": 60
    }
  ]
}
```

---

## 🏠 Prompt 2: Local SEO Detection

**Purpose:** Detect if website is a local business and generate LocalBusiness schema

**Template:**

```python
LOCAL_SEO_PROMPT = """
Analyze if this is a local business website and extract relevant data.

## Website Content:
{html_text}

## Instructions:
1. Look for physical address (street, city, postal code)
2. Look for phone number (any format)
3. Look for opening hours / business hours
4. Determine business type (restaurant, dentist, salon, etc.)
5. If local business detected, generate Schema.org LocalBusiness JSON-LD

Return JSON:
{{
  "is_local_business": true|false,
  "confidence": 0.0-1.0,
  "found_elements": {{
    "address": "full address or null",
    "street": "ul. Mokotowska 12",
    "city": "Warszawa",
    "postal_code": "00-001",
    "country": "PL",
    "phone": "+48 123 456 789 or null",
    "opening_hours": "Mo-Fr 09:00-18:00 or null",
    "business_type": "Dentist|Restaurant|Salon|Store|..."
  }},
  "schema_present": true|false,
  "schema_recommendation": {{
    "priority": "HIGH|MEDIUM|LOW",
    "reason": "Why this matters",
    "code_snippet": "Complete Schema.org JSON-LD ready to paste"
  }}
}}

CRITICAL: 
- Only set is_local_business=true if you find BOTH address AND phone
- Generate complete, valid Schema.org markup
- Use correct @type (Dentist, Restaurant, etc.)
"""
```

**Expected Output:**
```json
{
  "is_local_business": true,
  "confidence": 0.95,
  "found_elements": {
    "address": "ul. Mokotowska 12, 00-001 Warszawa",
    "street": "ul. Mokotowska 12",
    "city": "Warszawa",
    "postal_code": "00-001",
    "country": "PL",
    "phone": "+48 123 456 789",
    "opening_hours": "Mo-Fr 09:00-18:00",
    "business_type": "Dentist"
  },
  "schema_present": false,
  "schema_recommendation": {
    "priority": "HIGH",
    "reason": "Missing LocalBusiness schema prevents Google Maps rich results and reduces local visibility by ~30%",
    "code_snippet": "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Dentist\",\n  \"name\": \"Dentysta Premium\",\n  \"address\": {\n    \"@type\": \"PostalAddress\",\n    \"streetAddress\": \"ul. Mokotowska 12\",\n    \"addressLocality\": \"Warszawa\",\n    \"postalCode\": \"00-001\",\n    \"addressCountry\": \"PL\"\n  },\n  \"telephone\": \"+48 123 456 789\",\n  \"openingHours\": \"Mo-Fr 09:00-18:00\",\n  \"priceRange\": \"$$\"\n}\n</script>"
  }
}
```

---

## ⚡ Prompt 3: Performance Analysis

**Purpose:** Analyze Core Web Vitals and suggest specific optimizations

**Template:**

```python
PERFORMANCE_PROMPT = """
Analyze website performance and provide optimization recommendations.

## Lighthouse Metrics (Desktop):
LCP: {lcp_desktop}s (target: <2.5s)
INP: {inp_desktop}ms (target: <200ms)
CLS: {cls_desktop} (target: <0.1)
TTFB: {ttfb_desktop}s (target: <0.8s)
Speed Index: {speed_index_desktop}s

## Lighthouse Metrics (Mobile):
LCP: {lcp_mobile}s
INP: {inp_mobile}ms
CLS: {cls_mobile}
TTFB: {ttfb_mobile}s
Speed Index: {speed_index_mobile}s

## Lighthouse Opportunities:
{lighthouse_opportunities_json}

## Images Found:
{images_list}
<!-- Format: [{{"src": "/img.jpg", "size_kb": 450, "alt": "..."}}] -->

## Instructions:
1. Identify which Core Web Vitals are failing (> thresholds)
2. For each failing metric, explain root cause
3. Provide specific fix with code snippet
4. Estimate impact (e.g., "reduce LCP from 3.2s to 1.5s")

Return JSON:
{{
  "core_web_vitals_status": {{
    "lcp": "PASS|FAIL",
    "inp": "PASS|FAIL",
    "cls": "PASS|FAIL"
  }},
  "critical_issues": [
    {{
      "metric": "LCP|INP|CLS|TTFB",
      "current_value": "3.2s",
      "threshold": "2.5s",
      "diagnosis": "What's causing the problem",
      "fix": "Specific solution",
      "code_snippet": "Implementation code",
      "expected_improvement": "LCP → 1.5s"
    }}
  ],
  "image_optimizations": [
    {{
      "filename": "hero.jpg",
      "current_size_kb": 450,
      "recommended_size_kb": 80,
      "savings_pct": 82,
      "recommendation": "Convert to WebP, resize to 1200px width"
    }}
  ]
}}
"""
```

**Expected Output:**
```json
{
  "core_web_vitals_status": {
    "lcp": "PASS",
    "inp": "PASS",
    "cls": "FAIL"
  },
  "critical_issues": [
    {
      "metric": "CLS",
      "current_value": "0.25",
      "threshold": "0.1",
      "diagnosis": "Images in gallery section don't have width/height attributes, causing layout shift as they load",
      "fix": "Add explicit dimensions to all <img> tags",
      "code_snippet": "<!-- Before -->\n<img src=\"smile1.jpg\" alt=\"Patient\">\n\n<!-- After -->\n<img src=\"smile1.jpg\" alt=\"Patient\" width=\"800\" height=\"600\" loading=\"lazy\">",
      "expected_improvement": "CLS → 0.05 (PASS)"
    }
  ],
  "image_optimizations": [
    {
      "filename": "hero-background.jpg",
      "current_size_kb": 1200,
      "recommended_size_kb": 180,
      "savings_pct": 85,
      "recommendation": "Convert to WebP format, compress with quality=80, resize to max 1920px width"
    },
    {
      "filename": "team-photo.png",
      "current_size_kb": 980,
      "recommended_size_kb": 120,
      "savings_pct": 88,
      "recommendation": "Convert PNG to WebP (lossy compression acceptable for photos)"
    }
  ]
}
```

---

## 🏆 Prompt 4: Competitive Analysis

**Purpose:** Compare main site with competitors and find opportunities

**Template:**

```python
COMPETITIVE_PROMPT = """
Compare this website with its competitors and identify opportunities.

## Main Website:
URL: {main_url}
Lighthouse Performance: {main_performance}/100
Content Length: {main_word_count} words
Schema.org: {main_has_schema}
Meta Description: {main_has_meta_desc}

## Competitor 1:
URL: {comp1_url}
Lighthouse Performance: {comp1_performance}/100
Content Length: {comp1_word_count} words
Schema.org: {comp1_has_schema}
Meta Description: {comp1_has_meta_desc}

## Competitor 2:
URL: {comp2_url}
[... same structure ...]

## Competitor 3:
URL: {comp3_url}
[... same structure ...]

## Instructions:
1. Identify what competitors do better
2. Find specific features/tactics they use that main site doesn't
3. Suggest concrete actions to match or beat competitors

Return JSON:
{{
  "position": "ahead|middle|behind",
  "strengths": ["What main site does better than competitors"],
  "weaknesses": ["What main site lacks compared to competitors"],
  "opportunities": [
    {{
      "title": "Specific opportunity",
      "insight": "What competitor does that we don't",
      "competitor_url": "https://competitor.com",
      "recommendation": "How to implement this",
      "estimated_impact": "Quantified benefit"
    }}
  ]
}}
"""
```

**Expected Output:**
```json
{
  "position": "middle",
  "strengths": [
    "Better LCP than 2/3 competitors (1.2s vs avg 2.0s)",
    "Higher accessibility score (92 vs avg 85)"
  ],
  "weaknesses": [
    "No Schema.org markup (all competitors have it)",
    "Shorter content (850 words vs competitor avg 1400 words)",
    "Missing meta description (all competitors have optimized descriptions)"
  ],
  "opportunities": [
    {
      "title": "Add VideoObject Schema for visual content",
      "insight": "Competitor C (dentamed.pl) uses VideoObject schema for their 'How a visit looks' video, resulting in video thumbnails in Google search results",
      "competitor_url": "https://dentamed.pl",
      "recommendation": "Record a 2-minute video tour of your office, upload to YouTube, embed on site with VideoObject schema",
      "estimated_impact": "Video rich results attract 3x more clicks than standard results"
    },
    {
      "title": "Expand content with FAQ section",
      "insight": "Competitors A and B have FAQ sections (avg 800 additional words) with FAQPage schema, ranking for long-tail questions",
      "competitor_url": "https://competitor-a.pl",
      "recommendation": "Add FAQ section answering common patient questions ('Czy implanty bolą?', 'Ile kosztuje wizyta?') with FAQPage schema",
      "estimated_impact": "Target 10+ long-tail keywords, potential +30% organic traffic"
    }
  ]
}
```

---

## 🧠 Prompt 5: Executive Summary

**Purpose:** Generate concise executive summary for report

**Template:**

```python
SUMMARY_PROMPT = """
Create an executive summary of the website audit.

## Audit Results:
Overall Score: {overall_score}/100
SEO Score: {seo_score}/100
Performance Score: {performance_score}/100
Content Score: {content_score}/100

## Top 5 Issues Found:
{issues_list}

## Instructions:
Write a 3-paragraph executive summary:
1. Current state (strengths + weaknesses)
2. Top 3 critical issues
3. Expected outcome after fixes

Keep it non-technical, business-focused.

Return JSON:
{{
  "summary": "3-paragraph text",
  "key_findings": [
    "Finding 1",
    "Finding 2",
    "Finding 3"
  ],
  "expected_outcome": "After implementing recommendations, expect..."
}}
"""
```

---

## 🛠️ Prompt Engineering Best Practices

### 1. Always Include Schema in Prompt

```python
# Good
"Return JSON: { 'score': 0-100, 'recommendations': [...] }"

# Bad
"Give me some recommendations"
```

### 2. Use Few-Shot Examples for Complex Tasks

```python
PROMPT_WITH_EXAMPLES = """
Generate Schema.org LocalBusiness markup.

Example output:
{{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "name": "Example Dental",
  ...
}}

Now generate for this data:
{business_info}
"""
```

### 3. Validate JSON Before Storage

```python
import json
from pydantic import BaseModel, ValidationError

class AIRecommendation(BaseModel):
    id: str
    category: str
    priority: str
    # ... other fields

try:
    response_json = json.loads(claude_response)
    recommendation = AIRecommendation(**response_json)
except (json.JSONDecodeError, ValidationError) as e:
    # Log error, retry with different prompt
    logger.error(f"AI response invalid: {e}")
```

### 4. Handle Rate Limits & Retries

```python
from anthropic import RateLimitError
import time

def call_claude_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except RateLimitError:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                time.sleep(wait_time)
            else:
                raise
```

---

## 💰 Token Usage Optimization

**Estimated Token Usage per Audit:**

| Component | Input Tokens | Output Tokens | Cost @ Sonnet 4 |
|-----------|-------------|---------------|-----------------|
| Content Analysis | ~8,000 | ~2,000 | $0.024 + $0.030 = $0.054 |
| Local SEO Detection | ~3,000 | ~1,000 | $0.009 + $0.015 = $0.024 |
| Performance Analysis | ~2,000 | ~1,500 | $0.006 + $0.023 = $0.029 |
| Competitive Analysis | ~5,000 | ~1,000 | $0.015 + $0.015 = $0.030 |
| **TOTAL** | **~18,000** | **~5,500** | **~$0.137** |

**Cost per 1000 audits:** $137  
**Revenue per 1000 audits @ 29 PLN:** ~$7,000 USD  
**Margin:** 98%

---

## ✅ Prompt Checklist

- [ ] System prompt sets clear role & expectations
- [ ] JSON schema explicitly defined
- [ ] Few-shot examples included (for complex tasks)
- [ ] Error handling for invalid JSON
- [ ] Token usage optimized (remove unnecessary context)
- [ ] Retry logic for rate limits
- [ ] Output validated with Pydantic models

---

**Document Status:** ✅ COMPLETE  
**Next:** REPORT_STRUCTURE.md (PDF template design)
