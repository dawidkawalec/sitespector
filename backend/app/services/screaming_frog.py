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
    Transform Screaming Frog CSV data to our format.
    
    Args:
        data: List of dictionaries from Screaming Frog CSV
        url: Original URL crawled
        
    Returns:
        Dictionary with crawl results
        
    Raises:
        ValueError: If data is invalid or empty
    """
    if not isinstance(data, list) or not data:
        logger.error("❌ Invalid or empty Screaming Frog data")
        raise ValueError("No URLs found in Screaming Frog data")
    
    logger.warning(f"SF DEBUG: {len(data)} rows parsed")
    logger.warning(f"SF DEBUG: First row keys sample: {list(data[0].keys())[:5]}")
    logger.warning(f"SF DEBUG: Looking for URL: {url}")
        
    # Find homepage
    homepage = next((item for item in data if item.get('Address') == url or item.get('Address') == url + '/'), data[0])
    logger.warning(f"SF DEBUG: Homepage Address: {homepage.get('Address')}")
    logger.warning(f"SF DEBUG: Title 1 value: '{homepage.get('Title 1')}'")
    
    return {
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
        "total_images": len([d for d in data if 'image' in d.get('Content Type', '').lower()]),
        "images_without_alt": len([d for d in data if 'image' in d.get('Content Type', '').lower() and not d.get('Alt Text 1')]),
        "pages_crawled": len(data),
        "has_sitemap": False,  # TODO: Detect from crawl data if available
    }
