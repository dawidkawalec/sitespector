# SiteSpector — Agent Field Guide

## Project Identity
Professional SaaS SEO audit platform (Polish B2B market).  
Stack: **Next.js 14 App Router** · **FastAPI** · **Supabase** (auth + projects) · **VPS PostgreSQL** (audits) · **Docker** (10 containers on Hetzner VPS).

---

## Architecture in 30 seconds

```
auth.users (Supabase)
  └─ workspaces (Supabase) — auto-created on signup
       └─ projects (Supabase) — one per website
            └─ audits (VPS PostgreSQL) — always have project_id
                 └─ competitors / chat / rag
```

**Dual DB strategy**:
- **Supabase**: `workspaces`, `workspace_members`, `projects`, `project_members`, `subscriptions`, `profiles`
- **VPS PostgreSQL**: `audits`, `competitors`, `audit_schedules`, `chat_*`, `agent_types`

---

## Critical UX Flow (enforced)
```
Register → Workspace created automatically
            ↓
        Dashboard (workspace trends — READ ONLY, no audit creation)
            ↓
        /projects — create project
            ↓
        /projects/[id] — project view, create audit here
            ↓
        /audits/[id] — audit detail
```

> **NEVER create audits without `project_id`** — the UI enforces this at the project page level.  
> `PATCH /api/audits/{id}/assign-project` exists to migrate orphaned legacy audits.

---

## Key Modules

| Module | Location | Notes |
|--------|----------|-------|
| Sidebar | `frontend/components/layout/UnifiedSidebar.tsx` | Projects tree + audit nav + search |
| Dashboard | `frontend/app/(app)/dashboard/page.tsx` | Workspace trends only |
| Projects | `frontend/app/(app)/projects/` | CRUD, audits, compare, schedule, team |
| Audit detail | `frontend/app/(app)/audits/[id]/` | 15+ subpages |
| Chat (RAG) | `frontend/components/chat/ChatPanel.tsx` | SSE streaming, Zustand store |
| Backend API | `backend/app/routers/` | audits, projects, chat, schedules |
| Worker | `backend/app/worker.py` | Screaming Frog + Lighthouse + Gemini |

---

## Commands

```bash
# Deploy
ssh vps "cd /opt/sitespector && git pull && docker compose restart frontend backend worker"

# Logs
docker logs sitespector-backend --tail 100
docker logs sitespector-worker --tail 100

# DB migration (VPS)
docker exec sitespector-backend alembic upgrade head

# Rebuild frontend only
docker compose build frontend && docker compose up -d frontend
```

---

## Patterns & Rules

### TypeScript
- Strict null safety, `?.` and `??` everywhere
- All API calls through `frontend/lib/api.ts` (workspace-scoped)
- State: TanStack Query for server state, Zustand for UI state (chat panel)
- Container queries: use `@md:` / `@lg:` inside app pages (not viewport `md:`)

### Python (backend)
- `async/await` mandatory for all DB + external calls
- Auth via Supabase JWT: `get_current_user()` dependency
- Workspace access: `verify_workspace_access()` before any operation
- Project access: `verify_project_access()` before project-scoped operations

### Sidebar
- Projects tree with lazy audit loading per expanded project (max 3 shown)
- Search bar filters projects by name/URL
- Active project auto-expands on navigation
- Audit nav sections (Dane audytu / Strategia AI / Raporty) show only on `/audits/*`

### Chat
- SSE streaming via `frontend/lib/chat-sse.ts`
- Zustand store: `frontend/lib/chat-store.ts` (persists panel state)
- **BUG-013 fix**: `sendingConvoIdRef` guards against race condition overwriting optimistic messages
- Conversations scoped to `workspace_id + audit_id`

---

## Known Gotchas

1. **No local Docker** — all containers run on VPS (46.225.134.48). SSH tunnel for Dozzle.
2. **project_id is nullable in DB** but must be provided at UI level — legacy audits may have NULL.
3. `audits.user_id` = legacy field; `workspace_id` + `project_id` are canonical.
4. Supabase RLS: policies are in `supabase/policies.sql` — avoid recursive policies.
5. Frontend workspace switch triggers `window.location.reload()` — all state resets.

---

**Last updated**: 2026-02-25
