# SiteSpector - Agent Startup Prompt

**Purpose**: This file contains the complete initialization instructions for AI coding agents (Claude, GPT, Gemini) working on the SiteSpector project. Copy and paste this entire file into your AI chat to set up the working context.

---

## 🎯 Project Context

You are now working on **SiteSpector**, an SEO & technical audit platform (SaaS). This is a live production application running on a Hetzner VPS.

### Critical Information
- **Status**: Production SaaS (teams, billing, workspaces); domain sitespector.app, Let's Encrypt SSL
- **Deployment**: Hetzner VPS (IP: 77.42.79.46); app URL: https://sitespector.app
- **Environment**: **NO LOCAL DOCKER** - all containers run on VPS only
- **Workflow**: Code locally in Cursor, deploy via SSH to VPS
- **Branch**: `release` (most up-to-date)
- **Git**: Auto-commit YES, Auto-push ASK FIRST (always)

### Tech Stack
- **Backend**: FastAPI (Python 3.11) + SQLAlchemy 2.0 + PostgreSQL 15
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Infrastructure**: Docker Compose (7 containers: nginx, frontend, backend, worker, postgres, screaming-frog, lighthouse)
- **AI**: Google Gemini API (gemini-3-flash)
- **PDF**: WeasyPrint

---

## 📚 Context7 MCP - MANDATORY Usage

**BEFORE doing ANYTHING**, check Context7 documentation:

```bash
# Query relevant docs
query-docs "project overview"
query-docs "architecture containers flow"
query-docs "missing frontend features"
query-docs "API endpoints"
query-docs "worker process"
query-docs "deployment workflow"
```

**Context7 Directory Structure**:
```
.context7/
├── project/           # OVERVIEW.md, ARCHITECTURE.md, STACK.md, DEPLOYMENT.md
├── backend/           # API.md, MODELS.md, WORKER.md, AI_SERVICES.md
├── frontend/          # COMPONENTS.md, API_CLIENT.md, PAGES.md, MISSING_FEATURES.md
├── infrastructure/    # DOCKER.md, NGINX.md, DATABASE.md
└── decisions/         # DECISIONS_LOG.md, BUGS_AND_FIXES.md
```

**After making changes**, update docs:
```bash
update-docs "path/to/doc.md" "Brief description of change"
```

---

## 🚨 Critical Rules - READ CAREFULLY

### 1. VPS-Only Development Workflow

**NEVER attempt to run Docker locally** - all containers are on VPS only.

**Standard workflow**:
```bash
# 1. Make changes locally in Cursor (code, edit files)

# 2. Commit (auto-commit is allowed)
git add .
git commit -m "feat: description of changes"

# 3. Push (ALWAYS ASK USER FIRST - never auto-push)
# Agent must ask: "Ready to push to origin/release? Changes: [list]"
# Wait for user confirmation

# 4. Deploy to VPS (after user confirms push)
ssh root@77.42.79.46
cd /opt/sitespector
git pull origin release

# 5. Restart appropriate services:

# For backend/worker changes:
docker compose -f docker-compose.prod.yml restart backend worker

# For frontend changes (REQUIRES REBUILD):
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# For infrastructure changes (nginx, docker-compose.prod.yml):
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 6. Monitor logs
docker logs sitespector-backend --tail 50 -f
docker logs sitespector-worker --tail 50 -f
docker logs sitespector-frontend --tail 50 -f
```

### 2. Git Rules

**Auto-Commit**: ✅ Allowed
```bash
git commit -m "feat(frontend): add SEO details rendering"
git commit -m "fix(worker): handle timeout in Screaming Frog"
git commit -m "docs(context7): update API endpoints"
```

**Auto-Push**: ❌ NEVER - ALWAYS ASK FIRST
```bash
# WRONG - NEVER do this automatically:
git push origin release  # ❌ FORBIDDEN

# CORRECT - Ask user first:
"I've committed 3 changes:
- feat(frontend): SEO rendering
- fix(api): null safety  
- docs: update Context7

Ready to push to origin/release?"
```

### 3. TypeScript & Next.js Patterns

**UUID Handling** (CRITICAL):
```typescript
// ✅ CORRECT - UUID is ALWAYS string in API responses
interface Audit {
  id: string  // UUID from PostgreSQL comes as string via JSON
  user_id: string
}

// ❌ WRONG - Never use UUID type
import { UUID } from 'crypto'  // NO!
```

**Null Safety** (MANDATORY):
```typescript
// ✅ ALWAYS use optional chaining
const score = audit.overall_score ?? 0
const title = audit.results?.crawl?.title ?? 'No title'
const recommendations = audit.results?.content_analysis?.recommendations ?? []

// ❌ NEVER assume data exists
const score = audit.overall_score  // Can be null!
const title = audit.results.crawl.title  // Can crash!
```

**React Query**:
```typescript
const { data: audit, isLoading, isError, error } = useQuery({
  queryKey: ['audit', auditId],
  queryFn: () => auditsAPI.get(auditId),
  refetchInterval: audit?.status === 'processing' ? 5000 : false,
  enabled: !!auditId,
})

if (isLoading) return <LoadingState />
if (isError) return <ErrorState error={error} />
if (!audit) return <NotFoundState />
// Now audit is guaranteed to be defined
```

### 4. Python & FastAPI Patterns

**Async/Await** (MANDATORY):
```python
# ✅ ALWAYS use async for database and external calls
async def get_audit(audit_id: str, db: AsyncSession) -> Audit:
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id)
    )
    return result.scalar_one_or_none()
```

**Error Handling**:
```python
from fastapi import HTTPException, status

if not audit:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Audit {audit_id} not found"
    )
```

---

## 🎯 Current Priorities (2025-02-01)

### ✅ Priority 1: Documentation & Context7 (COMPLETED)
- Context7 MCP configured
- All `.context7/*.md` files created
- Startup prompt ready

### ✅ Priority 2: Frontend Detail Rendering (COMPLETED)

**Location**: `frontend/app/audits/[id]/page.tsx`

**Status**: ✅ **COMPLETED**

All three rendering functions are implemented and working:
1. `renderSeoResults(results)`
2. `renderPerformanceResults(results)`
3. `renderContentResults(results)`

**Note**: Previous documentation incorrectly stated these were missing.

### 🔴 Priority 3: PDF Generator (NEXT)

**File**: `backend/templates/report.html`

**Problem**: Sections 4-9 are EMPTY (only headers, no data)

**Sections to fill**:
- Section 4: SEO Technical Analysis (use `results.crawl`)
- Section 5: Performance Analysis (use `results.lighthouse`)
- Section 6: Content Analysis (use `results.content_analysis`)
- Section 7: Local SEO (conditional, use `results.local_seo`)
- Section 8: Competitive Analysis (conditional, use `results.competitive_analysis`)
- Section 9: Action Plan (aggregate recommendations)

---

## 🧪 Testing

### Test Audit (Use This for Verification)

**Audit ID**: `85d6ee6f-8c55-4c98-abd8-60dedfafa9df`  
**URL**: https://meditrue.pl/  
**Status**: COMPLETED (has full results in DB)  
**Access**: https://sitespector.app/audits/85d6ee6f-8c55-4c98-abd8-60dedfafa9df

**Test credentials**:  
Email: info@craftweb.pl  
Password: Dawid132?

**Expected after frontend fix**:
- SEO tab shows: title (45 chars), meta (155 chars), H1 tags, images, links
- Performance tab shows: Core Web Vitals, desktop/mobile scores, metrics
- Content tab shows: AI summary, quality score (85), recommendations

---

## 📁 Key Files & Locations

### Frontend (Next.js)
```
frontend/
├── app/
│   ├── audits/[id]/page.tsx       # ⚠️ Missing 3 functions (renderSeoResults, renderPerformanceResults, renderContentResults)
│   ├── dashboard/page.tsx         # ✅ Works
│   ├── login/page.tsx             # ✅ Works
│   └── register/page.tsx          # ✅ Works
│
├── components/
│   ├── NewAuditDialog.tsx         # ✅ Works
│   └── ui/                        # shadcn/ui components
│
└── lib/
    ├── api.ts                     # ✅ API client (all types correct)
    └── utils.ts                   # Utility functions
```

### Backend (FastAPI)
```
backend/
├── app/
│   ├── main.py                    # ✅ FastAPI app
│   ├── models.py                  # ✅ SQLAlchemy models
│   ├── schemas.py                 # ✅ Pydantic schemas
│   ├── auth.py                    # ✅ JWT authentication
│   ├── database.py                # ✅ Async engine
│   │
│   ├── routers/
│   │   ├── auth.py                # ✅ Login/register/me
│   │   └── audits.py              # ✅ CRUD endpoints
│   │
│   └── services/
│       ├── ai_analysis.py         # ✅ Gemini AI (4 functions)
│       ├── screaming_frog.py      # ✅ Crawler integration
│       ├── lighthouse.py          # ✅ Performance auditor
│       └── pdf_generator.py       # ⚠️ Works but template incomplete
│
├── templates/
│   └── report.html                # ⚠️ Sections 4-9 empty
│
└── worker.py                      # ✅ Background processor
```

### Infrastructure
```
/opt/sitespector/                  # VPS location
├── .env                           # Production environment variables
├── docker-compose.prod.yml        # ✅ Production config (7 services)
├── docker/
│   ├── nginx/nginx.conf           # ✅ Reverse proxy config
│   ├── screaming-frog/crawl.sh    # ✅ Crawler script
│   └── lighthouse/audit.sh        # ✅ Lighthouse script
└── ssl/                           # Self-signed certificates
```

---

## 🛠️ Common Commands

### View Logs
```bash
docker logs sitespector-backend --tail 100 -f
docker logs sitespector-worker --tail 100 -f
docker logs sitespector-frontend --tail 100 -f
```

### Check Container Status
```bash
docker ps
docker compose -f docker-compose.prod.yml ps
```

### Database Access
```bash
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db

# Useful queries:
SELECT id, url, status FROM audits ORDER BY created_at DESC LIMIT 5;
SELECT * FROM audits WHERE id='85d6ee6f-8c55-4c98-abd8-60dedfafa9df';
SELECT email, audits_count FROM users;
```

### Environment Variables
```bash
docker exec sitespector-backend printenv | grep -E "DATABASE|JWT|GEMINI"
```

---

## 🚀 Getting Started Checklist

When you start working on this project:

1. ✅ Read this entire startup prompt
2. ✅ Query Context7 docs: `query-docs "project overview"`
3. ✅ Check `.cursorrules` file for project-specific rules
4. ✅ Review `MISSING_FEATURES.md` for current priorities
5. ✅ Test VPS access: `ssh root@77.42.79.46`
6. ✅ Test application: https://sitespector.app (valid SSL)
7. ✅ Login with test credentials to see current state
8. ✅ View test audit to understand what's broken

---

## 💬 Communication Style

- **Language**: English (code, docs, commits)
- **Comments**: Moderate detail - explain complex logic only
- **Docs**: Professional but concise (solo project, not team onboarding)
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, etc.)

---

## 🎓 Key Concepts to Understand

### Audit Processing Flow
```
User creates audit (URL + optional competitors)
    ↓
Backend saves (status: PENDING)
    ↓
Worker picks up (polls every 10s)
    ↓
Sequential processing:
  1. Screaming Frog crawl (10-30s)
  2. Lighthouse desktop + mobile (20-40s)
  3. Process competitors (parallel)
  4. AI analysis (4 Gemini calls, 10-20s)
  5. Calculate scores
  6. Save results (status: COMPLETED)
    ↓
Frontend polls (every 5s), displays results
```

### Data Structure
`audits.results` (JSONB in database):
```json
{
  "crawl": { /* Screaming Frog data */ },
  "lighthouse": {
    "desktop": { /* scores, metrics, diagnostics */ },
    "mobile": { /* scores, metrics, diagnostics */ }
  },
  "content_analysis": { /* AI summary, quality_score, recommendations */ },
  "local_seo": { /* is_local_business, has_nap, has_schema */ },
  "performance_analysis": { /* core_web_vitals, recommendations */ },
  "competitive_analysis": { /* summary, strengths, weaknesses */ }
}
```

This data exists in DB but frontend doesn't display it (missing rendering functions).

---

## 📞 When You Need Help

1. **Query Context7**: `query-docs "troubleshooting"`, `query-docs "known issues"`
2. **Check logs**: `docker logs sitespector-backend --tail 100`
3. **Database inspection**: PostgreSQL queries (see commands above)
4. **Update docs**: If you discover something new, add it to Context7

---

## ✅ You're Ready!

You now have complete context to work on SiteSpector. Start by:

1. **Check priority**: `query-docs "missing frontend features"`
2. **Understand data**: `query-docs "audit results schema"`  
3. **Implement fix**: Follow guides in Context7 docs
4. **Test**: Use test audit (ID: 85d6ee6f...)
5. **Deploy**: Follow VPS workflow (commit → ask to push → SSH deploy)
6. **Update docs**: `update-docs` with what you learned

**Remember**:
- ✅ Auto-commit OK
- ❌ Auto-push FORBIDDEN (always ask)
- 📚 Context7 first (query before, update after)
- 🖥️ VPS-only (no local Docker)

Good luck! 🚀

---

**Last Updated**: 2025-02-01  
**Maintainer**: Dawid (solo developer)  
**AI Model**: Claude Sonnet 4.5 (primary), Gemini 3 Pro (occasional)  
**Status**: Ready for Priority 2 implementation (frontend rendering)
