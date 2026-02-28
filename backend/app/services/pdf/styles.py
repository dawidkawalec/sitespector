"""
CSS styles for PDF report generation via WeasyPrint.
"""


def get_pdf_css() -> str:
    """Return the complete CSS string for the PDF report."""
    return """
/* ========== PAGE SETUP ========== */
@page {
    size: A4;
    margin: 2.2cm 1.8cm 2.5cm 1.8cm;

    @top-left {
        content: element(header-logo);
        vertical-align: middle;
    }
    @top-right {
        content: element(header-right);
        vertical-align: middle;
        font-size: 7.5pt;
        color: #64748b;
        white-space: nowrap;
    }
    @bottom-left {
        content: "SiteSpector — Profesjonalny Audyt SEO & AI  |  sitespector.pl  |  kontakt@sitespector.pl";
        font-size: 7pt;
        color: #94a3b8;
    }
    @bottom-right {
        content: "Strona " counter(page) " z " counter(pages);
        font-size: 7.5pt;
        color: #94a3b8;
    }
    @bottom-center {
        content: "";
        border-top: 1px solid #e2e8f0;
        width: 100%;
    }
}

@page :first {
    @top-left { content: none; }
    @top-right { content: none; }
    @bottom-left { content: none; }
    @bottom-right { content: none; }
    @bottom-center { content: none; }
}

/* Running header elements */
#running-header-logo {
    position: running(header-logo);
    display: flex;
    align-items: center;
    gap: 6px;
}
#running-header-right {
    position: running(header-right);
    text-align: right;
}

/* ========== RESET & BASE ========== */
*, *::before, *::after { box-sizing: border-box; }

body {
    font-family: 'DejaVu Sans', 'Liberation Sans', 'Helvetica', 'Arial', sans-serif;
    font-size: 9.5pt;
    line-height: 1.55;
    color: #1e293b;
    background: #ffffff;
    margin: 0;
    padding: 0;
}

/* ========== TYPOGRAPHY ========== */
h1 {
    font-size: 28pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 12px 0;
    line-height: 1.1;
}
h2 {
    font-size: 17pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 3px solid #3b82f6;
    page-break-after: avoid;
    line-height: 1.2;
}
h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #1e293b;
    margin: 20px 0 10px 0;
    padding-left: 10px;
    border-left: 4px solid #3b82f6;
    page-break-after: avoid;
}
h4 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #334155;
    margin: 14px 0 6px 0;
    page-break-after: avoid;
}
p {
    margin: 0 0 8px 0;
}
ul, ol {
    margin: 6px 0 10px 0;
    padding-left: 20px;
}
li {
    margin-bottom: 4px;
}

/* ========== PAGE BREAKS ========== */
.page-break { page-break-before: always; }
.no-break { page-break-inside: avoid; }
.section { page-break-before: always; }
.section:first-child { page-break-before: auto; }

/* ========== COVER PAGE ========== */
.cover-page {
    page-break-after: always;
    background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%);
    color: #ffffff;
    min-height: 26cm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px 40px;
    margin: -2.2cm -1.8cm -2.5cm -1.8cm;
}
.cover-logo {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 48px;
}
.cover-logo-icon {
    width: 64px;
    height: 64px;
    background: #ff8945;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
}
.cover-logo-text {
    font-size: 28pt;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
}
.cover-title {
    font-size: 14pt;
    font-weight: 300;
    color: #94a3b8;
    margin-bottom: 60px;
    letter-spacing: 0.5px;
}
.cover-url-box {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 16px;
    padding: 32px 48px;
    margin-bottom: 48px;
    backdrop-filter: blur(10px);
}
.cover-url {
    font-size: 16pt;
    font-weight: 700;
    color: #ff8945;
    word-break: break-all;
    margin-bottom: 10px;
}
.cover-date {
    font-size: 9pt;
    color: #94a3b8;
}
.cover-report-type {
    display: inline-block;
    background: #3b82f6;
    color: #ffffff;
    padding: 8px 24px;
    border-radius: 9999px;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 20px;
}

/* ========== TABLE OF CONTENTS ========== */
.toc-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 28px 32px;
}
.toc-part {
    margin-bottom: 18px;
}
.toc-part-label {
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
}
.toc-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px dashed #e2e8f0;
    font-size: 9.5pt;
    color: #334155;
}
.toc-item:last-child { border-bottom: none; }
.toc-num { font-weight: 700; color: #3b82f6; margin-right: 10px; }
.toc-dots { flex: 1; border-bottom: 1px dotted #cbd5e1; margin: 0 10px; height: 0.6em; }
.toc-skipped {
    color: #94a3b8;
    font-style: italic;
    font-size: 8.5pt;
    padding: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* ========== SCORE CARDS ========== */
.scores-grid {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}
.score-card {
    flex: 1;
    min-width: 100px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px 12px;
    text-align: center;
    page-break-inside: avoid;
}
.score-value {
    font-size: 30pt;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 4px;
}
.score-label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.score-badge {
    display: inline-block;
    margin-top: 6px;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 7pt;
    font-weight: 700;
}

/* ========== METRIC GRID ========== */
.metric-grid {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}
.metric-card {
    flex: 1;
    min-width: 90px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 10px;
    text-align: center;
    page-break-inside: avoid;
}
.metric-value {
    font-size: 17pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
}
.metric-label {
    font-size: 7pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-top: 4px;
}

/* ========== TWO-COLUMN LAYOUT ========== */
.two-col {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}
.two-col > * { flex: 1; }
.col-narrow { flex: 0.6 !important; }
.col-wide { flex: 1.4 !important; }

/* ========== TABLES ========== */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8.5pt;
    page-break-inside: auto;
}
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th {
    background: #f1f5f9;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    font-size: 7.5pt;
    letter-spacing: 0.3px;
    padding: 8px 10px;
    text-align: left;
    border: 1px solid #e2e8f0;
}
td {
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
    word-break: break-word;
}
tr:nth-child(even) td { background: #f8fafc; }
tr:hover td { background: #f1f5f9; }
.td-url { font-size: 7.5pt; font-family: 'DejaVu Sans Mono', monospace; word-break: break-all; }
.td-center { text-align: center; }
.td-right { text-align: right; }
.td-bold { font-weight: 700; }
.td-small { font-size: 7.5pt; color: #64748b; }

/* ========== BADGES ========== */
.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 7pt;
    font-weight: 700;
    white-space: nowrap;
}
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef9c3; color: #854d0e; }
.badge-danger  { background: #fee2e2; color: #991b1b; }
.badge-info    { background: #e0f2fe; color: #0369a1; }
.badge-purple  { background: #f5f3ff; color: #5b21b6; }
.badge-gray    { background: #f1f5f9; color: #475569; }

/* ========== ALERT / RECOMMENDATION BOXES ========== */
.alert {
    padding: 14px 16px;
    border-radius: 10px;
    border-left: 5px solid #3b82f6;
    background: #eff6ff;
    margin: 10px 0;
    page-break-inside: avoid;
}
.alert-critical { border-left-color: #ef4444; background: #fef2f2; }
.alert-warning  { border-left-color: #f59e0b; background: #fffbeb; }
.alert-success  { border-left-color: #10b981; background: #f0fdf4; }
.alert-ai       { border-left-color: #8b5cf6; background: #f5f3ff; }
.alert-info     { border-left-color: #3b82f6; background: #eff6ff; }

.alert-title {
    font-weight: 700;
    font-size: 9.5pt;
    margin-bottom: 4px;
    display: block;
}
.alert p { margin: 4px 0 0 0; }
.alert ul { margin: 6px 0 0 0; }

/* ========== PROGRESS BAR ========== */
.progress-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}
.progress-label { font-size: 8.5pt; color: #334155; min-width: 140px; }
.progress-bar-outer {
    flex: 1;
    background: #e2e8f0;
    border-radius: 9999px;
    height: 8px;
}
.progress-bar-inner {
    height: 8px;
    border-radius: 9999px;
    background: #3b82f6;
}
.progress-value { font-size: 8.5pt; font-weight: 700; min-width: 36px; text-align: right; }

/* ========== CHART CONTAINERS ========== */
.chart-container {
    text-align: center;
    margin: 14px 0;
    page-break-inside: avoid;
}
.chart-container img {
    max-width: 100%;
    height: auto;
}
.chart-caption {
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 6px;
    text-align: center;
    font-style: italic;
}
.chart-pair {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
}
.chart-pair > .chart-container { flex: 1; }

/* ========== SECTION PART HEADER ========== */
.part-header {
    background: #0f172a;
    color: #ffffff;
    padding: 20px 24px;
    border-radius: 12px;
    margin-bottom: 28px;
    page-break-after: avoid;
}
.part-header-num {
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #ff8945;
    letter-spacing: 1px;
    margin-bottom: 4px;
}
.part-header-title {
    font-size: 20pt;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    border: none;
    padding: 0;
}
.part-header-subtitle {
    font-size: 9pt;
    color: #94a3b8;
    margin-top: 4px;
}

/* ========== QUICK WINS / TASK CARDS ========== */
.task-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 10px;
    page-break-inside: avoid;
    background: #ffffff;
}
.task-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;
    gap: 12px;
}
.task-card-title {
    font-weight: 700;
    font-size: 9.5pt;
    color: #0f172a;
    flex: 1;
}
.task-card-badges { display: flex; gap: 4px; white-space: nowrap; }
.task-card-desc { font-size: 8.5pt; color: #475569; margin: 0; }
.task-card-meta { font-size: 7.5pt; color: #94a3b8; margin-top: 6px; }

/* ========== ROADMAP ========== */
.roadmap-col-header {
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 12px;
    border-radius: 8px 8px 0 0;
    margin-bottom: 8px;
}
.roadmap-immediate { background: #fee2e2; color: #991b1b; }
.roadmap-short     { background: #fef9c3; color: #854d0e; }
.roadmap-medium    { background: #dcfce7; color: #166534; }
.roadmap-long      { background: #e0f2fe; color: #0369a1; }

.roadmap-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 6px;
    page-break-inside: avoid;
}
.roadmap-item-title { font-weight: 600; font-size: 9pt; color: #0f172a; }
.roadmap-item-desc  { font-size: 8pt; color: #64748b; margin-top: 3px; }

/* ========== UTILITY ========== */
.text-muted   { color: #64748b; }
.text-small   { font-size: 8pt; }
.text-center  { text-align: center; }
.text-right   { text-align: right; }
.text-bold    { font-weight: 700; }
.text-italic  { font-style: italic; }
.mt-8  { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
.mb-8  { margin-bottom: 8px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }

.list-clean { list-style: none; padding: 0; margin: 0; }
.list-clean li { padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
.list-clean li:last-child { border-bottom: none; }

.chip {
    display: inline-block;
    background: #f1f5f9;
    color: #334155;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 7.5pt;
    font-weight: 600;
    margin: 2px;
}
.chip-blue   { background: #eff6ff; color: #1d4ed8; }
.chip-orange { background: #fff7ed; color: #c2410c; }
.chip-green  { background: #f0fdf4; color: #166534; }

.divider {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 16px 0;
}

/* ========== APPENDIX TABLES ========== */
.appendix-table th { font-size: 7pt; }
.appendix-table td { font-size: 7.5pt; padding: 5px 8px; }

/* ========== INFO BOXES ========== */
.info-box {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    border-radius: 4px;
    padding: 10px 14px;
    margin: 10px 0 16px 0;
    font-size: 8.5pt;
    color: #1e40af;
    line-height: 1.5;
}
.info-box p { margin: 0; }
.info-box strong { color: #1e3a8a; }

.info-box-light {
    background: #f8fafc;
    border-left: 3px solid #94a3b8;
    border-radius: 4px;
    padding: 8px 12px;
    margin: 8px 0 12px 0;
    font-size: 8pt;
    color: #475569;
    line-height: 1.5;
}
.info-box-light p { margin: 0; }
.info-box-light strong { color: #334155; }

"""
