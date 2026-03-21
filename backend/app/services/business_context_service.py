"""
Business context service — smart form generation and context extraction.

Generates personalized questionnaire based on audit Phase 1 data,
and structures business context for AI prompt injection.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from app.services.ai_client import call_claude

logger = logging.getLogger(__name__)


async def generate_smart_form(
    crawl_data: Dict[str, Any],
    lighthouse_data: Dict[str, Any],
    senuto_data: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Generate 5-8 personalized questions based on collected audit data.
    AI analyzes the site and asks business-relevant questions.

    Returns list of:
        {
            "id": "q1",
            "question": "...",
            "type": "text" | "select" | "multiselect",
            "options": [...] (for select/multiselect),
            "hint": "..." (optional helper text)
        }
    """
    # Build a compact data summary for the AI
    crawl = crawl_data or {}
    lh = lighthouse_data or {}
    senuto = senuto_data or {}

    page_type_stats = crawl.get("page_type_stats", {})
    pages_crawled = crawl.get("pages_crawled", 0)
    has_products = page_type_stats.get("product", 0) > 0
    has_blog = page_type_stats.get("blog", 0) > 0
    has_services = page_type_stats.get("service", 0) > 0

    structured_data = crawl.get("structured_data_v2", {})
    sd_types = structured_data.get("types", []) if isinstance(structured_data, dict) else []

    vis = senuto.get("visibility", {}) if isinstance(senuto, dict) else {}
    vis_stats = (vis.get("statistics", {}).get("statistics", {}) or {}) if isinstance(vis, dict) else {}

    desktop = lh.get("desktop", {}) if isinstance(lh, dict) else {}

    summary = {
        "pages_crawled": pages_crawled,
        "page_types": page_type_stats,
        "has_products": has_products,
        "has_blog": has_blog,
        "has_services": has_services,
        "schema_types": sd_types[:10],
        "perf_score": desktop.get("performance_score", 0),
        "seo_score": desktop.get("seo_score", 0),
        "top10_keywords": vis_stats.get("top10", 0),
        "domain_rank": vis_stats.get("domain_rank", 0),
    }

    system_prompt = """Jestes ekspertem SEO pomagajacym zrozumiec biznes klienta.
Na podstawie danych z audytu technicznego wygeneruj 5-8 spersonalizowanych pytan
ktore pomoga nam lepiej zrozumiec cele biznesowe klienta i dopasowac rekomendacje.

ZASADY:
1. Pytania maja byc KROTKIE i jasne (max 1-2 zdania).
2. Dostosuj pytania do tego co widzisz w danych (np. jesli sa produkty - pytaj o ecommerce).
3. Pierwsze pytanie to ZAWSZE typ biznesu (select).
4. Kazde pytanie ma miec type: "text", "select" lub "multiselect".
5. Dla select/multiselect podaj opcje.
6. Odpowiedz WYLACZNIE w formacie JSON (lista obiektow).

Format odpowiedzi (JSON array):
[
  {"id": "q1", "question": "Jaki typ biznesu prowadzisz?", "type": "select", "options": ["Sklep internetowy", "Uslugi", "SaaS", "Blog/Portal", "Firma korporacyjna", "Inny"], "hint": "Pomoze nam dopasowac rekomendacje"},
  {"id": "q2", "question": "...", "type": "text", "hint": "..."},
  ...
]"""

    user_prompt = f"""Dane z audytu technicznego strony:
{json.dumps(summary, ensure_ascii=True)}

Wygeneruj 5-8 pytan o kontekst biznesowy klienta.
Dostosuj pytania do danych - np.:
- Jesli sa produkty ({page_type_stats.get('product', 0)} stron produktowych) → pytaj o cele sprzedazowe
- Jesli jest blog ({page_type_stats.get('blog', 0)} artykulow) → pytaj o strategia content
- Jesli niski performance ({desktop.get('performance_score', 0)}) → pytaj o priorytety techniczne
- Jesli mala widocznosc (TOP10: {vis_stats.get('top10', 0)}) → pytaj o cele widocznosci

Odpowiedz TYLKO JSON array, bez dodatkowego tekstu."""

    try:
        response = await call_claude(user_prompt, system_prompt=system_prompt, max_tokens=2048)
        # Parse JSON from response
        text = response.strip()
        # Handle potential markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        questions = json.loads(text)
        if isinstance(questions, list) and len(questions) > 0:
            logger.info("Smart form generated: %d questions", len(questions))
            return questions
    except Exception as e:
        logger.warning("Smart form generation failed, using fallback: %s", e)

    # Fallback: static questions adapted to detected page types
    return _fallback_questions(page_type_stats)


def _fallback_questions(page_type_stats: Dict[str, int]) -> List[Dict[str, Any]]:
    """Static fallback questions when AI is unavailable."""
    questions = [
        {
            "id": "q1",
            "question": "Jaki typ biznesu prowadzisz?",
            "type": "select",
            "options": ["Sklep internetowy", "Uslugi lokalne", "Uslugi B2B", "SaaS", "Blog/Portal", "Firma korporacyjna", "Inny"],
            "hint": "Pomoze dopasowac rekomendacje do Twojej branzy",
        },
        {
            "id": "q2",
            "question": "W jakiej branzy dzialasz?",
            "type": "text",
            "hint": "Np. moda, elektronika, uslugi prawne, IT",
        },
        {
            "id": "q3",
            "question": "Jakie sa Twoje glowne cele biznesowe?",
            "type": "multiselect",
            "options": ["Wiecej ruchu organicznego", "Wzrost sprzedazy/konwersji", "Generowanie leadow", "Brand awareness", "Lokalne SEO", "Poprawa wydajnosci strony"],
            "hint": "Wybierz 1-3 najwazniejsze",
        },
        {
            "id": "q4",
            "question": "Kto jest Twoja grupa docelowa?",
            "type": "text",
            "hint": "Np. kobiety 25-45, wlasciciele malych firm, programisci",
        },
        {
            "id": "q5",
            "question": "Jakie masz mozliwosci wdrozeniowe?",
            "type": "select",
            "options": ["Brak dewelopera - potrzebuje prostych instrukcji", "Podstawowy zespol - moge wdrozyc proste zmiany", "Pelny zespol tech - moge wdrozyc wszystko"],
            "hint": "Dostosujemy poziom szczegolowosci instrukcji",
        },
    ]

    # Add context-specific questions
    if page_type_stats.get("product", 0) > 0:
        questions.append({
            "id": "q6",
            "question": "Jakie sa Twoje kluczowe kategorie produktow?",
            "type": "text",
            "hint": "Np. obuwie, elektronika, meble — pomoze skupic analize",
        })
    elif page_type_stats.get("service", 0) > 0:
        questions.append({
            "id": "q6",
            "question": "Jakie uslugi sa dla Ciebie najwazniejsze?",
            "type": "text",
            "hint": "Np. konsulting, naprawa, szkolenia",
        })

    questions.append({
        "id": "q7",
        "question": "Czy jest cos szczegolnego co chcialbyc uwzglednic w analizie?",
        "type": "text",
        "hint": "Np. niedawna migracja, problemy z indeksowaniem, spadek ruchu",
    })

    return questions


def format_business_context_for_prompt(bc: Optional[Dict[str, Any]]) -> str:
    """
    Format business context dict for injection into AI prompts.
    Returns empty string if no context available.
    """
    if not bc:
        return ""

    parts = ["KONTEKST BIZNESOWY KLIENTA:"]

    if bc.get("business_type"):
        parts.append(f"- Typ biznesu: {bc['business_type']}")
    if bc.get("industry"):
        parts.append(f"- Branza: {bc['industry']}")
    if bc.get("target_audience"):
        parts.append(f"- Grupa docelowa: {bc['target_audience']}")
    if bc.get("geographic_focus"):
        parts.append(f"- Zasieg geograficzny: {bc['geographic_focus']}")
    if bc.get("business_goals"):
        goals = bc["business_goals"] if isinstance(bc["business_goals"], list) else [bc["business_goals"]]
        parts.append(f"- Cele biznesowe: {', '.join(str(g) for g in goals)}")
    if bc.get("priorities"):
        prios = bc["priorities"] if isinstance(bc["priorities"], list) else [bc["priorities"]]
        parts.append(f"- Priorytety: {', '.join(str(p) for p in prios)}")
    if bc.get("key_products_services"):
        items = bc["key_products_services"] if isinstance(bc["key_products_services"], list) else [bc["key_products_services"]]
        parts.append(f"- Kluczowe produkty/uslugi: {', '.join(str(i) for i in items[:5])}")
    if bc.get("team_capabilities"):
        team_map = {
            "no_dev": "brak dewelopera (proste instrukcje)",
            "basic_dev": "podstawowy zespol (sredniozaawansowane)",
            "full_team": "pelny zespol tech (zaawansowane)",
        }
        parts.append(f"- Zespol: {team_map.get(bc['team_capabilities'], bc['team_capabilities'])}")
    if bc.get("budget_range"):
        budget_map = {"low": "niski", "medium": "sredni", "high": "wysoki"}
        parts.append(f"- Budzet: {budget_map.get(bc['budget_range'], bc['budget_range'])}")
    if bc.get("current_challenges"):
        parts.append(f"- Wyzwania: {bc['current_challenges'][:200]}")
    if bc.get("competitors_context"):
        parts.append(f"- Kontekst konkurencji: {bc['competitors_context'][:200]}")

    if len(parts) <= 1:
        return ""

    parts.append("")
    parts.append("ZASADY KONTEKSTU BIZNESOWEGO:")
    parts.append("- Dopasuj rekomendacje do typu biznesu i branzy klienta.")
    parts.append("- Priorytetyzuj zadania zgodnie z celami klienta.")
    parts.append("- Kalibruj effort wzgledem mozliwosci zespolu.")
    parts.append("- Jesli ecommerce: skupiaj sie na Product Schema, konwersjach, kartach produktow.")
    parts.append("- Jesli uslugi: skupiaj sie na Local SEO, trust signals, lead generation.")
    parts.append("- Jesli blog/portal: skupiaj sie na content strategy, E-E-A-T, topical authority.")

    return "\n".join(parts) + "\n"
