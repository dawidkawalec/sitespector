# SiteSpector

Professional SaaS SEO & technical audit platform for the Polish B2B market (agencies, freelancers, website owners).

**Domain**: sitespector.app | **VPS**: 46.225.134.48 (Hetzner CPX42)

## Stack

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind, shadcn/ui) → `frontend/`
- **Landing**: Next.js marketing site (18+ Polish pages, blog, legal) → `landing/`
- **Backend**: FastAPI (Python 3.11, SQLAlchemy 2.0 async, Alembic) → `backend/`
- **Worker**: Background audit processor (Screaming Frog + Lighthouse + Gemini AI) → `backend/worker.py`
- **Auth & Teams**: Supabase (workspaces, projects, subscriptions, RLS)
- **Data**: VPS PostgreSQL (audits, chat, credits), Qdrant (RAG vectors), Stripe (billing)

## Commands

```bash
# Frontend
cd frontend && npm run dev        # local dev server
cd frontend && npm run build      # production build

# Landing
cd landing && npm run dev         # local dev server

# Deploy (VPS — always ask before pushing)
ssh deploy@46.225.134.48 "cd /opt/sitespector && git pull origin release && \
  docker compose -f docker-compose.prod.yml build <service> && \
  docker compose -f docker-compose.prod.yml up -d <service>"

# Backend (VPS only)
docker exec sitespector-backend alembic upgrade head   # DB migrations
docker logs sitespector-backend --tail 100             # logs
```

## Docs

Detailed docs in [docs/](docs/): [architecture](docs/architecture.md) | [api](docs/api.md) | [database](docs/database.md) | [frontend](docs/frontend.md) | [backend](docs/backend.md) | [deployment](docs/deployment.md) | [operations](docs/operations.md) | [decisions](docs/decisions.md) | [bugs](docs/bugs.md) | [coding-standards](docs/coding-standards.md) | [projects](docs/projects.md) | [marketing/](marketing/)

## Critical Rules

- **NO local Docker** — all containers run on VPS only
- **NEVER auto-push** — always ask user before `git push`
- **NEVER create audits without `project_id`** — UI enforces project-first flow
- TypeScript: strict null safety, `?.` and `??` everywhere
- Python: `async/await` mandatory, always call `verify_workspace_access()` first
- All frontend API calls go through `frontend/lib/api.ts` (workspace-scoped)
