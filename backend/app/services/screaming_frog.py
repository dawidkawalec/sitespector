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
        
        logger.debug(f"Executing: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error = stderr.decode()
            logger.warning(f"Screaming Frog failed: {error[:200]}")
            logger.info("Falling back to HTTP crawler...")
            return await _http_fallback_crawl(url)
            
        # Parse SF JSON output
        try:
            output = stdout.decode().strip()
            crawl_data = json.loads(output)
            return _transform_sf_data(crawl_data, url)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid SF JSON: {e}")
            return await _http_fallback_crawl(url)
            
    except Exception as e:
        logger.error(f"SF error: {e}", exc_info=True)
        return await _http_fallback_crawl(url)


async def _http_fallback_crawl(url: str) -> Dict[str, Any]:
    """HTTP fallback when Screaming Frog unavailable."""
    import httpx
    
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            )
            response.raise_for_status()
            return _parse_html(response.text, url, response.status_code, response.elapsed.total_seconds())
    except Exception as e:
        logger.error(f"HTTP fallback failed: {e}")
        return _empty_crawl_result(str(e))


def _transform_sf_data(data: list, url: str) -> Dict[str, Any]:
    """Transform Screaming Frog JSON to our format."""
    if not isinstance(data, list) or not data:
        return _empty_crawl_result("No URLs found")
        
    # Find homepage
    homepage = next((item for item in data if item.get('Address') == url or item.get('Address') == url + '/'), data[0])
    
    return {
        "url": url,
        "title": homepage.get('Title 1', ''),
        "title_length": int(homepage.get('Title 1 Length', 0)),
        "meta_description": homepage.get('Meta Description 1', ''),
        "meta_description_length": int(homepage.get('Meta Description 1 Length', 0)),
        "h1_tags": [homepage.get('H1-1', '')],
        "h1_count": int(homepage.get('H1-1 Length', 0) > 0),
        "status_code": homepage.get('Status Code', 200),
        "word_count": int(homepage.get('Word Count', 0)),
        "size_bytes": int(homepage.get('Size (bytes)', 0)),
        "load_time": float(homepage.get('Response Time', 0)),
        "internal_links_count": len([d for d in data if 'Internal' in d.get('Type', 'Internal')]),
        "total_images": len([d for d in data if 'Image' in d.get('Type', '')]),
        "images_without_alt": len([d for d in data if 'Image' in d.get('Type', '') and not d.get('Alt Text')]),
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
