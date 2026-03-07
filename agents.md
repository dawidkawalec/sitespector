# SiteSpector — Agent Field Guide

Professional SaaS SEO audit platform for Polish B2B market.

## Stack

- **Frontend**: Next.js 14 App Router → `frontend/`
- **Backend**: FastAPI → `backend/`
- **Auth + Teams**: Supabase (workspaces, projects, subscriptions)
- **Audits DB**: VPS PostgreSQL (audits, competitors, chat)
- **Infra**: 10 Docker containers on Hetzner VPS (46.225.134.48)

## Commands

```bash
# Deploy (frontend example)
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48 \
  "cd /opt/sitespector && git pull origin release && \
   docker compose -f docker-compose.prod.yml build frontend && \
   docker compose -f docker-compose.prod.yml up -d frontend"

docker logs sitespector-backend --tail 100   # backend logs
docker exec sitespector-backend alembic upgrade head  # DB migrations
```

## Docs

- [docs/architecture.md](docs/architecture.md) — system design, containers, UX flow
- [docs/api.md](docs/api.md) — all API endpoints and schemas
- [docs/database.md](docs/database.md) — DB schema (Supabase + VPS PostgreSQL)
- [docs/frontend.md](docs/frontend.md) — pages, components, API client, missing features
- [docs/backend.md](docs/backend.md) — worker pipeline, Gemini AI services
- [docs/deployment.md](docs/deployment.md) — Docker, NGINX, SSL, full deploy guide
- [docs/operations.md](docs/operations.md) — runbooks, testing, history
- [docs/decisions.md](docs/decisions.md) — architectural decision records (ADRs)
- [docs/bugs.md](docs/bugs.md) — bug log and fixes

## Critical Rules

- **NO local Docker** — all containers run on VPS only
- **NEVER auto-push** — always ask user before `git push`
- **NEVER create audits without `project_id`** — UI enforces project-first flow
- TypeScript: strict null safety, `?.` and `??` everywhere
- Python: `async/await` mandatory, always call `verify_workspace_access()` first
- All API calls go through `frontend/lib/api.ts` (workspace-scoped)

---
**Last updated**: 2026-03-07
