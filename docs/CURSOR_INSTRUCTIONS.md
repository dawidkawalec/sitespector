# Cursor Global Instructions
## SiteSpector.app Project

---

## 🎯 Project Context

**What:** AI-powered website audit tool (Polish market MVP)  
**Tech:** FastAPI (backend) + Next.js 14 (frontend) + PostgreSQL + Claude Sonnet 4  
**Deploy:** Railway.app  
**Timeline:** 6 weeks, 51 tasks

---

## 📚 Documentation Structure

**All specs are in `/docs/` folder. Use them as reference.**

### Core Reference Files:
- `TABLE_OF_CONTENTS.md` - Quick guide to all docs
- `PRD.md` - Product requirements
- `TECH_STACK.md` - Technology choices
- `ARCHITECTURE.md` - System design
- `DATABASE_SCHEMA.md` - Database structure
- `API_ENDPOINTS.md` - API specifications
- `FRONTEND_COMPONENTS.md` - UI component specs
- `BACKLOG.md` - All development tasks (start here!)

**→ When implementing a feature, ALWAYS check relevant docs first.**

---

## 🛠️ Code Guidelines

### Backend (Python/FastAPI)
- **Type hints:** Always use (e.g., `def func(x: int) -> str:`)
- **Async:** Use `async def` for all endpoints and DB operations
- **Validation:** Use Pydantic models for all request/response
- **Errors:** Raise custom exceptions (see `ERROR_HANDLING.md`)
- **Format:** Black + isort (run before commit)

### Frontend (TypeScript/React)
- **TypeScript:** Strict mode, no `any` types
- **Components:** Functional components with hooks
- **Styling:** Tailwind CSS + shadcn/ui only
- **State:** React Query for server state, useState for local
- **Format:** Prettier + ESLint (run before commit)

### Database
- **ORM:** SQLAlchemy 2.0 async
- **Migrations:** Alembic (never edit database directly)
- **Queries:** Use ORM, avoid raw SQL
- **Schema:** Follow `DATABASE_SCHEMA.md` exactly

---

## 📋 Development Workflow

1. **Find task** in `BACKLOG.md` (Epic → Task)
2. **Read relevant docs** (e.g., API_ENDPOINTS.md for API tasks)
3. **Use Cursor prompt** from BACKLOG.md
4. **Review generated code** (check imports, types, logic)
5. **Write tests** (see TESTING_STRATEGY.md)
6. **Run tests** (`pytest` or `npm test`)
7. **Commit** when tests pass

---

## 🚨 Critical Rules

### Security
- **NO hardcoded secrets** (use environment variables)
- **ALL passwords hashed** (bcrypt, cost=12)
- **JWT expiration:** 7 days max
- **Input validation:** ALWAYS validate user input (Pydantic)
- **SQL injection:** Use ORM only, never f-strings in queries

### Performance
- **Database:** Use indexes (see DATABASE_SCHEMA.md)
- **API:** Add pagination to list endpoints (limit=20 default)
- **Images:** Lazy loading, WebP format
- **Caching:** Redis for repeated audits (Etap 2)

### Error Handling
- **User-facing:** Friendly messages (no technical jargon)
- **Logging:** Log everything (but no passwords/tokens)
- **Graceful degradation:** Partial results > no results
- **Status codes:** Use correct HTTP codes (see API_ENDPOINTS.md)

---

## 🎨 Naming Conventions

### Python
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions: `snake_case()`
- Constants: `UPPER_SNAKE_CASE`

### TypeScript
- Files: `PascalCase.tsx` (components), `camelCase.ts` (utils)
- Components: `PascalCase`
- Functions: `camelCase()`
- Constants: `UPPER_SNAKE_CASE`

### Database
- Tables: `snake_case` (plural)
- Columns: `snake_case`
- Indexes: `idx_{table}_{column}`

---

## 🔗 Key Integrations

### Claude API
- Model: `claude-sonnet-4-20250514`
- Cost: ~$0.12/audit
- Prompts: See `AI_PROMPTS.md`
- Retry: 3 attempts with exponential backoff

### Railway
- Services: Backend, Worker, Frontend, PostgreSQL
- Domains: `api.sitespector.app`, `sitespector.app`
- Env vars: See `DEPLOYMENT_CHECKLIST.md`

### Docker
- Screaming Frog: `docker/screaming-frog/`
- Lighthouse: `docker/lighthouse/`

---

## ✅ Before Asking Me

**Check these first:**
1. Is there a relevant doc? (see TABLE_OF_CONTENTS.md)
2. Is there a task in BACKLOG.md?
3. Is there an example in the docs?

**Then ask with context:**
- "According to DATABASE_SCHEMA.md, the audits table has... but I'm getting error X. How to fix?"
- "BACKLOG.md Task 2.3 says to implement /api/audits endpoint. I've done X, but Y doesn't work. Here's my code: [paste]"

---

## 📖 Quick Links

- **Start coding:** `/docs/BACKLOG.md` → Epic 1, Task 1.1
- **Stuck on setup:** `/docs/SETUP_GUIDE.md`
- **Need API spec:** `/docs/API_ENDPOINTS.md`
- **Database question:** `/docs/DATABASE_SCHEMA.md`
- **Common issues:** `/docs/FAQ.md`

---

**Remember:** This is a 6-week MVP. Prioritize working code over perfection. Iterate fast, test often, deploy early.

**Last Updated:** 2025-12-04
