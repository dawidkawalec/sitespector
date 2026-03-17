# SiteSpector — Coding Standards

Conventions detected from the actual codebase. Follow these when writing new code.

---

## TypeScript / Frontend (`frontend/`)

### Language & Compiler
- **TypeScript strict mode** enabled (`strict: true` in tsconfig)
- Additional strictness flags: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`
- Target: ES5, module: ESNext (bundler resolution)
- Null safety mandatory — use `?.` (optional chaining) and `??` (nullish coalescing) everywhere

### Naming
- **PascalCase** for components, interfaces, types, enums (`AuditPageLayout`, `CreateProjectDialog`, `AdminStats`)
- **camelCase** for functions, variables, hooks (`formatScore`, `getScoreColor`, `apiRequest`)
- **UPPER_SNAKE_CASE** for constants (`TOKEN_KEY`, `API_URL`)
- File names: PascalCase for components (`AiInsightsPanel.tsx`), kebab-case for libs (`chat-store.ts`)

### Imports & Paths
- Path alias: `@/*` maps to project root (e.g. `import { cn } from '@/lib/utils'`)
- Group order: external libs, then `@/` internal imports

### Styling
- **Tailwind CSS 3** with `tailwindcss-animate` and `@tailwindcss/container-queries` plugins
- Container queries preferred for responsive layouts: use `@sm:`, `@md:`, `@lg:` (not media-based `sm:`, `md:`)
- Dark mode: class-based (`darkMode: ['class']`)
- CSS variables for theme colors via `hsl(var(--...))` pattern
- Brand colors: `brand-teal: #0b363d`, `brand-orange: #ff8945`
- Utility merging: always use `cn()` from `@/lib/utils` (wraps `clsx` + `tailwind-merge`)

### Components & UI
- **shadcn/ui** components in `components/ui/` (Radix primitives underneath)
- Custom components in `components/` — PascalCase, one component per file
- Subdirectories by domain: `components/audit/`, `components/chat/`, `components/layout/`, `components/brand/`
- Icons: `lucide-react` (primary), `react-icons` (supplementary)

### State Management
- **TanStack Query v5** (`@tanstack/react-query`) for all server state — queries, mutations, caching
- **Zustand v5** for client-side UI state (e.g. `lib/chat-store.ts` with `persist` middleware)
- No Redux, no Context API for server data

### API Layer
- All backend calls go through `frontend/lib/api.ts` — never call `fetch()` directly from components
- Centralized `apiRequest<T>()` generic handles auth tokens, error parsing, 204 responses
- API objects grouped by domain: `authAPI`, `auditsAPI`, `projectsAPI`, `adminAPI`, `systemAPI`
- Auth: Supabase session tokens with auto-refresh (5-min expiry buffer)
- Workspace-scoped: most endpoints require `workspace_id` query param

### Forms & Validation
- `react-hook-form` for form state
- `zod` for schema validation

---

## Python / Backend (`backend/`)

### Language & Runtime
- Python 3.11+
- **async/await mandatory** — all I/O uses asyncpg, httpx, async SQLAlchemy

### Naming
- **snake_case** everywhere: functions, variables, modules, endpoints
- **PascalCase** for classes: models, enums, schemas (`AuditStatus`, `SubscriptionTier`)
- **UPPER_SNAKE_CASE** for module-level constants (`IMPACT_WEIGHT`, `EFFORT_WEIGHT`)

### Models (SQLAlchemy 2.0)
- Declarative base from `app.database.Base`
- UUIDs as primary keys (`UUID` from `sqlalchemy.dialects.postgresql`)
- `JSONB` for flexible data columns (results, processing_logs)
- `str` enums inheriting from both `str` and `enum.Enum`
- Relationships via `sqlalchemy.orm.relationship`

### Routers (FastAPI)
- One router per domain: `app/routers/audits.py`, etc.
- Module docstrings describe version and scope
- Standard imports: `APIRouter`, `Depends`, `HTTPException`, `status`, `Query`
- Dependency injection: `get_db` for DB sessions, `get_current_user` for auth
- **`verify_workspace_access()`** called on every endpoint — mandatory access control
- Type hints: `typing.Optional`, `UUID`, return types on all functions

### Services
- Business logic in `app/services/` — separated from routers
- AI services use `call_claude()` wrapper from `app/services/ai_client.py`
- Error handling: custom `AIUnavailableError` for graceful degradation
- Helper functions prefixed with `_` for internal/private use

### Configuration
- **Pydantic Settings** (`pydantic_settings.BaseSettings`) in `app/config.py`
- All secrets via environment variables — never hardcoded
- `Field(default=..., description=...)` pattern for every setting

### Linting (flake8)
- Max line length: 100 (but E501 ignored — Black handles line length)
- Ignored: E203 (whitespace before `:`), W503 (line break before binary operator)
- `__init__.py` allowed unused imports (F401)
- Excluded: `__pycache__`, `.venv`, `alembic`, `build`, `dist`

---

## Landing Site (`landing/`)

**Different stack from the app!** Do not mix patterns.

- **Next.js 15** (React 19) — newer than the app frontend (Next.js 14, React 18)
- **Bootstrap 5** + **SCSS** for styling (not Tailwind!)
- `react-bootstrap` components
- Markdown content files in `landing/content/blog/`, `landing/content/case-studies/`
- Parsed with `gray-matter` + `remark` + `remark-html`
- Icons: `react-icons`, Lordicon (animated)
- ESLint: `next/core-web-vitals` + `next/typescript`, `@next/next/no-img-element` disabled
- Swiper for carousels

---

## Formatting & Linting

### Frontend Prettier (`frontend/.prettierrc`)
| Setting | Value |
|---|---|
| Semi | `false` (no semicolons) |
| Quotes | Single quotes |
| Print width | 100 |
| Tab width | 2 spaces |
| Trailing comma | ES5 |
| Arrow parens | Always (`(x) => ...`) |
| End of line | LF |

### Landing Prettier (`landing/.prettierrc`)
| Setting | Value |
|---|---|
| Semi | `true` (semicolons!) |
| Quotes | Single quotes |
| Print width | 100 |
| Tab width | 2 spaces |
| Trailing comma | ES5 |
| Arrow parens | Avoid (`x => ...`) |

**Key difference**: Frontend has no semicolons + always parens; Landing has semicolons + avoid parens.

### ESLint
- Frontend: extends `next/core-web-vitals`, warns on `react-hooks/exhaustive-deps`
- Landing: extends `next/core-web-vitals` + `next/typescript`, disables `no-img-element`

---

## Git & Deployment

- **Branch model**: `release` branch deploys to VPS (Hetzner CPX42)
- **Never auto-push** — always confirm with user before `git push`
- **Commit messages**: conventional commits — `type(scope): description`
  - Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
  - Examples: `fix(landing): restore clean mobile menu visual style`, `feat(audits): add operational rerun actions`
- No local Docker — all containers run on VPS only
- Deploy: `git pull origin release` on VPS, then `docker compose build + up`

---

## Key Architectural Rules

1. **Never create audits without `project_id`** — UI enforces project-first flow
2. **All API calls through `frontend/lib/api.ts`** — workspace-scoped, centralized auth
3. **`verify_workspace_access()` on every backend endpoint** — mandatory access control
4. **Secrets in env vars only** — update `.env.example` for new variables, never commit `.env`
5. **Locale: Polish (pl-PL)** — date/number formatting uses Polish locale in the frontend

---

Last updated: 2026-03-17
