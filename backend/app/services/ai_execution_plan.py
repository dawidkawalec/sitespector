"""
AI Execution Plan Engine for SiteSpector.

Generates concrete, actionable tasks with implementation instructions
for each audit module (SEO, Performance, Visibility, etc.).

Phase 3 of the audit pipeline - transforms analysis into executable plans.
"""

import logging
from typing import Dict, List, Any, Optional
from app.services.ai_client import call_claude

logger = logging.getLogger(__name__)

# ============================================
# Task Generation Functions (Per Module)
# ============================================

async def generate_seo_tasks(
    crawl: Dict[str, Any],
    lighthouse: Dict[str, Any],
    senuto: Optional[Dict[str, Any]],
    ai_context_seo: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate concrete SEO tasks from crawl + lighthouse + senuto data.
    
    Returns tasks with:
    - Title/meta rewrites (with current + suggested values)
    - Schema JSON-LD code (ready to paste)
    - Canonical fixes
    - Sitemap actions
    - H1 optimization
    """
    system_prompt = """Jesteś ekspertem Technical SEO. Na podstawie danych z audytu, wygeneruj KONKRETNE zadania do wykonania.

Dla każdego zadania podaj:
- Dokładną instrukcję krok po kroku
- Obecną wartość i sugerowaną nową wartość
- Gotowy kod/tekst do wklejenia (np. nowy title, JSON-LD schema)
- Priorytet (critical/high/medium/low) i szacowany effort (easy/medium/hard)

Odpowiedź w formacie JSON:
{
    "tasks": [
        {
            "title": "Krótki tytuł zadania",
            "description": "Szczegółowa instrukcja krok po kroku",
            "category": "technical",
            "priority": "high|medium|low",
            "impact": "high|medium|low",
            "effort": "easy|medium|hard",
            "fix_data": {
                "current_value": "Obecna wartość (jeśli dotyczy)",
                "suggested_value": "Sugerowana wartość",
                "code_snippet": "Gotowy kod do wklejenia (jeśli dotyczy)"
            }
        }
    ]
}"""

    # Prepare comprehensive input data
    title = crawl.get("title", "")
    title_length = crawl.get("title_length", 0)
    meta_desc = crawl.get("meta_description", "")
    meta_desc_length = crawl.get("meta_description_length", 0)
    h1_tags = crawl.get("h1_tags", [])
    h1_count = crawl.get("h1_count", 0)
    status_code = crawl.get("status_code", 200)
    has_sitemap = crawl.get("has_sitemap", False)
    technical_seo = crawl.get("technical_seo", {})
    broken_links = technical_seo.get("broken_links", 0)
    missing_canonical = technical_seo.get("missing_canonical", 0)
    noindex_pages = technical_seo.get("noindex_pages", 0)
    
    lighthouse_seo = lighthouse.get("desktop", {}).get("seo_score", 0)
    
    # Visibility metrics from Senuto
    vis_stats = {}
    if senuto and senuto.get("visibility"):
        vis_stats = senuto["visibility"].get("statistics", {}).get("statistics", {})
    
    top3 = vis_stats.get("top3", 0)
    top10 = vis_stats.get("top10", 0)
    domain_rank = vis_stats.get("domain_rank", 0)
    
    # AI insights
    ai_findings = []
    ai_recs = []
    ai_priority_issues = []
    if ai_context_seo:
        ai_findings = ai_context_seo.get("key_findings", [])
        ai_recs = ai_context_seo.get("recommendations", [])
        ai_priority_issues = ai_context_seo.get("priority_issues", [])
    
    user_message = f"""Dane SEO do wygenerowania zadań:

PODSTAWOWE DANE:
- Title: "{title}" (długość: {title_length} znaków)
- Meta Description: "{meta_desc}" (długość: {meta_desc_length} znaków)
- H1: {h1_tags} (liczba: {h1_count})
- Status: {status_code}
- Sitemap: {"TAK" if has_sitemap else "NIE"}

PROBLEMY TECHNICZNE:
- Błędy 404: {broken_links}
- Brak canonical: {missing_canonical}
- Strony noindex: {noindex_pages}
- Lighthouse SEO Score: {lighthouse_seo}/100

WIDOCZNOŚĆ (Senuto):
- TOP3: {top3} fraz
- TOP10: {top10} fraz
- Domain Rank: {domain_rank}

AI INSIGHTS:
- Kluczowe ustalenia: {ai_findings[:3]}
- Rekomendacje: {ai_recs[:3]}
- Priorytety: {ai_priority_issues[:2]}

WYMAGANIA:
1. Jeśli title jest zły/za długi/za krótki - zaproponuj KONKRETNY nowy title (gotowy do wklejenia)
2. Jeśli meta description jest zły - zaproponuj KONKRETNY nowy opis
3. Jeśli brak Schema markup - wygeneruj GOTOWY kod JSON-LD dla LocalBusiness/Organization
4. Jeśli są błędy 404 - konkretne kroki naprawy (redirect 301)
5. Jeśli brak sitemap - instrukcja generowania i dodania
6. Jeśli H1 problematyczny - zaproponuj poprawioną wersję
7. Jeśli brak canonical - konkretne instrukcje dodania

Wygeneruj 5-12 zadań, priorytetyzując według impact/effort. Każde zadanie musi być gotowe do realizacji (developer/SEO może od razu wdrożyć)."""

    try:
        response = await call_claude(user_message, system_prompt, max_tokens=4096)
        
        import json
        import re
        
        # Try to parse JSON
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            # Extract JSON from markdown code block
            match = re.search(r'```json\s*\n(.*?)\n```', response, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                match = re.search(r'\{.*"tasks".*\}', response, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError("No JSON found in response")
        
        tasks = data.get("tasks", [])
        
        # Enrich tasks with module and source
        for task in tasks:
            task["module"] = "seo"
            task["source"] = "execution_plan"
        
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to generate SEO tasks: {e}")
        # Return fallback tasks
        return [
            {
                "title": "Optymalizacja meta title",
                "description": f"Obecny title: '{title}' (długość: {title_length} znaków). Zoptymalizuj do 50-60 znaków z głównym słowem kluczowym.",
                "category": "technical",
                "priority": "high" if title_length < 30 or title_length > 60 else "medium",
                "impact": "high",
                "effort": "easy",
                "fix_data": {
                    "current_value": title,
                    "suggested_value": "Zaproponuj nowy title bazując na zawartości strony i słowach kluczowych",
                    "code_snippet": f'<title>Twój zoptymalizowany title tutaj</title>'
                },
                "module": "seo",
                "source": "execution_plan"
            }
        ]


async def generate_performance_tasks(
    lighthouse: Dict[str, Any],
    crawl: Dict[str, Any],
    ai_context_performance: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate concrete performance tasks from Lighthouse + crawl data.
    
    Returns tasks with:
    - Specific image compression targets (which images, target sizes)
    - Lazy loading instructions
    - Render-blocking resources to defer
    - LCP/CLS optimization steps
    """
    system_prompt = """Jesteś ekspertem Web Performance. Na podstawie danych Lighthouse, wygeneruj KONKRETNE zadania optymalizacji wydajności.

Dla każdego zadania podaj:
- Dokładną instrukcję techniczną
- Które pliki/zasoby zoptymalizować
- Konkretne parametry (docelowe rozmiary, formaty, atrybuty)
- Gotowy kod (atrybuty lazy loading, preload, defer)

Odpowiedź w formacie JSON:
{
    "tasks": [
        {
            "title": "Krótki tytuł zadania",
            "description": "Szczegółowa instrukcja techniczna",
            "category": "technical",
            "priority": "critical|high|medium|low",
            "impact": "high|medium|low",
            "effort": "easy|medium|hard",
            "fix_data": {
                "current_value": "Obecna wartość metryki (np. LCP: 3.5s)",
                "suggested_value": "Docelowa wartość (np. LCP: <2.5s)",
                "code_snippet": "Gotowy kod/parametry"
            }
        }
    ]
}"""

    desktop = lighthouse.get("desktop", {})
    mobile = lighthouse.get("mobile", {})
    
    perf_desktop = desktop.get("performance_score", 0)
    perf_mobile = mobile.get("performance_score", 0)
    lcp_desktop = desktop.get("lcp", 0)
    lcp_mobile = mobile.get("lcp", 0)
    fcp_desktop = desktop.get("fcp", 0)
    fcp_mobile = mobile.get("fcp", 0)
    cls_desktop = desktop.get("cls", 0)
    cls_mobile = mobile.get("cls", 0)
    tbt_desktop = desktop.get("tbt", 0)
    tbt_mobile = mobile.get("tbt", 0)
    ttfb_desktop = desktop.get("ttfb", 0)
    ttfb_mobile = mobile.get("ttfb", 0)
    
    images = crawl.get("images", {})
    total_images = images.get("total", 0)
    images_without_alt = images.get("without_alt", 0)
    avg_image_size = images.get("avg_size", 0)
    
    # AI insights
    ai_findings = []
    ai_recs = []
    ai_priority_issues = []
    if ai_context_performance:
        ai_findings = ai_context_performance.get("key_findings", [])
        ai_recs = ai_context_performance.get("recommendations", [])
        ai_priority_issues = ai_context_performance.get("priority_issues", [])
    
    user_message = f"""Dane Performance do wygenerowania zadań:

CORE WEB VITALS:
Desktop:
- Performance Score: {perf_desktop}/100
- LCP: {lcp_desktop}ms (target: <2500ms)
- FCP: {fcp_desktop}ms (target: <1800ms)
- CLS: {cls_desktop} (target: <0.1)
- TBT: {tbt_desktop}ms (target: <200ms)
- TTFB: {ttfb_desktop}ms (target: <600ms)

Mobile:
- Performance Score: {perf_mobile}/100
- LCP: {lcp_mobile}ms
- FCP: {fcp_mobile}ms
- CLS: {cls_mobile}
- TBT: {tbt_mobile}ms
- TTFB: {ttfb_mobile}ms

OBRAZY:
- Liczba: {total_images}
- Bez ALT: {images_without_alt}
- Średni rozmiar: {avg_image_size} KB

AI INSIGHTS:
- Kluczowe ustalenia: {ai_findings[:3]}
- Rekomendacje: {ai_recs[:3]}
- Priorytety: {ai_priority_issues[:2]}

WYMAGANIA:
1. Jeśli LCP > 2500ms - konkretne kroki optymalizacji (lazy loading, preload, kompresja)
2. Jeśli CLS > 0.1 - instrukcje stabilizacji layoutu (reserve space, font-display)
3. Jeśli TBT > 200ms - optymalizacja JavaScript (code splitting, defer)
4. Jeśli TTFB > 600ms - optymalizacja serwera/cachingu
5. Jeśli obrazy > 100KB - konkretne parametry kompresji (WebP, quality, rozmiary)
6. Jeśli FCP > 1800ms - critical CSS, preconnect, preload

Wygeneruj 5-10 zadań technicznych gotowych do wdrożenia."""

    try:
        response = await call_claude(user_message, system_prompt, max_tokens=4096)
        
        import json
        import re
        
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'```json\s*\n(.*?)\n```', response, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                match = re.search(r'\{.*"tasks".*\}', response, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError("No JSON found in response")
        
        tasks = data.get("tasks", [])
        
        for task in tasks:
            task["module"] = "performance"
            task["source"] = "execution_plan"
        
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to generate performance tasks: {e}")
        return [
            {
                "title": "Optymalizacja LCP",
                "description": f"Obecny LCP: {lcp_desktop}ms (desktop), {lcp_mobile}ms (mobile). Zoptymalizuj główny element (hero image/text) używając preload, lazy loading i kompresji.",
                "category": "technical",
                "priority": "critical" if lcp_desktop > 2500 else "high",
                "impact": "high",
                "effort": "medium",
                "fix_data": {
                    "current_value": f"LCP: {lcp_desktop}ms",
                    "suggested_value": "LCP: <2500ms",
                    "code_snippet": '<link rel="preload" as="image" href="/hero.webp">'
                },
                "module": "performance",
                "source": "execution_plan"
            }
        ]


async def generate_visibility_tasks(
    senuto: Optional[Dict[str, Any]],
    crawl: Dict[str, Any],
    ai_context_visibility: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate concrete visibility/keyword tasks from Senuto data.
    
    Returns tasks with:
    - Keyword targeting plan for specific pages
    - Content gap instructions (which keywords to target)
    - Position improvement strategies (TOP3->TOP10 wins)
    """
    if not senuto or not senuto.get("visibility"):
        return []
    
    system_prompt = """Jesteś strategiem SEO i keyword researcherem. Na podstawie danych Senuto, wygeneruj KONKRETNE zadania związane z widocznością i słowami kluczowymi.

Dla każdego zadania podaj:
- Konkretne słowa kluczowe do targetowania
- Na których stronach je umieścić
- Jak je wykorzystać (content, meta, H1)
- Strategię podniesienia pozycji

Odpowiedź w formacie JSON:
{
    "tasks": [
        {
            "title": "Krótki tytuł zadania",
            "description": "Strategia targetowania słowa kluczowego + konkretne akcje",
            "category": "content",
            "priority": "high|medium|low",
            "impact": "high|medium|low",
            "effort": "easy|medium|hard",
            "fix_data": {
                "keywords": ["słowo1", "słowo2"],
                "target_pages": ["URL1", "URL2"],
                "strategy": "Opis strategii"
            }
        }
    ]
}"""

    vis_data = senuto["visibility"]
    stats = vis_data.get("statistics", {}).get("statistics", {})
    
    top3 = stats.get("top3", 0)
    top10 = stats.get("top10", 0)
    top50 = stats.get("top50", 0)
    domain_rank = stats.get("domain_rank", 0)
    
    positions = vis_data.get("positions", [])
    wins = vis_data.get("wins", [])
    losses = vis_data.get("losses", [])
    
    # Sample keywords
    keywords_sample = []
    for pos in positions[:20]:
        keywords_sample.append({
            "keyword": pos.get("keyword", ""),
            "position": pos.get("position", 0),
            "url": pos.get("url", ""),
            "difficulty": pos.get("difficulty", 0)
        })
    
    # AI insights
    ai_findings = []
    ai_recs = []
    ai_opportunities = []
    if ai_context_visibility:
        ai_findings = ai_context_visibility.get("key_findings", [])
        ai_recs = ai_context_visibility.get("recommendations", [])
        ai_opportunities = ai_context_visibility.get("keyword_opportunities", [])
    
    user_message = f"""Dane Visibility do wygenerowania zadań:

STATYSTYKI:
- TOP3: {top3} fraz
- TOP10: {top10} fraz
- TOP50: {top50} fraz
- Domain Rank: {domain_rank}

PRZYKŁADOWE POZYCJE (top 20):
{keywords_sample[:10]}

WZROSTY (ostatnie): {len(wins)} fraz
SPADKI (ostatnie): {len(losses)} fraz

AI INSIGHTS:
- Kluczowe ustalenia: {ai_findings[:3]}
- Rekomendacje: {ai_recs[:3]}
- Szanse keyword: {ai_opportunities[:3]}

WYMAGANIA:
1. Dla fraz w TOP10-20 - strategia wejścia do TOP10 (content improvement, internal linking)
2. Dla fraz w TOP20-50 - plan targetowania (nowa treść, optymalizacja)
3. Wykorzystaj wzrosty (wins) - podwój effort na te frazy
4. Przeanalizuj spadki (losses) - plan odzyskania pozycji
5. Content gaps - które frazy dodać do contentu

Wygeneruj 5-10 zadań strategicznych."""

    try:
        response = await call_claude(user_message, system_prompt, max_tokens=4096)
        
        import json
        import re
        
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'```json\s*\n(.*?)\n```', response, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                match = re.search(r'\{.*"tasks".*\}', response, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError("No JSON found in response")
        
        tasks = data.get("tasks", [])
        
        for task in tasks:
            task["module"] = "visibility"
            task["source"] = "execution_plan"
        
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to generate visibility tasks: {e}")
        return []


async def generate_ai_overviews_tasks(
    senuto_aio: Optional[Dict[str, Any]],
    crawl: Dict[str, Any],
    ai_context_aio: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate tasks for AI Overviews optimization.
    
    Returns tasks focused on getting cited in Google AI Overviews.
    """
    if not senuto_aio:
        return []
    
    system_prompt = """Jesteś ekspertem AI Overviews SEO. Wygeneruj KONKRETNE zadania optymalizacji contentu pod cytowania w Google AIO.

Odpowiedź w JSON:
{
    "tasks": [
        {
            "title": "Krótki tytuł",
            "description": "Konkretna instrukcja rewrite contentu",
            "category": "content",
            "priority": "high|medium|low",
            "impact": "high|medium|low",
            "effort": "medium|hard",
            "fix_data": {
                "target_keywords": ["keyword1", "keyword2"],
                "content_type": "FAQ|How-to|Definition",
                "instructions": "Konkretne wskazówki"
            }
        }
    ]
}"""

    stats = senuto_aio.get("statistics", {})
    aio_keywords_count = stats.get("aio_keywords_with_domain_count", 0)
    aio_avg_pos = stats.get("aio_avg_pos", 0)
    aio_wins = stats.get("aio_wins_count", 0)
    aio_losses = stats.get("aio_losses_count", 0)
    aio_vis_loss = stats.get("aio_vis_loss_percentage", 0)
    
    keywords = senuto_aio.get("keywords", [])[:20]
    
    user_message = f"""AI Overviews data:
- Cytowania: {aio_keywords_count}
- Avg pozycja: {aio_avg_pos}
- Wins/Losses: {aio_wins}/{aio_losses}
- Utrata visibility: {aio_vis_loss}%

Przykładowe keywords: {keywords[:10]}

Wygeneruj 3-8 zadań rewrite contentu pod AIO."""

    try:
        response = await call_claude(user_message, system_prompt, max_tokens=3072)
        
        import json
        import re
        
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'```json\s*\n(.*?)\n```', response, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                match = re.search(r'\{.*"tasks".*\}', response, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError("No JSON found in response")
        
        tasks = data.get("tasks", [])
        
        for task in tasks:
            task["module"] = "ai_overviews"
            task["source"] = "execution_plan"
        
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to generate AIO tasks: {e}")
        return []


async def generate_links_tasks(
    crawl: Dict[str, Any],
    senuto_backlinks: Optional[Dict[str, Any]],
    ai_context_links: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate tasks for internal linking + backlinks.
    """
    system_prompt = """Jesteś ekspertem link buildingu i linkowania wewnętrznego. Wygeneruj KONKRETNE zadania.

JSON format:
{
    "tasks": [
        {
            "title": "Krótki tytuł",
            "description": "Konkretne instrukcje linkowania",
            "category": "offsite|technical",
            "priority": "high|medium|low",
            "impact": "high|medium|low",
            "effort": "easy|medium|hard",
            "fix_data": {
                "link_targets": ["URL1", "URL2"],
                "anchor_texts": ["anchor1", "anchor2"]
            }
        }
    ]
}"""

    links = crawl.get("links", {})
    total_links = links.get("total", 0)
    internal = links.get("internal", 0)
    external = links.get("external", 0)
    broken = links.get("broken", 0)
    
    bl_stats = {}
    if senuto_backlinks:
        bl_stats = senuto_backlinks.get("statistics", {})
    
    user_message = f"""Links data:
Internal: {internal}, External: {external}, Broken: {broken}
Backlinks: {bl_stats}

Wygeneruj 3-8 zadań linkowania."""

    try:
        response = await call_claude(user_message, system_prompt, max_tokens=3072)
        
        import json
        import re
        
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'```json\s*\n(.*?)\n```', response, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                match = re.search(r'\{.*"tasks".*\}', response, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError("No JSON found in response")
        
        tasks = data.get("tasks", [])
        
        for task in tasks:
            task["module"] = "links"
            task["source"] = "execution_plan"
        
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to generate links tasks: {e}")
        return []


async def generate_images_tasks(
    crawl: Dict[str, Any],
    ai_context_images: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate tasks for image optimization (ALT texts, compression, formats).
    """
    system_prompt = """Jesteś ekspertem optymalizacji obrazów. Wygeneruj KONKRETNE zadania.

JSON format:
{
    "tasks": [
        {
            "title": "Krótki tytuł",
            "description": "Instrukcje optymalizacji",
            "category": "technical",
            "priority": "medium|low",
            "impact": "medium|low",
            "effort": "easy|medium",
            "fix_data": {
                "alt_text": "Sugerowany ALT (jeśli dotyczy)",
                "compression": "Parametry kompresji"
            }
        }
    ]
}"""

    images = crawl.get("images", {})
    total_images = images.get("total", 0)
    without_alt = images.get("without_alt", 0)
    avg_size = images.get("avg_size", 0)
    
    user_message = f"""Images data:
Total: {total_images}, Bez ALT: {without_alt}, Avg size: {avg_size}KB

Wygeneruj 3-6 zadań optymalizacji obrazów."""

    try:
        response = await call_claude(user_message, system_prompt, max_tokens=2048)
        
        import json
        import re
        
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'```json\s*\n(.*?)\n```', response, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                match = re.search(r'\{.*"tasks".*\}', response, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError("No JSON found in response")
        
        tasks = data.get("tasks", [])
        
        for task in tasks:
            task["module"] = "images"
            task["source"] = "execution_plan"
        
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to generate images tasks: {e}")
        return []


async def generate_ux_tasks(
    lighthouse: Dict[str, Any],
    ai_context_ux: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate UX/accessibility tasks from Lighthouse.
    """
    system_prompt = """Jesteś ekspertem UX i accessibility. Wygeneruj KONKRETNE zadania.

JSON format:
{
    "tasks": [
        {
            "title": "Krótki tytuł",
            "description": "Instrukcje poprawy UX",
            "category": "ux",
            "priority": "medium|low",
            "impact": "medium|high",
            "effort": "easy|medium",
            "fix_data": {}
        }
    ]
}"""

    desktop = lighthouse.get("desktop", {})
    accessibility_score = desktop.get("accessibility_score", 0)
    
    user_message = f"""UX data:
Accessibility: {accessibility_score}/100

Wygeneruj 3-5 zadań UX."""

    try:
        response = await call_claude(user_message, system_prompt, max_tokens=2048)
        
        import json
        import re
        
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'```json\s*\n(.*?)\n```', response, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                match = re.search(r'\{.*"tasks".*\}', response, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError("No JSON found in response")
        
        tasks = data.get("tasks", [])
        
        for task in tasks:
            task["module"] = "ux"
            task["source"] = "execution_plan"
        
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to generate UX tasks: {e}")
        return []


async def generate_security_tasks(
    crawl: Dict[str, Any],
    ai_context_security: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Generate security tasks from crawl data.
    """
    system_prompt = """Jesteś ekspertem bezpieczeństwa web. Wygeneruj KONKRETNE zadania.

JSON format:
{
    "tasks": [
        {
            "title": "Krótki tytuł",
            "description": "Instrukcje poprawy security",
            "category": "security",
            "priority": "critical|high",
            "impact": "high",
            "effort": "easy|medium",
            "fix_data": {
                "headers": "Nagłówki do dodania",
                "code": "Kod konfiguracji"
            }
        }
    ]
}"""

    status_code = crawl.get("status_code", 200)
    is_https = status_code == 200  # Simplified
    
    user_message = f"""Security data:
HTTPS: {is_https}

Wygeneruj 2-5 zadań security."""

    try:
        response = await call_claude(user_message, system_prompt, max_tokens=2048)
        
        import json
        import re
        
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'```json\s*\n(.*?)\n```', response, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
            else:
                match = re.search(r'\{.*"tasks".*\}', response, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                else:
                    raise ValueError("No JSON found in response")
        
        tasks = data.get("tasks", [])
        
        for task in tasks:
            task["module"] = "security"
            task["source"] = "execution_plan"
        
        return tasks
        
    except Exception as e:
        logger.error(f"Failed to generate security tasks: {e}")
        return []


# ============================================
# Synthesis Function
# ============================================

def synthesize_execution_plan(all_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Synthesize execution plan from all module tasks.
    
    - Deduplicates similar tasks
    - Auto-tags quick wins (high/medium impact + easy effort)
    - Assigns final priorities
    - Sorts by priority and impact
    """
    def _norm_str(v: Any) -> str:
        return str(v or "").strip()

    def _norm_lower(v: Any) -> str:
        return _norm_str(v).lower()

    def _normalize_priority(v: Any) -> str:
        p = _norm_lower(v) or "medium"
        mapping = {
            "crit": "critical",
            "critical": "critical",
            "high": "high",
            "medium": "medium",
            "med": "medium",
            "low": "low",
        }
        return mapping.get(p, "medium")

    def _normalize_impact(v: Any) -> str:
        i = _norm_lower(v) or "medium"
        return i if i in ("high", "medium", "low") else "medium"

    def _normalize_effort(v: Any) -> str:
        e = _norm_lower(v) or "medium"
        mapping = {
            "easy": "easy",
            "low": "easy",
            "medium": "medium",
            "med": "medium",
            "hard": "hard",
            "high": "hard",
        }
        return mapping.get(e, "medium")

    # Deduplicate by normalized title
    seen_titles = set()
    unique_tasks = []
    
    for task in all_tasks:
        if not isinstance(task, dict):
            continue

        # Normalize core fields early to avoid enum/validation problems later.
        task["title"] = _norm_str(task.get("title") or "Untitled task")
        task["description"] = _norm_str(task.get("description") or "")
        task["category"] = _norm_lower(task.get("category") or "technical") or "technical"
        task["priority"] = _normalize_priority(task.get("priority"))
        task["impact"] = _normalize_impact(task.get("impact"))
        task["effort"] = _normalize_effort(task.get("effort"))
        task["module"] = _norm_lower(task.get("module") or "unknown") or "unknown"
        task["source"] = _norm_lower(task.get("source") or "execution_plan") or "execution_plan"

        title_normalized = task.get("title", "").lower().strip()
        if title_normalized and title_normalized not in seen_titles:
            seen_titles.add(title_normalized)
            unique_tasks.append(task)
    
    # Auto-tag quick wins
    for task in unique_tasks:
        impact = task.get("impact", "medium")
        effort = task.get("effort", "medium")
        
        # Quick win: high/medium impact + easy effort
        if impact in ("high", "medium") and effort == "easy":
            task["is_quick_win"] = True
        else:
            task["is_quick_win"] = False
    
    # Assign sort_order based on priority + impact
    priority_weight = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    impact_weight = {"high": 3, "medium": 2, "low": 1}
    
    for i, task in enumerate(unique_tasks):
        priority = task.get("priority", "medium")
        impact = task.get("impact", "medium")
        
        score = priority_weight.get(priority, 2) * 10 + impact_weight.get(impact, 2)
        task["sort_order"] = -score  # Negative for descending sort
    
    # Sort by sort_order (highest priority first)
    unique_tasks.sort(key=lambda t: t.get("sort_order", 0))
    
    # Re-assign sort_order as sequential integers
    for i, task in enumerate(unique_tasks):
        task["sort_order"] = i
    
    logger.info(f"✅ Synthesized {len(unique_tasks)} tasks ({sum(1 for t in unique_tasks if t.get('is_quick_win'))} quick wins)")
    
    return unique_tasks
