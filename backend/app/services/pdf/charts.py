"""
Chart generation for PDF reports using matplotlib.
All functions return base64-encoded SVG strings suitable for embedding in HTML.
"""

import base64
import io
import math
from typing import Dict, List, Optional, Tuple, Any

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch
import numpy as np

# ---- Brand colors ----
COLOR_BLUE   = "#3b82f6"
COLOR_ORANGE = "#ff8945"
COLOR_GREEN  = "#16a34a"
COLOR_YELLOW = "#ca8a04"
COLOR_RED    = "#dc2626"
COLOR_GRAY   = "#94a3b8"
COLOR_BG     = "#ffffff"
COLOR_TEXT   = "#1e293b"
COLOR_LIGHT  = "#f8fafc"
COLOR_BORDER = "#e2e8f0"

PALETTE = [COLOR_BLUE, COLOR_ORANGE, COLOR_GREEN, COLOR_YELLOW, "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"]


def _fig_to_b64_svg(fig: plt.Figure) -> str:
    """Convert matplotlib figure to base64-encoded SVG string."""
    buf = io.BytesIO()
    fig.savefig(buf, format="svg", bbox_inches="tight", facecolor=fig.get_facecolor())
    buf.seek(0)
    svg_bytes = buf.read()
    b64 = base64.b64encode(svg_bytes).decode("utf-8")
    plt.close(fig)
    return f"data:image/svg+xml;base64,{b64}"


def _style_axes(ax: plt.Axes) -> None:
    """Apply common styling to an axes."""
    ax.set_facecolor(COLOR_BG)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(COLOR_BORDER)
    ax.spines["bottom"].set_color(COLOR_BORDER)
    ax.tick_params(colors=COLOR_TEXT, labelsize=7)
    ax.xaxis.label.set_color(COLOR_TEXT)
    ax.yaxis.label.set_color(COLOR_TEXT)


# =====================================================================
# 1. SCORE GAUGE (semi-circle)
# =====================================================================

def score_gauge(score: float, label: str, size: Tuple[float, float] = (3.0, 1.8)) -> str:
    """
    Semi-circle gauge chart for a score 0-100.
    Returns base64 SVG.
    """
    if score < 80:
        color = COLOR_RED if score < 50 else COLOR_YELLOW
    else:
        color = COLOR_GREEN

    fig, ax = plt.subplots(figsize=size, facecolor=COLOR_BG)
    ax.set_aspect("equal")
    ax.axis("off")

    # Background arc
    theta_bg = np.linspace(np.pi, 0, 200)
    ax.plot(np.cos(theta_bg), np.sin(theta_bg), color=COLOR_BORDER, linewidth=12, solid_capstyle="round")

    # Score arc
    ratio = max(0, min(score / 100, 1))
    theta_score = np.linspace(np.pi, np.pi - ratio * np.pi, 200)
    ax.plot(np.cos(theta_score), np.sin(theta_score), color=color, linewidth=12, solid_capstyle="round")

    ax.text(0, 0.05, f"{int(round(score))}", ha="center", va="center",
            fontsize=22, fontweight="bold", color=COLOR_TEXT)
    ax.text(0, -0.22, label, ha="center", va="center", fontsize=7, color="#64748b", fontweight="bold")

    ax.set_xlim(-1.3, 1.3)
    ax.set_ylim(-0.4, 1.2)
    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.2)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 2. PIE CHART
# =====================================================================

def pie_chart(
    labels: List[str],
    values: List[float],
    title: str = "",
    colors: Optional[List[str]] = None,
    size: Tuple[float, float] = (4.5, 3.2),
) -> str:
    """Simple pie chart. Returns base64 SVG."""
    if not values or sum(values) == 0:
        return ""

    colors = colors or PALETTE[: len(values)]
    fig, ax = plt.subplots(figsize=size, facecolor=COLOR_BG)
    wedges, texts, autotexts = ax.pie(
        values,
        labels=None,
        colors=colors,
        autopct=lambda p: f"{p:.1f}%" if p > 3 else "",
        startangle=90,
        wedgeprops={"edgecolor": "white", "linewidth": 1.5},
        pctdistance=0.75,
    )
    for at in autotexts:
        at.set_fontsize(7)
        at.set_color("white")
        at.set_fontweight("bold")

    ax.legend(
        wedges,
        [f"{l} ({v:,.0f})" for l, v in zip(labels, values)],
        loc="center left",
        bbox_to_anchor=(1, 0.5),
        fontsize=7,
        frameon=False,
    )
    if title:
        ax.set_title(title, fontsize=9, fontweight="bold", color=COLOR_TEXT, pad=8)
    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.3)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 3. BAR CHART (vertical)
# =====================================================================

def bar_chart(
    labels: List[str],
    values: List[float],
    title: str = "",
    ylabel: str = "",
    color: str = COLOR_BLUE,
    colors: Optional[List[str]] = None,
    size: Tuple[float, float] = (5.5, 3.5),
    rotate_labels: bool = False,
) -> str:
    """Vertical bar chart. Returns base64 SVG."""
    if not values:
        return ""

    bar_colors = colors or [color] * len(values)
    fig, ax = plt.subplots(figsize=size, facecolor=COLOR_BG)
    _style_axes(ax)
    bars = ax.bar(range(len(labels)), values, color=bar_colors, width=0.6, zorder=2, edgecolor="white")

    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, fontsize=7, rotation=45 if rotate_labels else 0, ha="right" if rotate_labels else "center")
    ax.set_ylabel(ylabel, fontsize=7)
    if title:
        ax.set_title(title, fontsize=9, fontweight="bold", color=COLOR_TEXT, pad=8)
    ax.yaxis.grid(True, alpha=0.4, color=COLOR_BORDER, zorder=1)
    ax.set_axisbelow(True)

    for bar in bars:
        h = bar.get_height()
        if h > 0:
            ax.text(bar.get_x() + bar.get_width() / 2, h + max(h * 0.02, 0.5),
                    f"{h:,.0f}", ha="center", va="bottom", fontsize=6.5, color=COLOR_TEXT)
    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.3)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 4. HORIZONTAL BAR CHART (Core Web Vitals)
# =====================================================================

def horizontal_bar_chart(
    labels: List[str],
    values: List[float],
    colors: Optional[List[str]] = None,
    title: str = "",
    max_value: Optional[float] = None,
    thresholds: Optional[List[Tuple[float, float]]] = None,
    units: Optional[List[str]] = None,
    size: Tuple[float, float] = (5.5, 3.0),
) -> str:
    """Horizontal bar chart. Optionally adds threshold markers for CWV."""
    if not values:
        return ""

    bar_colors = colors or [COLOR_BLUE] * len(values)
    fig, ax = plt.subplots(figsize=size, facecolor=COLOR_BG)
    _style_axes(ax)

    n = len(labels)
    y_pos = range(n)
    mx = max_value or (max(values) * 1.2 if values else 1)

    ax.barh(list(y_pos), values, color=bar_colors, height=0.55, zorder=2, edgecolor="white")

    # Threshold markers
    if thresholds:
        for i, (good_th, poor_th) in enumerate(thresholds):
            if good_th and good_th < mx:
                ax.axvline(good_th, color=COLOR_GREEN, linewidth=0.8, linestyle="--", alpha=0.6, zorder=3)
            if poor_th and poor_th < mx:
                ax.axvline(poor_th, color=COLOR_RED, linewidth=0.8, linestyle="--", alpha=0.6, zorder=3)

    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(labels, fontsize=7.5)
    ax.set_xlim(0, mx * 1.05)
    ax.xaxis.grid(True, alpha=0.4, color=COLOR_BORDER, zorder=1)
    ax.set_axisbelow(True)
    if title:
        ax.set_title(title, fontsize=9, fontweight="bold", color=COLOR_TEXT, pad=8)

    for i, (v, bar_c) in enumerate(zip(values, bar_colors)):
        unit = units[i] if units else ""
        ax.text(v + mx * 0.01, i, f"{v:,.0f}{unit}", va="center", fontsize=7, color=COLOR_TEXT, fontweight="bold")

    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.3)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 5. LINE / AREA CHART (seasonality, trends)
# =====================================================================

def line_chart(
    x_labels: List[str],
    series: List[Dict],  # [{"label": str, "values": List[float], "color": str}]
    title: str = "",
    ylabel: str = "",
    filled: bool = False,
    size: Tuple[float, float] = (6.0, 3.0),
) -> str:
    """Line or area chart. Returns base64 SVG."""
    if not series:
        return ""

    fig, ax = plt.subplots(figsize=size, facecolor=COLOR_BG)
    _style_axes(ax)

    for i, s in enumerate(series):
        vals = s.get("values", [])
        color = s.get("color", PALETTE[i % len(PALETTE)])
        label = s.get("label", "")
        x = range(len(vals))
        ax.plot(x, vals, color=color, linewidth=1.8, label=label, marker="o", markersize=3)
        if filled:
            ax.fill_between(x, vals, alpha=0.12, color=color)

    if x_labels:
        step = max(1, len(x_labels) // 12)
        ticks = list(range(0, len(x_labels), step))
        ax.set_xticks(ticks)
        ax.set_xticklabels([x_labels[i] for i in ticks], fontsize=6.5, rotation=45, ha="right")

    ax.set_ylabel(ylabel, fontsize=7)
    ax.yaxis.grid(True, alpha=0.4, color=COLOR_BORDER)
    ax.set_axisbelow(True)
    if title:
        ax.set_title(title, fontsize=9, fontweight="bold", color=COLOR_TEXT, pad=8)
    if len(series) > 1:
        ax.legend(fontsize=7, frameon=False)

    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.3)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 6. STACKED BAR CHART (wins/losses, status distribution)
# =====================================================================

def stacked_bar_chart(
    categories: List[str],
    series: List[Dict],  # [{"label": str, "values": List[float], "color": str}]
    title: str = "",
    size: Tuple[float, float] = (5.5, 3.0),
    horizontal: bool = False,
) -> str:
    """Stacked bar chart. Returns base64 SVG."""
    if not series or not categories:
        return ""

    fig, ax = plt.subplots(figsize=size, facecolor=COLOR_BG)
    _style_axes(ax)

    bottoms = [0.0] * len(categories)
    for s in series:
        vals = s.get("values", [0] * len(categories))
        color = s.get("color", COLOR_BLUE)
        label = s.get("label", "")
        if horizontal:
            ax.barh(range(len(categories)), vals, left=bottoms, color=color, label=label,
                    height=0.55, edgecolor="white")
        else:
            ax.bar(range(len(categories)), vals, bottom=bottoms, color=color, label=label,
                   width=0.6, edgecolor="white")
        bottoms = [b + v for b, v in zip(bottoms, vals)]

    if horizontal:
        ax.set_yticks(range(len(categories)))
        ax.set_yticklabels(categories, fontsize=7.5)
        ax.xaxis.grid(True, alpha=0.4, color=COLOR_BORDER)
    else:
        ax.set_xticks(range(len(categories)))
        ax.set_xticklabels(categories, fontsize=7.5, rotation=30, ha="right")
        ax.yaxis.grid(True, alpha=0.4, color=COLOR_BORDER)

    ax.set_axisbelow(True)
    ax.legend(fontsize=7, frameon=False, loc="upper right")
    if title:
        ax.set_title(title, fontsize=9, fontweight="bold", color=COLOR_TEXT, pad=8)

    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.3)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 7. IMPACT/EFFORT SCATTER MATRIX
# =====================================================================

def impact_effort_matrix(
    items: List[Dict],  # [{"title": str, "impact": "high/medium/low", "effort": "easy/medium/hard"}]
    size: Tuple[float, float] = (5.5, 4.0),
) -> str:
    """Scatter plot showing items on impact vs effort matrix."""
    if not items:
        return ""

    impact_map = {"high": 3, "medium": 2, "low": 1}
    effort_map  = {"easy": 1, "medium": 2, "hard": 3}
    color_map   = {"high": COLOR_RED, "medium": COLOR_YELLOW, "low": COLOR_GREEN}

    fig, ax = plt.subplots(figsize=size, facecolor=COLOR_BG)
    _style_axes(ax)

    # Quadrant background
    ax.axhspan(2.5, 3.5, xmin=0, xmax=0.5, alpha=0.06, color=COLOR_GREEN, zorder=0)   # High impact, easy → Quick wins
    ax.axhspan(2.5, 3.5, xmin=0.5, xmax=1, alpha=0.06, color=COLOR_YELLOW, zorder=0)  # High impact, hard → Major projects

    jitter = np.random.RandomState(42)
    plotted: Dict[Tuple, int] = {}

    for item in items[:20]:  # cap at 20 for readability
        impact_str = item.get("impact", "medium")
        effort_str = item.get("effort", "medium")
        x = effort_map.get(effort_str, 2)
        y = impact_map.get(impact_str, 2)

        key = (x, y)
        count = plotted.get(key, 0)
        jx = x + jitter.uniform(-0.12, 0.12) + count * 0.08
        jy = y + jitter.uniform(-0.08, 0.08)
        plotted[key] = count + 1

        color = color_map.get(impact_str, COLOR_GRAY)
        ax.scatter(jx, jy, color=color, s=60, zorder=5, edgecolors="white", linewidths=0.8)

    ax.set_xlim(0.5, 3.5)
    ax.set_ylim(0.5, 3.5)
    ax.set_xticks([1, 2, 3])
    ax.set_xticklabels(["Łatwy", "Średni", "Trudny"], fontsize=7.5)
    ax.set_yticks([1, 2, 3])
    ax.set_yticklabels(["Niski", "Średni", "Wysoki"], fontsize=7.5)
    ax.set_xlabel("Nakład pracy", fontsize=8, color=COLOR_TEXT)
    ax.set_ylabel("Wpływ (Impact)", fontsize=8, color=COLOR_TEXT)
    ax.set_title("Macierz Quick Wins: Wpływ vs Nakład", fontsize=9, fontweight="bold", color=COLOR_TEXT)

    # Legend
    legend_elements = [
        mpatches.Patch(color=COLOR_RED,    label="Wysoki impact"),
        mpatches.Patch(color=COLOR_YELLOW, label="Średni impact"),
        mpatches.Patch(color=COLOR_GREEN,  label="Niski impact"),
    ]
    ax.legend(handles=legend_elements, fontsize=6.5, frameon=False, loc="lower right")

    ax.text(0.65, 3.3, "Quick Wins ✓", fontsize=7, color=COLOR_GREEN, fontstyle="italic")
    ax.text(2.65, 3.3, "Duże projekty", fontsize=7, color=COLOR_YELLOW, fontstyle="italic")

    ax.grid(True, alpha=0.3, color=COLOR_BORDER)
    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.3)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 8. CWV COMPARISON CHART (Desktop vs Mobile)
# =====================================================================

def cwv_comparison_chart(
    desktop: Dict[str, float],
    mobile: Dict[str, float],
    size: Tuple[float, float] = (6.5, 3.5),
) -> str:
    """
    Grouped horizontal bar chart comparing Desktop vs Mobile CWV metrics.
    desktop/mobile: {metric_name: value_ms}
    """
    metrics = []
    d_vals = []
    m_vals = []
    thresholds_good = []

    cwv_thresholds = {
        "LCP": (2500, 4000),
        "FCP": (1800, 3000),
        "TBT": (200, 600),
        "TTFB": (800, 1800),
        "SI": (3400, 5800),
    }
    unit_map = {"CLS": ""}  # no ms unit for CLS

    for key, (good, poor) in cwv_thresholds.items():
        if key in desktop or key in mobile:
            metrics.append(key)
            d_vals.append(desktop.get(key, 0) or 0)
            m_vals.append(mobile.get(key, 0) or 0)
            thresholds_good.append(good)

    if not metrics:
        return ""

    n = len(metrics)
    y = np.arange(n)
    height = 0.35

    fig, ax = plt.subplots(figsize=size, facecolor=COLOR_BG)
    _style_axes(ax)

    def bar_colors_for(vals, ths):
        result = []
        for v, (good, poor) in zip(vals, [cwv_thresholds[m] for m in metrics]):
            if v <= good:
                result.append(COLOR_GREEN)
            elif v <= poor:
                result.append(COLOR_YELLOW)
            else:
                result.append(COLOR_RED)
        return result

    dc = bar_colors_for(d_vals, thresholds_good)
    mc = bar_colors_for(m_vals, thresholds_good)

    bars_d = ax.barh(y + height / 2, d_vals, height=height, label="Desktop",
                     color=dc, edgecolor="white")
    bars_m = ax.barh(y - height / 2, m_vals, height=height, label="Mobile",
                     color=mc, alpha=0.7, edgecolor="white")

    ax.set_yticks(y)
    ax.set_yticklabels(metrics, fontsize=8)
    ax.set_xlabel("ms", fontsize=7)
    ax.xaxis.grid(True, alpha=0.3, color=COLOR_BORDER)
    ax.set_axisbelow(True)
    ax.set_title("Core Web Vitals: Desktop vs Mobile", fontsize=9, fontweight="bold", color=COLOR_TEXT)
    ax.legend(fontsize=7, frameon=False)

    mx = max(max(d_vals + m_vals, default=1), 1)
    for bars_set, vals in [(bars_d, d_vals), (bars_m, m_vals)]:
        for bar, v in zip(bars_set, vals):
            if v > 0:
                ax.text(v + mx * 0.01, bar.get_y() + bar.get_height() / 2,
                        f"{int(v)}", va="center", fontsize=6.5, color=COLOR_TEXT)

    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.3)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 9. KEYWORD DISTRIBUTION BAR
# =====================================================================

def keyword_distribution_chart(
    top3: int,
    top10: int,
    top50: int,
    size: Tuple[float, float] = (4.5, 2.5),
) -> str:
    """Stacked bar showing keyword position distribution."""
    labels = ["TOP 3", "TOP 4–10", "TOP 11–50"]
    values = [
        max(top3, 0),
        max(top10 - top3, 0),
        max(top50 - top10, 0),
    ]
    colors = [COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW]
    return stacked_bar_chart(
        ["Słowa kluczowe"],
        [{"label": l, "values": [v], "color": c} for l, v, c in zip(labels, values, colors)],
        title="Rozkład pozycji słów kluczowych",
        size=size,
        horizontal=True,
    )


# =====================================================================
# 10. ROADMAP TIMELINE
# =====================================================================

def roadmap_timeline_chart(
    roadmap: Dict,  # {"immediate_actions": [...], "short_term": [...], "medium_term": [...], "long_term": [...]}
    size: Tuple[float, float] = (6.5, 2.5),
) -> str:
    """Simple timeline bar showing roadmap phases."""
    phases = [
        ("Natychmiast", len(roadmap.get("immediate_actions", [])), COLOR_RED),
        ("1–3 mies.", len(roadmap.get("short_term", [])), COLOR_YELLOW),
        ("3–6 mies.", len(roadmap.get("medium_term", [])), COLOR_BLUE),
        ("6–12 mies.", len(roadmap.get("long_term", [])), COLOR_GREEN),
    ]
    labels = [p[0] for p in phases]
    values = [p[1] for p in phases]
    colors = [p[2] for p in phases]

    return bar_chart(
        labels,
        values,
        title="Zadania w Roadmapie według horyzontu",
        ylabel="Liczba zadań",
        colors=colors,
        size=size,
    )


# =====================================================================
# 11. SCORES OVERVIEW CHART (4 gauges)
# =====================================================================

def scores_overview_chart(
    overall: float,
    seo: float,
    performance: float,
    content: float,
    size: Tuple[float, float] = (7.0, 2.5),
) -> str:
    """4 small gauge charts side by side."""
    scores = [
        (overall, "Ogółem"),
        (seo, "SEO"),
        (performance, "Wydajność"),
        (content, "Treść"),
    ]
    n = len(scores)
    fig, axes = plt.subplots(1, n, figsize=size, facecolor=COLOR_BG)

    for ax, (score, label) in zip(axes, scores):
        score = score or 0
        color = COLOR_RED if score < 50 else (COLOR_YELLOW if score < 80 else COLOR_GREEN)
        ax.set_aspect("equal")
        ax.axis("off")
        theta_bg = np.linspace(np.pi, 0, 200)
        ax.plot(np.cos(theta_bg), np.sin(theta_bg), color=COLOR_BORDER, linewidth=10, solid_capstyle="round")
        ratio = max(0, min(score / 100, 1))
        theta_score = np.linspace(np.pi, np.pi - ratio * np.pi, 200)
        ax.plot(np.cos(theta_score), np.sin(theta_score), color=color, linewidth=10, solid_capstyle="round")
        ax.text(0, 0.1, f"{int(round(score))}", ha="center", va="center",
                fontsize=20, fontweight="bold", color=COLOR_TEXT)
        ax.text(0, -0.25, label, ha="center", va="center", fontsize=7, color="#64748b", fontweight="bold")
        ax.set_xlim(-1.3, 1.3)
        ax.set_ylim(-0.5, 1.2)

    fig.patch.set_facecolor(COLOR_BG)
    plt.tight_layout(pad=0.2)
    return _fig_to_b64_svg(fig)


# =====================================================================
# 12. HTTP STATUS PIE
# =====================================================================

def http_status_pie(pages_by_status: Dict[str, int], size: Tuple[float, float] = (4.5, 3.0)) -> str:
    """Pie chart of HTTP status codes."""
    label_map = {"200": "200 OK", "301": "301 Redirect", "302": "302 Redirect",
                 "404": "404 Not Found", "other": "Inne"}
    color_map  = {"200": COLOR_GREEN, "301": COLOR_YELLOW, "302": COLOR_ORANGE,
                  "404": COLOR_RED, "other": COLOR_GRAY}

    labels, values, colors = [], [], []
    for key in ["200", "301", "302", "404", "other"]:
        v = pages_by_status.get(key, 0) or 0
        if v > 0:
            labels.append(label_map.get(key, key))
            values.append(v)
            colors.append(color_map.get(key, COLOR_GRAY))

    if not values:
        return ""
    return pie_chart(labels, values, title="Statusy HTTP stron", colors=colors, size=size)


# =====================================================================
# 13. COMPETITOR COMPARISON BAR
# =====================================================================

def competitor_comparison_chart(
    competitors: List[Dict],  # [{"domain": str, "common_keywords": int, "visibility": float}]
    metric: str = "common_keywords",
    title: str = "Porównanie z konkurencją",
    size: Tuple[float, float] = (6.0, 3.5),
) -> str:
    """Bar chart comparing site vs competitors on a metric."""
    if not competitors:
        return ""

    labels = [c.get("domain", "N/A")[:25] for c in competitors[:8]]
    values = [c.get(metric, 0) or 0 for c in competitors[:8]]
    colors = [COLOR_BLUE] * len(labels)

    return bar_chart(labels, values, title=title, colors=colors, size=size, rotate_labels=True)


# =====================================================================
# 14. INTENT DISTRIBUTION PIE
# =====================================================================

def intent_distribution_chart(positions: List[Dict], size: Tuple[float, float] = (4.5, 3.0)) -> str:
    """Pie chart of keyword intents from Senuto positions."""
    intent_counts: Dict[str, int] = {}
    for pos in positions:
        intent = pos.get("intent", "unknown") or "unknown"
        intent_counts[intent] = intent_counts.get(intent, 0) + 1

    if not intent_counts:
        return ""

    label_map = {
        "informational": "Informacyjne",
        "navigational": "Nawigacyjne",
        "transactional": "Transakcyjne",
        "commercial": "Komercyjne",
        "unknown": "Nieokreślone",
    }
    color_map = {
        "informational": COLOR_BLUE,
        "navigational": COLOR_GREEN,
        "transactional": COLOR_ORANGE,
        "commercial": COLOR_YELLOW,
        "unknown": COLOR_GRAY,
    }

    labels = [label_map.get(k, k) for k in intent_counts]
    values = list(intent_counts.values())
    colors = [color_map.get(k, COLOR_GRAY) for k in intent_counts]
    return pie_chart(labels, values, title="Rozkład intencji słów kluczowych", colors=colors, size=size)


# =====================================================================
# 15. EXECUTION PLAN PRIORITY CHART
# =====================================================================

def execution_plan_priority_chart(
    tasks: List[Dict],
    size: Tuple[float, float] = (5.0, 2.8),
) -> str:
    """Bar chart of task counts by priority."""
    priority_counts: Dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for t in tasks:
        p = t.get("priority", "medium") or "medium"
        if p in priority_counts:
            priority_counts[p] += 1

    labels_pl = ["Krytyczny", "Wysoki", "Średni", "Niski"]
    values = [priority_counts.get(k, 0) for k in ["critical", "high", "medium", "low"]]
    colors = [COLOR_RED, "#f97316", COLOR_YELLOW, COLOR_GREEN]
    return bar_chart(labels_pl, values, title="Zadania według priorytetu", colors=colors, size=size)
