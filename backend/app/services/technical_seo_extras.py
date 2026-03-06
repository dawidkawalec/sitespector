"""
Additional technical SEO data collection:
- Schema.org structured data (JSON-LD)
- Robots.txt full analysis
- Sitemap deep analysis
- Domain variant checks
- HTML semantic structure
"""

import logging
import re
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = "SiteSpector/1.0"
TIMEOUT = httpx.Timeout(15.0, connect=5.0)

SCHEMA_RULES: Dict[str, Dict[str, List[str]]] = {
    "Organization": {
        "required": ["name"],
        "recommended": ["url", "logo", "sameAs", "contactPoint"],
    },
    "LocalBusiness": {
        "required": ["name", "address", "telephone"],
        "recommended": ["url", "openingHoursSpecification", "sameAs", "areaServed"],
    },
    "WebSite": {
        "required": ["name", "url"],
        "recommended": ["potentialAction"],
    },
    "BreadcrumbList": {
        "required": ["itemListElement"],
        "recommended": [],
    },
    "JobPosting": {
        "required": ["title", "datePosted", "hiringOrganization", "jobLocation"],
        "recommended": ["validThrough", "baseSalary", "description", "employmentType"],
    },
    "Service": {
        "required": ["name"],
        "recommended": ["description", "serviceType", "areaServed", "provider"],
    },
    "FAQPage": {
        "required": ["mainEntity"],
        "recommended": [],
    },
    "BlogPosting": {
        "required": ["headline", "author", "datePublished"],
        "recommended": ["image", "dateModified", "publisher"],
    },
    "Article": {
        "required": ["headline", "author", "datePublished"],
        "recommended": ["image", "dateModified", "publisher"],
    },
    "VideoObject": {
        "required": ["name", "thumbnailUrl", "uploadDate"],
        "recommended": ["description", "duration"],
    },
    "Event": {
        "required": ["name", "startDate", "location"],
        "recommended": ["eventStatus", "offers"],
    },
    "ContactPoint": {
        "required": ["contactType"],
        "recommended": ["telephone", "email", "availableLanguage"],
    },
    "AggregateRating": {
        "required": ["ratingValue", "reviewCount"],
        "recommended": ["bestRating", "worstRating"],
    },
    "Review": {
        "required": ["reviewBody", "author"],
        "recommended": ["reviewRating", "datePublished"],
    },
}

SCHEMA_PRIORITY: Dict[str, str] = {
    "Organization": "critical",
    "LocalBusiness": "critical",
    "WebSite": "high",
    "BreadcrumbList": "high",
    "JobPosting": "high",
    "Service": "high",
    "FAQPage": "medium",
    "BlogPosting": "medium",
    "Article": "medium",
    "VideoObject": "medium",
    "Event": "medium",
    "ContactPoint": "medium",
    "AggregateRating": "low",
    "Review": "low",
}

SCHEMA_RECOMMENDATIONS: Dict[str, str] = {
    "Organization": "identyfikacja firmy i sygnał wiarygodności",
    "LocalBusiness": "sygnał lokalny i dane kontaktowe firmy",
    "WebSite": "lepsza identyfikacja marki oraz SearchAction",
    "BreadcrumbList": "czytelna struktura informacji w SERP",
    "JobPosting": "większa widoczność ofert pracy",
    "Service": "lepsze rozumienie oferty usługowej",
    "FAQPage": "szansa na rich results Q&A",
    "BlogPosting": "lepszy kontekst treści eksperckich",
    "Article": "lepsza klasyfikacja treści informacyjnych",
    "VideoObject": "lepsza widoczność treści video",
    "Event": "widoczność wydarzen i webinarow",
    "ContactPoint": "precyzyjna komunikacja kanałów kontaktu",
    "AggregateRating": "rozszerzone wyniki z ocenami",
    "Review": "czytelna warstwa opinii",
}


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

def _normalize_schema_type(value: Any) -> List[str]:
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return []


def _flatten_schema_nodes(payload: Any) -> List[Dict[str, Any]]:
    nodes: List[Dict[str, Any]] = []

    def _walk(node: Any) -> None:
        if isinstance(node, list):
            for item in node:
                _walk(item)
            return
        if not isinstance(node, dict):
            return

        node_types = _normalize_schema_type(node.get("@type"))
        if node_types:
            node_copy = dict(node)
            node_copy["_normalized_types"] = node_types
            nodes.append(node_copy)

        graph_nodes = node.get("@graph")
        if isinstance(graph_nodes, list):
            for graph_node in graph_nodes:
                _walk(graph_node)

        for key, value in node.items():
            if key in {"@graph", "@context"}:
                continue
            if isinstance(value, (dict, list)):
                _walk(value)

    _walk(payload)
    return nodes


def _parse_structured_data(html_content: str) -> List[Dict[str, Any]]:
    """Extract JSON-LD structured data from HTML, including @graph payloads."""
    import json

    nodes: List[Dict[str, Any]] = []
    try:
        pattern = re.compile(
            r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            re.DOTALL | re.IGNORECASE,
        )
        for block in pattern.findall(html_content):
            raw_block = (block or "").strip()
            if not raw_block:
                continue
            sanitized = re.sub(r"^\s*<!--|-->\s*$", "", raw_block, flags=re.MULTILINE).strip()
            if not sanitized:
                continue
            try:
                parsed = json.loads(sanitized)
            except json.JSONDecodeError:
                continue
            nodes.extend(_flatten_schema_nodes(parsed))
    except Exception as e:
        logger.debug("Structured data parse error: %s", e)
    return nodes


def _schema_field_missing(node: Dict[str, Any], field: str) -> bool:
    value = node.get(field)
    if value is None:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    if isinstance(value, list) and not value:
        return True
    if isinstance(value, dict) and not value:
        return True
    return False


def _analyze_schema_v2(nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not nodes:
        return {
            "found": False,
            "total_items": 0,
            "types": [],
            "items": [],
            "issues": [],
            "has_issues": False,
            "missing_priority_types": [
                "Organization / LocalBusiness — identyfikacja firmy i wiarygodnosc",
                "WebSite — identyfikacja strony i SearchAction",
                "BreadcrumbList — lepsza nawigacja i prezentacja w SERP",
            ],
            "ai_crawler_readiness": {
                "score": 0,
                "status": "poor",
                "notes": ["Brak danych Schema.org utrudnia rozumienie tresci przez crawlery AI."],
            },
        }

    all_types: Set[str] = set()
    issues: List[Dict[str, Any]] = []
    items: List[Dict[str, Any]] = []

    for idx, node in enumerate(nodes):
        types = node.get("_normalized_types") or _normalize_schema_type(node.get("@type"))
        if not types:
            continue
        primary_type = types[0]
        for t in types:
            all_types.add(t)

        rule = SCHEMA_RULES.get(primary_type, {"required": [], "recommended": []})
        missing_required = [f for f in rule["required"] if _schema_field_missing(node, f)]
        missing_recommended = [f for f in rule["recommended"] if _schema_field_missing(node, f)]
        severity = SCHEMA_PRIORITY.get(primary_type, "low")

        node_issues: List[str] = []
        for field in missing_required:
            message = f"Brak wymaganego pola: {field}"
            node_issues.append(message)
            issues.append(
                {
                    "type": primary_type,
                    "severity": "high" if severity in {"critical", "high"} else "medium",
                    "message": message,
                    "item_index": idx,
                }
            )
        for field in missing_recommended:
            message = f"Brak rekomendowanego pola: {field}"
            node_issues.append(message)
            issues.append(
                {
                    "type": primary_type,
                    "severity": "medium" if severity in {"critical", "high"} else "low",
                    "message": message,
                    "item_index": idx,
                }
            )

        items.append(
            {
                "type": primary_type,
                "types": types,
                "priority": severity,
                "is_important": primary_type in SCHEMA_PRIORITY,
                "missing_required": missing_required,
                "missing_recommended": missing_recommended,
                "issues": node_issues,
                "has_issues": bool(node_issues),
            }
        )

    found_types = set(all_types)
    missing_priority_types: List[str] = []
    for schema_type, reason in SCHEMA_RECOMMENDATIONS.items():
        if schema_type not in found_types and SCHEMA_PRIORITY.get(schema_type) in {"critical", "high"}:
            missing_priority_types.append(f"{schema_type} — {reason}")

    readiness_score = 100
    if not found_types:
        readiness_score = 0
    else:
        if "Organization" not in found_types and "LocalBusiness" not in found_types:
            readiness_score -= 25
        if "WebSite" not in found_types:
            readiness_score -= 15
        if "BreadcrumbList" not in found_types:
            readiness_score -= 10
        high_issues = sum(1 for issue in issues if issue.get("severity") == "high")
        medium_issues = sum(1 for issue in issues if issue.get("severity") == "medium")
        readiness_score -= min(40, high_issues * 8 + medium_issues * 3)
    readiness_score = max(0, min(100, readiness_score))

    if readiness_score >= 75:
        readiness_status = "good"
    elif readiness_score >= 45:
        readiness_status = "partial"
    else:
        readiness_status = "poor"

    readiness_notes = []
    if readiness_status == "good":
        readiness_notes.append("Schema.org jest obecne i zapewnia dobry kontekst dla Google oraz crawlerow AI.")
    elif readiness_status == "partial":
        readiness_notes.append("Schema.org jest czesciowo wdrozone, ale wystepuja luki ograniczajace potencjal rich results.")
    else:
        readiness_notes.append("Schema.org wymaga pilnej rozbudowy, aby poprawic zrozumienie tresci przez wyszukiwarki i modele AI.")
    if missing_priority_types:
        readiness_notes.append("Brakuje kluczowych typow: " + ", ".join(s.split(" — ")[0] for s in missing_priority_types[:4]))

    return {
        "found": bool(items),
        "total_items": len(items),
        "types": sorted(found_types),
        "items": items,
        "issues": issues,
        "has_issues": bool(issues),
        "missing_priority_types": missing_priority_types,
        "ai_crawler_readiness": {
            "score": readiness_score,
            "status": readiness_status,
            "notes": readiness_notes,
        },
    }


def _to_legacy_schema(v2: Dict[str, Any]) -> Dict[str, Any]:
    if not v2.get("found"):
        return {"found": False, "count": 0, "types": [], "schemas": [], "has_issues": False, "missing_suggestions": v2.get("missing_priority_types", [])}
    schemas = []
    for item in v2.get("items", []):
        schemas.append(
            {
                "type": item.get("type", "Unknown"),
                "is_important": bool(item.get("is_important")),
                "issues": item.get("issues", []),
                "has_issues": bool(item.get("has_issues")),
                "priority": item.get("priority", "low"),
            }
        )
    return {
        "found": True,
        "count": int(v2.get("total_items", 0)),
        "types": v2.get("types", []),
        "schemas": schemas,
        "has_issues": bool(v2.get("has_issues")),
        "missing_suggestions": v2.get("missing_priority_types", []),
        "ai_crawler_readiness": v2.get("ai_crawler_readiness", {}),
    }


def _analyze_schema(schemas: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Legacy schema payload kept for backwards compatibility."""
    return _to_legacy_schema(_analyze_schema_v2(schemas))


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
# Render without JavaScript
# ==========================================

def _analyze_render_nojs(html_content: str) -> Dict[str, Any]:
    """Heuristic assessment of content availability when JavaScript is disabled."""
    try:
        soup = BeautifulSoup(html_content or "", "html.parser")
        scripts = soup.find_all("script")
        noscript = soup.find_all("noscript")
        anchors = soup.find_all("a")
        text_content = " ".join(soup.stripped_strings)
        text_length = len(text_content)

        main_tag = soup.find("main")
        body = soup.body
        body_children = body.find_all(recursive=False) if body else []
        likely_spa_shell = len(body_children) <= 2 and len(scripts) >= 10 and text_length < 500

        score = 100
        issues: List[str] = []
        recommendations: List[str] = []

        if text_length < 400:
            score -= 35
            issues.append("Bardzo malo tresci w renderze bez JS")
            recommendations.append("Zapewnij SSR/SSG lub pre-render kluczowych tresci.")
        elif text_length < 900:
            score -= 15
            issues.append("Niska ilosc tresci dostepnej bez JS")

        if len(anchors) < 5:
            score -= 15
            issues.append("Mala liczba linkow nawigacyjnych bez JS")
            recommendations.append("Zadbaj o semantyczna nawigacje HTML dostepna bez JS.")

        if not main_tag:
            score -= 10
            issues.append("Brak elementu <main> w renderze HTML")

        if likely_spa_shell:
            score -= 25
            issues.append("Render przypomina shell SPA z silna zaleznoscia od JS")
            recommendations.append("Wdróz server-side rendering dla sekcji krytycznych SEO.")

        if len(noscript) == 0 and len(scripts) > 12:
            score -= 8
            issues.append("Brak komunikatu fallback <noscript> przy wysokiej liczbie skryptow")

        score = max(0, min(100, score))
        status = "good" if score >= 75 else "partial" if score >= 45 else "poor"
        if status == "poor":
            recommendations.append("Przetestuj kluczowe URL-e w trybie bez JS i popraw dostepnosc tresci krytycznych.")

        return {
            "score": score,
            "status": status,
            "text_length": text_length,
            "scripts_count": len(scripts),
            "noscript_count": len(noscript),
            "links_count": len(anchors),
            "has_main": bool(main_tag),
            "likely_spa_shell": likely_spa_shell,
            "issues": issues,
            "recommendations": recommendations,
            "has_issues": bool(issues),
        }
    except Exception as e:
        logger.debug("Render no-JS analysis failed: %s", e)
        return {
            "score": 50,
            "status": "partial",
            "issues": ["Nie udalo sie przeanalizowac renderu bez JavaScript"],
            "recommendations": [],
            "has_issues": True,
        }


# ==========================================
# Soft 404 and low-content pages
# ==========================================

def _analyze_soft_404(all_pages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Detect probable soft-404 pages among HTTP 200 responses."""
    if not all_pages:
        return {"has_data": False, "soft_404_count": 0, "low_content_count": 0, "samples": []}

    patterns = [
        "404",
        "not found",
        "page not found",
        "nie znaleziono",
        "strona nie istnieje",
        "error 404",
        "oops",
    ]

    soft_candidates: List[Dict[str, Any]] = []
    low_content_pages: List[Dict[str, Any]] = []

    for page in all_pages:
        if int(page.get("status_code") or 0) != 200:
            continue
        title = (page.get("title") or "").strip()
        h1 = (page.get("h1") or "").strip()
        text = f"{title} {h1}".lower()
        word_count = int(page.get("word_count") or 0)
        url = page.get("url", "")

        matched = any(pattern in text for pattern in patterns)
        is_low_content = word_count < 120
        if is_low_content:
            low_content_pages.append(
                {
                    "url": url,
                    "title": title[:80],
                    "word_count": word_count,
                }
            )
        if matched and (word_count < 250 or "404" in url):
            soft_candidates.append(
                {
                    "url": url,
                    "title": title[:100],
                    "h1": h1[:100],
                    "word_count": word_count,
                    "reason": "Wzorzec strony bledu przy statusie 200",
                }
            )

    issues: List[str] = []
    if soft_candidates:
        issues.append(f"Wykryto prawdopodobne soft 404: {len(soft_candidates)}")
    if len(low_content_pages) > 20:
        issues.append(f"Wysoka liczba stron low-content (<120 slow): {len(low_content_pages)}")

    return {
        "has_data": True,
        "soft_404_count": len(soft_candidates),
        "soft_404_samples": soft_candidates[:30],
        "low_content_count": len(low_content_pages),
        "low_content_samples": low_content_pages[:30],
        "has_issues": bool(issues),
        "issues": issues,
    }


# ==========================================
# Directives / hreflang / nofollow
# ==========================================

def _analyze_directives_hreflang(sf_raw_tabs: Optional[Dict[str, Any]], all_pages: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    directives_rows = []
    hreflang_rows = []
    if isinstance(sf_raw_tabs, dict):
        raw_directives = sf_raw_tabs.get("directives")
        raw_hreflang = sf_raw_tabs.get("hreflang")
        if isinstance(raw_directives, list):
            directives_rows = raw_directives
        if isinstance(raw_hreflang, list):
            hreflang_rows = raw_hreflang

    pages = all_pages or []
    noindex_count = 0
    nofollow_count = 0
    x_robots_count = 0
    sample_directives: List[Dict[str, Any]] = []

    if directives_rows:
        for row in directives_rows:
            meta_robots = str(row.get("Meta Robots 1") or "").lower()
            x_robots = str(row.get("X-Robots-Tag 1") or "").lower()
            if "noindex" in meta_robots or "noindex" in x_robots:
                noindex_count += 1
            if "nofollow" in meta_robots or "nofollow" in x_robots:
                nofollow_count += 1
            if x_robots:
                x_robots_count += 1
            if meta_robots or x_robots:
                sample_directives.append(
                    {
                        "url": row.get("Address", ""),
                        "meta_robots": row.get("Meta Robots 1", ""),
                        "x_robots_tag": row.get("X-Robots-Tag 1", ""),
                    }
                )
    else:
        for page in pages:
            meta_robots = str(page.get("meta_robots") or "").lower()
            x_robots = str(page.get("x_robots_tag") or "").lower()
            if "noindex" in meta_robots or "noindex" in x_robots:
                noindex_count += 1
            if "nofollow" in meta_robots or "nofollow" in x_robots:
                nofollow_count += 1
            if x_robots:
                x_robots_count += 1

    hreflang_count = 0
    hreflang_empty = 0
    hreflang_samples: List[Dict[str, Any]] = []
    if hreflang_rows:
        for row in hreflang_rows:
            hreflang_value = ""
            for key, value in row.items():
                if key.lower().startswith("hreflang") and str(value or "").strip():
                    hreflang_value = str(value).strip()
                    break
            if hreflang_value:
                hreflang_count += 1
                hreflang_samples.append({"url": row.get("Address", ""), "hreflang": hreflang_value})
            else:
                hreflang_empty += 1
    else:
        for page in pages:
            hreflang_value = str(page.get("hreflang") or "").strip()
            if hreflang_value:
                hreflang_count += 1

    issues: List[str] = []
    if nofollow_count > 0:
        issues.append(f"Wykryto {nofollow_count} stron z dyrektywa nofollow.")
    if hreflang_rows and hreflang_count == 0:
        issues.append("Tab hreflang jest dostepny, ale brak poprawnych wartosci hreflang.")

    return {
        "has_data": bool(directives_rows or hreflang_rows or pages),
        "noindex_count": noindex_count,
        "nofollow_count": nofollow_count,
        "x_robots_count": x_robots_count,
        "directives_samples": sample_directives[:30],
        "hreflang_count": hreflang_count,
        "hreflang_empty_count": hreflang_empty,
        "hreflang_samples": hreflang_samples[:30],
        "issues": issues,
        "has_issues": bool(issues),
    }


# ==========================================
# Main Orchestrator
# ==========================================

async def collect_technical_extras(
    url: str,
    crawled_urls: Optional[List[str]] = None,
    sitemap_url: Optional[str] = None,
    user_agent: Optional[str] = None,
    sf_raw_tabs: Optional[Dict[str, Any]] = None,
    all_pages: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Collect all additional technical SEO data in parallel.
    
    Returns dict with keys:
    - structured_data: Schema.org legacy analysis
    - structured_data_v2: detailed schema analysis with priorities
    - robots_txt: Robots.txt analysis
    - sitemap_analysis: Sitemap deep analysis
    - domain_config: Domain variant checks
    - semantic_html: HTML semantic structure
    - render_nojs: no-JS render readiness
    - soft_404: probable soft 404 pages
    - directives_hreflang: directives/hreflang/nofollow summary
    """
    ua = (user_agent or "").strip() or DEFAULT_USER_AGENT
    headers = {"User-Agent": ua}
    
    origin = _get_origin(url)
    result = {
        "structured_data": None,
        "structured_data_v2": None,
        "robots_txt": None,
        "sitemap_analysis": None,
        "domain_config": None,
        "semantic_html": None,
        "render_nojs": None,
        "soft_404": None,
        "directives_hreflang": None,
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
                schema_v2 = _analyze_schema_v2(schemas)
                result["structured_data_v2"] = schema_v2
                result["structured_data"] = _to_legacy_schema(schema_v2)
                result["semantic_html"] = _analyze_semantic_html(html)
                result["render_nojs"] = _analyze_render_nojs(html)
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

    # --- Soft 404 / low-content ---
    try:
        result["soft_404"] = _analyze_soft_404(all_pages or [])
    except Exception as e:
        logger.warning("Soft 404 analysis failed: %s", e)

    # --- Directives / hreflang / nofollow ---
    try:
        result["directives_hreflang"] = _analyze_directives_hreflang(sf_raw_tabs, all_pages)
    except Exception as e:
        logger.warning("Directives/hreflang analysis failed: %s", e)
    
    return result


def _get_origin(url: str) -> str:
    """Return scheme://host for URL."""
    p = urlparse(url)
    if not p.scheme or not p.netloc:
        return url.rstrip("/")
    return f"{p.scheme}://{p.netloc}".rstrip("/")
