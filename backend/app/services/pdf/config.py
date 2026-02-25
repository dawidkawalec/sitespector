"""
Report type configurations for PDF generation.
Defines which sections and data limits apply for each report type.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class SectionConfig:
    """Configuration for a single report section."""
    id: str
    enabled: bool = True
    # Max rows for tables (None = unlimited)
    max_rows: Optional[int] = None
    # Whether to include extended sub-data (e.g., raw tabs, full audits)
    extended: bool = False


@dataclass
class ReportTypeConfig:
    """Configuration for a complete report type."""
    name: str
    label_pl: str
    description_pl: str
    estimated_pages: str
    color: str  # accent color for cover
    sections: List[SectionConfig] = field(default_factory=list)

    def get_section(self, section_id: str) -> Optional[SectionConfig]:
        for s in self.sections:
            if s.id == section_id:
                return s
        return None

    def is_enabled(self, section_id: str) -> bool:
        sc = self.get_section(section_id)
        return sc.enabled if sc else False

    def get_max_rows(self, section_id: str, default: int = 50) -> int:
        sc = self.get_section(section_id)
        if sc and sc.max_rows is not None:
            return sc.max_rows
        return default

    def is_extended(self, section_id: str) -> bool:
        sc = self.get_section(section_id)
        return sc.extended if sc else False


def _make_section(sid: str, enabled: bool = True, max_rows: Optional[int] = None, extended: bool = False) -> SectionConfig:
    return SectionConfig(id=sid, enabled=enabled, max_rows=max_rows, extended=extended)


# ---------- EXECUTIVE ----------
EXECUTIVE = ReportTypeConfig(
    name="executive",
    label_pl="Executive Summary",
    description_pl="Skrócony raport dla zarządu i prezentacji. Zawiera kluczowe wyniki, dashboard metryk i TOP 5 quick wins.",
    estimated_pages="15–25",
    color="#0f172a",
    sections=[
        _make_section("cover"),
        _make_section("toc"),
        _make_section("executive_summary"),
        _make_section("technical_overview", max_rows=0),   # only scores, no tables
        _make_section("performance", max_rows=0),
        _make_section("visibility_overview", max_rows=0),  # only dashboard metrics
        _make_section("content", max_rows=0),
        _make_section("security", max_rows=0),
        _make_section("quick_wins", max_rows=5),
        _make_section("roadmap_immediate"),                # only immediate actions
        _make_section("benchmark"),
        # Disabled sections
        _make_section("on_page_seo", enabled=False),
        _make_section("internal_links", enabled=False),
        _make_section("lighthouse_detail", enabled=False),
        _make_section("accessibility", enabled=False),
        _make_section("keywords", enabled=False),
        _make_section("position_changes", enabled=False),
        _make_section("organic_competitors", enabled=False),
        _make_section("backlinks", enabled=False),
        _make_section("ai_overviews", enabled=False),
        _make_section("ux_mobile", enabled=False),
        _make_section("tech_stack", enabled=False),
        _make_section("ai_insights", enabled=False),
        _make_section("cross_tool", enabled=False),
        _make_section("roadmap_full", enabled=False),
        _make_section("execution_plan", enabled=False),
        _make_section("appendix_pages", enabled=False),
        _make_section("appendix_images", enabled=False),
        _make_section("appendix_keywords", enabled=False),
        _make_section("appendix_backlinks", enabled=False),
    ],
)

# ---------- STANDARD ----------
STANDARD = ReportTypeConfig(
    name="standard",
    label_pl="Standard Report",
    description_pl="Kompletny raport dla zespołów marketingowych. Pełna analiza techniczna, wydajność, widoczność i strategia AI.",
    estimated_pages="50–80",
    color="#1e3a5f",
    sections=[
        _make_section("cover"),
        _make_section("toc"),
        _make_section("executive_summary"),
        _make_section("technical_overview"),
        _make_section("on_page_seo", max_rows=50),
        _make_section("internal_links", max_rows=50),
        _make_section("performance"),
        _make_section("lighthouse_detail", max_rows=10),   # top 10 opportunities
        _make_section("accessibility"),
        _make_section("visibility_overview"),
        _make_section("keywords", max_rows=50),
        _make_section("position_changes", max_rows=20),
        _make_section("organic_competitors"),
        _make_section("backlinks", max_rows=50),
        _make_section("ai_overviews", max_rows=20),
        _make_section("content"),
        _make_section("ux_mobile"),
        _make_section("security"),
        _make_section("tech_stack"),
        _make_section("ai_insights"),
        _make_section("cross_tool"),
        _make_section("quick_wins"),
        _make_section("roadmap_full"),
        _make_section("execution_plan", max_rows=30),
        _make_section("benchmark"),
        _make_section("appendix_pages", max_rows=50),
        _make_section("appendix_images", enabled=False),
        _make_section("appendix_keywords", max_rows=100),
        _make_section("appendix_backlinks", max_rows=50),
    ],
)

# ---------- FULL ----------
FULL = ReportTypeConfig(
    name="full",
    label_pl="Full Audit Report",
    description_pl="Pełny raport techniczny. Wszystkie dane surowe, kompletne tabele keywords i backlinks, pełny execution plan.",
    estimated_pages="80–150+",
    color="#1a0533",
    sections=[
        _make_section("cover"),
        _make_section("toc"),
        _make_section("executive_summary"),
        _make_section("technical_overview"),
        _make_section("on_page_seo", extended=True),       # includes raw SF tabs
        _make_section("internal_links", extended=True),
        _make_section("performance", extended=True),
        _make_section("lighthouse_detail", extended=True), # opportunities + diagnostics + passed
        _make_section("accessibility", extended=True),
        _make_section("visibility_overview", extended=True),
        _make_section("keywords", max_rows=200, extended=True),
        _make_section("position_changes", max_rows=50, extended=True),
        _make_section("organic_competitors", extended=True),
        _make_section("backlinks", max_rows=200, extended=True),
        _make_section("ai_overviews", max_rows=50, extended=True),
        _make_section("content", extended=True),
        _make_section("ux_mobile", extended=True),
        _make_section("security", extended=True),
        _make_section("tech_stack", extended=True),
        _make_section("ai_insights", extended=True),
        _make_section("cross_tool"),
        _make_section("quick_wins"),
        _make_section("roadmap_full"),
        _make_section("execution_plan", extended=True),    # includes fix_data
        _make_section("benchmark"),
        _make_section("appendix_pages"),                   # all pages
        _make_section("appendix_images", max_rows=100),
        _make_section("appendix_keywords", max_rows=200),
        _make_section("appendix_backlinks", max_rows=100),
    ],
)

REPORT_TYPES = {
    "executive": EXECUTIVE,
    "standard": STANDARD,
    "full": FULL,
}

DEFAULT_REPORT_TYPE = "standard"


def get_report_config(report_type: str) -> ReportTypeConfig:
    """Get report configuration by type name. Falls back to standard."""
    return REPORT_TYPES.get(report_type, STANDARD)
