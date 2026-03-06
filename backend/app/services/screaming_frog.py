"""
Screaming Frog SEO Spider integration via Docker container.
"""

import logging
import json
import asyncio
from typing import Dict, Any, Optional
import csv
import io
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = "SiteSpector/1.0"

def _origin_from_url(url: str) -> str:
    """Return scheme://host for any input URL."""
    p = urlparse(url)
    if not p.scheme or not p.netloc:
        return url.rstrip("/")
    return f"{p.scheme}://{p.netloc}".rstrip("/")


async def _detect_sitemaps(base_url: str, user_agent: Optional[str] = None) -> Dict[str, Any]:
    """Detect sitemap(s) via common endpoints + robots.txt.

    Returns:
      { "has_sitemap": bool, "sitemap_url": str|None, "sitemaps": [str] }
    """
    origin = _origin_from_url(base_url)
    candidates = [
        f"{origin}/sitemap.xml",
        f"{origin}/sitemap_index.xml",
        f"{origin}/wp-sitemap.xml",
    ]

    found: list[str] = []
    ua = (user_agent or "").strip() or DEFAULT_USER_AGENT

    def _add(u: str) -> None:
        u = (u or "").strip()
        if u and u not in found:
            found.append(u)

    timeout = httpx.Timeout(10.0, connect=5.0)
    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
        headers = {"User-Agent": ua}
        # 1) robots.txt Sitemap: lines
        try:
            r = await client.get(f"{origin}/robots.txt", headers=headers)
            if r.status_code == 200 and r.text:
                for line in r.text.splitlines():
                    if line.lower().startswith("sitemap:"):
                        _add(line.split(":", 1)[1].strip())
        except Exception:
            pass

        # 2) Common sitemap endpoints (follow redirects)
        for u in candidates:
            try:
                r = await client.get(u, headers=headers)
                if r.status_code != 200:
                    continue
                ct = (r.headers.get("content-type") or "").lower()
                if "xml" in ct or r.text.lstrip().startswith("<?xml"):
                    _add(str(r.url))
            except Exception:
                continue

    return {
        "has_sitemap": bool(found),
        "sitemap_url": found[0] if found else None,
        "sitemaps": found,
    }


async def _clean_crawl_output() -> None:
    """Clean /tmp/crawls/ in the SF container before a new crawl."""
    clean_cmd = [
        "docker", "exec", "sitespector-screaming-frog",
        "bash", "-c", "rm -f /tmp/crawls/*.csv 2>/dev/null; echo CLEANED"
    ]
    proc = await asyncio.create_subprocess_exec(
        *clean_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await asyncio.wait_for(proc.communicate(), timeout=10)


async def _run_single_crawl(url: str, user_agent: Optional[str] = None) -> Dict[str, Any]:
    """Execute a single Screaming Frog crawl attempt. Returns parsed tab data."""
    from app.config import settings

    # Clean stale CSV files before crawl
    await _clean_crawl_output()

    cmd = [
        "docker", "exec", "sitespector-screaming-frog",
        "/usr/local/bin/crawl.sh",
        url,
    ]
    if (user_agent or "").strip():
        cmd.append((user_agent or "").strip())

    # Register license if configured
    if settings.SCREAMING_FROG_USER and settings.SCREAMING_FROG_KEY:
        logger.info("Using Screaming Frog license: %s", settings.SCREAMING_FROG_USER)
        license_cmd = [
            "docker", "exec", "sitespector-screaming-frog",
            "ScreamingFrogSEOSpider",
            "--license",
            settings.SCREAMING_FROG_USER,
            settings.SCREAMING_FROG_KEY,
        ]
        proc_lic = await asyncio.create_subprocess_exec(
            *license_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc_lic.communicate()

    logger.info("Executing crawl command for %s", url)

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=300)
    except asyncio.TimeoutError:
        process.kill()
        raise Exception(f"Screaming Frog crawl timed out after 300s for {url}")

    stderr_text = stderr.decode().strip()
    if stderr_text:
        logger.info("SF stderr: %s", stderr_text[:500])

    if process.returncode != 0:
        raise Exception(
            f"Screaming Frog exit code {process.returncode}: {stderr_text[:500]}"
        )

    output = stdout.decode().strip()
    if not output:
        raise Exception("Screaming Frog returned empty output")

    try:
        crawl_data_tabs = json.loads(output)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse SF JSON: %s | output: %s", e, output[:500])
        raise Exception("Screaming Frog returned invalid JSON")

    if not crawl_data_tabs.get("internal_all"):
        tab_keys = list(crawl_data_tabs.keys())
        raise Exception(
            f"Screaming Frog returned empty internal_all data (tabs present: {tab_keys})"
        )

    return crawl_data_tabs


async def crawl_url(url: str, max_retries: int = 2, user_agent: Optional[str] = None) -> Dict[str, Any]:
    """
    Run Screaming Frog crawl with automatic retry.

    Cleans /tmp/crawls/ before each attempt to prevent stale data issues.

    Args:
        url: Website URL to crawl
        max_retries: Total attempts (default 2 = 1 original + 1 retry)
        user_agent: Optional custom User-Agent (whitelist in Cloudflare/WAF)

    Returns:
        Dictionary with comprehensive crawl results

    Raises:
        Exception: If all attempts fail
    """
    logger.info("Starting Screaming Frog crawl: %s (max_retries=%d)", url, max_retries)

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            logger.info("Crawl attempt %d/%d for %s", attempt, max_retries, url)
            crawl_data_tabs = await _run_single_crawl(url, user_agent=user_agent)

            crawl_data = _transform_sf_data(crawl_data_tabs, url)

            # Sitemap detection (same UA as crawl)
            try:
                sitemap_info = await _detect_sitemaps(url, user_agent=user_agent)
                crawl_data["has_sitemap"] = bool(sitemap_info.get("has_sitemap"))
                if sitemap_info.get("sitemap_url"):
                    crawl_data["sitemap_url"] = sitemap_info["sitemap_url"]
                if sitemap_info.get("sitemaps") is not None:
                    crawl_data["sitemaps"] = sitemap_info["sitemaps"]
            except Exception as e:
                logger.warning("Sitemap detection failed for %s: %s", url, e)

            logger.info(
                "Crawl succeeded for %s on attempt %d (%d pages)",
                url, attempt, len(crawl_data.get("all_pages", [])),
            )
            return crawl_data

        except Exception as e:
            last_error = e
            logger.warning(
                "Crawl attempt %d/%d failed for %s: %s",
                attempt, max_retries, url, e,
            )
            if attempt < max_retries:
                wait = 10 * attempt
                logger.info("Retrying in %ds...", wait)
                await asyncio.sleep(wait)

    logger.error("All %d crawl attempts failed for %s: %s", max_retries, url, last_error)
    raise last_error  # type: ignore[misc]


def _transform_sf_data(tabs: Dict[str, list], url: str) -> Dict[str, Any]:
    """
    Transform Screaming Frog JSON data (multiple tabs) to our format.
    """
    data = tabs.get("internal_all", [])
    if not data:
        logger.error("❌ Invalid or empty Screaming Frog data")
        raise ValueError("No URLs found in Screaming Frog data")

    logger.info(f"✅ SF parsed {len(data)} rows from internal_all successfully")

    response_codes_tab = tabs.get("response_codes", []) or []
    titles_tab = tabs.get("page_titles", []) or []
    meta_tab = tabs.get("meta_descriptions", []) or []
    h1_tab = tabs.get("h1_all", []) or []
    h2_tab = tabs.get("h2_all", []) or []
    canonicals_tab = tabs.get("canonicals", []) or []
    directives_tab = tabs.get("directives", []) or []
    hreflang_tab = tabs.get("hreflang", []) or []
    images_tab = tabs.get("images_all", []) or []

    def _clean_url(value: str) -> str:
        return (value or "").strip()

    def _to_int(value: Any, default: int = 0) -> int:
        try:
            if value is None or value == "":
                return default
            return int(float(value))
        except (TypeError, ValueError):
            return default

    def _to_float(value: Any, default: float = 0.0) -> float:
        try:
            if value is None or value == "":
                return default
            return float(value)
        except (TypeError, ValueError):
            return default

    response_map: Dict[str, Dict[str, Any]] = {}
    for row in response_codes_tab:
        row_url = _clean_url(row.get("Address", ""))
        if not row_url:
            continue
        response_map[row_url] = {
            "status_code": _to_int(row.get("Status Code")),
            "content_type": row.get("Content Type", ""),
            "size_bytes": _to_int(row.get("Size (Bytes)") or row.get("Size (bytes)")),
        }

    titles_map = {_clean_url(r.get("Address", "")): r for r in titles_tab if _clean_url(r.get("Address", ""))}
    meta_map = {_clean_url(r.get("Address", "")): r for r in meta_tab if _clean_url(r.get("Address", ""))}
    h1_map = {_clean_url(r.get("Address", "")): r for r in h1_tab if _clean_url(r.get("Address", ""))}
    h2_map = {_clean_url(r.get("Address", "")): r for r in h2_tab if _clean_url(r.get("Address", ""))}
    canonicals_map = {_clean_url(r.get("Address", "")): r for r in canonicals_tab if _clean_url(r.get("Address", ""))}
    directives_map = {_clean_url(r.get("Address", "")): r for r in directives_tab if _clean_url(r.get("Address", ""))}
    hreflang_map = {_clean_url(r.get("Address", "")): r for r in hreflang_tab if _clean_url(r.get("Address", ""))}

    # Find homepage
    homepage = next((item for item in data if item.get('Address') == url or item.get('Address') == url + '/'), data[0])
    homepage_status = int(homepage.get("Status Code", 0) or 200)
    crawl_blocked = homepage_status >= 400

    # Process ALL pages and images
    all_pages = []
    images_data = []

    seen_image_urls = set()
    for row in data:
        page_url = _clean_url(row.get("Address", ""))
        if not page_url:
            continue

        row_response = response_map.get(page_url, {})
        content_type = row.get("Content Type", "") or row_response.get("content_type", "")

        title_row = titles_map.get(page_url, {})
        meta_row = meta_map.get(page_url, {})
        h1_row = h1_map.get(page_url, {})
        h2_row = h2_map.get(page_url, {})
        canonical_row = canonicals_map.get(page_url, {})
        directives_row = directives_map.get(page_url, {})
        hreflang_row = hreflang_map.get(page_url, {})

        # Classify by content type
        if 'image' in (content_type or '').lower():
            seen_image_urls.add(page_url)
            images_data.append({
                'url': page_url,
                'alt_text': row.get('Alt Text 1', ''),
                'size_bytes': _to_int(row.get('Size (bytes)', 0) or row_response.get("size_bytes")),
                'format': content_type,
            })
        elif 'text/html' in (content_type or '').lower() or not (content_type or '').strip():
            # HTML pages
            title_value = row.get("Title 1") or title_row.get("Title 1", "")
            meta_value = row.get("Meta Description 1") or meta_row.get("Meta Description 1", "")
            h1_value = row.get("H1-1") or h1_row.get("H1-1", "")
            h2_value = row.get("H2-1") or h2_row.get("H2-1", "")
            canonical_value = row.get("Canonical Link Element 1") or canonical_row.get("Canonical Link Element 1", "")
            meta_robots_value = row.get("Meta Robots 1") or directives_row.get("Meta Robots 1", "")
            x_robots_value = directives_row.get("X-Robots-Tag 1", "")
            status_code = _to_int(row.get("Status Code", 0) or row_response.get("status_code"), default=200)
            indexability_value = row.get("Indexability", "") or directives_row.get("Indexability", "")

            all_pages.append({
                'url': page_url,
                'title': title_value,
                'title_length': _to_int(row.get('Title 1 Length', 0) or title_row.get("Title 1 Length")),
                'meta_description': meta_value,
                'meta_description_length': _to_int(row.get('Meta Description 1 Length', 0) or meta_row.get("Meta Description 1 Length")),
                'h1': h1_value,
                'h2': h2_value,
                'status_code': status_code,
                'indexability': indexability_value,
                'indexability_status': row.get('Indexability Status', ''),
                'word_count': _to_int(row.get('Word Count', 0)),
                'size_bytes': _to_int(row.get('Size (bytes)', 0) or row_response.get("size_bytes")),
                'response_time': _to_float(row.get('Response Time', 0)),
                'flesch_reading_ease': _to_float(row.get('Flesch Reading Ease Score', 0)),
                'readability': row.get('Readability', ''),
                'inlinks': _to_int(row.get('Unique Inlinks', 0)),
                'outlinks': _to_int(row.get('Unique Outlinks', 0)),
                'external_outlinks': _to_int(row.get('Unique External Outlinks', 0)),
                'canonical': canonical_value,
                'meta_robots': meta_robots_value,
                'x_robots_tag': x_robots_value,
                'hreflang': hreflang_row.get("hreflang 1", ""),
                'redirect_url': row.get('Redirect URL', ''),
                'redirect_type': row.get('Redirect Type', ''),
            })

    # Ensure image tab is also included (not all crawls include image rows in internal tab)
    for row in images_tab:
        image_url = _clean_url(row.get("Address", ""))
        if not image_url or image_url in seen_image_urls:
            continue
        images_data.append({
            "url": image_url,
            "alt_text": row.get("Alt Text 1", ""),
            "size_bytes": _to_int(row.get("Size (Bytes)") or row.get("Size (bytes)")),
            "format": row.get("Content Type", ""),
        })

    # ... (rest of analysis logic remains same) ...
    internal_links = sum(max(0, p['outlinks'] - p['external_outlinks']) for p in all_pages)
    external_links = sum(p['external_outlinks'] for p in all_pages)
    broken_links = len([p for p in all_pages if p['status_code'] >= 400])
    redirects = len([p for p in all_pages if 300 <= p['status_code'] < 400])
    
    missing_canonical = len([p for p in all_pages if not p['canonical'] and p['status_code'] == 200])
    noindex_pages = len([p for p in all_pages if 'noindex' in p.get('meta_robots', '').lower()])
    nofollow_pages = len([p for p in all_pages if 'nofollow' in p.get('meta_robots', '').lower() or 'nofollow' in p.get('x_robots_tag', '').lower()])
    hreflang_pages = len([p for p in all_pages if p.get("hreflang")])
    
    pages_by_status = {
        "200": len([p for p in all_pages if p['status_code'] == 200]),
        "301": len([p for p in all_pages if p['status_code'] == 301]),
        "302": len([p for p in all_pages if p['status_code'] == 302]),
        "404": len([p for p in all_pages if p['status_code'] == 404]),
        "other": len([p for p in all_pages if p['status_code'] not in [200, 301, 302, 404]])
    }
    
    images_with_alt = len([i for i in images_data if i['alt_text']])
    images_without_alt = len([i for i in images_data if not i['alt_text']])
    total_images_size = sum(i['size_bytes'] for i in images_data)
    
    return {
        "url": url,
        "crawl_blocked": crawl_blocked,
        "crawl_blocked_status": homepage_status if crawl_blocked else None,
        "title": homepage.get('Title 1', ''),
        "title_length": int(homepage.get('Title 1 Length', 0) or 0),
        "meta_description": homepage.get('Meta Description 1', ''),
        "meta_description_length": int(homepage.get('Meta Description 1 Length', 0) or 0),
        "h1_tags": [homepage.get('H1-1', '')] if homepage.get('H1-1') else [],
        "h1_count": 1 if homepage.get('H1-1') else 0,
        "status_code": int(homepage.get('Status Code', 200)),
        "word_count": int(homepage.get('Word Count', 0) or 0),
        "size_bytes": int(homepage.get('Size (bytes)', 0) or 0),
        "load_time": float(homepage.get('Response Time', 0) or 0),
        "internal_links_count": int(homepage.get('Unique Outlinks', 0) or 0) - int(homepage.get('Unique External Outlinks', 0) or 0),
        "total_images": len(images_data),
        "images_without_alt": images_without_alt,
        "pages_crawled": len(all_pages),
        # Determined after crawl via `_detect_sitemaps()`.
        "has_sitemap": False,
        "flesch_reading_ease": float(homepage.get('Flesch Reading Ease Score', 0) or 0),
        "all_pages": all_pages,
        "pages_by_status": pages_by_status,
        "images": {
            "total": len(images_data),
            "with_alt": images_with_alt,
            "without_alt": images_without_alt,
            "total_size_mb": round(total_images_size / (1024 * 1024), 2),
            "all_images": images_data,
        },
        "links": {
            "internal": internal_links,
            "external": external_links,
            "broken": broken_links,
            "redirects": redirects,
        },
        "technical_seo": {
            "missing_canonical": missing_canonical,
            "noindex_pages": noindex_pages,
            "nofollow_pages": nofollow_pages,
            "redirects": redirects,
            "broken_links": broken_links,
            "hreflang_pages": hreflang_pages,
        },
        "sf_raw_tabs": tabs # Store all raw tabs for future use
    }
