# Development Backlog
## SiteSpector.app - MVP Implementation

**Sprint Duration:** 1 week  
**Total Sprints:** 6 weeks  
**Team Size:** 1 developer + AI assistant (Cursor)

---

## 📊 Epic Overview

| Epic | Tasks | Est. Time | Priority | Sprint |
|------|-------|-----------|----------|--------|
| **Epic 1:** Infrastructure | 8 | 5 days | HIGH | 1 |
| **Epic 2:** Backend API | 12 | 5 days | HIGH | 2 |
| **Epic 3:** Crawlers Integration | 6 | 4 days | HIGH | 3 |
| **Epic 4:** AI Pipeline | 5 | 3 days | HIGH | 3 |
| **Epic 5:** Frontend Dashboard | 10 | 5 days | HIGH | 4 |
| **Epic 6:** PDF Generation | 4 | 3 days | HIGH | 5 |
| **Epic 7:** Testing & Polish | 6 | 5 days | MEDIUM | 6 |

**Total:** 51 tasks, ~30 working days

---

## 🏗️ EPIC 1: Infrastructure Setup

**Goal:** Setup Railway, PostgreSQL, Docker environment

### Task 1.1: Railway Project Setup ⏱️ 1h

**Description:** Create Railway project, provision PostgreSQL

**Cursor Prompt:**
```
Create a Railway project setup guide for SiteSpector.

Steps:
1. Initialize Railway CLI
2. Create new project "sitespector"
3. Add PostgreSQL plugin (version 16)
4. Get DATABASE_URL and save to .env
5. Setup custom domain: api.sitespector.app

Generate:
- railway.json configuration file
- .env.example with all required variables
- README with deployment instructions
```

**Acceptance Criteria:**
- [ ] Railway project created
- [ ] PostgreSQL provisioned
- [ ] DATABASE_URL obtained
- [ ] Can connect from local machine

---

### Task 1.2: Docker Compose Setup ⏱️ 2h

**Description:** Create docker-compose.yml for local development

**Cursor Prompt:**
```
Create docker-compose.yml for SiteSpector local development.

Services needed:
1. PostgreSQL 16 (local database)
2. Backend (FastAPI, port 8000)
3. Worker (background jobs)
4. Frontend (Next.js, port 3000)

Requirements:
- All services should restart on failure
- Shared volumes for /tmp/audits
- Environment variables from .env file
- Health checks for database

Also create:
- .dockerignore files
- Makefile with shortcuts (make up, make down, make logs)
```

**Files to Generate:**
- `docker-compose.yml`
- `.dockerignore`
- `Makefile`

**Acceptance Criteria:**
- [ ] `docker-compose up` starts all services
- [ ] Backend accessible at localhost:8000
- [ ] Frontend accessible at localhost:3000
- [ ] PostgreSQL accessible at localhost:5432

---

### Task 1.3: Database Schema Migration ⏱️ 2h

**Description:** Setup Alembic, create initial migration

**Cursor Prompt:**
```
Setup Alembic for SiteSpector and create initial database schema.

Tables to create (see DATABASE_SCHEMA.md):
1. users (id, email, password_hash, subscription_tier, ...)
2. audits (id, user_id, url, status, results JSONB, ...)
3. competitors (id, audit_id, url, results JSONB, ...)

Create:
1. alembic.ini configuration
2. alembic/env.py (async engine setup)
3. Initial migration: 001_initial_tables.py
4. SQLAlchemy models in backend/app/models.py

Follow DATABASE_SCHEMA.md for exact column definitions.
```

**Files to Generate:**
- `backend/alembic.ini`
- `backend/alembic/env.py`
- `backend/alembic/versions/001_initial_tables.py`
- `backend/app/models.py`

**Acceptance Criteria:**
- [ ] `alembic upgrade head` creates tables
- [ ] All indexes created
- [ ] Foreign keys work correctly
- [ ] Can insert sample data

---

### Task 1.4: Screaming Frog Docker Image ⏱️ 3h

**Description:** Create Docker image with Screaming Frog CLI

**Cursor Prompt:**
```
Create Dockerfile for Screaming Frog SEO Spider CLI.

Requirements:
- Base image: openjdk:11 (Screaming Frog requires Java)
- Download Screaming Frog CLI from official source
- Make it executable
- Add wrapper script to run crawls

Create:
1. docker/screaming-frog/Dockerfile
2. docker/screaming-frog/crawl.sh (wrapper script)

Wrapper script should:
- Accept URL as argument
- Output JSON to /output directory
- Handle errors gracefully

Test command:
docker run screaming-frog crawl.sh https://example.com
```

**Files to Generate:**
- `docker/screaming-frog/Dockerfile`
- `docker/screaming-frog/crawl.sh`
- `docker/screaming-frog/README.md`

**Acceptance Criteria:**
- [ ] Docker image builds successfully
- [ ] Can crawl example.com
- [ ] JSON output generated in /output
- [ ] No errors in logs

---

### Task 1.5: Lighthouse Docker Image ⏱️ 2h

**Description:** Create Docker image with Lighthouse CLI

**Cursor Prompt:**
```
Create Dockerfile for Google Lighthouse CLI.

Requirements:
- Base image: node:20-slim
- Install Chromium browser
- Install Lighthouse globally via npm
- Add wrapper script for audits

Create:
1. docker/lighthouse/Dockerfile
2. docker/lighthouse/audit.sh (wrapper script)

Wrapper script should:
- Accept URL as argument
- Run both desktop and mobile audits
- Output JSON to /output directory
- Include all categories: performance, accessibility, best-practices, seo

Test command:
docker run lighthouse audit.sh https://example.com
```

**Files to Generate:**
- `docker/lighthouse/Dockerfile`
- `docker/lighthouse/audit.sh`

**Acceptance Criteria:**
- [ ] Docker image builds successfully
- [ ] Can audit example.com (desktop + mobile)
- [ ] JSON reports generated
- [ ] Core Web Vitals data present

---

## ⚙️ EPIC 2: Backend API

**Goal:** Build FastAPI backend with auth and CRUD endpoints

### Task 2.1: FastAPI Project Structure ⏱️ 1h

**Description:** Setup FastAPI app structure

**Cursor Prompt:**
```
Create FastAPI project structure for SiteSpector backend.

Structure:
backend/
├── app/
│   ├── __init__.py
│   ├── main.py (FastAPI app)
│   ├── config.py (settings from env)
│   ├── database.py (async SQLAlchemy setup)
│   ├── models.py (already created in Epic 1)
│   ├── schemas.py (Pydantic models)
│   ├── auth.py (JWT utilities)
│   ├── dependencies.py (current_user, etc.)
│   ├── routers/
│   │   ├── auth.py
│   │   └── audits.py
│   └── services/
│       ├── screaming_frog.py
│       ├── lighthouse.py
│       └── ai_analysis.py
├── worker.py
├── requirements.txt
└── Dockerfile

Create all files with basic boilerplate.
```

**Acceptance Criteria:**
- [ ] Project structure created
- [ ] FastAPI app starts without errors
- [ ] Swagger docs accessible at /docs

---

### Task 2.2: Auth Endpoints (Register, Login) ⏱️ 3h

**Description:** Implement user registration and login

**Cursor Prompt:**
```
Implement authentication endpoints for SiteSpector.

Use specifications from API_ENDPOINTS.md:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

Requirements:
- Password hashing with bcrypt (passlib)
- JWT token generation (python-jose)
- Token expiration: 7 days
- Pydantic schemas for request/response validation

Create:
1. app/routers/auth.py (endpoints)
2. app/schemas.py (UserCreate, UserLogin, UserResponse, Token)
3. app/auth.py (create_access_token, verify_password, etc.)

Follow API_ENDPOINTS.md for exact request/response formats.
```

**Files to Generate:**
- `backend/app/routers/auth.py`
- `backend/app/auth.py`
- `backend/app/schemas.py` (auth schemas)

**Acceptance Criteria:**
- [ ] Can register new user
- [ ] Can login with correct credentials
- [ ] Receives JWT token
- [ ] Token validation works
- [ ] Password requirements enforced

---

### Task 2.3: Audit CRUD Endpoints ⏱️ 4h

**Description:** Implement audit creation, listing, retrieval

**Cursor Prompt:**
```
Implement audit endpoints for SiteSpector.

Endpoints (see API_ENDPOINTS.md):
- POST /api/audits (create new audit)
- GET /api/audits (list user's audits with filters)
- GET /api/audits/{id} (get single audit)
- GET /api/audits/{id}/status (poll status)
- DELETE /api/audits/{id} (delete audit)

Requirements:
- All endpoints require authentication (JWT)
- User can only see their own audits
- Pagination for list endpoint (limit, offset)
- Filters: status, search by URL
- Validation: URL must be valid HTTPS

Create:
1. app/routers/audits.py
2. app/schemas.py (AuditCreate, AuditResponse, AuditList)
3. app/dependencies.py (get_current_user)

Follow API_ENDPOINTS.md for exact specs.
```

**Files to Generate:**
- `backend/app/routers/audits.py`
- `backend/app/dependencies.py`
- Update `backend/app/schemas.py`

**Acceptance Criteria:**
- [ ] Can create audit (status=pending)
- [ ] Can list audits with pagination
- [ ] Can get single audit by ID
- [ ] Can check status
- [ ] Can delete audit
- [ ] Authorization works (can't see other users' audits)

---

### Task 2.4: Rate Limiting ⏱️ 2h

**Description:** Implement rate limiting with SlowAPI

**Cursor Prompt:**
```
Add rate limiting to SiteSpector API using SlowAPI.

Limits (see API_ENDPOINTS.md):
- /api/auth/register: 5/hour
- /api/auth/login: 10/hour
- /api/audits (POST): 5/hour
- All other GET endpoints: 60/minute

Requirements:
- Use SlowAPI library
- Key function: get_remote_address (IP-based)
- Custom rate limit response (429 with retry_after)
- Add X-RateLimit headers to responses

Update:
- app/main.py (add SlowAPI middleware)
- app/routers/*.py (add @limiter.limit decorators)
```

**Acceptance Criteria:**
- [ ] Rate limits enforced
- [ ] 429 response when exceeded
- [ ] X-RateLimit headers present
- [ ] Can test with multiple requests

---

## 🕷️ EPIC 3: Crawlers Integration

**Goal:** Integrate Screaming Frog and Lighthouse

### Task 3.1: Screaming Frog Service ⏱️ 3h

**Description:** Python service to run Screaming Frog CLI

**Cursor Prompt:**
```
Create service to run Screaming Frog crawls.

File: backend/app/services/screaming_frog.py

Function:
async def crawl_url(url: str) -> dict:
    """
    Run Screaming Frog CLI on URL.
    
    Steps:
    1. Run Docker container with SF CLI
    2. Parse JSON output
    3. Extract: meta tags, headers, images, links, schema.org
    4. Return structured dict
    
    Handle errors:
    - Timeout after 5 minutes
    - Invalid URL
    - Crawl failures
    """

Return format should match DATABASE_SCHEMA.md > results.screaming_frog structure.

Use subprocess or docker-py to run container.
```

**Acceptance Criteria:**
- [ ] Can crawl valid URL
- [ ] Returns structured data
- [ ] Handles timeouts
- [ ] Handles invalid URLs
- [ ] Logs errors properly

---

### Task 3.2: Lighthouse Service ⏱️ 3h

**Description:** Python service to run Lighthouse audits

**Cursor Prompt:**
```
Create service to run Lighthouse audits.

File: backend/app/services/lighthouse.py

Functions:
async def audit_url(url: str, device: str = "desktop") -> dict:
    """
    Run Lighthouse audit on URL.
    
    Args:
        url: URL to audit
        device: "desktop" or "mobile"
    
    Returns:
        Lighthouse JSON with scores and metrics
    """

async def audit_both(url: str) -> dict:
    """Run both desktop and mobile audits, return combined results."""

Extract Core Web Vitals:
- LCP, INP, CLS, TTFB, Speed Index

Return format should match DATABASE_SCHEMA.md > results.lighthouse structure.
```

**Acceptance Criteria:**
- [ ] Can audit URL (desktop)
- [ ] Can audit URL (mobile)
- [ ] Returns Core Web Vitals
- [ ] Returns performance opportunities
- [ ] Handles errors

---

## 🤖 EPIC 4: AI Analysis Pipeline

**Goal:** Integrate Claude API for content analysis

### Task 4.1: Claude API Setup ⏱️ 1h

**Description:** Setup Anthropic Claude client

**Cursor Prompt:**
```
Setup Anthropic Claude API client for SiteSpector.

File: backend/app/services/ai_client.py

Create:
1. Claude client initialization (from env var CLAUDE_API_KEY)
2. Helper function for API calls with retry logic
3. Token counter function (estimate usage)

Use anthropic Python SDK.

Include:
- Exponential backoff for rate limits
- Error handling for API failures
- Logging of token usage
```

**Acceptance Criteria:**
- [ ] Claude client initializes
- [ ] Can make test API call
- [ ] Retry logic works
- [ ] Token usage logged

---

### Task 4.2: Content Analysis Prompt ⏱️ 3h

**Description:** Implement AI content analysis

**Cursor Prompt:**
```
Implement AI content analysis for SiteSpector.

File: backend/app/services/ai_analysis.py

Function:
async def analyze_content(
    url: str,
    html_text: str,
    meta_tags: dict,
    headers: dict,
    word_count: int,
    readability: dict
) -> dict:
    """
    Analyze website content using Claude Sonnet 4.
    
    Use prompt template from AI_PROMPTS.md > CONTENT_ANALYSIS_PROMPT
    
    Returns:
        {
          "content_quality": {...},
          "recommendations": [...]
        }
    """

Also implement:
- analyze_local_seo()
- analyze_performance()
- analyze_competitive()

Follow AI_PROMPTS.md for exact prompt templates and output schemas.

Validate JSON responses with Pydantic models.
```

**Acceptance Criteria:**
- [ ] Content analysis returns valid JSON
- [ ] Recommendations include code snippets
- [ ] Local SEO detection works
- [ ] Performance analysis accurate
- [ ] Handles malformed AI responses

---

### Task 4.3: Readability Scores ⏱️ 1h

**Description:** Calculate readability metrics

**Cursor Prompt:**
```
Add readability analysis using textstat library.

File: backend/app/services/readability.py

Function:
def calculate_readability(text: str) -> dict:
    """
    Calculate readability scores.
    
    Returns:
        {
          "flesch_score": 0-100,
          "fog_index": int,
          "avg_sentence_length": float,
          "complex_words_pct": float,
          "interpretation": str
        }
    """

Use textstat library:
- textstat.flesch_reading_ease()
- textstat.gunning_fog()

Add interpretation based on scores (see AI_PROMPTS.md).
```

**Acceptance Criteria:**
- [ ] Returns all scores
- [ ] Interpretation correct
- [ ] Handles edge cases (empty text)

---

## 🖥️ EPIC 5: Frontend Dashboard

**Goal:** Build Next.js dashboard with shadcn/ui

### Task 5.1: Next.js Project Setup ⏱️ 2h

**Description:** Initialize Next.js with TypeScript and Tailwind

**Cursor Prompt:**
```
Create Next.js 14 project for SiteSpector frontend.

Structure:
frontend/
├── app/
│   ├── layout.tsx (root layout)
│   ├── page.tsx (home/landing)
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── audits/
│       └── [id]/page.tsx
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── AuditCard.tsx
├── lib/
│   ├── api.ts (API client)
│   └── utils.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json

Initialize:
1. npx create-next-app@latest
2. Setup Tailwind CSS
3. Initialize shadcn/ui: npx shadcn-ui@latest init

Install components:
- button, card, badge, table, form, input, dialog, tabs, accordion
```

**Acceptance Criteria:**
- [ ] Next.js app runs (npm run dev)
- [ ] Tailwind works
- [ ] shadcn/ui components installed
- [ ] TypeScript configured

---

### Task 5.2: Auth Pages (Login, Register) ⏱️ 3h

**Description:** Build login and registration forms

**Cursor Prompt:**
```
Create authentication pages for SiteSpector.

Pages:
1. app/login/page.tsx
2. app/register/page.tsx

Requirements:
- Use shadcn/ui Form components
- Client-side validation (email format, password strength)
- Call API endpoints (see API_ENDPOINTS.md)
- Store JWT token in localStorage
- Redirect to /dashboard on success
- Show error messages

Use:
- shadcn/ui: Form, Input, Button, Card
- react-hook-form for form handling
- axios for API calls

Create API client in lib/api.ts with methods:
- register(email, password)
- login(email, password)
- getMe() (get current user)
```

**Files to Generate:**
- `frontend/app/login/page.tsx`
- `frontend/app/register/page.tsx`
- `frontend/lib/api.ts`

**Acceptance Criteria:**
- [ ] Can register new user
- [ ] Can login
- [ ] Token stored in localStorage
- [ ] Redirects to dashboard
- [ ] Error handling works
- [ ] Form validation works

---

### Task 5.3: Dashboard Page ⏱️ 4h

**Description:** Build main dashboard with audits list

**Cursor Prompt:**
```
Create dashboard page for SiteSpector.

File: app/dashboard/page.tsx

Features:
1. List of user's audits (DataTable from shadcn/ui)
2. Columns: URL, Status, Overall Score, Date, Actions
3. Filters: Status dropdown, Search input
4. Pagination (20 items per page)
5. "New Audit" button → opens modal/dialog
6. Click on audit → navigate to /audits/[id]

Use:
- shadcn/ui: DataTable, Badge (for status), Button, Dialog
- API: GET /api/audits with filters
- Polling: Refresh list every 10s if any audit is "processing"

Status badges:
- pending: gray
- processing: blue (animated)
- completed: green
- failed: red

Create reusable components:
- components/AuditTable.tsx
- components/NewAuditDialog.tsx
```

**Acceptance Criteria:**
- [ ] Shows list of audits
- [ ] Filters work (status, search)
- [ ] Pagination works
- [ ] Can create new audit (modal)
- [ ] Status updates automatically (polling)
- [ ] Click audit → goes to details page

---

### Task 5.4: Audit Details Page ⏱️ 5h

**Description:** Build single audit results page

**Cursor Prompt:**
```
Create audit details page.

File: app/audits/[id]/page.tsx

Sections:
1. Header with overall score (big circular progress)
2. Score breakdown (SEO, Performance, Content)
3. Tabs:
   - Overview (quick wins, key findings)
   - SEO Technical (meta tags, headers, schema)
   - Performance (Core Web Vitals, images)
   - Content (readability, keywords, CTA)
   - Competitors (if present)
4. Download PDF button

Use:
- shadcn/ui: Tabs, Card, Accordion (for collapsible sections), Badge
- Charts: Use a simple chart library (recharts) for score visualization
- Code blocks: Syntax highlighting for code snippets (react-syntax-highlighter)

API: GET /api/audits/{id}

Show loading state while fetching data.
```

**Acceptance Criteria:**
- [ ] Shows audit results
- [ ] Tabs work
- [ ] Code snippets displayed with syntax highlighting
- [ ] Charts/visualizations render
- [ ] Download PDF button works
- [ ] Loading state shown

---

## 📄 EPIC 6: PDF Generation

**Goal:** Generate professional PDF reports

### Task 6.1: Jinja2 Template ⏱️ 4h

**Description:** Create HTML template for PDF

**Cursor Prompt:**
```
Create Jinja2 HTML template for SiteSpector PDF report.

File: backend/templates/report.html

Structure (see REPORT_STRUCTURE.md):
1. Cover page
2. Executive summary
3. Table of contents (with page numbers)
4. SEO Technical section (5-8 pages)
5. Performance section (3-5 pages)
6. Content Analysis section (3-4 pages)
7. Local SEO (if detected)
8. Competitive Analysis
9. Action Plan
10. Appendix (code snippets)

Requirements:
- Use CSS for styling (WeasyPrint compatible)
- Page breaks between major sections
- Syntax highlighting for code blocks
- Charts/graphs (can use SVG or CSS-based)
- Avoid orphan headings

Follow REPORT_STRUCTURE.md for exact page layouts and wireframes.

Create helper functions for:
- format_date()
- format_score() (with color coding)
- syntax_highlight()
```

**Files to Generate:**
- `backend/templates/report.html`
- `backend/templates/styles.css`
- `backend/app/services/pdf_generator.py`

**Acceptance Criteria:**
- [ ] Template renders with sample data
- [ ] Styling matches design guidelines
- [ ] Code blocks syntax-highlighted
- [ ] Page breaks work correctly
- [ ] PDF generated successfully

---

### Task 6.2: PDF Endpoint ⏱️ 2h

**Description:** Add endpoint to download PDF

**Cursor Prompt:**
```
Add PDF download endpoint.

Endpoint: GET /api/audits/{id}/pdf

Requirements:
- Check if audit is completed (status='completed')
- If PDF already generated, return existing file
- If not, generate on-demand
- Return PDF file with proper headers:
  - Content-Type: application/pdf
  - Content-Disposition: attachment; filename="..."

Update app/routers/audits.py:
@router.get("/{audit_id}/pdf", response_class=FileResponse)
async def download_pdf(audit_id: str, current_user: User = Depends(get_current_user)):
    # Check authorization
    # Generate or retrieve PDF
    # Return file

Use FileResponse from FastAPI.
```

**Acceptance Criteria:**
- [ ] Endpoint returns PDF file
- [ ] Filename is descriptive (includes domain and date)
- [ ] Works for completed audits
- [ ] Returns 404 if audit not ready

---

## 🧪 EPIC 7: Testing & Polish

**Goal:** Test all features, fix bugs, prepare for launch

### Task 7.1: Backend Unit Tests ⏱️ 4h

**Description:** Write pytest tests for backend

**Cursor Prompt:**
```
Create pytest tests for SiteSpector backend.

Test files:
backend/tests/
├── conftest.py (fixtures)
├── test_auth.py
├── test_audits.py
├── test_screaming_frog.py
└── test_ai_analysis.py

Test coverage:
- Auth: register, login, token validation
- Audits: CRUD operations, authorization
- Services: Screaming Frog, Lighthouse, AI analysis
- Rate limiting

Use pytest-asyncio for async tests.
Use httpx.AsyncClient for API testing.

Fixtures needed:
- test_db (clean database)
- test_user
- test_audit
- auth_headers (JWT token)

Run: pytest --cov=app --cov-report=html
```

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] Integration tests work
- [ ] CI/CD ready (can run in GitHub Actions)

---

### Task 7.2: Frontend E2E Tests ⏱️ 3h

**Description:** Write Playwright E2E tests

**Cursor Prompt:**
```
Create Playwright E2E tests for SiteSpector frontend.

Test files:
frontend/e2e/
├── auth.spec.ts (register, login, logout)
├── dashboard.spec.ts (list audits, filters)
└── audit.spec.ts (create audit, view results, download PDF)

Test scenarios:
1. User registers → logs in → sees dashboard
2. User creates audit → waits for completion → views results
3. User downloads PDF report
4. User can filter audits by status
5. User can search audits by URL

Use Playwright with TypeScript.

Setup:
npx playwright install
npx playwright codegen localhost:3000 (to record tests)

Run: npx playwright test
```

**Acceptance Criteria:**
- [ ] All E2E tests pass
- [ ] Tests run in headless mode
- [ ] Screenshots captured on failure
- [ ] Can run in CI/CD

---

### Task 7.3: Error Handling & Validation ⏱️ 2h

**Description:** Add comprehensive error handling

**Cursor Prompt:**
```
Improve error handling across SiteSpector.

Backend:
- Custom exception classes (AuditNotFoundError, UnauthorizedError)
- Global exception handler in FastAPI
- Structured error responses (see API_ENDPOINTS.md)
- Sentry integration (optional, for production)

Frontend:
- Error boundaries (React)
- Toast notifications for errors (use sonner from shadcn/ui)
- Retry logic for failed API calls
- Friendly error messages

Update:
- backend/app/exceptions.py (custom exceptions)
- backend/app/main.py (exception handlers)
- frontend/components/ErrorBoundary.tsx
- frontend/lib/api.ts (error handling)
```

**Acceptance Criteria:**
- [ ] All errors handled gracefully
- [ ] User-friendly error messages
- [ ] Errors logged properly
- [ ] No uncaught exceptions

---

### Task 7.4: Documentation & README ⏱️ 2h

**Description:** Write user-facing documentation

**Cursor Prompt:**
```
Create user documentation for SiteSpector.

Files to create:
1. README.md (main project README)
   - What is SiteSpector
   - Features
   - Tech stack
   - Setup instructions (link to SETUP_GUIDE.md)
   - Demo link
   
2. docs/USER_GUIDE.md
   - How to create audit
   - How to read report
   - FAQ
   
3. docs/API_DOCUMENTATION.md
   - For developers who want to use API
   - Authentication
   - Endpoints
   - Examples

Make it beginner-friendly with screenshots/GIFs.
```

**Acceptance Criteria:**
- [ ] README is comprehensive
- [ ] User guide is clear
- [ ] API docs match actual endpoints
- [ ] Screenshots/GIFs added

---

### Task 7.5: Performance Optimization ⏱️ 3h

**Description:** Optimize app performance

**Cursor Prompt:**
```
Optimize SiteSpector performance.

Backend:
- Add database query optimization (select only needed columns)
- Add caching for repeated audits (Redis - optional)
- Optimize AI prompt tokens (remove unnecessary context)
- Add connection pooling for database

Frontend:
- Code splitting (dynamic imports for heavy components)
- Image optimization (next/image)
- Lazy loading for audit results
- Memoization (React.memo, useMemo)

Measure:
- Backend: Add logging for slow queries (> 100ms)
- Frontend: Use Lighthouse to measure performance

Target:
- API response time < 500ms (non-audit endpoints)
- Frontend FCP < 1.5s
- Frontend LCP < 2.5s
```

**Acceptance Criteria:**
- [ ] API response times improved
- [ ] Frontend Lighthouse score > 90
- [ ] No unnecessary re-renders
- [ ] Database queries optimized

---

### Task 7.6: Production Deployment ⏱️ 4h

**Description:** Deploy to Railway production

**Cursor Prompt:**
```
Deploy SiteSpector to Railway production.

Steps:
1. Push code to GitHub main branch
2. Connect Railway to GitHub repo
3. Configure services:
   - Backend: Root directory = /backend, Start command = uvicorn app.main:app
   - Worker: Root directory = /backend, Start command = python worker.py
   - Frontend: Root directory = /frontend, Build command = npm run build
4. Set environment variables (all services)
5. Configure custom domains:
   - api.sitespector.app → Backend
   - sitespector.app → Frontend
6. Run database migrations on production
7. Test all features on production

Create:
- .github/workflows/deploy.yml (CI/CD pipeline)
- scripts/deploy.sh (deployment script)

Checklist in DEPLOYMENT_CHECKLIST.md.
```

**Acceptance Criteria:**
- [ ] App deployed successfully
- [ ] All environment variables set
- [ ] Custom domains working
- [ ] SSL certificates active
- [ ] Database migrations run
- [ ] Can create test audit on production

---

## 📋 Task Tracking Template

For each task, use this template:

```markdown
## Task X.Y: [Task Name]

**Status:** 🟡 In Progress / ✅ Done / ❌ Blocked  
**Assignee:** Developer + Cursor  
**Est. Time:** Xh  
**Actual Time:** Xh  

**Description:** ...

**Cursor Prompt:** ...

**Files Generated:**
- [ ] file1.py
- [ ] file2.tsx

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Notes:**
- Issue encountered: ...
- Solution: ...
```

---

## 🎯 Sprint Planning

### Sprint 1 (Week 1): Infrastructure
- Epic 1: Tasks 1.1 - 1.5
- **Goal:** Docker, Railway, Database ready

### Sprint 2 (Week 2): Backend Core
- Epic 2: Tasks 2.1 - 2.4
- **Goal:** Auth + Audit CRUD working

### Sprint 3 (Week 3): Crawlers + AI
- Epic 3: Tasks 3.1 - 3.2
- Epic 4: Tasks 4.1 - 4.3
- **Goal:** Can run full audit pipeline

### Sprint 4 (Week 4): Frontend
- Epic 5: Tasks 5.1 - 5.4
- **Goal:** Dashboard + Audit details working

### Sprint 5 (Week 5): PDF + Integration
- Epic 6: Tasks 6.1 - 6.2
- **Goal:** End-to-end flow complete

### Sprint 6 (Week 6): Testing + Launch
- Epic 7: Tasks 7.1 - 7.6
- **Goal:** Production-ready, deployed

---

## 📊 Progress Tracking

**Completion Status:**
- [ ] Epic 1: Infrastructure (0/8 tasks)
- [ ] Epic 2: Backend API (0/12 tasks)
- [ ] Epic 3: Crawlers (0/6 tasks)
- [ ] Epic 4: AI Pipeline (0/5 tasks)
- [ ] Epic 5: Frontend (0/10 tasks)
- [ ] Epic 6: PDF Generation (0/4 tasks)
- [ ] Epic 7: Testing & Polish (0/6 tasks)

**Overall Progress:** 0/51 tasks (0%)

**Velocity:** TBD (calculate after Sprint 1)

---

**Document Status:** ✅ READY FOR DEVELOPMENT  
**Next Steps:** Start with Epic 1, Task 1.1  
**Questions?** Check SETUP_GUIDE.md or open GitHub issue
