"""
PDF generation service using Jinja2 and WeasyPrint.
"""

import logging
from pathlib import Path
from typing import Dict, Any
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

# Setup Jinja2 environment
template_dir = Path(__file__).parent.parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))


async def generate_pdf(audit_id: str, audit_data: Dict[str, Any]) -> str:
    """
    Generate PDF report for an audit.
    
    Args:
        audit_id: Audit UUID
        audit_data: Complete audit data including results
        
    Returns:
        Path to generated PDF file
        
    Raises:
        Exception: If PDF generation fails
    """
    logger.info(f"Generating PDF for audit {audit_id}")
    
    try:
        # Load template
        template = jinja_env.get_template("report.html")
        
        # Prepare template context
        context = {
            "audit": audit_data,
            "generated_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "app_name": settings.APP_NAME,
            **_extract_report_data(audit_data),
        }
        
        # Render HTML
        html_content = template.render(context)
        
        # Generate PDF
        pdf_filename = f"audit_{audit_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_path = Path(settings.PDF_STORAGE_PATH) / pdf_filename
        
        # Ensure output directory exists
        pdf_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert HTML to PDF
        HTML(string=html_content).write_pdf(
            pdf_path,
            stylesheets=[_get_pdf_css()],
        )
        
        logger.info(f"✅ PDF generated successfully: {pdf_path}")
        return str(pdf_path)
        
    except Exception as e:
        logger.error(f"❌ Failed to generate PDF for audit {audit_id}: {e}", exc_info=True)
        raise


def _extract_report_data(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and structure data for PDF report.
    
    Args:
        audit_data: Raw audit data from database
        
    Returns:
        Structured data for PDF template
    """
    # Helper to safely get nested dicts
    def get_safe(d, *keys):
        for k in keys:
            if not isinstance(d, dict): return {}
            d = d.get(k, {})
        return d

    results = audit_data.get("results") or {}
    
    # Default mock structures if data is missing to prevent template errors
    default_seo = {
        "title": "N/A", "meta_description": "N/A", "h1_tags": [], "status_code": 0,
        "load_time": 0, "word_count": 0, "size_bytes": 0, "error": "No data"
    }
    
    seo_data = results.get("crawl") or default_seo
    
    lighthouse = results.get("lighthouse") or {}
    desktop_data = lighthouse.get("desktop") or {}
    mobile_data = lighthouse.get("mobile") or {}
    
    content_analysis = results.get("content_analysis") or {
        "quality_score": 0, "readability_score": 0, "word_count": 0, 
        "summary": "Analysis failed or incomplete.", "recommendations": []
    }

    return {
        "seo_data": seo_data,
        "performance_desktop": desktop_data,
        "performance_mobile": mobile_data,
        "content_analysis": content_analysis,
        "local_seo": results.get("local_seo") or {},
        "performance_analysis": results.get("performance_analysis") or {},
        "competitive_analysis": results.get("competitive_analysis") or {},
    }


def _get_pdf_css() -> CSS:
    """
    Get CSS styling for PDF.
    
    Returns:
        CSS object for WeasyPrint
    """
    css_content = """
    @page {
        size: A4;
        margin: 2cm;
    }
    
    body {
        font-family: 'Inter', 'Helvetica', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
    }
    
    h1 {
        font-size: 24pt;
        font-weight: bold;
        color: #000;
        margin-bottom: 0.5em;
    }
    
    h2 {
        font-size: 18pt;
        font-weight: bold;
        color: #222;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        page-break-after: avoid;
    }
    
    h3 {
        font-size: 14pt;
        font-weight: 600;
        color: #444;
        margin-top: 1em;
        margin-bottom: 0.3em;
    }
    
    .score-high {
        color: #16a34a;
        font-weight: bold;
    }
    
    .score-medium {
        color: #ca8a04;
        font-weight: bold;
    }
    
    .score-low {
        color: #dc2626;
        font-weight: bold;
    }
    
    .recommendation {
        background-color: #f0f9ff;
        border-left: 4px solid #3b82f6;
        padding: 1em;
        margin: 1em 0;
    }
    
    code {
        background-color: #f3f4f6;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 10pt;
    }
    
    pre {
        background-color: #1f2937;
        color: #f3f4f6;
        padding: 1em;
        border-radius: 5px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 9pt;
        line-height: 1.4;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
    }
    
    th, td {
        border: 1px solid #e5e7eb;
        padding: 0.5em;
        text-align: left;
    }
    
    th {
        background-color: #f3f4f6;
        font-weight: 600;
    }
    
    .cover-page {
        page-break-after: always;
        text-align: center;
        padding-top: 30%;
    }
    
    .page-break {
        page-break-before: always;
    }
    """
    
    return CSS(string=css_content)

