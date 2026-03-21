"""
Action card generation service — AI generates persona-focused action cards from audit data.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Audit, ActionCard, Persona
from app.services.ai_client import call_claude

logger = logging.getLogger(__name__)


async def generate_action_cards(
    db: AsyncSession,
    audit_id,
    persona_id=None,
) -> List[ActionCard]:
    """
    Generate 3-5 action cards based on audit results and persona focus.
    Called after AI analysis completes (Phase 3.5 in worker).
    """
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit or not audit.results:
        logger.warning("Cannot generate action cards: audit %s not found or has no results", audit_id)
        return []

    # Load persona
    persona_dict = None
    if persona_id:
        p_result = await db.execute(select(Persona).where(Persona.id == persona_id))
        persona = p_result.scalar_one_or_none()
        if persona:
            persona_dict = {
                "name": persona.name,
                "slug": persona.slug,
                "prompt_modifier": persona.prompt_modifier,
                "focus_modules": (persona.dashboard_config or {}).get("focus_modules", []),
            }

    # Build compact audit summary for prompt
    results = audit.results
    executive_summary = results.get("executive_summary", {})
    quick_wins = results.get("quick_wins", [])[:10]
    ai_contexts = results.get("ai_contexts", {})

    # Collect top findings from focused modules
    focus_modules = persona_dict.get("focus_modules", []) if persona_dict else []
    focused_findings = []
    for module in (focus_modules or list(ai_contexts.keys())[:5]):
        ctx = ai_contexts.get(module, {})
        if isinstance(ctx, dict):
            for f in (ctx.get("key_findings") or [])[:2]:
                focused_findings.append(f"[{module}] {f}")
            for f in (ctx.get("priority_issues") or [])[:1]:
                focused_findings.append(f"[{module}][!] {f}")

    # Build prompt
    persona_section = ""
    if persona_dict:
        persona_section = f"""PERSONA: {persona_dict['name']}
{persona_dict.get('prompt_modifier', '')}
Focus areas: {', '.join(persona_dict.get('focus_modules', []))}
"""

    system_prompt = f"""{persona_section}Generujesz ACTION CARDS dla dashboardu uzytkownika.
Kazda karta to konkretna, wykonalna akcja oparta na danych z audytu.

ZASADY:
1. Generuj 3-5 kart (nie wiecej).
2. Kazda karta musi byc SPECYFICZNA (nie ogolna porada).
3. Dolacz category (performance/seo/content/ux/security) i priority (critical/high/medium/low).
4. Opis ma byc krotki (2-3 zdania max).
5. Jesli mozliwe, estymuj wplyw (kpi_impact).

Odpowiedz WYLACZNIE JSON array:
[
  {{
    "title": "...",
    "description": "...",
    "category": "performance",
    "priority": "high",
    "kpi_impact": {{"metric": "lcp", "improvement": "-1.5s"}}
  }},
  ...
]"""

    summary_text = executive_summary.get("summary", "Brak podsumowania")
    quick_wins_text = "\n".join(
        f"- {qw.get('title', qw) if isinstance(qw, dict) else qw}"
        for qw in quick_wins[:5]
    )

    user_prompt = f"""Podsumowanie audytu:
{summary_text}

Kluczowe ustalenia:
{chr(10).join(focused_findings[:12])}

Quick wins:
{quick_wins_text}

Scores: overall={audit.overall_score}, seo={audit.seo_score}, perf={audit.performance_score}, content={audit.content_score}

Wygeneruj 3-5 ACTION CARDS. Odpowiedz TYLKO JSON array."""

    try:
        response = await call_claude(user_prompt, system_prompt=system_prompt, max_tokens=1536)
        text = response.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]

        cards_data = json.loads(text.strip())
        if not isinstance(cards_data, list):
            cards_data = [cards_data]

        created_cards = []
        for i, cd in enumerate(cards_data[:5]):
            card = ActionCard(
                audit_id=audit_id,
                persona_id=persona_id,
                title=cd.get("title", "Bez tytulu")[:500],
                description=cd.get("description", "")[:2000],
                category=cd.get("category", "seo"),
                priority=cd.get("priority", "medium"),
                kpi_impact=cd.get("kpi_impact"),
                status="suggested",
                source="auto_generation",
                sort_order=i,
            )
            db.add(card)
            created_cards.append(card)

        await db.commit()
        for card in created_cards:
            await db.refresh(card)

        logger.info("Generated %d action cards for audit %s (persona=%s)", len(created_cards), audit_id, persona_dict.get("slug") if persona_dict else "none")
        return created_cards

    except Exception as e:
        logger.warning("Action card generation failed: %s", e)
        return []
