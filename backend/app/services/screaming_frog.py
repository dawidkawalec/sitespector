"""
Screaming Frog SEO Spider integration via Docker container.
"""

import logging
import json
import asyncio
from typing import Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

async def crawl_url(url: str) -> Dict[str, Any]:
    """
    Run Screaming Frog crawl using Docker container via docker exec.
    
    Falls back to HTTP crawl if Screaming Frog fails.
    
    Args:
        url: Website URL to crawl
        
    Returns:
        Dictionary with comprehensive crawl results
    """
    logger.info(f"🕷️  Running Screaming Frog crawl: {url}")
    
    try:
        # Try Screaming Frog first
        cmd = [
            "docker", "exec", "sitespector-screaming-frog",
            "/usr/local/bin/crawl.sh",
            url
        ]
        
        # Add license if configured
        from app.config import settings
        if settings.SCREAMING_FROG_USER and settings.SCREAMING_FROG_KEY:
             logger.info("🔑 Using Screaming Frog License")
             # We assume crawl.sh accepts license args or we prepend them to the SF command inside the container
             # For now, let's assume we need to run a license command first OR pass it.
             # Standard CLI: ScreamingFrogSEOSpider --license user key
             # Since crawl.sh likely wraps the command, we might need to modify how we call it.
             # If crawl.sh is just `ScreamingFrogSEOSpider --crawl $1 --headless ...`, we can't easily inject.
             # BUT, we can try to run the license command separately via exec before crawling.
             
             license_cmd = [
                "docker", "exec", "sitespector-screaming-frog",
                "ScreamingFrogSEOSpider",
                "--license",
                settings.SCREAMING_FROG_USER,
                settings.SCREAMING_FROG_KEY
             ]
             
             # Run license registration
             proc_lic = await asyncio.create_subprocess_exec(
                *license_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
             )
             await proc_lic.communicate()
        
        logger.debug(f"Executing: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error = stderr.decode()
            if "licence" in error.lower() or "license" in error.lower():
                logger.warning("Screaming Frog License missing. Falling back to HTTP crawler.")
            else:
                logger.warning(f"Screaming Frog failed: {error[:200]}")
            
            logger.info("Falling back to HTTP crawler...")
            return await _http_fallback_crawl(url)
            
        # Parse SF output (CSV format)
        try:
            output = stdout.decode().strip()
            # If output is empty or starts with error json
            if not output or output.startswith('{'):
                 try:
                     err_json = json.loads(output)
                     if "error" in err_json:
                         logger.warning(f"SF returned error JSON: {err_json}")
                         return await _http_fallback_crawl(url)
                 except: pass

            # Convert CSV to list of dicts
            import csv
            import io
            
            # Find the start of CSV content (header)
            # Address,Content,Status Code,Status,Indexability,Indexability Status,Title 1,Title 1 Length,Title 1 Pixel Width,Meta Description 1,Meta Description 1 Length,Meta Description 1 Pixel Width,Meta Keyword 1,Meta Keywords 1 Length,H1-1,H1-1 Length,H2-1,H2-1 Length,Meta Robots 1,Meta Refresh 1,Canonical Link Element 1,Rel Next 1,Rel Prev 1,HTTP Rel Next 1,HTTP Rel Prev 1,Size (bytes),Word Count,Text Ratio,Crawl Depth,Link Score,Inlinks,Unique Inlinks,% of Total,Outlinks,Unique Outlinks,External Outlinks,Unique External Outlinks,Hash,Response Time,Last Modified,Redirect URI,Redirect Type,URL Encoded Address
            
            csv_io = io.StringIO(output)
            reader = csv.DictReader(csv_io)
            crawl_data = list(reader)
            
            if not crawl_data:
                logger.warning("SF returned empty CSV")
                return await _http_fallback_crawl(url)

            return _transform_sf_data(crawl_data, url)
        except Exception as e:
            logger.error(f"Error parsing SF CSV output: {e}")
            return await _http_fallback_crawl(url)
            
    except Exception as e:
        logger.error(f"SF error: {e}", exc_info=True)
        return await _http_fallback_crawl(url)


async def _http_fallback_crawl(url: str) -> Dict[str, Any]:
    """
    HTTP fallback when Screaming Frog unavailable.
    Crawls the homepage and follows internal links to simulate a basic crawl.
    """
    import httpx
    from urllib.parse import urlparse, urljoin
    
    logger.info(f"🕷️  Running HTTP fallback crawl for: {url}")
    
    base_domain = urlparse(url).netloc
    max_pages = 20  # Limit to prevent infinite loops
    visited_urls = set()
    queue = [url]
    crawled_data = []
    
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, verify=False) as client:
        while queue and len(visited_urls) < max_pages:
            current_url = queue.pop(0)
            if current_url in visited_urls:
                continue
                
            visited_urls.add(current_url)
            
            try:
                # Add headers to mimic a real browser
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9,pl;q=0.8",
                }
                
                logger.info(f"Attempting HTTP crawl of: {current_url}")
                response = await client.get(current_url, headers=headers)
                logger.info(f"HTTP crawl response: {current_url} - Status {response.status_code}")
                
                if response.status_code == 200:
                    page_data = _parse_html(response.text, current_url, response.status_code, response.elapsed.total_seconds())
                    crawled_data.append(page_data)
                    
                    # Extract internal links for the queue
                    # Only add links if we haven't visited them and they are internal
                    soup = BeautifulSoup(response.text, 'lxml')
                    links = soup.find_all('a', href=True)
                    
                    for link in links:
                        href = link['href']
                        full_url = urljoin(current_url, href)
                        parsed_link = urlparse(full_url)
                        
                        # Check if internal link and not already visited
                        if parsed_link.netloc == base_domain and full_url not in visited_urls and full_url not in queue:
                            # Basic filter to avoid junk
                            if not any(ext in full_url.lower() for ext in ['.jpg', '.png', '.pdf', '.css', '.js', 'mailto:', 'tel:']):
                                queue.append(full_url)
                else:
                     logger.warning(f"HTTP crawl failed for {current_url}: Status {response.status_code}")

            except Exception as e:
                logger.error(f"Failed to crawl {current_url}: {type(e).__name__} - {e}", exc_info=True)
                
    if not crawled_data:
        return _empty_crawl_result("HTTP crawl failed completely - Check logs for detailed error (SSL/Timeout/Block)")

    # Aggregate results to match Screaming Frog structure
    homepage_data = crawled_data[0] # Assume first is homepage
    
    total_images = sum(p.get("total_images", 0) for p in crawled_data)
    images_without_alt = sum(p.get("images_without_alt", 0) for p in crawled_data)
    internal_links_count = sum(p.get("internal_links_count", 0) for p in crawled_data)
    
    # Enrich homepage data with aggregated stats
    homepage_data["pages_crawled"] = len(crawled_data)
    homepage_data["total_images"] = total_images
    homepage_data["images_without_alt"] = images_without_alt
    homepage_data["internal_links_count"] = internal_links_count
    
    # Additional logic to check for robots.txt and sitemap
    try:
        robots_url = urljoin(url, "/robots.txt")
        robots_resp = await client.get(robots_url)
        homepage_data["has_robots_txt"] = robots_resp.status_code == 200
        
        sitemap_url = urljoin(url, "/sitemap.xml")
        sitemap_resp = await client.get(sitemap_url)
        homepage_data["has_sitemap"] = sitemap_resp.status_code == 200
    except:
        pass

    logger.info(f"✅ HTTP crawl finished. Scanned {len(crawled_data)} pages.")
    return homepage_data


def _transform_sf_data(data: list, url: str) -> Dict[str, Any]:
    """Transform Screaming Frog JSON to our format."""
    if not isinstance(data, list) or not data:
        return _empty_crawl_result("No URLs found")
        
    # Find homepage
    homepage = next((item for item in data if item.get('Address') == url or item.get('Address') == url + '/'), data[0])
    
    return {
        "url": url,
        "title": homepage.get('Title 1', ''),
        "title_length": int(homepage.get('Title 1 Length', 0) or 0),
        "meta_description": homepage.get('Meta Description 1', ''),
        "meta_description_length": int(homepage.get('Meta Description 1 Length', 0) or 0),
        "h1_tags": [homepage.get('H1-1', '')],
        "h1_count": int(homepage.get('H1-1 Length', 0) or 0),
        "status_code": homepage.get('Status Code', 200),
        "word_count": int(homepage.get('Word Count', 0) or 0),
        "size_bytes": int(homepage.get('Size (bytes)', 0) or 0),
        "load_time": float(homepage.get('Response Time', 0) or 0),
        # Fix: Calculate internal links using Outlinks - External Outlinks
        "internal_links_count": int(homepage.get('Unique Outlinks', 0) or 0) - int(homepage.get('Unique External Outlinks', 0) or 0),
        # Fix: Count images by checking Content-Type column
        "total_images": len([d for d in data if 'image' in d.get('Content', '').lower()]),
        "images_without_alt": len([d for d in data if 'image' in d.get('Content', '').lower() and not d.get('Alt Text')]),
    }


def _parse_html(html: str, url: str, status_code: int = 200, load_time: float = 0.0) -> Dict[str, Any]:
    """Parse HTML for HTTP fallback."""
    soup = BeautifulSoup(html, 'lxml')
    
    # Title
    title_tag = soup.find('title')
    title = title_tag.get_text(strip=True) if title_tag else ''
    
    # Meta description
    meta_desc_tag = soup.find('meta', attrs={'name': 'description'})
    meta_description = meta_desc_tag.get('content', '') if meta_desc_tag else ''
    
    # H1 tags
    h1_tags = [h1.get_text(strip=True) for h1 in soup.find_all('h1')]
    
    # Images
    images = soup.find_all('img')
    total_images = len(images)
    images_without_alt = len([img for img in images if not img.get('alt')])
    
    # Word count
    for script in soup(["script", "style", "meta", "link"]):
        script.decompose()
    text = soup.get_text()
    words = text.split()
    word_count = len(words)
    
    # Links
    links = soup.find_all('a', href=True)
    from urllib.parse import urlparse
    base_domain = urlparse(url).netloc
    
    internal_links = []
    for link in links:
        href = link['href']
        if href.startswith('/') or base_domain in href:
            internal_links.append(href)
    
    result = {
        "url": url,
        "status_code": status_code,
        "load_time": round(load_time, 3),
        "title": title,
        "title_length": len(title),
        "meta_description": meta_description,
        "meta_description_length": len(meta_description),
        "h1_tags": h1_tags,
        "h1_count": len(h1_tags),
        "total_images": total_images,
        "images_without_alt": images_without_alt,
        "word_count": word_count,
        "internal_links_count": len(internal_links),
        "has_sitemap": False,
    }
    
    logger.info(f"✅ HTTP crawl: {url} - '{title[:50]}...', {word_count} words")
    return result


def _empty_crawl_result(error: str = "Unknown error") -> Dict[str, Any]:
    """Return empty result."""
    return {
        "title": None,
        "meta_description": None,
        "h1_tags": [],
        "status_code": 0,
        "word_count": 0,
        "error": error,
        "crawler_used": "Failed"
    }
