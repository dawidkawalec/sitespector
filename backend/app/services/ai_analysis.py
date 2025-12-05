"""
AI-powered analysis services using Claude.
"""

import logging
from typing import Dict, Any, List
from app.services.ai_client import call_claude

logger = logging.getLogger(__name__)


async def analyze_content(content_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze website content quality and provide recommendations.
    
    Args:
        content_data: Content data from crawl
        
    Returns:
        Dictionary with content analysis and recommendations
    """
    logger.info("Analyzing content with AI")
    
    recommendations = []
    quality_score = 100
    
    # Analyze title
    title = content_data.get("title", "")
    title_length = content_data.get("title_length", 0)
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
    meta_desc = content_data.get("meta_description", "")
    meta_length = content_data.get("meta_description_length", 0)
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
    h1_count = content_data.get("h1_count", 0)
    if h1_count == 0:
        recommendations.append("❌ Brak tagu H1 - dodaj główny nagłówek strony")
        quality_score -= 15
    elif h1_count > 1:
        recommendations.append(f"⚠️ Zbyt wiele tagów H1 ({h1_count}) - użyj tylko jednego H1 na stronę")
        quality_score -= 10
    else:
        recommendations.append("✅ Strona ma jeden tag H1")
    
    # Analyze images
    total_images = content_data.get("total_images", 0)
    images_without_alt = content_data.get("images_without_alt", 0)
    if images_without_alt > 0:
        recommendations.append(f"⚠️ {images_without_alt} z {total_images} obrazów bez atrybutu ALT - dodaj opisy dla SEO i dostępności")
        quality_score -= min(15, images_without_alt * 2)
    elif total_images > 0:
        recommendations.append(f"✅ Wszystkie {total_images} obrazów mają atrybut ALT")
    
    # Word count
    word_count = content_data.get("word_count", 0)
    if word_count < 300:
        recommendations.append("⚠️ Za mało treści na stronie - dodaj więcej wartościowej treści (min. 300 słów)")
        quality_score -= 10
    else:
        recommendations.append(f"✅ Strona zawiera {word_count} słów")
    
    return {
        "quality_score": max(0, quality_score),
        "readability_score": 75,  # Mock for now
        "recommendations": recommendations,
        "word_count": word_count,
        "has_title": bool(title),
        "has_meta_description": bool(meta_desc),
        "has_h1": h1_count > 0,
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
    title = content_data.get("title", "").lower()
    meta_desc = content_data.get("meta_description", "").lower()
    h1_tags = [h.lower() for h in content_data.get("h1_tags", [])]
    
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
    ttfb_desktop = desktop.get("ttfb", 0)
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
    lcp_desktop = desktop.get("lcp", 0)
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
    perf_score = desktop.get("performance_score", 0)
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
    
    Args:
        main_site_data: Main website data
        competitor_data: List of competitor data
        
    Returns:
        Dictionary with competitive analysis
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
    main_perf = main_lighthouse.get("performance_score", 0)
    
    # Compare with competitors
    better_count = 0
    worse_count = 0
    
    for comp in competitor_data:
        comp_lighthouse = comp.get("lighthouse", {})
        comp_perf = comp_lighthouse.get("performance_score", 0)
        
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

