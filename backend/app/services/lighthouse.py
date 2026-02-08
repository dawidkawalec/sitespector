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
        chrome_flags = "--headless --no-sandbox --disable-gpu --disable-dev-shm-usage"
        
        # We invoke the 'lighthouse' command directly inside the container
        # Note: The container ENTRYPOINT is /opt/audit.sh, but we are overriding it via docker exec
        # effectively running `docker exec <container> lighthouse ...`
        
        cmd = [
            "docker", "exec", "sitespector-lighthouse",
            "lighthouse",
            url,
            "--output=json",
            "--output-path=stdout",
            "--quiet",
            f"--chrome-flags={chrome_flags}",
            "--emulated-form-factor=" + device,
            "--only-categories=performance,accessibility,best-practices,seo"
        ]
        
        logger.debug(f"Executing command: {' '.join(cmd)}")
        
        # Run command asynchronously
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        from app.config import settings
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=settings.LIGHTHOUSE_TIMEOUT)
        except asyncio.TimeoutError:
            process.kill()
            logger.error(f"❌ Lighthouse audit TIMEOUT for {url} ({device})")
            raise Exception(f"Lighthouse audit timed out after {settings.LIGHTHOUSE_TIMEOUT}s for {url} ({device})")
        
        if process.returncode != 0:
            error_msg = stderr.decode()
            logger.error(f"❌ Lighthouse failed with code {process.returncode}: {error_msg}")
            raise Exception(f"Lighthouse audit failed for {url} ({device}): {error_msg[:500]}")
            
        # Parse JSON output
        try:
            lh_result = json.loads(stdout.decode())
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Lighthouse JSON: {e}")
            logger.error(f"Output start: {stdout.decode()[:200]}...")
            raise Exception(f"Lighthouse returned invalid JSON for {url} ({device})")
            
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
        
        # NEW: Categorize ALL audits (176 total)
        diagnostics = []  # Failed audits (score < 0.5)
        opportunities = []  # Optimization suggestions (0.5 <= score < 1.0)
        passed_audits = []  # Passed audits (score >= 1.0)
        
        for audit_id, audit_data in audits.items():
            score = audit_data.get('score')
            
            # Skip informational audits (no score)
            if score is None:
                continue
            
            audit_info = {
                'id': audit_id,
                'title': audit_data.get('title', ''),
                'description': audit_data.get('description', ''),
                'score': round(score, 3),
                'scoreDisplayMode': audit_data.get('scoreDisplayMode', ''),
                'displayValue': audit_data.get('displayValue', ''),
                'numericValue': audit_data.get('numericValue'),
                'numericUnit': audit_data.get('numericUnit', ''),
            }
            
            # Categorize by score
            if score < 0.5:
                diagnostics.append(audit_info)
            elif score < 1.0:
                opportunities.append(audit_info)
            else:
                passed_audits.append(audit_info)
        
        # Sort by score (worst first)
        diagnostics.sort(key=lambda x: x['score'])
        opportunities.sort(key=lambda x: x['score'])
        
        logger.info(f"✅ Lighthouse: {len(diagnostics)} issues, {len(opportunities)} opportunities, {len(passed_audits)} passed")
        
        result = {
            # Existing summary (backward compatible)
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
            "total_time": round(lcp),
            "status_code": 200,
            
            # NEW: Full audit data
            "audits": {
                "diagnostics": diagnostics,
                "opportunities": opportunities,
                "passed": passed_audits,
            },
            "categories_detail": {
                "performance": {
                    "score": round(performance_score),
                    "title": categories.get("performance", {}).get("title", ""),
                },
                "accessibility": {
                    "score": round(accessibility_score),
                    "title": categories.get("accessibility", {}).get("title", ""),
                },
                "best_practices": {
                    "score": round(best_practices_score),
                    "title": categories.get("best-practices", {}).get("title", ""),
                },
                "seo": {
                    "score": round(seo_score),
                    "title": categories.get("seo", {}).get("title", ""),
                },
            },
        }
        
        logger.info(f"✅ Lighthouse audit completed for {url} ({device})")
        return result
        
    except Exception as e:
        logger.error(f"❌ Lighthouse error: {e}", exc_info=True)
        raise  # Re-raise exception - NO FALLBACKS


async def audit_both(url: str) -> Dict[str, Dict[str, Any]]:
    """
    Run performance audit for both desktop and mobile.
    
    NO FALLBACKS - If either audit fails, the entire process fails.
    
    Args:
        url: Website URL to audit
        
    Returns:
        Dictionary with desktop and mobile results
        
    Raises:
        Exception: If either desktop or mobile audit fails
    """
    # Run parallel
    desktop_task = audit_url(url, "desktop")
    mobile_task = audit_url(url, "mobile")
    
    results = await asyncio.gather(desktop_task, mobile_task)
    
    return {
        "desktop": results[0],
        "mobile": results[1],
    }
