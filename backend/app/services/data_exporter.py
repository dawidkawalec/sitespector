"""
Raw data export service.
"""

import logging
import json
from pathlib import Path
from typing import Dict, Any
import zipfile
import io
from app.config import settings

logger = logging.getLogger(__name__)

def export_raw_data(audit_id: str, audit_data: Dict[str, Any]) -> str:
    """
    Create a ZIP file containing all raw audit data.
    
    Args:
        audit_id: Audit UUID
        audit_data: Complete audit data
        
    Returns:
        Path to generated ZIP file
    """
    logger.info(f"Exporting raw data for audit {audit_id}")
    
    try:
        zip_filename = f"audit_{audit_id}_raw.zip"
        zip_path = Path(settings.PDF_STORAGE_PATH) / zip_filename
        
        # Ensure output directory exists
        zip_path.parent.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # 1. Main audit JSON
            zipf.writestr("audit_summary.json", json.dumps(audit_data, indent=2, default=str))
            
            # 2. Raw Crawl Data
            results = audit_data.get("results", {})
            crawl_data = results.get("crawl", {})
            zipf.writestr("screaming_frog_crawl.json", json.dumps(crawl_data, indent=2, default=str))
            
            # 3. Lighthouse Data (Desktop)
            lighthouse = results.get("lighthouse", {})
            lh_desktop = lighthouse.get("desktop", {})
            zipf.writestr("lighthouse_desktop.json", json.dumps(lh_desktop, indent=2, default=str))
            
            # 4. Lighthouse Data (Mobile)
            lh_mobile = lighthouse.get("mobile", {})
            zipf.writestr("lighthouse_mobile.json", json.dumps(lh_mobile, indent=2, default=str))
            
            # 5. AI Analysis
            ai_data = {
                "content": results.get("content_analysis"),
                "local_seo": results.get("local_seo"),
                "performance": results.get("performance_analysis"),
                "competitive": results.get("competitive_analysis")
            }
            zipf.writestr("ai_analysis.json", json.dumps(ai_data, indent=2, default=str))
            
            # 6. HTML Content (Placeholder for now, as we don't store raw HTML in DB)
            # If we had it, we'd write it here:
            # zipf.writestr("homepage.html", raw_html_content)
            
        logger.info(f"✅ Raw data exported: {zip_path}")
        return str(zip_path)
        
    except Exception as e:
        logger.error(f"❌ Failed to export raw data: {e}", exc_info=True)
        raise

