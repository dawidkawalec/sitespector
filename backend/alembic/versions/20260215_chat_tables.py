"""Add chat tables for agent conversations (RAG chat).

Revision ID: 20260215_chat_tables
Revises: 20260214_fix_competitors_cascade
Create Date: 2026-02-15

"""

from __future__ import annotations

import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = "20260215_chat_tables"
down_revision = "20260214_fix_competitors_cascade"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # Enums (idempotent)
    chatmessagerole = postgresql.ENUM(
        "user", "assistant", "system", name="chatmessagerole", create_type=False
    )
    chatsharepermission = postgresql.ENUM(
        "read", "write", name="chatsharepermission", create_type=False
    )
    chatmessagerole.create(bind, checkfirst=True)
    chatsharepermission.create(bind, checkfirst=True)

    # agent_types
    op.create_table(
        "agent_types",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(length=120), nullable=True),
        sa.Column("system_prompt", sa.Text(), nullable=False),
        sa.Column("tools_config", JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("workspace_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_agent_types_slug"),
    )
    op.create_index("ix_agent_types_slug", "agent_types", ["slug"])
    op.create_index("ix_agent_types_is_system", "agent_types", ["is_system"])
    op.create_index("ix_agent_types_workspace_id", "agent_types", ["workspace_id"])
    op.create_index("ix_agent_types_created_by", "agent_types", ["created_by"])
    op.create_index("ix_agent_types_created_at", "agent_types", ["created_at"])

    # chat_conversations
    op.create_table(
        "chat_conversations",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", UUID(as_uuid=True), nullable=False),
        sa.Column("audit_id", UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), nullable=False),
        sa.Column("agent_type_id", UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=True),
        sa.Column("is_shared", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["agent_type_id"], ["agent_types.id"]),
        sa.ForeignKeyConstraint(["audit_id"], ["audits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chat_conversations_workspace_id", "chat_conversations", ["workspace_id"])
    op.create_index("ix_chat_conversations_audit_id", "chat_conversations", ["audit_id"])
    op.create_index("ix_chat_conversations_created_by", "chat_conversations", ["created_by"])
    op.create_index("ix_chat_conversations_agent_type_id", "chat_conversations", ["agent_type_id"])
    op.create_index("ix_chat_conversations_is_shared", "chat_conversations", ["is_shared"])
    op.create_index("ix_chat_conversations_created_at", "chat_conversations", ["created_at"])

    # chat_messages
    op.create_table(
        "chat_messages",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", UUID(as_uuid=True), nullable=False),
        sa.Column("role", chatmessagerole, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["chat_conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chat_messages_conversation_id", "chat_messages", ["conversation_id"])
    op.create_index("ix_chat_messages_role", "chat_messages", ["role"])
    op.create_index("ix_chat_messages_created_at", "chat_messages", ["created_at"])

    # chat_shares
    op.create_table(
        "chat_shares",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", UUID(as_uuid=True), nullable=False),
        sa.Column("shared_with_user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("shared_by_user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("permission", chatsharepermission, nullable=False, server_default=sa.text("'read'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["chat_conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("conversation_id", "shared_with_user_id", name="uq_chat_share_conversation_user"),
    )
    op.create_index("ix_chat_shares_conversation_id", "chat_shares", ["conversation_id"])
    op.create_index("ix_chat_shares_shared_with_user_id", "chat_shares", ["shared_with_user_id"])
    op.create_index("ix_chat_shares_shared_by_user_id", "chat_shares", ["shared_by_user_id"])
    op.create_index("ix_chat_shares_permission", "chat_shares", ["permission"])
    op.create_index("ix_chat_shares_created_at", "chat_shares", ["created_at"])

    # chat_usage
    op.create_table(
        "chat_usage",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("month", sa.String(length=7), nullable=False),
        sa.Column("messages_sent", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "month", name="uq_chat_usage_user_month"),
    )
    op.create_index("ix_chat_usage_user_id", "chat_usage", ["user_id"])
    op.create_index("ix_chat_usage_month", "chat_usage", ["month"])

    # Seed predefined system agent types
    agent_types_table = sa.table(
        "agent_types",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("slug", sa.String),
        sa.column("description", sa.Text),
        sa.column("icon", sa.String),
        sa.column("system_prompt", sa.Text),
        sa.column("tools_config", JSONB),
        sa.column("is_system", sa.Boolean),
        sa.column("workspace_id", UUID(as_uuid=True)),
        sa.column("created_by", UUID(as_uuid=True)),
    )

    def _agent(name: str, slug: str, icon: str, tools: list[str], description: str) -> dict:
        return {
            "id": uuid.uuid4(),
            "name": name,
            "slug": slug,
            "description": description,
            "icon": icon,
            "system_prompt": (
                "Jestes pomocnym asystentem SiteSpector. Odpowiadaj konkretnie, "
                "uzywaj danych z raportu, a gdy czegos nie ma w raporcie - powiedz to wprost. "
                "Odpowiadaj w jezyku uzytkownika (domyslnie polski)."
            ),
            "tools_config": tools,
            "is_system": True,
            "workspace_id": None,
            "created_by": None,
        }

    op.bulk_insert(
        agent_types_table,
        [
            _agent(
                name="Ekspert SEO",
                slug="seo-expert",
                icon="Search",
                tools=[
                    "crawl_overview",
                    "lighthouse_desktop",
                    "lighthouse_mobile",
                    "content_analysis",
                    "senuto_visibility",
                    "ai_contexts_seo",
                    "quick_wins",
                    "executive_summary",
                ],
                description="Rozmowy o SEO technicznym i wynikach audytu.",
            ),
            _agent(
                name="Ekspert Linkowania",
                slug="linking-expert",
                icon="Link",
                tools=[
                    "links_internal",
                    "senuto_backlinks",
                    "crawl_overview",
                    "ai_contexts_links",
                    "quick_wins",
                ],
                description="Analiza linkowania wewnetrznego i backlinkow.",
            ),
            _agent(
                name="Copywriter SEO",
                slug="seo-copywriter",
                icon="PenTool",
                tools=[
                    "content_analysis",
                    "senuto_visibility",
                    "links_internal",
                    "ai_contexts_content",
                    "quick_wins",
                ],
                description="Optymalizacja tekstow pod frazy i linkowanie wewnetrzne.",
            ),
            _agent(
                name="Ekspert Wydajnosci",
                slug="performance-expert",
                icon="Zap",
                tools=[
                    "lighthouse_desktop",
                    "lighthouse_mobile",
                    "performance_analysis",
                    "ai_contexts_performance",
                    "quick_wins",
                ],
                description="Core Web Vitals i optymalizacja wydajnosci.",
            ),
            _agent(
                name="Strateg AI Overviews",
                slug="aio-strategist",
                icon="Brain",
                tools=[
                    "senuto_ai_overviews",
                    "senuto_visibility",
                    "ai_contexts_ai_overviews",
                    "quick_wins",
                ],
                description="Rozmowy o widocznosci w AI Overviews i strategii.",
            ),
        ],
    )


def downgrade() -> None:
    # Drop tables (reverse order)
    op.drop_index("ix_chat_usage_month", table_name="chat_usage")
    op.drop_index("ix_chat_usage_user_id", table_name="chat_usage")
    op.drop_table("chat_usage")

    op.drop_index("ix_chat_shares_created_at", table_name="chat_shares")
    op.drop_index("ix_chat_shares_permission", table_name="chat_shares")
    op.drop_index("ix_chat_shares_shared_by_user_id", table_name="chat_shares")
    op.drop_index("ix_chat_shares_shared_with_user_id", table_name="chat_shares")
    op.drop_index("ix_chat_shares_conversation_id", table_name="chat_shares")
    op.drop_table("chat_shares")

    op.drop_index("ix_chat_messages_created_at", table_name="chat_messages")
    op.drop_index("ix_chat_messages_role", table_name="chat_messages")
    op.drop_index("ix_chat_messages_conversation_id", table_name="chat_messages")
    op.drop_table("chat_messages")

    op.drop_index("ix_chat_conversations_created_at", table_name="chat_conversations")
    op.drop_index("ix_chat_conversations_is_shared", table_name="chat_conversations")
    op.drop_index("ix_chat_conversations_agent_type_id", table_name="chat_conversations")
    op.drop_index("ix_chat_conversations_created_by", table_name="chat_conversations")
    op.drop_index("ix_chat_conversations_audit_id", table_name="chat_conversations")
    op.drop_index("ix_chat_conversations_workspace_id", table_name="chat_conversations")
    op.drop_table("chat_conversations")

    op.drop_index("ix_agent_types_created_at", table_name="agent_types")
    op.drop_index("ix_agent_types_created_by", table_name="agent_types")
    op.drop_index("ix_agent_types_workspace_id", table_name="agent_types")
    op.drop_index("ix_agent_types_is_system", table_name="agent_types")
    op.drop_index("ix_agent_types_slug", table_name="agent_types")
    op.drop_table("agent_types")

    # Drop enums (checkfirst)
    bind = op.get_bind()
    postgresql.ENUM(name="chatsharepermission").drop(bind, checkfirst=True)
    postgresql.ENUM(name="chatmessagerole").drop(bind, checkfirst=True)

