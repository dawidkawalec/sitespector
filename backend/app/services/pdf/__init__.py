"""
PDF report generation package for SiteSpector.
Supports three report types: executive, standard, full.
"""

from .generator import generate_pdf

__all__ = ["generate_pdf"]
