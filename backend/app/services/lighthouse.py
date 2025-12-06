"""
Lighthouse performance audit service using Docker container.
"""

import logging
import json
import asyncio
import subprocess
from typing import Dict, Any

logger = logging.getLogger(__name__)

async def audit_url(url: str, device: str = "desktop") -> Dict[str, Any]:
    """
    Run Lighthouse audit using the sibling Docker container via docker exec.
    
    Args:
        url: Website URL to audit
        device: Device type ('desktop' or 'mobile')
        
    Returns:
        Dictionary with performance results
    """
    logger.info(f"Running Lighthouse audit (Docker): {url} ({device})")
    
    try:
        # Construct Lighthouse command
        # We use --output=json and print to stdout to capture result
        # --chrome-flags are crucial for running in container
        preset = "--preset=desktop" if device == "desktop" else ""
        cmd = [
            "docker", "exec", "sitespector-lighthouse",
            "lighthouse",
            url,
            "--output=json",
            "--output-path=stdout",
            "--quiet",
            "--chrome-flags='--headless --no-sandbox --disable-gpu --disable-dev-shm-usage'",
            preset
        ]
        
        # Remove empty strings
        cmd = [c for c in cmd if c]
        
        logger.debug(f"Executing command: {' '.join(cmd)}")
        
        # Run command asynchronously
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode()
            logger.error(f"Lighthouse failed with code {process.returncode}: {error_msg}")
            return _failed_audit_result(url, device, error_msg)
            
        # Parse JSON output
        try:
            lh_result = json.loads(stdout.decode())
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Lighthouse JSON: {e}")
            logger.error(f"Output start: {stdout.decode()[:200]}...")
            return _failed_audit_result(url, device, "Invalid JSON output")
            
        # Extract metrics
        categories = lh_result.get("categories", {})
        audits = lh_result.get("audits", {})
        
        performance_score = categories.get("performance", {}).get("score", 0) * 100
        seo_score = categories.get("seo", {}).get("score", 0) * 100
        accessibility_score = categories.get("accessibility", {}).get("score", 0) * 100
        best_practices_score = categories.get("best-practices", {}).get("score", 0) * 100
        
        # Core Web Vitals
        fcp = audits.get("first-contentful-paint", {}).get("numericValue", 0)
        lcp = audits.get("largest-contentful-paint", {}).get("numericValue", 0)
        tbt = audits.get("total-blocking-time", {}).get("numericValue", 0)
        cls = audits.get("cumulative-layout-shift", {}).get("numericValue", 0)
        si = audits.get("speed-index", {}).get("numericValue", 0)
        
        # Additional metrics
        ttfb = audits.get("server-response-time", {}).get("numericValue", 0)
        
        result = {
            "url": url,
            "device": device,
            "performance_score": round(performance_score),
            "accessibility_score": round(accessibility_score),
            "best_practices_score": round(best_practices_score),
            "seo_score": round(seo_score),
            "ttfb": round(ttfb),
            "fcp": round(fcp),
            "lcp": round(lcp),
            "cls": round(cls, 3),
            "total_blocking_time": round(tbt),
            "speed_index": round(si),
            "total_time": round(lcp), # Approximation
            "status_code": 200, # Assumed if LH succeeded
        }
        
        logger.info(f"✅ Lighthouse audit completed for {url} ({device})")
        return result
        
    except Exception as e:
        logger.error(f"Error running Lighthouse audit: {e}", exc_info=True)
        return _failed_audit_result(url, device, str(e))


async def audit_both(url: str) -> Dict[str, Dict[str, Any]]:
    """
    Run performance audit for both desktop and mobile.
    """
    # Run parallel
    desktop_task = audit_url(url, "desktop")
    mobile_task = audit_url(url, "mobile")
    
    results = await asyncio.gather(desktop_task, mobile_task)
    
    return {
        "desktop": results[0],
        "mobile": results[1],
    }


def _failed_audit_result(url: str, device: str, error: str = "Unknown error") -> Dict[str, Any]:
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
        "total_blocking_time": 0,
        "speed_index": 0,
        "error": error,
    }
