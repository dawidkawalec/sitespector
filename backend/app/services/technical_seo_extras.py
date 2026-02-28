"""
Additional technical SEO data collection:
- Schema.org structured data (JSON-LD)
- Robots.txt full analysis
- Sitemap deep analysis
- Domain variant checks
- HTML semantic structure
"""

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = "SiteSpector/1.0"
TIMEOUT = httpx.Timeout(15.0, connect=5.0)


async def _fetch(client: httpx.AsyncClient, url: str) -> Optional[httpx.Response]:
    try:
        r = await client.get(url)
        return r
    except Exception as e:
        logger.debug("Fetch failed for %s: %s", url, e)
        return None


# ==========================================
# Structured Data (Schema.org JSON-LD)
# ==========================================

def _parse_structured_data(html_content: str) -> List[Dict]:
    """Extract JSON-LD structured data from HTML."""
    import json
    schemas = []
    try:
        # Find all <script type="application/ld+json"> blocks
        pattern = re.compile(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)
        matches = pattern.findall(html_content)
        for match in matches:
            try:
                data = json.loads(match.strip())
                if isinstance(data, list):
                    schemas.extend(data)
                else:
                    schemas.append(data)
            except json.JSONDecodeError:
                pass
    except Exception as e:
        logger.debug("Structured data parse error: %s", e)
    return schemas


def _analyze_schema(schemas: List[Dict]) -> Dict:
    """Analyze detected schemas and check completeness."""
    if not schemas:
        return {"found": False, "count": 0, "types": [], "schemas": []}

    schema_types = []
    schema_details = []

    # High-value schema types for different site types
    IMPORTANT_SCHEMAS = {
        "Organization", "LocalBusiness", "Product", "Article",
        "BlogPosting", "FAQPage", "BreadcrumbList", "WebSite",
        "Service", "Person", "Event", "Review", "ItemList",
        "HowTo", "VideoObject", "Recipe", "JobPosting",
    }

    for schema in schemas:
        stype = schema.get("@type", "Unknown")
        if isinstance(stype, list):
            stype = stype[0]
        schema_types.append(stype)

        # Check completeness
        issues = []
        if stype in ("Article", "BlogPosting"):
            for field in ("headline", "author", "datePublished", "image"):
                if not schema.get(field):
                    issues.append(f"Brak pola: {field}")
        elif stype == "Product":
            for field in ("name", "image", "description", "offers"):
                if not schema.get(field):
                    issues.append(f"Brak pola: {field}")
        elif stype == "LocalBusiness":
            for field in ("name", "address", "telephone"):
                if not schema.get(field):
                    issues.append(f"Brak pola: {field}")
        elif stype == "FAQPage":
            if not schema.get("mainEntity"):
                issues.append("Brak mainEntity (pytania i odpowiedzi)")

        schema_details.append({
            "type": stype,
            "is_important": stype in IMPORTANT_SCHEMAS,
            "issues": issues,
            "has_issues": bool(issues),
        })

    # Missing important schemas suggestions
    found_types = set(schema_types)
    missing_suggestions = []
    if "Organization" not in found_types and "LocalBusiness" not in found_types:
        missing_suggestions.append("Organization / LocalBusiness — identyfikacja firmy")
    if "BreadcrumbList" not in found_types:
        missing_suggestions.append("BreadcrumbList — nawigacja okruszkowa (breadcrumbs)")
    if "WebSite" not in found_types:
        missing_suggestions.append("WebSite — wyszukiwarka sitelinks w Google")

    return {
        "found": True,
        "count": len(schemas),
        "types": list(set(schema_types)),
        "schemas": schema_details,
        "has_issues": any(s["has_issues"] for s in schema_details),
        "missing_suggestions": missing_suggestions,
    }


# ==========================================
# Robots.txt Analysis
# ==========================================

def _parse_robots_txt(content: str, url: str) -> Dict:
    """Parse and analyze robots.txt content."""
    lines = content.splitlines()
    
    user_agents = {}
    current_ua = "*"
    sitemap_urls = []
    crawl_delay = None
    blocked_important = []
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        
        if ":" in line:
            directive, _, value = line.partition(":")
            directive = directive.strip().lower()
            value = value.strip()
            
            if directive == "user-agent":
                current_ua = value
                if current_ua not in user_agents:
                    user_agents[current_ua] = {"disallow": [], "allow": []}
            elif directive == "disallow" and value:
                user_agents.setdefault(current_ua, {"disallow": [], "allow": []})["disallow"].append(value)
                # Check if blocking important paths
                important_paths = ["/", "/sitemap", "/category", "/product", "/blog", "/shop"]
                for p in important_paths:
                    if value == p or value.startswith(p + "/"):
                        blocked_important.append({"ua": current_ua, "path": value})
            elif directive == "allow" and value:
                user_agents.setdefault(current_ua, {"disallow": [], "allow": []})["allow"].append(value)
            elif directive == "sitemap":
                if value not in sitemap_urls:
                    sitemap_urls.append(value)
            elif directive == "crawl-delay":
                try:
                    crawl_delay = float(value)
                except ValueError:
                    pass
    
    # Analysis
    googlebot_rules = user_agents.get("Googlebot", user_agents.get("*", {}))
    full_block = "/" in (googlebot_rules.get("disallow") or [])
    
    issues = []
    if full_block:
        issues.append("KRYTYCZNE: Cała strona zablokowana dla Google (Disallow: /)")
    if crawl_delay and crawl_delay > 2:
        issues.append(f"Crawl-delay: {crawl_delay}s — spowalnia indeksowanie")
    if not sitemap_urls:
        issues.append("Brak linku do sitemap.xml w robots.txt")
    
    return {
        "content": content[:5000],  # Store first 5000 chars
        "content_lines": len(lines),
        "user_agents": list(user_agents.keys()),
        "sitemap_urls": sitemap_urls,
        "crawl_delay": crawl_delay,
        "full_block": full_block,
        "blocked_important": blocked_important[:10],
        "googlebot_disallow": (googlebot_rules.get("disallow") or [])[:20],
        "googlebot_allow": (googlebot_rules.get("allow") or [])[:10],
        "issues": issues,
        "has_issues": bool(issues or blocked_important),
    }


# ==========================================
# Sitemap Deep Analysis
# ==========================================

def _analyze_sitemap_content(content: str, sitemap_url: str, crawled_urls: List[str]) -> Dict:
    """Parse sitemap XML and check coverage."""
    try:
        import xml.etree.ElementTree as ET
        # Remove XML namespaces for easier parsing
        content_clean = re.sub(r' xmlns="[^"]+"', '', content)
        content_clean = re.sub(r' xmlns:[a-z]+="[^"]+"', '', content_clean)
        
        root = ET.fromstring(content_clean)
        
        # Check if it's a sitemap index
        is_index = root.tag.lower() in ("sitemapindex",)
        
        urls = []
        lastmod_dates = []
        changefreq_values = []
        
        if is_index:
            # Sitemap index - collect sitemap URLs
            for sitemap in root.findall("sitemap"):
                loc = sitemap.findtext("loc", "").strip()
                if loc:
                    urls.append(loc)
            return {
                "is_index": True,
                "child_sitemaps": urls[:50],
                "child_count": len(urls),
                "url": sitemap_url,
            }
        else:
            # Regular sitemap
            for url_el in root.findall("url"):
                loc = url_el.findtext("loc", "").strip()
                if loc:
                    urls.append(loc)
                    lm = url_el.findtext("lastmod", "").strip()
                    if lm:
                        lastmod_dates.append(lm)
                    cf = url_el.findtext("changefreq", "").strip()
                    if cf:
                        changefreq_values.append(cf)
        
        # Coverage analysis
        crawled_set = set(u.rstrip("/") for u in crawled_urls)
        sitemap_set = set(u.rstrip("/") for u in urls)
        in_sitemap_not_crawled = list(sitemap_set - crawled_set)[:20]
        crawled_not_in_sitemap = list(crawled_set - sitemap_set)[:20]
        
        # Stale entries (lastmod > 1 year old)
        stale_entries = 0
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        for lm in lastmod_dates:
            try:
                # Handle various date formats
                lm_clean = lm[:10]  # Take date part only
                lm_dt = datetime.strptime(lm_clean, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                if (now - lm_dt).days > 365:
                    stale_entries += 1
            except Exception:
                pass
        
        return {
            "is_index": False,
            "url": sitemap_url,
            "total_urls": len(urls),
            "has_lastmod": bool(lastmod_dates),
            "stale_entries": stale_entries,
            "changefreq_values": list(set(changefreq_values)),
            "in_sitemap_not_crawled": in_sitemap_not_crawled,
            "in_sitemap_not_crawled_count": len(list(sitemap_set - crawled_set)),
            "crawled_not_in_sitemap": crawled_not_in_sitemap,
            "crawled_not_in_sitemap_count": len(list(crawled_set - sitemap_set)),
            "coverage_pct": round(len(crawled_set & sitemap_set) / max(len(sitemap_set), 1) * 100, 1),
        }
    except Exception as e:
        logger.debug("Sitemap parse error: %s", e)
        return {
            "url": sitemap_url,
            "parse_error": str(e),
            "total_urls": 0,
        }


# ==========================================
# Domain Variant Checks
# ==========================================

async def _check_domain_variants(base_url: str, client: httpx.AsyncClient) -> Dict:
    """Check www/non-www and http/https redirects."""
    parsed = urlparse(base_url)
    domain = parsed.netloc
    is_https = parsed.scheme == "https"
    
    has_www = domain.startswith("www.")
    bare_domain = domain.removeprefix("www.")
    
    variants = {
        "https_www": f"https://www.{bare_domain}/",
        "https_bare": f"https://{bare_domain}/",
        "http_www": f"http://www.{bare_domain}/",
        "http_bare": f"http://{bare_domain}/",
    }
    
    results = {}
    for name, url in variants.items():
        try:
            r = await _fetch(client, url)
            if r:
                final_url = str(r.url)
                results[name] = {
                    "url": url,
                    "status": r.status_code,
                    "final_url": final_url,
                    "redirects_to": final_url if final_url != url else None,
                }
            else:
                results[name] = {"url": url, "status": "error", "final_url": None}
        except Exception:
            results[name] = {"url": url, "status": "error", "final_url": None}
    
    # Determine canonical URL
    preferred_url = base_url.rstrip("/") + "/"
    
    # Issues
    issues = []
    http_www = results.get("http_www", {})
    http_bare = results.get("http_bare", {})
    
    if http_www.get("status") == 200 and not http_www.get("redirects_to"):
        issues.append("HTTP wersja www dostępna bez przekierowania do HTTPS")
    if http_bare.get("status") == 200 and not http_bare.get("redirects_to"):
        issues.append("HTTP wersja bez www dostępna bez przekierowania do HTTPS")
    
    return {
        "variants": results,
        "preferred_url": preferred_url,
        "is_https": is_https,
        "has_www": has_www,
        "bare_domain": bare_domain,
        "issues": issues,
    }


# ==========================================
# HTML Semantic Structure
# ==========================================

def _analyze_semantic_html(html_content: str) -> Dict:
    """Check for proper HTML5 semantic elements usage."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        elements = {}
        semantic_tags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer', 'figure', 'figcaption']
        
        for tag in semantic_tags:
            found = soup.find_all(tag)
            elements[tag] = len(found)
        
        issues = []
        recommendations = []
        
        if not elements.get('header'):
            issues.append("Brak elementu <header>")
            recommendations.append("Dodaj <header> do nagłówka strony (logo, nawigacja)")
        
        if not elements.get('nav'):
            issues.append("Brak elementu <nav>")
            recommendations.append("Owiń nawigację główną w <nav>")
        
        if not elements.get('main'):
            issues.append("Brak elementu <main>")
            recommendations.append("Owiń treść główną w <main> (pominięty przez screen readers)")
        
        if not elements.get('footer'):
            issues.append("Brak elementu <footer>")
        
        main_count = elements.get('main', 0)
        if main_count > 1:
            issues.append(f"Wiele elementów <main> ({main_count}) — powinien być dokładnie jeden")
        
        nav_count = elements.get('nav', 0)
        if nav_count > 3:
            issues.append(f"Zbyt wiele elementów <nav> ({nav_count}) — zredukuj do głównych sekcji nawigacji")
        
        # Check for div-soup (no semantic elements at all)
        divs_count = len(soup.find_all('div'))
        semantic_total = sum(elements.values())
        
        if divs_count > 20 and semantic_total < 3:
            issues.append(f"Strona używa głównie <div> ({divs_count} elementów) bez semantycznych tagów HTML5")
        
        score = max(0, 100 - len(issues) * 20)
        
        return {
            "elements": elements,
            "issues": issues,
            "recommendations": recommendations,
            "has_issues": bool(issues),
            "score": score,
            "divs_count": divs_count,
            "semantic_total": semantic_total,
        }
    except Exception as e:
        logger.debug("Semantic HTML analysis error: %s", e)
        return {"elements": {}, "issues": [], "has_issues": False, "score": 50}


# ==========================================
# Main Orchestrator
# ==========================================

async def collect_technical_extras(
    url: str,
    crawled_urls: Optional[List[str]] = None,
    sitemap_url: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Collect all additional technical SEO data in parallel.
    
    Returns dict with keys:
    - structured_data: Schema.org analysis
    - robots_txt: Robots.txt analysis
    - sitemap_analysis: Sitemap deep analysis
    - domain_config: Domain variant checks
    - semantic_html: HTML semantic structure
    """
    ua = (user_agent or "").strip() or DEFAULT_USER_AGENT
    headers = {"User-Agent": ua}
    
    origin = _get_origin(url)
    result = {
        "structured_data": None,
        "robots_txt": None,
        "sitemap_analysis": None,
        "domain_config": None,
        "semantic_html": None,
    }
    
    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=TIMEOUT,
        headers=headers,
    ) as client:
        tasks = {
            "homepage": _fetch(client, url),
            "robots": _fetch(client, f"{origin}/robots.txt"),
        }
        
        responses = {}
        for name, coro in tasks.items():
            try:
                responses[name] = await coro
            except Exception as e:
                logger.debug("Failed to fetch %s: %s", name, e)
                responses[name] = None
        
        # --- Structured data ---
        homepage_resp = responses.get("homepage")
        if homepage_resp and homepage_resp.status_code == 200:
            try:
                html = homepage_resp.text
                schemas = _parse_structured_data(html)
                result["structured_data"] = _analyze_schema(schemas)
                result["semantic_html"] = _analyze_semantic_html(html)
            except Exception as e:
                logger.warning("Structured data / semantic HTML analysis failed: %s", e)
        
        # --- Robots.txt ---
        robots_resp = responses.get("robots")
        if robots_resp and robots_resp.status_code == 200:
            try:
                result["robots_txt"] = _parse_robots_txt(robots_resp.text, url)
            except Exception as e:
                logger.warning("Robots.txt analysis failed: %s", e)
        
        # --- Sitemap analysis ---
        sitemap_to_analyze = sitemap_url
        if not sitemap_to_analyze:
            sitemap_to_analyze = f"{origin}/sitemap.xml"
        
        try:
            sm_resp = await _fetch(client, sitemap_to_analyze)
            if sm_resp and sm_resp.status_code == 200:
                result["sitemap_analysis"] = _analyze_sitemap_content(
                    sm_resp.text,
                    sitemap_to_analyze,
                    crawled_urls or [],
                )
        except Exception as e:
            logger.warning("Sitemap analysis failed: %s", e)
        
        # --- Domain variants ---
        try:
            result["domain_config"] = await _check_domain_variants(url, client)
        except Exception as e:
            logger.warning("Domain variant check failed: %s", e)
    
    return result


def _get_origin(url: str) -> str:
    """Return scheme://host for URL."""
    p = urlparse(url)
    if not p.scheme or not p.netloc:
        return url.rstrip("/")
    return f"{p.scheme}://{p.netloc}".rstrip("/")
