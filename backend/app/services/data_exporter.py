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
    
    NO FALLBACKS - if audit has no results, export fails.
    
    Args:
        audit_id: Audit UUID
        audit_data: Complete audit data
        
    Returns:
        Path to generated ZIP file
        
    Raises:
        ValueError: If audit has no results
    """
    logger.info(f"Exporting raw data for audit {audit_id}")
    
    try:
        # Validate audit has results
        results = audit_data.get("results")
        if not results:
            logger.error(f"❌ Cannot export raw data - audit has no results (status: {audit_data.get('status')})")
            raise ValueError(f"Cannot export raw data - audit has no results (status: {audit_data.get('status')})")
        
        zip_filename = f"audit_{audit_id}_raw.zip"
        zip_path = Path(settings.PDF_STORAGE_PATH) / zip_filename
        
        # Ensure output directory exists
        zip_path.parent.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # 1. Main audit JSON
            zipf.writestr("audit_summary.json", json.dumps(audit_data, indent=2, default=str))

            # 2. Raw Crawl Data
            crawl_data = results.get("crawl", {})
            if crawl_data:
                zipf.writestr("screaming_frog_crawl.json", json.dumps(crawl_data, indent=2, default=str))
            else:
                logger.warning("⚠️ No crawl data to export")
            
            # 3. Lighthouse Data
            lighthouse = results.get("lighthouse", {})
            if lighthouse:
                lh_desktop = lighthouse.get("desktop", {})
                if lh_desktop:
                    zipf.writestr("lighthouse_desktop.json", json.dumps(lh_desktop, indent=2, default=str))
                
                lh_mobile = lighthouse.get("mobile", {})
                if lh_mobile:
                    zipf.writestr("lighthouse_mobile.json", json.dumps(lh_mobile, indent=2, default=str))
            else:
                logger.warning("⚠️ No Lighthouse data to export")
            
            # 4. AI Analysis
            ai_data = {
                "content": results.get("content_analysis"),
                "local_seo": results.get("local_seo"),
                "performance": results.get("performance_analysis"),
                "competitive": results.get("competitive_analysis")
            }
            zipf.writestr("ai_analysis.json", json.dumps(ai_data, indent=2, default=str))
            
        logger.info(f"✅ Raw data exported: {zip_path}")
        return str(zip_path)
        
    except Exception as e:
        logger.error(f"❌ Failed to export raw data: {e}", exc_info=True)
        raise

