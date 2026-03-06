"""
AI-powered analysis services using Claude.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.services.ai_client import call_claude, AIUnavailableError
from app.services.global_context import format_global_snapshot_for_prompt

logger = logging.getLogger(__name__)


IMPACT_WEIGHT = {"high": 3, "medium": 2, "low": 1}
EFFORT_WEIGHT = {"easy": 3, "medium": 2, "hard": 1}


def _normalize_impact(value: Any) -> str:
    v = str(value or "").strip().lower()
    if v in IMPACT_WEIGHT:
        return v
    return "medium"


def _normalize_effort(value: Any) -> str:
    v = str(value or "").strip().lower()
    if v in EFFORT_WEIGHT:
        return v
    return "medium"


def _to_number(value: Any, default: float = 0.0) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, dict):
        for key in ("current", "value", "recent_value", "count", "total"):
            nested = value.get(key)
            if isinstance(nested, (int, float)):
                return float(nested)
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def aggregate_quick_wins_from_results(all_results: Dict[str, Any], max_items: int = 20) -> List[Dict[str, Any]]:
    """
    Build a single prioritized quick wins list from all AI modules.
    """
    if not isinstance(all_results, dict):
        return []

    candidates: List[Dict[str, Any]] = []
    ai_contexts = all_results.get("ai_contexts", {}) or {}
    area_labels = {
        "seo": "SEO",
        "performance": "Performance",
        "visibility": "Visibility",
        "ai_overviews": "AI Overviews",
        "backlinks": "Backlinks",
        "links": "Internal Links",
        "images": "Images",
    }

    if isinstance(ai_contexts, dict):
        for area, payload in ai_contexts.items():
            if not isinstance(payload, dict):
                continue
            area_wins = payload.get("quick_wins", []) or []
            for win in area_wins:
                if not isinstance(win, dict):
                    continue
                title = (win.get("title") or "").strip()
                if not title:
                    continue
                impact = _normalize_impact(win.get("impact"))
                effort = _normalize_effort(win.get("effort"))
                candidates.append({
                    "title": title,
                    "description": win.get("description") or "",
                    "impact": impact,
                    "effort": effort,
                    "category": area_labels.get(area, str(area).replace("_", " ").title()),
                    "source": f"ai_contexts.{area}",
                    "score": IMPACT_WEIGHT[impact] * 3 + EFFORT_WEIGHT[effort] * 2,
                })

    content_plan = all_results.get("content_analysis", {}).get("roi_action_plan", []) or []
    for action in content_plan:
        if not isinstance(action, dict):
            continue
        title = (action.get("action") or "").strip()
        if not title:
            continue
        impact = _normalize_impact(action.get("impact"))
        effort = _normalize_effort(action.get("effort"))
        candidates.append({
            "title": title,
            "description": "Akcja z planu ROI dla contentu.",
            "impact": impact,
            "effort": effort,
            "category": "Content",
            "source": "content_analysis.roi_action_plan",
            "score": IMPACT_WEIGHT[impact] * 2 + EFFORT_WEIGHT[effort] * 2,
        })

    roadmap_now = all_results.get("roadmap", {}).get("immediate_actions", []) or []
    for action in roadmap_now:
        if not isinstance(action, dict):
            continue
        title = (action.get("title") or "").strip()
        if not title:
            continue
        impact = _normalize_impact(action.get("impact"))
        effort = _normalize_effort(action.get("effort"))
        candidates.append({
            "title": title,
            "description": action.get("description") or "",
            "impact": impact,
            "effort": effort,
            "category": action.get("area") or "Strategy",
            "source": "roadmap.immediate_actions",
            "score": IMPACT_WEIGHT[impact] * 4 + EFFORT_WEIGHT[effort],
        })

    dedup: Dict[str, Dict[str, Any]] = {}
    for candidate in candidates:
        dedup_key = " ".join(str(candidate.get("title", "")).lower().split())
        if not dedup_key:
            continue
        existing = dedup.get(dedup_key)
        if not existing or candidate["score"] > existing["score"]:
            dedup[dedup_key] = candidate

    wins = list(dedup.values())
    wins.sort(key=lambda item: (-item.get("score", 0), item.get("title", "")))

    return [
        {
            "title": item["title"],
            "description": item.get("description", ""),
            "impact": item.get("impact", "medium"),
            "effort": item.get("effort", "medium"),
            "category": item.get("category", "General"),
            "source": item.get("source", "unknown"),
        }
        for item in wins[:max_items]
    ]


async def analyze_content(content_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze website content quality and provide recommendations using Claude AI.
    
    Args:
        content_data: Content data from crawl
        
    Returns:
        Dictionary with content analysis and recommendations
    """
    logger.info("Analyzing content with AI")
    
    recommendations = []
    quality_score = 100
    
    # Extract content for AI analysis
    title = content_data.get("title") or ""
    meta_desc = content_data.get("meta_description") or ""
    h1_tags = content_data.get("h1_tags") or []
    h1_text = " ".join(h1_tags) if h1_tags else ""
    
    # Get full text content if available (future improvement)
    # Currently we rely on metadata and structure
    
    # --- Rule-based analysis (keeping existing logic as baseline) ---
    
    # Analyze title
    title_length = content_data.get("title_length") or 0
    if not title:
        recommendations.append("❌ Brak tagu title - dodaj unikalny tytuł strony (50-60 znaków)")
        quality_score -= 20
    elif title_length < 30:
        recommendations.append("⚠️ Title tag za krótki - rozbuduj do 50-60 znaków")
        quality_score -= 10
    elif title_length > 70:
        recommendations.append("⚠️ Title tag za długi - skróć do maksymalnie 70 znaków")
        quality_score -= 5
    else:
        recommendations.append("✅ Title tag ma optymalną długość")
    
    # Analyze meta description
    meta_length = content_data.get("meta_description_length") or 0
    if not meta_desc:
        recommendations.append("❌ Brak meta description - dodaj opis strony (150-160 znaków)")
        quality_score -= 15
    elif meta_length < 120:
        recommendations.append("⚠️ Meta description za krótka - rozbuduj do 150-160 znaków")
        quality_score -= 8
    elif meta_length > 170:
        recommendations.append("⚠️ Meta description za długa - skróć do maksymalnie 170 znaków")
        quality_score -= 5
    else:
        recommendations.append("✅ Meta description ma optymalną długość")
    
    # Analyze H1 tags
    h1_count = content_data.get("h1_count") or 0
    if h1_count == 0:
        recommendations.append("❌ Brak tagu H1 - dodaj główny nagłówek strony")
        quality_score -= 15
    elif h1_count > 1:
        recommendations.append(f"⚠️ Zbyt wiele tagów H1 ({h1_count}) - użyj tylko jednego H1 na stronę")
        quality_score -= 10
    else:
        recommendations.append("✅ Strona ma jeden tag H1")
    
    # Analyze images
    total_images = content_data.get("total_images") or 0
    images_without_alt = content_data.get("images_without_alt") or 0
    if images_without_alt > 0:
        recommendations.append(f"⚠️ {images_without_alt} z {total_images} obrazów bez atrybutu ALT - dodaj opisy dla SEO i dostępności")
        quality_score -= min(15, images_without_alt * 2)
    elif total_images > 0:
        recommendations.append(f"✅ Wszystkie {total_images} obrazów mają atrybut ALT")
    
    # Word count
    word_count = content_data.get("word_count") or 0
    if word_count < 300:
        recommendations.append("⚠️ Za mało treści na stronie - dodaj więcej wartościowej treści (min. 300 słów)")
        quality_score -= 10
    else:
        recommendations.append(f"✅ Strona zawiera {word_count} słów")
        
    # --- AI Analysis Integration ---
    try:
        # Construct prompt for Claude
        system_prompt = "Jesteś ekspertem SEO i copywritingu. Twoim zadaniem jest analiza jakości treści strony internetowej na podstawie dostarczonych metadanych."
        
        user_message = f"""
        Przeanalizuj poniższe dane ze strony internetowej i podaj krótką, biznesową ocenę jakości komunikacji.
        Skup się na tym, czy tytuł i opis zachęcają do kliknięcia (CTR) oraz czy nagłówki są spójne.
        
        Dane strony:
        - Tytuł: {title}
        - Meta Opis: {meta_desc}
        - Nagłówki H1: {h1_text}
        - Liczba słów: {word_count}
        
        Twoja odpowiedź powinna być w formacie JSON z polami:
        - "summary": Krótkie podsumowanie jakości treści (max 2 zdania)
        - "tone_voice": Ocena tonu wypowiedzi (np. profesjonalny, luźny, niespójny)
        - "ai_recommendations": Lista 2-3 konkretnych sugestii poprawy copywritingu
        - "roi_action_plan": Lista obiektów {{"action": string, "impact": "high"|"medium"|"low", "effort": "easy"|"medium"|"hard"}}
        """
        
        # Call Gemini (using call_claude wrapper)
        ai_response = await call_claude(user_message, system_prompt)
        
        # Simple JSON extraction from response
        import json
        import re
        
        # Find JSON block in response
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group())
        else:
            # Fallback if no JSON block found
            ai_data = {
                "summary": ai_response[:200],
                "tone_voice": "Nieokreślony",
                "ai_recommendations": [],
                "roi_action_plan": []
            }
        
        # Merge AI recommendations
        if ai_data.get("ai_recommendations"):
            recommendations.extend([f"🤖 AI: {rec}" for rec in ai_data["ai_recommendations"]])
            
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        ai_data = {
            "summary": "Analiza AI tymczasowo niedostępna.",
            "tone_voice": "N/A",
            "ai_recommendations": [],
            "roi_action_plan": []
        }
    
    return {
        "quality_score": max(0, quality_score),
        "readability_score": int(content_data.get("flesch_reading_ease", 0)) if content_data.get("flesch_reading_ease") else None,
        "recommendations": recommendations,
        "word_count": word_count,
        "has_title": bool(title),
        "has_meta_description": bool(meta_desc),
        "has_h1": h1_count > 0,
        "summary": ai_data.get("summary"),
        "tone_voice": ai_data.get("tone_voice"),
        "roi_action_plan": ai_data.get("roi_action_plan", [])
    }


async def analyze_content_deep(all_pages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Perform deep analysis on all crawled pages.
    Detects thin content, duplicate content, and content gaps.
    """
    logger.info(f"Performing deep content analysis on {len(all_pages)} pages")
    
    thin_content_pages = [p['url'] for p in all_pages if p.get('word_count', 0) < 200 and p.get('status_code') == 200]
    
    # Simple duplicate detection based on titles
    titles = {}
    duplicates = []
    for p in all_pages:
        title = p.get('title')
        if title and p.get('status_code') == 200:
            if title in titles:
                duplicates.append({"url1": titles[title], "url2": p['url'], "title": title})
            else:
                titles[title] = p['url']
                
    return {
        "thin_content_count": len(thin_content_pages),
        "thin_content_urls": thin_content_pages[:10],
        "duplicate_content_count": len(duplicates),
        "duplicates": duplicates[:5]
    }


async def generate_fix_suggestion(issue_type: str, urls: List[str]) -> Dict[str, Any]:
    """
    Generate concrete fix suggestions for a specific SEO issue using AI.
    """
    logger.info(f"Generating fix suggestion for {issue_type}")
    
    issues_map = {
        "broken_links": "uszkodzone linki (404)",
        "missing_canonical": "brakujące tagi kanoniczne",
        "noindex_pages": "strony wykluczone z indeksowania (noindex)",
        "duplicate_titles": "duplikaty tytułów meta",
        "thin_content": "zbyt mała ilość treści (thin content)"
    }
    
    issue_desc = issues_map.get(issue_type, issue_type)
    urls_str = "\n".join(urls[:10])
    if len(urls) > 10:
        urls_str += f"\n... i {len(urls) - 10} więcej"
        
    system_prompt = "Jesteś ekspertem technicznym SEO. Twoim zadaniem jest podanie konkretnych, technicznych kroków naprawczych dla zgłoszonego problemu."
    
    user_message = f"""
    Problem: {issue_desc}
    Dotknięte adresy URL:
    {urls_str}
    
    Podaj:
    1. Dlaczego to jest ważne dla SEO?
    2. Konkretne kroki techniczne, aby to naprawić (np. co zmienić w kodzie, CMS lub serwerze).
    3. Jak sprawdzić, czy zostało to poprawnie naprawione?
    
    Twoja odpowiedź powinna być w formacie JSON:
    {{
        "importance": "krótkie wyjaśnienie (max 2 zdania)",
        "steps": ["krok 1", "krok 2", ...],
        "verification": "jak sprawdzić poprawność",
        "ai_tip": "dodatkowa wskazówka od AI"
    }}
    """
    
    try:
        ai_response = await call_claude(user_message, system_prompt)
        import json
        import re
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.error(f"Failed to generate fix suggestion: {e}")
        
    return {
        "importance": "Ten problem wpływa negatywnie na indeksowanie i widoczność strony.",
        "steps": ["Zidentyfikuj przyczynę problemu w CMS lub kodzie strony.", "Zastosuj odpowiednie poprawki techniczne."],
        "verification": "Użyj narzędzi takich jak Google Search Console lub ponownie uruchom audyt.",
        "ai_tip": "Regularne audyty techniczne pomagają unikać takich problemów w przyszłości."
    }


async def detect_tech_stack(url: str, crawl_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Detect technology stack using response headers and HTML patterns.
    """
    logger.info(f"Detecting tech stack for {url}")
    
    # Simple pattern matching for common technologies
    homepage = next((p for p in crawl_data.get("all_pages", []) if p['url'] == url or p['url'] == url + '/'), {})
    
    techs = []
    
    # 1. CMS Detection
    if "wp-content" in str(crawl_data):
        techs.append({"name": "WordPress", "category": "CMS", "icon": "wordpress"})
    
    # 2. Frameworks
    if "next/static" in str(crawl_data):
        techs.append({"name": "Next.js", "category": "Framework", "icon": "nextjs"})
    elif "react" in str(crawl_data).lower():
        techs.append({"name": "React", "category": "Library", "icon": "react"})
        
    # 3. Analytics
    if "googletagmanager.com" in str(crawl_data):
        techs.append({"name": "Google Tag Manager", "category": "Analytics", "icon": "gtm"})
    if "google-analytics.com" in str(crawl_data):
        techs.append({"name": "Google Analytics", "category": "Analytics", "icon": "ga"})
        
    return {
        "technologies": techs,
        "server": "Unknown",
        "recommendations": ["Rozważ użycie formatów obrazów nowej generacji", "Zaktualizuj biblioteki JavaScript"]
    }


async def analyze_security(url: str, crawl_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform basic security analysis.
    """
    logger.info(f"Analyzing security for {url}")
    
    is_https = url.startswith("https")
    
    # Check for mixed content
    mixed_content = [p['url'] for p in crawl_data.get("all_pages", []) if p['url'].startswith("http://")]
    
    return {
        "is_https": is_https,
        "mixed_content_count": len(mixed_content),
        "security_score": 100 if is_https and len(mixed_content) == 0 else 50,
        "recommendations": ["Wdróż Content Security Policy (CSP)", "Dodaj nagłówek HSTS"] if is_https else ["Zainstaluj certyfikat SSL"]
    }


async def analyze_ux(lighthouse_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform basic UX analysis using Lighthouse accessibility and mobile data.
    """
    logger.info("Analyzing UX signals")
    
    desktop = lighthouse_data.get("desktop", {})
    mobile = lighthouse_data.get("mobile", {})
    
    acc_score = desktop.get("accessibility_score", 0)
    
    return {
        "ux_score": acc_score,
        "mobile_friendly": mobile.get("performance_score", 0) > 50,
        "accessibility_score": acc_score,
        "recommendations": ["Popraw kontrast kolorów", "Dodaj etykiety do pól formularzy", "Zwiększ rozmiar celów dotykowych na mobile"]
    }


async def analyze_local_seo(content_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Detect if website is a local business and analyze local SEO.
    
    Args:
        content_data: Content data from crawl
        
    Returns:
        Dictionary with local SEO analysis
    """
    logger.info("Analyzing local SEO signals")
    
    # Simple heuristic: check for local business keywords
    title = (content_data.get("title") or "").lower()
    meta_desc = (content_data.get("meta_description") or "").lower()
    h1_tags = [(h or "").lower() for h in content_data.get("h1_tags", [])]
    
    all_text = f"{title} {meta_desc} {' '.join(h1_tags)}"
    
    local_keywords = ["warszawa", "kraków", "wrocław", "poznań", "gdańsk", "łódź", 
                     "katowice", "polska", "poland", "city", "miasto", "lokalizacja",
                     "adres", "address", "tel", "phone", "kontakt", "contact"]
    
    is_local = any(keyword in all_text for keyword in local_keywords)
    
    recommendations = []
    if is_local:
        recommendations.append("✅ Wykryto lokalny biznes - rozważ dodanie:")
        recommendations.append("  • Schema.org LocalBusiness markup")
        recommendations.append("  • Profil Google My Business")
        recommendations.append("  • NAP (Name, Address, Phone) w stopce")
        recommendations.append("  • Mapę Google na stronie kontakt")
    else:
        recommendations.append("ℹ️ Brak wykrycia lokalnego biznesu")
    
    return {
        "is_local_business": is_local,
        "has_nap": False,  # Would need to parse for phone/address
        "has_schema_markup": False,  # Would need to parse HTML
        "recommendations": recommendations,
    }


async def analyze_performance(performance_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze Core Web Vitals and provide optimization recommendations.
    
    Args:
        performance_data: Lighthouse performance data
        
    Returns:
        Dictionary with performance analysis
    """
    logger.info("Analyzing performance data with AI")
    
    desktop = performance_data.get("desktop", {})
    mobile = performance_data.get("mobile", {})
    
    recommendations = []
    issues = []
    
    # Analyze TTFB
    ttfb_desktop = desktop.get("ttfb") or 0
    if ttfb_desktop > 800:
        issues.append("Bardzo wolny Time to First Byte (TTFB)")
        recommendations.append("❌ TTFB > 800ms - rozważ:")
        recommendations.append("  • Optymalizację serwera/hostingu")
        recommendations.append("  • CDN dla statycznych zasobów")
        recommendations.append("  • Caching po stronie serwera")
    elif ttfb_desktop > 600:
        recommendations.append("⚠️ TTFB > 600ms - można poprawić wydajność serwera")
    else:
        recommendations.append("✅ TTFB < 600ms - dobry czas odpowiedzi serwera")
    
    # Analyze LCP
    lcp_desktop = desktop.get("lcp") or 0
    if lcp_desktop > 2500:
        issues.append("Wolny Largest Contentful Paint (LCP)")
        recommendations.append("❌ LCP > 2.5s - optymalizuj:")
        recommendations.append("  • Kompresję i lazy loading obrazów")
        recommendations.append("  • Preload kluczowych zasobów")
        recommendations.append("  • Usunięcie render-blocking CSS/JS")
    elif lcp_desktop > 2000:
        recommendations.append("⚠️ LCP > 2.0s - rozważ optymalizację obrazów")
    else:
        recommendations.append("✅ LCP < 2.5s - dobry czas renderowania")
    
    # Analyze performance score
    perf_score = desktop.get("performance_score") or 0
    if perf_score < 50:
        recommendations.append("❌ Niski wynik wydajności - priorytetowa optymalizacja")
    elif perf_score < 80:
        recommendations.append("⚠️ Średni wynik wydajności - jest miejsce na poprawę")
    else:
        recommendations.append("✅ Dobry wynik wydajności")
    
    return {
        "issues": issues,
        "recommendations": recommendations,
        "ttfb_desktop": ttfb_desktop,
        "lcp_desktop": lcp_desktop,
        "performance_score": perf_score,
        "impact": "high" if len(issues) > 2 else "medium" if len(issues) > 0 else "low",
    }


async def analyze_competitive(
    main_site_data: Dict[str, Any],
    competitor_data: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compare website with competitors and provide insights.
    """
    logger.info(f"Analyzing competitive landscape ({len(competitor_data)} competitors)")
    
    if not competitor_data:
        return {
            "strengths": ["Brak danych konkurencji do porównania"],
            "weaknesses": [],
            "opportunities": ["Dodaj konkurentów aby uzyskać pełną analizę"],
            "recommendations": [],
            "competitors_analyzed": 0,
        }
    
    strengths = []
    weaknesses = []
    opportunities = []
    
    # Get main site performance
    main_lighthouse = main_site_data.get("lighthouse", {}).get("desktop", {})
    main_perf = main_lighthouse.get("performance_score") or 0
    
    # Compare with competitors
    better_count = 0
    worse_count = 0
    
    for comp in competitor_data:
        comp_lighthouse = comp.get("lighthouse", {})
        comp_perf = comp_lighthouse.get("performance_score") or 0
        
        if main_perf > comp_perf + 10:
            better_count += 1
        elif main_perf < comp_perf - 10:
            worse_count += 1
    
    if better_count > worse_count:
        strengths.append(f"✅ Lepsza wydajność niż {better_count} z {len(competitor_data)} konkurentów")
    elif worse_count > better_count:
        weaknesses.append(f"❌ Gorsza wydajność niż {worse_count} z {len(competitor_data)} konkurentów")
        opportunities.append("Zoptymalizuj wydajność aby dorównać konkurencji")
    else:
        strengths.append("Wydajność na poziomie konkurencji")
    
    opportunities.append("Przeprowadź szczegółową analizę treści konkurencji")
    opportunities.append("Sprawdź pozycjonowanie konkurentów na kluczowe frazy")
    
    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "opportunities": opportunities,
        "recommendations": opportunities[:3],
        "competitors_analyzed": len(competitor_data),
    }


async def analyze_single_page(page_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform deep AI analysis on a single page.
    """
    logger.info(f"Analyzing single page: {page_data.get('url')}")
    
    system_prompt = "Jesteś ekspertem SEO. Przeanalizuj dane strony i podaj konkretne uwagi."
    user_message = f"Dane strony: {page_data}"
    
    try:
        from app.services.ai_client import call_claude
        ai_response = await call_claude(user_message, system_prompt)
        return {"analysis": ai_response}
    except Exception as e:
        logger.error(f"Single page analysis failed: {e}")
        return {"analysis": "Analiza nieudana."}


async def generate_quick_wins(audit_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate quick wins based on audit results.
    """
    logger.info("Generating quick wins")
    results = audit_data.get("results", {})
    aggregated = aggregate_quick_wins_from_results(results, max_items=20)
    if aggregated:
        return aggregated

    crawl = results.get("crawl", {})
    lighthouse = results.get("lighthouse", {}).get("desktop", {})
    
    quick_wins = []
    
    # 1. Broken Links
    broken_links = crawl.get("links", {}).get("broken", 0)
    if broken_links > 0:
        quick_wins.append({
            "title": f"Napraw {broken_links} uszkodzonych linków",
            "description": "Wykryto linki prowadzące do stron 404. Ich naprawa poprawi indeksowanie i UX.",
            "impact": "high",
            "effort": "easy",
            "category": "SEO"
        })
        
    # 2. Performance - LCP
    lcp = lighthouse.get("lcp", 0)
    if lcp > 2500:
        quick_wins.append({
            "title": "Zoptymalizuj LCP (Largest Contentful Paint)",
            "description": f"Obecny wynik to {lcp}ms. Skup się na kompresji obrazów i priorytetyzacji zasobów.",
            "impact": "high",
            "effort": "medium",
            "category": "Performance"
        })
        
    # 3. Performance - TTFB
    ttfb = lighthouse.get("ttfb", 0)
    if ttfb > 600:
        quick_wins.append({
            "title": "Popraw czas odpowiedzi serwera (TTFB)",
            "description": f"Obecny wynik to {ttfb}ms. Rozważ wdrożenie cachowania lub zmianę hostingu.",
            "impact": "high",
            "effort": "medium",
            "category": "Performance"
        })
        
    # 4. SEO - Missing H1
    h1_count = crawl.get("h1_count", 0)
    if h1_count == 0:
        quick_wins.append({
            "title": "Dodaj brakujący nagłówek H1",
            "description": "Strona główna nie posiada nagłówka H1, co jest kluczowe dla hierarchii treści.",
            "impact": "high",
            "effort": "easy",
            "category": "SEO"
        })
        
    # 5. SEO - Missing ALT tags
    images_without_alt = crawl.get("images", {}).get("without_alt", 0)
    if images_without_alt > 0:
        quick_wins.append({
            "title": f"Uzupełnij ALT dla {images_without_alt} obrazów",
            "description": "Opisy alternatywne pomagają w pozycjonowaniu w Google Images i poprawiają dostępność.",
            "impact": "medium",
            "effort": "easy",
            "category": "Images"
        })

    # Fallback if no specific issues found
    if not quick_wins:
        quick_wins.append({
            "title": "Optymalizacja Meta Tagów",
            "description": "Regularnie odświeżaj tytuły i opisy, aby utrzymać wysoki współczynnik klikalności (CTR).",
            "impact": "medium",
            "effort": "easy",
            "category": "SEO"
        })
        
    return quick_wins


async def generate_alt_text(image_url: str) -> str:
    """
    Generate alt text for an image.
    """
    logger.info(f"Generating alt text for {image_url}")
    return "Opis obrazu"


async def get_industry_benchmarks(industry: str = "general") -> Dict[str, Any]:
    """
    Get industry benchmarks for comparison.
    """
    # Placeholder for real benchmark database
    benchmarks = {
        "general": {
            "performance": 70,
            "seo": 80,
            "accessibility": 85,
            "best_practices": 80,
            "lcp": 2500,
            "cls": 0.1,
            "ttfb": 600
        },
        "ecommerce": {
            "performance": 60,
            "seo": 85,
            "accessibility": 80,
            "best_practices": 75,
            "lcp": 3000,
            "cls": 0.15,
            "ttfb": 800
        },
        "saas": {
            "performance": 80,
            "seo": 90,
            "accessibility": 90,
            "best_practices": 90,
            "lcp": 1500,
            "cls": 0.05,
            "ttfb": 400
        }
    }
    return benchmarks.get(industry, benchmarks["general"])


def calculate_readability(text: str) -> Dict[str, Any]:
    """
    Calculate readability scores using textstat library.
    
    Args:
        text: Text content to analyze
        
    Returns:
        Dictionary with readability scores:
        - flesch_score: Flesch Reading Ease (0-100)
        - fog_index: Gunning Fog Index
        - interpretation: Human-readable interpretation
        
    TODO: Implement actual textstat integration
    """
    # Placeholder implementation
    return {
        "flesch_score": 0,
        "fog_index": 0,
        "interpretation": "Unknown",
    }


# ============================================================
# Contextual AI analysis functions (per-area, cross-tool)
# ============================================================

def _safe_json_parse(text: str) -> Dict[str, Any]:
    """Safely extract JSON from AI response text."""
    import json
    import re
    
    # Try direct parse first
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"Direct JSON parse failed: {str(e)[:100]}")
    
    # Try finding JSON block
    json_match = re.search(r'\{.*\}', text or '', re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError as e:
            logger.warning(f"JSON block regex parse failed: {str(e)[:100]}")
    
    # Try finding JSON array
    arr_match = re.search(r'\[.*\]', text or '', re.DOTALL)
    if arr_match:
        try:
            return {"items": json.loads(arr_match.group())}
        except json.JSONDecodeError as e:
            logger.warning(f"JSON array regex parse failed: {str(e)[:100]}")
    
    logger.warning(f"All JSON parse attempts failed. Returning empty dict. Text preview: {(text or '')[:200]}")
    return {}


async def _call_ai_context(
    system_prompt: str,
    user_prompt: str,
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Call AI and parse JSON response for context analysis."""
    try:
        global_block = format_global_snapshot_for_prompt(global_snapshot)
        if global_block:
            user_prompt = f"{global_block}\n{user_prompt}"

        response = await call_claude(user_prompt, system_prompt, max_tokens=20000)
        parsed = _safe_json_parse(response)
        parsed_keys = list(parsed.keys()) if isinstance(parsed, dict) else []
        response_preview = (response or "")[:200].replace("\n", " ")

        logger.info(
            "AI context parsed (response_len=%s, parsed_keys=%s, preview=%s)",
            len(response or ""),
            parsed_keys,
            response_preview,
        )

        if not parsed:
            logger.warning("AI context parse returned empty JSON")
            return {}

        expected_ai_keys = {
            "key_findings",
            "recommendations",
            "quick_wins",
            "priority_issues",
            "correlations",
            "synergies",
            "conflicts",
            "unified_recommendations",
            "immediate_actions",
            "short_term",
            "medium_term",
            "long_term",
            "overall_health",
            "health_score",
            "summary",
        }
        if set(parsed_keys).isdisjoint(expected_ai_keys):
            logger.warning(
                "AI context payload has unexpected schema (keys=%s). "
                "Downstream insights may be empty.",
                parsed_keys,
            )

        return parsed
    except AIUnavailableError as e:
        # Explicit, user-facing fallback: do not fabricate insights/quick-wins.
        logger.warning("AI unavailable for contextual analysis (reason=%s)", getattr(e, "reason", "unknown"))
        return {
            "ai_unavailable": True,
            "message": "AI jest chwilowo niedostepne. Ta sekcja nie zawiera wnioskow AI.",
            "reason": getattr(e, "reason", "unknown"),
            "key_findings": [],
            "recommendations": [],
            "quick_wins": [],
            "priority_issues": [],
        }
    except Exception as e:
        logger.error(f"AI context call failed: {e}")
        return {}

def _ai_meta(result: Dict[str, Any]) -> Dict[str, Any]:
    """Extract AI availability metadata (kept small for UI)."""
    if not isinstance(result, dict):
        return {}
    if not result.get("ai_unavailable"):
        return {}
    return {
        "ai_unavailable": True,
        "message": result.get("message") or "AI jest chwilowo niedostepne.",
        "reason": result.get("reason") or "unavailable",
    }


async def analyze_seo_context(
    crawl: Dict[str, Any],
    lighthouse: Dict[str, Any],
    senuto: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    SEO insights crossing data from SF + LH + Senuto.
    Returns key_findings, recommendations, quick_wins, priority_issues.
    """
    logger.info("Analyzing SEO context (cross-tool)")
    
    # Prepare compact data summary
    pages_count = crawl.get("pages_crawled", 0)
    broken_links = crawl.get("technical_seo", {}).get("broken_links", 0)
    missing_canonical = crawl.get("technical_seo", {}).get("missing_canonical", 0)
    noindex = crawl.get("technical_seo", {}).get("noindex_pages", 0)
    title = crawl.get("title", "")
    meta_desc = crawl.get("meta_description", "")
    
    # Extract sample URLs with issues
    all_pages = crawl.get("all_pages", [])
    broken_urls = [p.get("url") for p in all_pages if p.get("status_code", 0) >= 400][:5]
    noindex_urls = [p.get("url") for p in all_pages if "noindex" in p.get("meta_robots", "").lower()][:5]
    missing_canonical_urls = [p.get("url") for p in all_pages if not p.get("canonical") and p.get("status_code") == 200][:5]
    
    lh_desktop = lighthouse.get("desktop", {})
    seo_score = lh_desktop.get("seo_score", 0)
    
    senuto_vis = senuto.get("visibility", {})
    top3 = senuto_vis.get("statistics", {}).get("statistics", {}).get("top3", 0)
    top10 = senuto_vis.get("statistics", {}).get("statistics", {}).get("top10", 0)
    top50 = senuto_vis.get("statistics", {}).get("statistics", {}).get("top50", 0)

    schema_v2 = crawl.get("structured_data_v2", {}) or {}
    schema_readiness = (schema_v2.get("ai_crawler_readiness") or {}).get("score", 0)
    schema_missing_priority = schema_v2.get("missing_priority_types", []) or []
    render_nojs = crawl.get("render_nojs", {}) or {}
    soft_404 = crawl.get("soft_404", {}) or {}
    semantic_html = crawl.get("semantic_html", {}) or {}
    directives_hreflang = crawl.get("directives_hreflang", {}) or {}
    
    system_prompt = """Jesteś ekspertem SEO. Na podstawie danych ze Screaming Frog, Lighthouse i Senuto 
    przygotuj kontekstową analizę SEO. 
    
    ZASADY:
    1. Każda rekomendacja MUSI odwoływać się do konkretnego URL-a lub elementu strony jeśli jest dostępny.
    2. Nie powtarzaj ogólnych stwierdzeń typu "zoptymalizuj obrazy" - napisz które konkretnie.
    3. Nie powtarzaj wniosków z innych sekcji jeśli masz do nich wgląd.
    4. Dodatkowo przygotuj jeden fragment wyjaśnienia dla klienta nietechnicznego.
    
    Odpowiedz w JSON:
    {
        "key_findings": ["finding1", "finding2", ...],
        "recommendations": ["rec1", "rec2", ...],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["issue1", "issue2", ...],
        "technical_story_for_client": "1-3 zdania bez zargonu",
        "schema_recommendations": ["..."],
        "render_recommendations": ["..."]
    }"""
    
    user_prompt = f"""Dane SEO do analizy:
    - Stron: {pages_count}, Błędy 404: {broken_links} (przykłady: {broken_urls}), Brak canonical: {missing_canonical} (przykłady: {missing_canonical_urls}), Noindex: {noindex} (przykłady: {noindex_urls})
    - Title: {title[:100]}, Meta: {meta_desc[:100]}
    - LH SEO Score: {seo_score}
    - Senuto: TOP3={top3}, TOP10={top10}, TOP50={top50}
    - Ma sitemap: {crawl.get('has_sitemap', False)}
    - Schema.org: found={schema_v2.get('found', False)}, score={schema_readiness}, typy={schema_v2.get('types', [])[:8]}, brakujace priorytetowe={schema_missing_priority[:6]}
    - Render bez JS: status={render_nojs.get('status')}, score={render_nojs.get('score')}, issues={render_nojs.get('issues', [])[:5]}
    - Soft 404: count={soft_404.get('soft_404_count', 0)}, low_content={soft_404.get('low_content_count', 0)}
    - Semantic HTML: score={semantic_html.get('score')}, issues={semantic_html.get('issues', [])[:5]}
    - Dyrektywy/Hreflang: noindex={directives_hreflang.get('noindex_count', 0)}, nofollow={directives_hreflang.get('nofollow_count', 0)}, hreflang={directives_hreflang.get('hreflang_count', 0)}
    
    Priorytet: pokaz wpływ biznesowy i ryzyko utraty widocznosci.
    Przygotuj max 6 key_findings, 6 recommendations, 4 quick_wins, 4 priority_issues."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
        "technical_story_for_client": result.get("technical_story_for_client", ""),
        "schema_recommendations": result.get("schema_recommendations", []),
        "render_recommendations": result.get("render_recommendations", []),
    }


async def analyze_performance_context(
    lighthouse_desktop: Dict[str, Any],
    lighthouse_mobile: Dict[str, Any],
    crawl: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Performance insights from Lighthouse Desktop + Mobile + SF crawl.
    """
    logger.info("Analyzing performance context")
    
    # Extract LCP element if available
    lcp_element = lighthouse_desktop.get("lcp_element") or lighthouse_mobile.get("lcp_element") or "Nieznany"
    
    system_prompt = """Jesteś ekspertem wydajności stron (Web Performance). Porównaj Desktop i Mobile 
    i podaj wnioski. 
    
    ZASADY:
    1. Każda rekomendacja MUSI odwoływać się do konkretnego URL-a lub elementu strony.
    2. Zamiast "zoptymalizuj obrazy" napisz które konkretnie (np. obraz LCP).
    3. Nie powtarzaj wniosków z innych sekcji.
    
    Odpowiedz w JSON:
    {
        "key_findings": ["..."],
        "recommendations": ["..."],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["..."],
        "desktop_vs_mobile_comparison": "krótki tekst porównania"
    }"""
    
    user_prompt = f"""Desktop: perf={lighthouse_desktop.get('performance_score', 0)}, FCP={lighthouse_desktop.get('fcp', 0)}ms, LCP={lighthouse_desktop.get('lcp', 0)}ms, CLS={lighthouse_desktop.get('cls', 0)}, TBT={lighthouse_desktop.get('tbt', 0)}ms, TTFB={lighthouse_desktop.get('ttfb', 0)}ms
    Mobile: perf={lighthouse_mobile.get('performance_score', 0)}, FCP={lighthouse_mobile.get('fcp', 0)}ms, LCP={lighthouse_mobile.get('lcp', 0)}ms, CLS={lighthouse_mobile.get('cls', 0)}, TBT={lighthouse_mobile.get('tbt', 0)}ms, TTFB={lighthouse_mobile.get('ttfb', 0)}ms
    LCP Element: {lcp_element}
    Crawl: pages={crawl.get('pages_crawled', 0)}, avg_load_time={crawl.get('average_response_time', 'N/A')}
    
    Max 5 key_findings, 5 recommendations, 3 quick_wins."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
        "desktop_vs_mobile_comparison": result.get("desktop_vs_mobile_comparison", ""),
    }


async def analyze_visibility_context(
    senuto_visibility: Dict[str, Any],
    crawl: Dict[str, Any],
    *,
    ai_overviews_data: Optional[Dict[str, Any]] = None,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Visibility strategy from Senuto + crawl data.
    """
    logger.info("Analyzing visibility context")
    
    stats = senuto_visibility.get("statistics", {}).get("statistics", {})
    positions = senuto_visibility.get("positions", [])[:10]
    competitors = senuto_visibility.get("competitors", [])[:5]
    wins = senuto_visibility.get("wins", [])[:5]
    losses = senuto_visibility.get("losses", [])[:5]
    sections_subdomains = senuto_visibility.get("sections_subdomains", [])[:5]
    sections_urls = senuto_visibility.get("sections_urls", [])[:5]
    top3_numeric = _to_number(stats.get("top3", 0))
    top50_numeric = _to_number(stats.get("top50", 1), default=1.0)
    top3_share = round((top3_numeric / max(top50_numeric, 1.0)) * 100, 2) if stats else 0

    difficulties = []
    cpcs = []
    intents: Dict[str, int] = {}
    snippets_count = 0
    for position in positions:
        statistics = position.get("statistics", {}) or {}
        difficulty = statistics.get("difficulty")
        cpc = statistics.get("cpc")
        if isinstance(difficulty, (int, float)):
            difficulties.append(difficulty)
        if isinstance(cpc, (int, float)):
            cpcs.append(cpc)
        intent = str(statistics.get("intent") or "").strip().lower()
        if intent:
            intents[intent] = intents.get(intent, 0) + 1
        snippets = position.get("snippets") or []
        snippets_count += len(snippets) if isinstance(snippets, list) else 0
    avg_difficulty = round(sum(difficulties) / len(difficulties), 2) if difficulties else 0
    avg_cpc = round(sum(cpcs) / len(cpcs), 2) if cpcs else 0
    
    positions_summary = ", ".join([f"{p.get('keyword','')}(pos:{p.get('statistics',{}).get('position','')})" for p in positions[:5]])
    competitors_summary = ", ".join([f"{c.get('domain','')}(common:{c.get('common_keywords',0)})" for c in competitors])

    # Canonical AIO metrics should come from dedicated AIO payload (not generic visibility stats).
    aio_stats = (ai_overviews_data or {}).get("statistics", {}) if isinstance(ai_overviews_data, dict) else {}
    canonical_aio_keywords_with_domain = aio_stats.get("aio_keywords_with_domain_count", 0)
    canonical_aio_keywords_count = aio_stats.get("aio_keywords_count", 0)
    canonical_aio_avg_pos = aio_stats.get("aio_avg_pos", 0)
    
    system_prompt = """Jesteś ekspertem widoczności SEO. Na podstawie danych Senuto przygotuj strategię 
    widoczności. 
    
    ZASADY:
    1. Każda rekomendacja MUSI odwoływać się do konkretnej frazy lub URL-a.
    2. Nie powtarzaj ogólnych wniosków o wydajności (LCP itp.) - skup się na widoczności i słowach kluczowych.
    3. Komunikuj wyniki prostym językiem dla odbiorcy nietechnicznego.
    
    Odpowiedz w JSON:
    {
        "key_findings": ["..."],
        "recommendations": ["..."],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["..."],
        "keyword_opportunities": ["fraza 1 - opis szansy", ...],
        "competitor_gaps": ["gap 1", ...],
        "seasonality_strategy": "krótki tekst",
        "non_technical_summary": "2-4 zdania dla klienta/zarzadu",
        "next_steps_for_management": ["..."],
        "metrics_legend": [
            {"metric": "TOP3/TOP10/TOP50", "meaning": "...", "business_impact": "..."},
            {"metric": "Domain Rank", "meaning": "...", "business_impact": "..."},
            {"metric": "Ads Equivalent", "meaning": "...", "business_impact": "..."}
        ]
    }"""
    
    user_prompt = f"""Widoczność:
    - TOP3: {stats.get('top3', 0)}, TOP10: {stats.get('top10', 0)}, TOP50: {stats.get('top50', 0)}, udział TOP3/TOP50: {top3_share}%
    - Domain Rank: {stats.get('domain_rank', 0)}, Ads Equivalent: {stats.get('ads_equivalent', 0)}
    - AIO (canonical, z dedykowanego modułu): cytowania={canonical_aio_keywords_with_domain}, słowa={canonical_aio_keywords_count}, avg_pos={canonical_aio_avg_pos}
    - AIO (legacy z visibility stats): keywords={stats.get('aio_keywords_count', 0)}, avg_pos={stats.get('aio_avg_pos', 0)}, vis_loss={stats.get('aio_vis_loss_percentage', 0)}%
    - Śr. difficulty (sample): {avg_difficulty}, Śr. CPC (sample): {avg_cpc}, intents(sample): {intents}, snippets(sample): {snippets_count}
    - Top frazy: {positions_summary}
    - Wins (ostatnie wzrosty): {len(wins)} fraz
    - Losses (ostatnie spadki): {len(losses)} fraz
    - Konkurenci: {competitors_summary}
    - Sekcje/subdomeny: {", ".join([str(s.get("section", s.get("subdomain", ""))) for s in sections_subdomains])}
    - Top URL sekcji: {", ".join([str(u.get("url", ""))[:70] for u in sections_urls])}
    - Stron w crawlu: {crawl.get('pages_crawled', 0)}
    
    Uwzględnij wszystkie nowe metryki i zależności (AIO, difficulty, CPC, intencje, snippets, sekcje).
    WAŻNE: nie wolno Ci stwierdzić "brak AIO" jeśli AIO (canonical) ma cytowania>0 lub słowa>0.
    Max 6 key_findings, 6 recommendations, 5 quick_wins, 4 keyword_opportunities, 4 competitor_gaps, 4 next_steps_for_management."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
        "keyword_opportunities": result.get("keyword_opportunities", []),
        "competitor_gaps": result.get("competitor_gaps", []),
        "seasonality_strategy": result.get("seasonality_strategy", ""),
        "non_technical_summary": result.get("non_technical_summary", ""),
        "next_steps_for_management": result.get("next_steps_for_management", []),
        "metrics_legend": result.get("metrics_legend", []),
    }


async def analyze_ai_overviews_context(
    ai_overviews_data: Dict[str, Any],
    crawl: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    AI Overviews strategy from Senuto AIO data.
    """
    logger.info("Analyzing AI Overviews context")

    stats = ai_overviews_data.get("statistics", {}) or {}
    keywords = ai_overviews_data.get("keywords", []) or []
    competitors = ai_overviews_data.get("competitors", []) or []
    keyword_intents: Dict[str, int] = {}
    difficulty_values = []
    cpc_values = []
    for item in keywords[:50]:
        intent = str(item.get("intent") or "").strip().lower()
        if intent:
            keyword_intents[intent] = keyword_intents.get(intent, 0) + 1
        if isinstance(item.get("difficulty"), (int, float)):
            difficulty_values.append(item.get("difficulty"))
        if isinstance(item.get("cpc"), (int, float)):
            cpc_values.append(item.get("cpc"))
    avg_difficulty = round(sum(difficulty_values) / len(difficulty_values), 2) if difficulty_values else 0
    avg_cpc = round(sum(cpc_values) / len(cpc_values), 2) if cpc_values else 0

    keyword_preview = ", ".join(
        [
            f"{k.get('keyword', '')}(aio_pos:{k.get('best_aio_pos', '-')}, organic:{k.get('organic_pos', '-')})"
            for k in keywords[:5]
        ]
    )
    competitors_preview = ", ".join(
        [
            f"{c.get('domain', '')}(avg:{c.get('aio_avg_position', '-')}, common:{c.get('aio_common_words', 0)})"
            for c in competitors[:5]
        ]
    )

    system_prompt = """Jesteś ekspertem SEO AI Overviews. Przeanalizuj obecność domeny w AIO i podaj strategię.
    
    ZASADY:
    1. Każda rekomendacja MUSI odwoływać się do konkretnej frazy widocznej w AIO lub URL-a.
    2. Skup się na optymalizacji treści pod "Direct Answers" dla botów AI.
    
    Odpowiedz w JSON:
    {
        "key_findings": ["..."],
        "recommendations": ["..."],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["..."],
        "aio_opportunities": ["..."],
        "competitor_gaps": ["..."],
        "content_rewrite_targets": ["..."],
        "non_technical_summary": "2-4 zdania dla klienta nietechnicznego"
    }"""

    user_prompt = f"""Dane AI Overviews:
    - Cytowania w AIO: {stats.get('aio_keywords_with_domain_count', 0)}
    - Widoczne słowa AIO: {stats.get('aio_keywords_count', 0)}
    - Śr. pozycja AIO: {stats.get('aio_avg_pos', 0)}
    - Wzrosty/Spadki AIO: {stats.get('aio_wins_count', 0)}/{stats.get('aio_losses_count', 0)}
    - Utrata visibility: {stats.get('aio_vis_loss_percentage', 0)}%
    - Intent distribution (sample): {keyword_intents}
    - Śr. difficulty/CPC (sample): {avg_difficulty}/{avg_cpc}
    - Przykładowe frazy: {keyword_preview}
    - Konkurencja AIO: {competitors_preview}
    - Liczba stron z crawla: {crawl.get('pages_crawled', 0)}

    Uwzględnij kontekst nowych pól (intencja, difficulty, CPC, porównanie organic vs AIO).
    Przygotuj max 6 key_findings, 6 recommendations, 5 quick_wins, 4 aio_opportunities, 4 competitor_gaps."""

    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
        "aio_opportunities": result.get("aio_opportunities", []),
        "competitor_gaps": result.get("competitor_gaps", []),
        "content_rewrite_targets": result.get("content_rewrite_targets", []),
        "non_technical_summary": result.get("non_technical_summary", ""),
    }


async def analyze_backlinks_context(
    senuto_backlinks: Dict[str, Any],
    crawl: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Backlink profile analysis from Senuto.
    """
    logger.info("Analyzing backlinks context")
    
    stats = senuto_backlinks.get("statistics", {})
    link_attrs = senuto_backlinks.get("link_attributes", {})
    ref_domains = senuto_backlinks.get("ref_domains", [])[:5]
    anchors = senuto_backlinks.get("anchors", {})
    
    ref_summary = ", ".join([f"{d.get('ref_domain','')}({d.get('backlinks_count',0)} links)" for d in ref_domains])
    
    system_prompt = """Jesteś ekspertem link buildingu. Przeanalizuj profil linków i podaj strategię. 
    Odpowiedz w JSON:
    {
        "key_findings": ["..."],
        "recommendations": ["..."],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["..."],
        "toxic_risk_assessment": "ocena ryzyka toksycznych linków",
        "anchor_diversity_score": 0-100,
        "link_building_suggestions": ["sugestia 1", ...]
    }"""
    
    user_prompt = f"""Profil backlinków:
    - Stats: {stats}
    - Top ref domains: {ref_summary}
    - Link attributes: {link_attrs}
    - Stron w crawlu: {crawl.get('pages_crawled', 0)}
    
    Max 5 key_findings, 5 recommendations, 3 link_building_suggestions."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
        "toxic_risk_assessment": result.get("toxic_risk_assessment", ""),
        "anchor_diversity_score": result.get("anchor_diversity_score", 50),
        "link_building_suggestions": result.get("link_building_suggestions", []),
    }


async def analyze_links_context(
    crawl_data: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Internal linking analysis from crawl data.
    """
    logger.info("Analyzing internal links context")
    
    links = crawl_data.get("links", {})
    all_pages = crawl_data.get("all_pages", [])
    
    system_prompt = """Jesteś ekspertem linkowania wewnętrznego. Przeanalizuj dane i podaj wnioski. 
    Odpowiedz w JSON:
    {
        "key_findings": ["..."],
        "recommendations": ["..."],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["..."],
        "orphan_pages": ["url1", ...],
        "link_juice_distribution": "opis",
        "silo_suggestions": ["sugestia 1", ...]
    }"""
    
    user_prompt = f"""Linkowanie wewnętrzne:
    - Total links: {links.get('total', 0)}, Internal: {links.get('internal', 0)}, External: {links.get('external', 0)}, Broken: {links.get('broken', 0)}
    - Stron: {len(all_pages)}
    
    Max 5 key_findings, 5 recommendations, 3 silo_suggestions."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
        "orphan_pages": result.get("orphan_pages", []),
        "link_juice_distribution": result.get("link_juice_distribution", ""),
        "silo_suggestions": result.get("silo_suggestions", []),
    }


async def analyze_images_context(
    crawl_data: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Image optimization analysis from crawl data.
    """
    logger.info("Analyzing images context")
    
    images = crawl_data.get("images", {})
    
    system_prompt = """Jesteś ekspertem optymalizacji obrazów. Przeanalizuj dane i podaj wnioski. 
    Odpowiedz w JSON:
    {
        "key_findings": ["..."],
        "recommendations": ["..."],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["..."],
        "missing_alt_count": 0,
        "oversized_images": ["url1", ...],
        "format_suggestions": ["sugestia 1", ...]
    }"""
    
    user_prompt = f"""Obrazy:
    - Total: {images.get('total', 0)}, Without ALT: {images.get('without_alt', 0)}
    - Average size: {images.get('avg_size', 'N/A')}
    
    Max 5 key_findings, 5 recommendations, 3 format_suggestions."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
        "missing_alt_count": result.get("missing_alt_count", images.get("without_alt", 0)),
        "oversized_images": result.get("oversized_images", []),
        "format_suggestions": result.get("format_suggestions", []),
    }


async def analyze_cross_tool(
    all_results: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Cross-tool correlation analysis (for /ai-strategy page).
    """
    logger.info("Analyzing cross-tool correlations")
    
    crawl = all_results.get("crawl", {})
    lighthouse = all_results.get("lighthouse", {})
    senuto = all_results.get("senuto", {})
    
    desktop = lighthouse.get("desktop", {})
    
    system_prompt = """Jesteś strategiem SEO. Przeanalizuj korelacje między danymi z Screaming Frog, 
    Lighthouse i Senuto. Znajdź synergię i konflikty. Odpowiedz w JSON:
    {
        "correlations": ["korelacja 1: np. niski LCP wpływa na pozycje...", ...],
        "synergies": ["synergia 1", ...],
        "conflicts": ["konflikt 1", ...],
        "unified_recommendations": ["rec 1", ...]
    }"""
    
    senuto_visibility = senuto.get("visibility", {})
    senuto_stats = senuto_visibility.get("statistics", {}).get("statistics", {})
    aio_stats = senuto_visibility.get("ai_overviews", {}).get("statistics", {})
    backlinks_stats = senuto.get("backlinks", {}).get("statistics", {})

    user_prompt = f"""Dane cross-tool:
    SF: pages={crawl.get('pages_crawled',0)}, broken_links={crawl.get('technical_seo',{}).get('broken_links',0)}
    LH Desktop: perf={desktop.get('performance_score',0)}, seo={desktop.get('seo_score',0)}, LCP={desktop.get('lcp',0)}ms
    Senuto Visibility: TOP10={senuto_stats.get('top10',0)}, TOP3={senuto_stats.get('top3',0)}, domain_rank={senuto_stats.get('domain_rank',0)}, ads_eq={senuto_stats.get('ads_equivalent',0)}
    Senuto AIO: count={aio_stats.get('aio_keywords_count',0)}, avg_pos={aio_stats.get('aio_avg_pos',0)}, vis_loss={aio_stats.get('aio_vis_loss_percentage',0)}
    Senuto Backlinks: {backlinks_stats}
    
    Wykryj korelacje między technicznym SEO, Core Web Vitals, visibility/AIO i profilem linków.
    Przygotuj max 6 correlations, 4 synergies, 4 conflicts, 6 unified_recommendations."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "correlations": result.get("correlations", []),
        "synergies": result.get("synergies", []),
        "conflicts": result.get("conflicts", []),
        "unified_recommendations": result.get("unified_recommendations", []),
    }


async def generate_roadmap(
    all_results: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Priority roadmap generation from all data.
    """
    logger.info("Generating priority roadmap")
    
    system_prompt = """Jesteś strategiem SEO. Na podstawie wszystkich danych audytu stwórz roadmapę 
    priorytetów. Odpowiedz w JSON:
    {
        "immediate_actions": [{"title": "...", "description": "...", "impact": "high", "area": "SEO|Performance|Visibility|Backlinks"}],
        "short_term": [{"title": "...", "description": "...", "impact": "...", "area": "..."}],
        "medium_term": [{"title": "...", "description": "...", "impact": "...", "area": "..."}],
        "long_term": [{"title": "...", "description": "...", "impact": "...", "area": "..."}]
    }"""
    
    crawl = all_results.get("crawl", {})
    lh = all_results.get("lighthouse", {}).get("desktop", {})
    senuto_visibility = all_results.get("senuto", {}).get("visibility", {})
    senuto_stats = senuto_visibility.get("statistics", {}).get("statistics", {})
    aio_stats = senuto_visibility.get("ai_overviews", {}).get("statistics", {})
    
    user_prompt = f"""Podsumowanie audytu:
    - Stron: {crawl.get('pages_crawled',0)}, 404: {crawl.get('technical_seo',{}).get('broken_links',0)}
    - Perf: {lh.get('performance_score',0)}, SEO: {lh.get('seo_score',0)}, LCP: {lh.get('lcp',0)}ms
    - Visibility TOP10: {senuto_stats.get('top10',0)}, TOP3: {senuto_stats.get('top3',0)}, Domain Rank: {senuto_stats.get('domain_rank',0)}, Ads Eq: {senuto_stats.get('ads_equivalent',0)}
    - AIO: count={aio_stats.get('aio_keywords_count',0)}, avg_pos={aio_stats.get('aio_avg_pos',0)}, wins/losses={aio_stats.get('aio_wins_count',0)}/{aio_stats.get('aio_losses_count',0)}, vis_loss={aio_stats.get('aio_vis_loss_percentage',0)}
    - Missing canonical: {crawl.get('technical_seo',{}).get('missing_canonical',0)}
    - Images without alt: {crawl.get('images',{}).get('without_alt',0)}
    
    Zadbaj, żeby "immediate_actions" były granularne i gotowe do realizacji jako taski.
    Stwórz 5-8 pozycji na immediate, 5-8 short_term, 3-5 medium_term, 3-5 long_term."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "immediate_actions": result.get("immediate_actions", []),
        "short_term": result.get("short_term", []),
        "medium_term": result.get("medium_term", []),
        "long_term": result.get("long_term", []),
    }


async def generate_executive_summary(
    all_results: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executive summary from all data.
    """
    logger.info("Generating executive summary")
    
    system_prompt = """Jesteś strategiem SEO przygotowującym executive summary dla klienta. 
    Bądź zwięzły i konkretny. Odpowiedz w JSON:
    {
        "overall_health": "good|moderate|poor|critical",
        "health_score": 0-100,
        "summary": "1-3 zdania podsumowania",
        "strengths": ["mocna strona 1", ...],
        "critical_issues": ["problem 1", ...],
        "growth_potential": "tekst o potencjale wzrostu",
        "estimated_impact": "szacowany wpływ wdrożenia rekomendacji"
    }"""
    
    crawl = all_results.get("crawl", {})
    lh = all_results.get("lighthouse", {}).get("desktop", {})
    senuto_stats = all_results.get("senuto", {}).get("visibility", {}).get("statistics", {}).get("statistics", {})
    
    user_prompt = f"""Executive Summary danych:
    - Stron: {crawl.get('pages_crawled',0)}, Title: {crawl.get('title','N/A')[:60]}
    - Performance: {lh.get('performance_score',0)}/100, SEO: {lh.get('seo_score',0)}/100
    - Accessibility: {lh.get('accessibility_score',0)}/100
    - LCP: {lh.get('lcp',0)}ms, TTFB: {lh.get('ttfb',0)}ms
    - 404 errors: {crawl.get('technical_seo',{}).get('broken_links',0)}
    - Visibility: TOP3={senuto_stats.get('top3',0)}, TOP10={senuto_stats.get('top10',0)}, TOP50={senuto_stats.get('top50',0)}
    - Sitemap: {crawl.get('has_sitemap',False)}
    - HTTPS: {'Yes' if crawl.get('url','').startswith('https') else 'No'}
    
    Max 3 strengths, 3 critical_issues."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "overall_health": result.get("overall_health", "moderate"),
        "health_score": result.get("health_score", 50),
        "summary": result.get("summary", ""),
        "strengths": result.get("strengths", []),
        "critical_issues": result.get("critical_issues", []),
        "growth_potential": result.get("growth_potential", ""),
        "estimated_impact": result.get("estimated_impact", ""),
    }


async def analyze_security_context(
    security_data: Dict[str, Any],
    crawl: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Security context insights from security analysis and crawl data.
    Returns key_findings, recommendations, quick_wins, priority_issues.
    """
    logger.info("Analyzing security context")
    
    url = crawl.get("url", "")
    is_https = url.startswith("https")
    security_score = security_data.get("security_score", 0)
    mixed_content_count = security_data.get("mixed_content_count", 0)
    
    system_prompt = """Jesteś ekspertem bezpieczeństwa web. Na podstawie danych security 
    przygotuj kontekstową analizę bezpieczeństwa. Odpowiedz w JSON:
    {
        "key_findings": ["finding1", "finding2", ...],
        "recommendations": ["rec1", "rec2", ...],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["issue1", "issue2", ...]
    }"""
    
    user_prompt = f"""Dane Security do analizy:
    - HTTPS: {is_https}
    - Security Score: {security_score}/100
    - Mixed Content: {mixed_content_count} zasobów
    - URL: {url}
    
    Przygotuj max 5 key_findings, 5 recommendations, 3 quick_wins, 3 priority_issues."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
    }


async def analyze_ux_context(
    ux_data: Dict[str, Any],
    lighthouse: Dict[str, Any],
    *,
    global_snapshot: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    UX context insights from UX analysis and Lighthouse data.
    Returns key_findings, recommendations, quick_wins, priority_issues.
    """
    logger.info("Analyzing UX context")
    
    mobile_friendly = ux_data.get("mobile_friendly", False)
    accessibility_score = lighthouse.get("desktop", {}).get("accessibility_score", 0)
    best_practices = lighthouse.get("desktop", {}).get("best_practices_score", 0)
    
    system_prompt = """Jesteś ekspertem UX i dostępności (accessibility). Na podstawie danych UX 
    przygotuj kontekstową analizę doświadczenia użytkownika. Odpowiedz w JSON:
    {
        "key_findings": ["finding1", "finding2", ...],
        "recommendations": ["rec1", "rec2", ...],
        "quick_wins": [{"title": "...", "description": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
        "priority_issues": ["issue1", "issue2", ...]
    }"""
    
    user_prompt = f"""Dane UX do analizy:
    - Mobile Friendly: {mobile_friendly}
    - Accessibility Score: {accessibility_score}/100
    - Best Practices: {best_practices}/100
    
    Przygotuj max 5 key_findings, 5 recommendations, 3 quick_wins, 3 priority_issues."""
    
    result = await _call_ai_context(system_prompt, user_prompt, global_snapshot=global_snapshot)
    
    return {
        **_ai_meta(result),
        "key_findings": result.get("key_findings", []),
        "recommendations": result.get("recommendations", []),
        "quick_wins": result.get("quick_wins", []),
        "priority_issues": result.get("priority_issues", []),
    }


def validate_cross_module_consistency(ai_contexts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate consistency between modules (e.g., Visibility vs AI Overviews).
    Returns a consistency report with detected conflicts.
    """
    logger.info("Validating cross-module consistency")
    
    conflicts = []
    warnings = []
    
    # Check Visibility vs AI Overviews consistency
    visibility = ai_contexts.get("visibility", {})
    ai_overviews = ai_contexts.get("ai_overviews", {})
    
    if visibility and ai_overviews:
        # If AI Overviews has data, Visibility shouldn't say "no AIO"
        vis_findings = " ".join(visibility.get("key_findings", [])).lower()
        vis_issues = " ".join(visibility.get("priority_issues", [])).lower()
        
        aio_findings = " ".join(ai_overviews.get("key_findings", [])).lower()
        aio_keywords = ai_overviews.get("aio_opportunities", [])
        
        if ("brak" in vis_findings or "nie ma" in vis_findings or "brak" in vis_issues) and "aio" in vis_findings:
            if aio_keywords or len(aio_findings) > 50:
                conflicts.append({
                    "modules": ["visibility", "ai_overviews"],
                    "issue": "Visibility reports 'no AIO' but AI Overviews has data",
                    "severity": "medium"
                })
    
    # Check if contexts have contradictory priority_issues
    all_modules = ["seo", "performance", "visibility", "backlinks", "links", "images", "security", "ux"]
    priority_map = {}
    
    for module in all_modules:
        ctx = ai_contexts.get(module, {})
        issues = ctx.get("priority_issues", [])
        for issue in issues:
            issue_lower = issue.lower()
            if issue_lower not in priority_map:
                priority_map[issue_lower] = []
            priority_map[issue_lower].append(module)
    
    # Detect duplicated priority issues across modules (informational, not an error)
    for issue_text, modules in priority_map.items():
        if len(modules) > 1:
            warnings.append({
                "issue": f"Priority issue mentioned in multiple modules: {', '.join(modules)}",
                "text": issue_text,
                "severity": "info"
            })
    
    return {
        "conflicts": conflicts,
        "warnings": warnings,
        "is_consistent": len(conflicts) == 0,
        "checked_at": datetime.utcnow().isoformat()
    }
