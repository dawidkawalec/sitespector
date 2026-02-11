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
                zipf.writestr("screaming_frog/crawl.json", json.dumps(crawl_data, indent=2, default=str))
                
                # Export individual SF raw tabs as separate files
                sf_raw_tabs = crawl_data.get("sf_raw_tabs", {})
                for tab_name, tab_data in sf_raw_tabs.items():
                    if tab_data:
                        zipf.writestr(
                            f"screaming_frog/tabs/{tab_name}.json",
                            json.dumps(tab_data, indent=2, default=str)
                        )
            else:
                logger.warning("⚠️ No crawl data to export")
            
            # 3. Lighthouse Data
            lighthouse = results.get("lighthouse", {})
            if lighthouse:
                lh_desktop = lighthouse.get("desktop", {})
                if lh_desktop:
                    zipf.writestr("lighthouse/desktop.json", json.dumps(lh_desktop, indent=2, default=str))
                
                lh_mobile = lighthouse.get("mobile", {})
                if lh_mobile:
                    zipf.writestr("lighthouse/mobile.json", json.dumps(lh_mobile, indent=2, default=str))
            else:
                logger.warning("⚠️ No Lighthouse data to export")
            
            # 4. Senuto Data
            senuto_data = results.get("senuto", {})
            if senuto_data:
                visibility = senuto_data.get("visibility", {})
                backlinks = senuto_data.get("backlinks", {})
                if visibility:
                    zipf.writestr("senuto/visibility.json", json.dumps(visibility, indent=2, default=str))
                if backlinks:
                    zipf.writestr("senuto/backlinks.json", json.dumps(backlinks, indent=2, default=str))
            
            # 5. AI Analysis (legacy)
            ai_data = {
                "content": results.get("content_analysis"),
                "local_seo": results.get("local_seo"),
                "performance": results.get("performance_analysis"),
                "competitive": results.get("competitive_analysis")
            }
            zipf.writestr("ai_analysis/legacy.json", json.dumps(ai_data, indent=2, default=str))
            
            # 6. AI Strategy (new contextual)
            ai_contexts = results.get("ai_contexts", {})
            if ai_contexts:
                for area, context_data in ai_contexts.items():
                    if context_data:
                        zipf.writestr(
                            f"ai_strategy/contexts/{area}.json",
                            json.dumps(context_data, indent=2, default=str)
                        )
            
            exec_summary = results.get("executive_summary")
            if exec_summary:
                zipf.writestr("ai_strategy/executive_summary.json", json.dumps(exec_summary, indent=2, default=str))
            
            roadmap = results.get("roadmap")
            if roadmap:
                zipf.writestr("ai_strategy/roadmap.json", json.dumps(roadmap, indent=2, default=str))
            
            cross_tool = results.get("cross_tool")
            if cross_tool:
                zipf.writestr("ai_strategy/cross_tool.json", json.dumps(cross_tool, indent=2, default=str))
            
        logger.info(f"✅ Raw data exported: {zip_path}")
        return str(zip_path)
        
    except Exception as e:
        logger.error(f"❌ Failed to export raw data: {e}", exc_info=True)
        raise

