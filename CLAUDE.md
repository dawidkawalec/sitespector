# SiteSpector — Claude Code Entry Point

**Source of truth**: [AGENTS.md](AGENTS.md) — read it first on every new conversation.

**Detailed docs**: [docs/](docs/) — architecture, API, database, frontend, backend, deployment, operations, decisions, bugs.

## Quick Context

- SEO audit SaaS for Polish B2B market
- Next.js 14 frontend + FastAPI backend + Supabase auth + VPS PostgreSQL
- 10 Docker containers on Hetzner VPS (no local Docker)
- Deploy branch: `release` → VPS via SSH

## Consistency Rule

`CLAUDE.md` and `AGENTS.md` must stay aligned. When updating project structure or critical rules, update both files.
