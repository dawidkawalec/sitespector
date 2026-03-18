"""
CSS styles for PDF report generation via WeasyPrint.
"""


def get_pdf_css(accent_color: str = "#ff8945") -> str:
    """Return the complete CSS string for the PDF report."""
    css = """
@font-face {
    font-family: "DejaVu Sans";
    src: local("DejaVu Sans");
}

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
        content: element(footer-brand);
        vertical-align: middle;
    }
    @bottom-right {
        content: element(footer-text);
        vertical-align: middle;
    }
    @bottom-center {
        content: "Strona " counter(page) " z " counter(pages);
        font-size: 7.3pt;
        color: #94a3b8;
    }
}

@page :first {
    margin: 0;
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
}
#running-footer-brand {
    position: running(footer-brand);
}
#running-footer-text {
    position: running(footer-text);
    text-align: right;
}
.running-logo-image {
    height: 11px;
    width: auto;
}
.running-footer-logo-image {
    height: 14px;
    width: auto;
    flex-shrink: 0;
}
.running-footer-contact {
    font-size: 7.4pt;
    color: #94a3b8;
    white-space: nowrap;
}
#running-header-right {
    position: running(header-right);
    text-align: right;
}

/* ========== RESET & BASE ========== */
*, *::before, *::after { box-sizing: border-box; }

body {
    font-family: 'DejaVu Sans', 'Liberation Sans', sans-serif;
    font-size: 9.5pt;
    line-height: 1.6;
    color: #334155;
    background: #ffffff;
    margin: 0;
    padding: 0;
}
p,
li,
td,
th {
    overflow-wrap: anywhere;
}

/* ========== TYPOGRAPHY ========== */
h1 {
    font-size: 26pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 12px 0;
    line-height: 1.1;
    letter-spacing: -0.02em;
}
h2 {
    font-size: 16pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
    page-break-after: avoid;
    line-height: 1.2;
    letter-spacing: -0.01em;
}
h3 {
    font-size: 12.5pt;
    font-weight: 600;
    color: #1e293b;
    margin: 24px 0 12px 0;
    page-break-after: avoid;
    letter-spacing: -0.01em;
}
h4 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #334155;
    margin: 16px 0 8px 0;
    page-break-after: avoid;
}
p {
    margin: 0 0 10px 0;
}
ul, ol {
    margin: 8px 0 12px 0;
    padding-left: 20px;
}
li {
    margin-bottom: 6px;
}

/* ========== PAGE BREAKS ========== */
.page-break { page-break-before: always; }
.no-break { page-break-inside: avoid; }
.section { page-break-before: always; }
.section:first-child { page-break-before: auto; }

/* ========== COVER PAGE ========== */
.cover-page {
    page-break-after: always;
    background: #f8fafc;
    color: #0f172a;
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 26mm 22mm 18mm 22mm;
    position: relative;
    overflow: hidden;
    text-align: center;
    font-family: Arial, Helvetica, 'Liberation Sans', sans-serif;
}
.cover-main {
    width: 100%;
    max-width: 140mm;
    margin: 0 auto;
    padding-top: 6mm;
    padding-bottom: 26mm;
}
.cover-logo-wrap {
    margin-bottom: 30px;
}
.cover-logo-image {
    width: auto;
    max-width: 100%;
    height: 24mm;
}
.cover-title {
    font-size: 16pt;
    font-weight: 400;
    color: #475569;
    margin: 0 0 20px 0;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    font-family: Arial, Helvetica, 'Liberation Sans', sans-serif;
}
.cover-divider {
    width: 54px;
    height: 0;
    margin: 0 auto 24px auto;
    border-top: 2px solid {{ACCENT_COLOR}};
}
.cover-url-box {
    width: 100%;
    max-width: 130mm;
    margin: 0 auto;
}
.cover-url {
    font-size: 20pt;
    font-weight: 700;
    color: #0f172a;
    overflow-wrap: anywhere;
    word-break: normal;
    line-height: 1.25;
    margin-bottom: 14px;
    letter-spacing: -0.02em;
    font-family: Arial, Helvetica, 'Liberation Sans', sans-serif;
}
.cover-date {
    font-size: 9.5pt;
    color: #475569;
    line-height: 1.35;
    margin-top: 4px;
    font-family: Arial, Helvetica, 'Liberation Sans', sans-serif;
}
.cover-report-type {
    display: inline-block;
    background: #e2e8f0;
    color: #1e3a8a;
    padding: 6px 20px;
    border-radius: 9999px;
    font-size: 8.5pt;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin: 6px 0 20px 0;
    font-family: Arial, Helvetica, 'Liberation Sans', sans-serif;
}
.cover-footer-note {
    position: absolute;
    left: 22mm;
    right: 22mm;
    bottom: 10mm;
    color: #64748b;
    font-size: 8.5pt;
    line-height: 1.4;
    font-family: Arial, Helvetica, 'Liberation Sans', sans-serif;
}
.cover-footer-logo {
    height: 8mm;
    width: auto;
    margin-bottom: 2mm;
}

/* ========== TABLE OF CONTENTS ========== */
.toc-container {
    padding: 10px 20px;
}
.toc-part {
    margin-bottom: 24px;
}
.toc-part-label {
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 1px;
    margin-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 6px;
}
.toc-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 9.5pt;
    color: #334155;
}
.toc-num { font-weight: 600; color: #64748b; margin-right: 12px; font-variant-numeric: tabular-nums; }
.toc-dots { flex: 1; border-bottom: 1px dotted #e2e8f0; margin: 0 12px; height: 0.6em; }
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
    gap: 16px;
    margin-bottom: 32px;
    flex-wrap: wrap;
}
.score-card {
    flex: 1;
    min-width: 100px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px 16px;
    text-align: center;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.score-value {
    font-size: 32pt;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 8px;
    letter-spacing: -0.03em;
}
.score-label {
    font-size: 7.5pt;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.score-badge {
    display: inline-block;
    margin-top: 8px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 7pt;
    font-weight: 600;
}

/* ========== METRIC GRID ========== */
.metric-grid {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 24px;
}
.metric-card {
    flex: 1;
    min-width: 90px;
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px 12px;
    text-align: center;
    page-break-inside: avoid;
}
.metric-value {
    font-size: 16pt;
    font-weight: 700;
    color: #0f172a;
    line-height: 1;
    letter-spacing: -0.02em;
}
.metric-label {
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 6px;
    font-weight: 500;
}

/* ========== TWO-COLUMN LAYOUT ========== */
.two-col {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
}
.two-col > * { flex: 1; }
.col-narrow { flex: 0.6 !important; }
.col-wide { flex: 1.4 !important; }

/* ========== TABLES ========== */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 8.5pt;
    table-layout: auto;
    page-break-inside: auto;
}
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th {
    background: #f8fafc;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    font-size: 7pt;
    letter-spacing: 0.05em;
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}
td {
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
    word-break: normal;
    overflow-wrap: anywhere;
    hyphens: none;
    color: #334155;
}
tr:last-child td { border-bottom: none; }
.td-url {
    font-size: 7.5pt;
    font-family: 'DejaVu Sans Mono', monospace;
    word-break: normal;
    overflow-wrap: anywhere;
    white-space: normal;
    color: #475569;
}
.td-center { text-align: center; }
.td-right { text-align: right; }
.td-bold { font-weight: 600; color: #0f172a; }
.td-small { font-size: 7.5pt; color: #64748b; }

/* ========== BADGES ========== */
.badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 7pt;
    font-weight: 600;
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
    padding: 16px 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    margin: 16px 0;
    page-break-inside: avoid;
}
.alert-critical { background: #fef2f2; border-color: #fecaca; }
.alert-warning  { background: #fffbeb; border-color: #fde68a; }
.alert-success  { background: #f0fdf4; border-color: #bbf7d0; }
.alert-ai       { background: #fcfaff; border-color: #ede9fe; }
.alert-info     { background: #f0f9ff; border-color: #bae6fd; }

.alert-title {
    font-weight: 600;
    font-size: 9.5pt;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.alert-ai .alert-title { color: #6d28d9; }
.alert-critical .alert-title { color: #b91c1c; }
.alert-warning .alert-title { color: #b45309; }

.alert p { margin: 4px 0 0 0; color: #334155; }
.alert ul { margin: 8px 0 0 0; color: #334155; }

/* ========== PROGRESS BAR ========== */
.progress-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}
.progress-label { font-size: 8.5pt; color: #475569; min-width: 140px; }
.progress-bar-outer {
    flex: 1;
    background: #f1f5f9;
    border-radius: 9999px;
    height: 6px;
}
.progress-bar-inner {
    height: 6px;
    border-radius: 9999px;
    background: #3b82f6;
}
.progress-value { font-size: 8.5pt; font-weight: 600; min-width: 36px; text-align: right; color: #0f172a; }

/* ========== CHART CONTAINERS ========== */
.chart-container {
    text-align: center;
    margin: 20px 0;
    page-break-inside: avoid;
}
.chart-container img {
    max-width: 100%;
    height: auto;
}
.chart-caption {
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 8px;
    text-align: center;
}
.chart-pair {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}
.chart-pair > .chart-container { flex: 1; }

/* ========== SECTION PART HEADER ========== */
.part-header {
    margin-bottom: 32px;
    page-break-after: avoid;
    padding-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;
}
.part-header-num {
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 1px;
    margin-bottom: 8px;
}
.part-header-title {
    font-size: 22pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    border: none;
    padding: 0;
    letter-spacing: -0.02em;
}
.part-header-subtitle {
    font-size: 10pt;
    color: #64748b;
    margin-top: 8px;
}

/* ========== QUICK WINS / TASK CARDS ========== */
.task-card {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    page-break-inside: avoid;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.task-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
    gap: 16px;
}
.task-card-title {
    font-weight: 600;
    font-size: 10pt;
    color: #0f172a;
    flex: 1;
}
.task-card-badges { display: flex; gap: 6px; white-space: nowrap; }
.task-card-desc { font-size: 8.5pt; color: #475569; margin: 0; line-height: 1.5; }
.task-card-meta { font-size: 7.5pt; color: #94a3b8; margin-top: 8px; font-weight: 500; }

/* ========== ROADMAP ========== */
.roadmap-col-header {
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 14px;
    border-radius: 10px 10px 0 0;
    margin-bottom: 10px;
}
.roadmap-immediate { background: #fef2f2; color: #991b1b; }
.roadmap-short     { background: #fffbeb; color: #b45309; }
.roadmap-medium    { background: #f0fdf4; color: #166534; }
.roadmap-long      { background: #f0f9ff; color: #0369a1; }

.roadmap-item {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 8px;
    page-break-inside: avoid;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.roadmap-item-title { font-weight: 600; font-size: 9pt; color: #0f172a; margin-bottom: 4px; }
.roadmap-item-desc  { font-size: 8pt; color: #64748b; margin: 0; line-height: 1.4; }

/* ========== UTILITY ========== */
.text-muted   { color: #64748b; }
.text-small   { font-size: 8pt; }
.text-center  { text-align: center; }
.text-right   { text-align: right; }
.text-bold    { font-weight: 600; }
.text-italic  { font-style: italic; }
.mt-8  { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
.mb-8  { margin-bottom: 8px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }

.list-clean { list-style: none; padding: 0; margin: 0; }
.list-clean li { padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
.list-clean li:last-child { border-bottom: none; }

.chip {
    display: inline-block;
    background: #f1f5f9;
    color: #475569;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 7.5pt;
    font-weight: 500;
    margin: 2px;
}
.chip-blue   { background: #eff6ff; color: #1d4ed8; }
.chip-orange { background: #fff7ed; color: #c2410c; }
.chip-green  { background: #f0fdf4; color: #166534; }

.divider {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 24px 0;
}

/* ========== APPENDIX TABLES ========== */
.appendix-table th { font-size: 7pt; padding: 8px 10px; }
.appendix-table td { font-size: 7.5pt; padding: 8px 10px; }
.appendix-table { table-layout: auto; }

/* ========== INFO BOXES ========== */
.info-box {
    background: #f8fafc;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 12px 0 20px 0;
    font-size: 8.5pt;
    color: #475569;
    line-height: 1.5;
}
.info-box p { margin: 0; }
.info-box strong { color: #1e293b; font-weight: 600; }

.info-box-light {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 10px 0 16px 0;
    font-size: 8pt;
    color: #64748b;
    line-height: 1.5;
}
.info-box-light p { margin: 0; }
.info-box-light strong { color: #334155; font-weight: 500; }

/* ========== CODE BLOCKS ========== */
.code-block {
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 7.2pt;
    line-height: 1.45;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    page-break-inside: avoid;
    margin: 10px 0 16px 0;
}
.code-block code {
    font-family: "DejaVu Sans Mono", "Liberation Mono", monospace;
}

"""
    return css.replace("{{ACCENT_COLOR}}", accent_color)
