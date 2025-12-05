"""
Simple web crawler service (replaces Screaming Frog for MVP).
Uses requests + BeautifulSoup for basic SEO crawling.
"""

import logging
import asyncio
from typing import Dict, Any, List
from urllib.parse import urljoin, urlparse
import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


async def crawl_url(url: str, max_pages: int = 50) -> Dict[str, Any]:
    """
    Crawl a website and extract SEO data.
    
    Simple implementation using aiohttp + BeautifulSoup.
    For production, this would use Screaming Frog Docker container.
    
    Args:
        url: Website URL to crawl
        max_pages: Maximum number of pages to crawl
        
    Returns:
        Dictionary with crawl results
    """
    logger.info(f"Crawling URL: {url} (max {max_pages} pages)")
    
    try:
        async with aiohttp.ClientSession() as session:
            # Fetch homepage
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch {url}: {response.status}")
                    return _empty_crawl_result()
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract basic SEO data
                title = soup.find('title')
                title_text = title.get_text().strip() if title else None
                
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                meta_description = meta_desc.get('content', '').strip() if meta_desc else None
                
                h1_tags = [h1.get_text().strip() for h1 in soup.find_all('h1')]
                h2_tags = [h2.get_text().strip() for h2 in soup.find_all('h2')]
                
                # Count links
                all_links = soup.find_all('a', href=True)
                internal_links = []
                external_links = []
                
                base_domain = urlparse(url).netloc
                
                for link in all_links:
                    href = link.get('href', '')
                    absolute_url = urljoin(url, href)
                    link_domain = urlparse(absolute_url).netloc
                    
                    if link_domain == base_domain:
                        internal_links.append(absolute_url)
                    elif link_domain:  # Skip anchors and javascript:
                        external_links.append(absolute_url)
                
                # Check for sitemap
                sitemap_url = None
                try:
                    robots_url = urljoin(url, '/robots.txt')
                    async with session.get(robots_url, timeout=aiohttp.ClientTimeout(total=10)) as robots_response:
                        if robots_response.status == 200:
                            robots_txt = await robots_response.text()
                            for line in robots_txt.split('\n'):
                                if 'sitemap:' in line.lower():
                                    sitemap_url = line.split(':', 1)[1].strip()
                                    break
                except Exception as e:
                    logger.warning(f"Failed to fetch robots.txt: {e}")
                
                # Extract images
                images = soup.find_all('img')
                images_without_alt = sum(1 for img in images if not img.get('alt'))
                
                return {
                    "pages_crawled": 1,  # MVP: only homepage
                    "url": url,
                    "title": title_text,
                    "title_length": len(title_text) if title_text else 0,
                    "meta_description": meta_description,
                    "meta_description_length": len(meta_description) if meta_description else 0,
                    "h1_tags": h1_tags,
                    "h1_count": len(h1_tags),
                    "h2_tags": h2_tags[:10],  # First 10
                    "h2_count": len(h2_tags),
                    "internal_links": len(set(internal_links)),
                    "external_links": len(set(external_links)),
                    "total_images": len(images),
                    "images_without_alt": images_without_alt,
                    "sitemap_url": sitemap_url,
                    "has_sitemap": sitemap_url is not None,
                    "word_count": len(soup.get_text().split()),
                    "crawl_depth": 1,
                }
                
    except Exception as e:
        logger.error(f"Error crawling {url}: {e}", exc_info=True)
        return _empty_crawl_result()


def _empty_crawl_result() -> Dict[str, Any]:
    """Return empty crawl result for failed crawls."""
    return {
        "pages_crawled": 0,
        "title": None,
        "meta_description": None,
        "h1_tags": [],
        "h1_count": 0,
        "h2_tags": [],
        "internal_links": 0,
        "external_links": 0,
        "total_images": 0,
        "images_without_alt": 0,
        "sitemap_url": None,
        "has_sitemap": False,
        "word_count": 0,
    }

