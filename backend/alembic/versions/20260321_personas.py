"""Add personas and action_cards tables, persona_id FK on audits.

Revision ID: 20260321_personas
Revises: 20260321_scoped_reports
Create Date: 2026-03-21

"""

from __future__ import annotations

import json
import uuid
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision = "20260321_personas"
down_revision = "20260321_scoped_reports"
branch_labels = None
depends_on = None

# Seed personas
SEED_PERSONAS = [
    {
        "id": str(uuid.uuid4()),
        "slug": "owner",
        "name": "Wlasciciel strony",
        "description": "Prosty przeglad strony z konkretnymi akcjami do wdrozenia. Bez technicznego zargonu.",
        "icon": "Home",
        "sort_order": 1,
        "prompt_modifier": (
            "Mowisz do wlasciciela strony/biznesu ktory NIE jest techniczna osoba.\n"
            "ZASADY:\n"
            "- Uzywaj prostego, zrozumialego jezyka (bez zargonu SEO/IT)\n"
            "- Skupiaj sie na ROI i wplywie biznesowym kazdej rekomendacji\n"
            "- Podawaj konkretne akcje ('zrob X' zamiast 'nalezy rozwazyc Y')\n"
            "- Priorytetyzuj po wplywie na biznes, nie po technicznej waznosci\n"
            "- Tlumacz metryki techniczne na jezyk biznesowy (np. 'strona laduje sie 4s — klienci odchodza')\n"
        ),
        "dashboard_config": json.dumps({
            "kpi_cards": [
                {"key": "overall_score", "label": "Ocena ogolna", "source": "audit.overall_score", "format": "score", "icon": "Activity"},
                {"key": "performance_score", "label": "Szybkosc strony", "source": "audit.performance_score", "format": "score", "icon": "Gauge"},
                {"key": "quick_wins_count", "label": "Szybkie poprawki", "source": "tasks.quick_wins_pending", "format": "count", "icon": "Zap"},
                {"key": "critical_issues", "label": "Krytyczne bledy", "source": "tasks.critical_count", "format": "count", "icon": "AlertTriangle"},
            ],
            "focus_modules": ["seo", "performance", "quick_wins"],
        }),
        "context_questions": json.dumps([
            {"id": "owner_goal", "question": "Co jest Twoim glownym celem?", "type": "select", "options": ["Wiecej klientow z Google", "Szybsza strona", "Poprawa widocznosci", "Nie wiem — sprawdz wszystko"]},
            {"id": "owner_challenge", "question": "Czy masz jakies znane problemy ze strona?", "type": "text", "hint": "Np. spadek ruchu, wolne ladowanie, brak w Google"},
        ]),
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "freelancer",
        "name": "Freelancer SEO",
        "description": "Pelny techniczny audyt z szczegolowymi instrukcjami krok-po-kroku.",
        "icon": "User",
        "sort_order": 2,
        "prompt_modifier": (
            "Mowisz do doswiadczonego freelancera SEO.\n"
            "ZASADY:\n"
            "- Uzywaj profesjonalnej terminologii SEO\n"
            "- Podawaj szczegolowe instrukcje krok-po-kroku\n"
            "- Dolacz gotowe snippety kodu gdzie to mozliwe\n"
            "- Wskazuj konkretne URL-e i elementy do poprawy\n"
            "- Priorytetyzuj po wplywie na ranking i indeksowanie\n"
        ),
        "dashboard_config": json.dumps({
            "kpi_cards": [
                {"key": "seo_score", "label": "SEO Score", "source": "audit.seo_score", "format": "score", "icon": "Search"},
                {"key": "performance_score", "label": "Performance", "source": "audit.performance_score", "format": "score", "icon": "Gauge"},
                {"key": "visibility_top10", "label": "TOP10 keywords", "source": "senuto.top10", "format": "count", "icon": "TrendingUp"},
                {"key": "tasks_pending", "label": "Zadania", "source": "tasks.pending_count", "format": "count", "icon": "ListTodo"},
            ],
            "focus_modules": ["seo", "performance", "visibility", "links", "schema", "content_quality", "architecture"],
        }),
        "context_questions": json.dumps([
            {"id": "seo_focus", "question": "Na czym chcesz sie skupic?", "type": "multiselect", "options": ["Technical SEO", "Content", "Widocznosc/Senuto", "Performance", "Link building"]},
        ]),
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "marketing",
        "name": "Marketing Manager",
        "description": "Analiza pod katem KPI marketingowych, ROI kampanii i widocznosci.",
        "icon": "Megaphone",
        "sort_order": 3,
        "prompt_modifier": (
            "Mowisz do marketing managera.\n"
            "ZASADY:\n"
            "- Skupiaj sie na KPI marketingowych (ruch, konwersje, widocznosc, ROI)\n"
            "- Wiaz rekomendacje SEO z celami marketingowymi\n"
            "- Podawaj estymacje wplywu na ruch organiczny\n"
            "- Uwzgledniaj kontekst kampanii i budzetu\n"
            "- Porownuj z konkurencja gdzie to mozliwe\n"
        ),
        "dashboard_config": json.dumps({
            "kpi_cards": [
                {"key": "visibility_top10", "label": "TOP10 frazy", "source": "senuto.top10", "format": "count", "icon": "TrendingUp"},
                {"key": "estimated_traffic", "label": "Est. ruch mies.", "source": "traffic_estimation.total", "format": "count", "icon": "Users"},
                {"key": "content_score", "label": "Content Score", "source": "audit.content_score", "format": "score", "icon": "FileText"},
                {"key": "ai_overviews", "label": "AI Overviews", "source": "senuto.aio_count", "format": "count", "icon": "Sparkles"},
            ],
            "focus_modules": ["visibility", "content_quality", "ai_overviews", "backlinks"],
        }),
        "context_questions": json.dumps([
            {"id": "mkt_goal", "question": "Jaki jest glowny cel marketingowy?", "type": "select", "options": ["Wzrost ruchu organicznego", "Generowanie leadow", "Brand awareness", "Wsparcie kampanii paid"]},
            {"id": "mkt_budget", "question": "Jaki masz budzet na SEO miesiecznie?", "type": "select", "options": ["Do 2000 PLN", "2000-5000 PLN", "5000-15000 PLN", "Powyzej 15000 PLN"]},
        ]),
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "webdev",
        "name": "Web Developer",
        "description": "Kod-first: Core Web Vitals, architektura, schema, security. Gotowe snippety.",
        "icon": "Code2",
        "sort_order": 4,
        "prompt_modifier": (
            "Mowisz do web developera.\n"
            "ZASADY:\n"
            "- Podawaj gotowy kod (HTML, JSON-LD, meta tagi, .htaccess)\n"
            "- Skupiaj sie na Core Web Vitals (LCP, CLS, FCP, TTFB)\n"
            "- Opisuj rozwiazania w kontekscie architektury strony\n"
            "- Wskazuj konkretne pliki/komponenty do modyfikacji\n"
            "- Priorytetyzuj po wplywie na wydajnosc i bezpieczenstwo\n"
        ),
        "dashboard_config": json.dumps({
            "kpi_cards": [
                {"key": "lcp", "label": "LCP", "source": "lighthouse.desktop.lcp", "format": "ms", "icon": "Timer"},
                {"key": "cls", "label": "CLS", "source": "lighthouse.desktop.cls", "format": "decimal", "icon": "Move"},
                {"key": "performance_score", "label": "Performance", "source": "audit.performance_score", "format": "score", "icon": "Gauge"},
                {"key": "security_issues", "label": "Security", "source": "tasks.security_count", "format": "count", "icon": "Shield"},
            ],
            "focus_modules": ["performance", "architecture", "schema", "security"],
        }),
        "context_questions": json.dumps([
            {"id": "dev_stack", "question": "Jaki stack technologiczny?", "type": "text", "hint": "Np. WordPress, Next.js, Shopify, custom PHP"},
            {"id": "dev_focus", "question": "Na czym chcesz sie skupic?", "type": "multiselect", "options": ["Core Web Vitals", "Schema.org / Structured Data", "Security headers", "Architektura URL", "Rendering/JS"]},
        ]),
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "ecommerce",
        "name": "E-commerce Manager",
        "description": "Analiza pod katem konwersji, produktow, kart produktowych i Product Schema.",
        "icon": "ShoppingCart",
        "sort_order": 5,
        "prompt_modifier": (
            "Mowisz do managera e-commerce.\n"
            "ZASADY:\n"
            "- Skupiaj sie na konwersji i sprzedazy\n"
            "- Analizuj karty produktowe, kategorie, filtry\n"
            "- Sprawdzaj Product Schema (JSON-LD) i rich snippets\n"
            "- Estymuj wplyw zmian na GMV/konwersje\n"
            "- Porownuj z best practices e-commerce (Allegro, Zalando, Amazon)\n"
        ),
        "dashboard_config": json.dumps({
            "kpi_cards": [
                {"key": "product_pages", "label": "Stron produktowych", "source": "page_types.product", "format": "count", "icon": "ShoppingBag"},
                {"key": "seo_score", "label": "SEO Score", "source": "audit.seo_score", "format": "score", "icon": "Search"},
                {"key": "performance_score", "label": "Szybkosc", "source": "audit.performance_score", "format": "score", "icon": "Gauge"},
                {"key": "schema_found", "label": "Schema Product", "source": "schema.product_found", "format": "boolean", "icon": "Code2"},
            ],
            "focus_modules": ["seo", "schema", "content_quality", "performance", "images"],
        }),
        "context_questions": json.dumps([
            {"id": "ecom_platform", "question": "Jaka platforma e-commerce?", "type": "select", "options": ["Shopify", "WooCommerce", "PrestaShop", "Magento", "Shoper", "IdoSell", "Custom", "Inna"]},
            {"id": "ecom_goal", "question": "Glowny cel?", "type": "select", "options": ["Wiecej ruchu organicznego na produkty", "Lepsze rich snippets w Google", "Szybsze ladowanie kart produktow", "Poprawa konwersji"]},
        ]),
    },
]


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    # 1. Create personas table
    if "personas" not in existing_tables:
        op.create_table(
            "personas",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("slug", sa.String(60), unique=True, nullable=False),
            sa.Column("name", sa.String(120), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("icon", sa.String(60), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("prompt_modifier", sa.Text(), nullable=True),
            sa.Column("dashboard_config", JSONB, nullable=True),
            sa.Column("context_questions", JSONB, nullable=True),
            sa.Column("is_system", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("workspace_id", UUID(as_uuid=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_personas_slug", "personas", ["slug"], unique=True)
        op.create_index("ix_personas_workspace_id", "personas", ["workspace_id"])

    # 2. Create action_cards table
    if "action_cards" not in existing_tables:
        op.create_table(
            "action_cards",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("audit_id", UUID(as_uuid=True), sa.ForeignKey("audits.id", ondelete="CASCADE"), nullable=False),
            sa.Column("persona_id", UUID(as_uuid=True), sa.ForeignKey("personas.id", ondelete="SET NULL"), nullable=True),
            sa.Column("title", sa.String(500), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("category", sa.String(50), nullable=True),
            sa.Column("priority", sa.String(20), nullable=True),
            sa.Column("kpi_impact", JSONB, nullable=True),
            sa.Column("action_data", JSONB, nullable=True),
            sa.Column("status", sa.String(20), nullable=False, server_default="suggested"),
            sa.Column("source", sa.String(30), nullable=False),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_action_cards_audit_id", "action_cards", ["audit_id"])
        op.create_index("ix_action_cards_status", "action_cards", ["status"])

    # 3. Add persona_id to audits
    existing_columns = [c["name"] for c in insp.get_columns("audits")]
    if "persona_id" not in existing_columns:
        op.add_column(
            "audits",
            sa.Column("persona_id", UUID(as_uuid=True), nullable=True),
        )
        op.create_foreign_key(
            "fk_audits_persona_id", "audits", "personas",
            ["persona_id"], ["id"], ondelete="SET NULL",
        )

    # 4. Seed system personas
    personas_table = sa.table(
        "personas",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("slug", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("icon", sa.String),
        sa.column("sort_order", sa.Integer),
        sa.column("prompt_modifier", sa.Text),
        sa.column("dashboard_config", JSONB),
        sa.column("context_questions", JSONB),
        sa.column("is_system", sa.Boolean),
    )

    for p in SEED_PERSONAS:
        op.execute(
            personas_table.insert().values(
                id=p["id"],
                slug=p["slug"],
                name=p["name"],
                description=p["description"],
                icon=p["icon"],
                sort_order=p["sort_order"],
                prompt_modifier=p["prompt_modifier"],
                dashboard_config=p["dashboard_config"],
                context_questions=p["context_questions"],
                is_system=True,
            )
        )


def downgrade() -> None:
    op.drop_constraint("fk_audits_persona_id", "audits", type_="foreignkey")
    op.drop_column("audits", "persona_id")
    op.drop_index("ix_action_cards_status", table_name="action_cards")
    op.drop_index("ix_action_cards_audit_id", table_name="action_cards")
    op.drop_table("action_cards")
    op.drop_index("ix_personas_workspace_id", table_name="personas")
    op.drop_index("ix_personas_slug", table_name="personas")
    op.drop_table("personas")
