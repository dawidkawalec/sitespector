"""
Lighthouse performance audit service (simplified MVP version).
Uses aiohttp for basic metrics. For production, use Lighthouse Docker.
"""

import logging
import time
from typing import Dict, Any
import aiohttp

logger = logging.getLogger(__name__)


async def audit_url(url: str, device: str = "desktop") -> Dict[str, Any]:
    """
    Run simplified performance audit on a URL.
    
    MVP version: Uses aiohttp to measure basic metrics.
    Production: Would use Lighthouse Docker container.
    
    Args:
        url: Website URL to audit
        device: Device type ('desktop' or 'mobile')
        
    Returns:
        Dictionary with performance results
    """
    logger.info(f"Running performance audit: {url} ({device})")
    
    try:
        async with aiohttp.ClientSession() as session:
            # Measure time to first byte and total load time
            start_time = time.time()
            
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                ttfb = (time.time() - start_time) * 1000  # Convert to ms
                html = await response.text()
                total_time = (time.time() - start_time) * 1000
                
                # Calculate scores based on response time
                # Good: <200ms, OK: <500ms, Poor: >500ms
                if ttfb < 200:
                    perf_score = 95
                elif ttfb < 500:
                    perf_score = 75
                elif ttfb < 1000:
                    perf_score = 50
                else:
                    perf_score = 25
                
                # Estimate other metrics based on TTFB
                fcp = ttfb + 200  # First Contentful Paint typically after TTFB
                lcp = ttfb + 500  # Largest Contentful Paint
                
                # Mock other scores (would come from real Lighthouse)
                seo_score = 85 if response.status == 200 else 50
                accessibility_score = 80  # Would need to analyze HTML
                best_practices_score = 75  # Would need security headers etc.
                
                return {
                    "url": url,
                    "device": device,
                    "performance_score": perf_score,
                    "accessibility_score": accessibility_score,
                    "best_practices_score": best_practices_score,
                    "seo_score": seo_score,
                    "ttfb": round(ttfb),
                    "fcp": round(fcp),
                    "lcp": round(lcp),
                    "cls": 0.05,  # Mock Cumulative Layout Shift
                    "inp": 50,    # Mock Interaction to Next Paint
                    "total_blocking_time": round(total_time * 0.1),
                    "speed_index": round(fcp * 1.5),
                    "total_time": round(total_time),
                    "status_code": response.status,
                }
                
    except Exception as e:
        logger.error(f"Error auditing {url}: {e}", exc_info=True)
        return _failed_audit_result(url, device)


async def audit_both(url: str) -> Dict[str, Dict[str, Any]]:
    """
    Run performance audit for both desktop and mobile.
    
    Args:
        url: Website URL to audit
        
    Returns:
        Dictionary with 'desktop' and 'mobile' results
    """
    desktop_results = await audit_url(url, "desktop")
    mobile_results = await audit_url(url, "mobile")
    
    # Mobile typically slower
    if mobile_results["performance_score"] > 0:
        mobile_results["performance_score"] = max(0, mobile_results["performance_score"] - 10)
        mobile_results["ttfb"] = int(mobile_results["ttfb"] * 1.3)
        mobile_results["lcp"] = int(mobile_results["lcp"] * 1.4)
    
    return {
        "desktop": desktop_results,
        "mobile": mobile_results,
    }


def _failed_audit_result(url: str, device: str) -> Dict[str, Any]:
    """Return failed audit result."""
    return {
        "url": url,
        "device": device,
        "performance_score": 0,
        "accessibility_score": 0,
        "best_practices_score": 0,
        "seo_score": 0,
        "ttfb": 0,
        "fcp": 0,
        "lcp": 0,
        "cls": 0,
        "inp": 0,
        "error": "Failed to audit URL",
    }

