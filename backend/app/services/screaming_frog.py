"""
Screaming Frog SEO Spider integration via Docker container.
"""

import logging
import json
import asyncio
from typing import Dict, Any
import csv
import io

logger = logging.getLogger(__name__)

async def crawl_url(url: str) -> Dict[str, Any]:
    """
    Run Screaming Frog crawl using Docker container via docker exec.
    
    NO FALLBACKS - If Screaming Frog fails, the entire audit fails.
    
    Args:
        url: Website URL to crawl
        
    Returns:
        Dictionary with comprehensive crawl results
        
    Raises:
        Exception: If Screaming Frog crawl fails for any reason
    """
    logger.info(f"🕷️  Running Screaming Frog crawl: {url}")
    
    try:
        # Try Screaming Frog
        cmd = [
            "docker", "exec", "sitespector-screaming-frog",
            "/usr/local/bin/crawl.sh",
            url
        ]
        
        # Add license if configured
        from app.config import settings
        if settings.SCREAMING_FROG_USER and settings.SCREAMING_FROG_KEY:
             logger.info("🔑 Using Screaming Frog License")
             
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
            logger.error(f"❌ Screaming Frog crawl FAILED: {error}")
            raise Exception(f"Screaming Frog crawl failed with exit code {process.returncode}: {error[:500]}")
            
        # Parse SF output (CSV format)
        output = stdout.decode().strip()
        
        # Remove BOM if present (Screaming Frog adds UTF-8 BOM to CSV)
        if output.startswith('\ufeff'):
            output = output[1:]
        
        # Check for error JSON
        if output.startswith('{'):
            try:
                err_json = json.loads(output)
                if "error" in err_json:
                    logger.error(f"❌ Screaming Frog returned error: {err_json}")
                    raise Exception(f"Screaming Frog error: {err_json.get('error', 'Unknown error')}")
            except json.JSONDecodeError:
                pass
        
        if not output:
            logger.error("❌ Screaming Frog returned empty output")
            raise Exception("Screaming Frog returned empty output")

        # Convert CSV to list of dicts
        csv_io = io.StringIO(output)
        reader = csv.DictReader(csv_io)
        crawl_data = list(reader)
        
        # Clean BOM from field names if present
        if crawl_data:
            first_row = crawl_data[0]
            # Check if first key has BOM or quotes
            first_key = list(first_row.keys())[0]
            if first_key.startswith('\ufeff') or first_key.startswith('"'):
                logger.warning(f"🔧 Cleaning CSV keys - detected BOM/quotes: {repr(first_key)}")
                cleaned_data = []
                for row in crawl_data:
                    cleaned_row = {}
                    for key, value in row.items():
                        # Remove BOM and quotes from key
                        clean_key = key.lstrip('\ufeff').strip('"')
                        cleaned_row[clean_key] = value
                    cleaned_data.append(cleaned_row)
                crawl_data = cleaned_data
                logger.info(f"✅ CSV keys cleaned - first key now: {list(crawl_data[0].keys())[0]}")
        
        if not crawl_data:
            logger.error("❌ Screaming Frog returned empty CSV data")
            raise Exception("Screaming Frog returned empty CSV data")

        return _transform_sf_data(crawl_data, url)
            
    except Exception as e:
        # Re-raise any exception - NO FALLBACKS
        logger.error(f"❌ Screaming Frog crawl error: {e}", exc_info=True)
        raise


def _transform_sf_data(data: list, url: str) -> Dict[str, Any]:
    """
    Transform Screaming Frog CSV data to our format with FULL data preservation.
    
    Extracts ALL pages, images, links, and technical SEO data from SF crawl.
    
    Args:
        data: List of dictionaries from Screaming Frog CSV
        url: Original URL crawled
        
    Returns:
        Dictionary with comprehensive crawl results including:
        - Homepage summary (backward compatible)
        - all_pages: Full list of all HTML pages with details
        - images: Complete image analysis
        - links: Internal/external/broken links analysis
        - technical_seo: Canonical, robots, redirects
        - pages_by_status: Grouping by HTTP status code
        
    Raises:
        ValueError: If data is invalid or empty
    """
    if not isinstance(data, list) or not data:
        logger.error("❌ Invalid or empty Screaming Frog data")
        raise ValueError("No URLs found in Screaming Frog data")
    
    logger.info(f"✅ SF parsed {len(data)} rows successfully")
        
    # Find homepage
    homepage = next((item for item in data if item.get('Address') == url or item.get('Address') == url + '/'), data[0])
    
    # Process ALL pages and images
    all_pages = []
    images_data = []
    
    for row in data:
        page_url = row.get('Address', '')
        content_type = row.get('Content Type', '')
        
        # Classify by content type
        if 'image' in content_type.lower():
            images_data.append({
                'url': page_url,
                'alt_text': row.get('Alt Text 1', ''),
                'size_bytes': int(row.get('Size (bytes)', 0) or 0),
                'format': content_type,
            })
        elif 'text/html' in (content_type or '').lower() or not content_type.strip():
            # HTML pages (or unspecified content type - default to HTML)
            all_pages.append({
                'url': page_url,
                'title': row.get('Title 1', ''),
                'title_length': int(row.get('Title 1 Length', 0) or 0),
                'meta_description': row.get('Meta Description 1', ''),
                'meta_description_length': int(row.get('Meta Description 1 Length', 0) or 0),
                'h1': row.get('H1-1', ''),
                'h2': row.get('H2-1', ''),
                'status_code': int(row.get('Status Code', 0) or 200),
                'indexability': row.get('Indexability', ''),
                'indexability_status': row.get('Indexability Status', ''),
                'word_count': int(row.get('Word Count', 0) or 0),
                'size_bytes': int(row.get('Size (bytes)', 0) or 0),
                'response_time': float(row.get('Response Time', 0) or 0),
                'flesch_reading_ease': float(row.get('Flesch Reading Ease Score', 0) or 0),
                'readability': row.get('Readability', ''),
                'inlinks': int(row.get('Unique Inlinks', 0) or 0),
                'outlinks': int(row.get('Unique Outlinks', 0) or 0),
                'external_outlinks': int(row.get('Unique External Outlinks', 0) or 0),
                'canonical': row.get('Canonical Link Element 1', ''),
                'meta_robots': row.get('Meta Robots 1', ''),
                'redirect_url': row.get('Redirect URL', ''),
                'redirect_type': row.get('Redirect Type', ''),
            })
    
    # Links analysis
    internal_links = sum(max(0, p['outlinks'] - p['external_outlinks']) for p in all_pages)
    external_links = sum(p['external_outlinks'] for p in all_pages)
    broken_links = len([p for p in all_pages if p['status_code'] >= 400])
    redirects = len([p for p in all_pages if 300 <= p['status_code'] < 400])
    
    # Technical SEO summary
    missing_canonical = len([p for p in all_pages if not p['canonical'] and p['status_code'] == 200])
    noindex_pages = len([p for p in all_pages if 'noindex' in p.get('meta_robots', '').lower()])
    
    # Pages by status code
    pages_by_status = {
        "200": len([p for p in all_pages if p['status_code'] == 200]),
        "301": len([p for p in all_pages if p['status_code'] == 301]),
        "302": len([p for p in all_pages if p['status_code'] == 302]),
        "404": len([p for p in all_pages if p['status_code'] == 404]),
        "other": len([p for p in all_pages if p['status_code'] not in [200, 301, 302, 404]])
    }
    
    # Images analysis
    images_with_alt = len([i for i in images_data if i['alt_text']])
    images_without_alt = len([i for i in images_data if not i['alt_text']])
    total_images_size = sum(i['size_bytes'] for i in images_data)
    
    logger.info(f"✅ Processed: {len(all_pages)} pages, {len(images_data)} images, {internal_links} internal links")
    
    return {
        # Homepage summary (backward compatible)
        "url": url,
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
        "has_sitemap": False,
        "flesch_reading_ease": float(homepage.get('Flesch Reading Ease Score', 0) or 0),
        
        # NEW: Full data structures
        "all_pages": all_pages,  # Complete list of all pages
        "pages_by_status": pages_by_status,
        "images": {
            "total": len(images_data),
            "with_alt": images_with_alt,
            "without_alt": images_without_alt,
            "total_size_mb": round(total_images_size / (1024 * 1024), 2),
            "all_images": images_data,  # Complete list
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
            "redirects": redirects,
            "broken_links": broken_links,
        }
    }
