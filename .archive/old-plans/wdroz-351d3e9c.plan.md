# Plan Wdrożenia SiteSpector.app - MVP

## 📊 Podsumowanie Projektu

**Repozytorium GitHub**: https://github.com/dawidkawalec/sitespector.git**Cel**: Stworzenie platformy do automatycznych audytów SEO z rekomendacjami AI**Timeline**: 6 tygodni (30 dni roboczych)**Zadań**: 51 w 7 Epic-ach**Team**: 1 developer + AI (Cursor)**Budget**: ~$160/miesiąc (Railway $40 + Claude API $120)---

## 🎯 ETAP 0: Przygotowanie (Dzień 0 - setup początkowy)

### Cel

Przygotowanie środowiska deweloperskiego i zapoznanie z dokumentacją.

### Zadania

**0.1 Przegląd Dokumentacji** (2h)

- Przeczytaj w kolejności:

1. [docs/PRD.md](docs/PRD.md) - zrozumienie produktu
2. [docs/TECH_STACK.md](docs/TECH_STACK.md) - stos technologiczny
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - architektura systemu
4. [docs/BACKLOG.md](docs/BACKLOG.md) - szczegółowe zadania

**0.2 Setup Lokalnego Środowiska** (3h)

- Zainstaluj wymagane narzędzia:
- Python 3.11+
- Node.js 20.x LTS
- Docker + Docker Compose
- PostgreSQL 16
- Git
- Sklonuj/utwórz repozytorium
- Skonfiguruj VSCode z rozszerzeniami
- Przygotuj `.env.example` z wymaganymi zmiennymi

**0.3 Konto Railway i API Keys** (1h)

- Załóż konto Railway.app
- Zdobądź Claude API key (Anthropic)
- Przygotuj domeny (sitespector.app, api.sitespector.app)
- Skonfiguruj Stripe account (dla płatności - opcjonalne na początek)

**Deliverables**:

- [ ] Środowisko lokalne gotowe
- [ ] Dostępy do Railway i Claude API
- [ ] Struktura projektu utworzona

**Dokumentacja**: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)---

## 🏗️ ETAP 1: Infrastructure (Tydzień 1 - 5 dni)

### Cel

Postavić fundament: Railway, PostgreSQL, Docker containers.

### Epic 1: Infrastructure Setup (8 zadań)

**1.1 Railway Project Setup** (1h)

- Utwórz projekt "sitespector-prod" w Railway
- Provisionuj PostgreSQL 16
- Skonfiguruj custom domains (api.sitespector.app)
- Zapisz DATABASE_URL do .env

**1.2 Docker Compose Setup** (2h)

- Stwórz `docker-compose.yml`:
- Backend service (FastAPI)
- Worker service (background jobs)
- PostgreSQL (local dev)
- Frontend service (Next.js)
- Utwórz Makefile z shortcuts (make up, make down, make logs)

**1.3 Database Schema Migration** (2h)

- Setup Alembic migrations
- Stwórz SQLAlchemy models ([docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)):
- `users` table
- `audits` table
- `competitors` table
- Uruchom pierwszą migrację: `alembic upgrade head`

**1.4 Screaming Frog Docker Image** (3h)

- Stwórz `docker/screaming-frog/Dockerfile`
- Zainstaluj Screaming Frog CLI + Java
- Dodaj wrapper script `crawl.sh`
- Test: zrób crawl example.com

**1.5 Lighthouse Docker Image** (2h)

- Stwórz `docker/lighthouse/Dockerfile`
- Zainstaluj Lighthouse + Chrome headless
- Dodaj wrapper script `audit.sh`
- Test: audyt example.com (desktop + mobile)

**Deliverables**:

- [ ] Railway projekt działa
- [ ] Docker containers zbudowane i działają
- [ ] Database schema gotowa
- [ ] Screaming Frog + Lighthouse testowane

**Czas**: 5 dni (1 tydzień)**Dokumentacja**: [docs/BACKLOG.md](docs/BACKLOG.md) Epic 1---

## ⚙️ ETAP 2: Backend Core (Tydzień 2 - 5 dni)

### Cel

Zbudować FastAPI backend z auth i CRUD dla audytów.

### Epic 2: Backend API (12 zadań - wybrane kluczowe)

**2.1 FastAPI Project Structure** (1h)

- Utwórz strukturę katalogów:
  ```javascript
    backend/app/
    ├── main.py (FastAPI app)
    ├── models.py (SQLAlchemy)
    ├── schemas.py (Pydantic)
    ├── database.py (async DB)
    ├── auth.py (JWT)
    ├── routers/ (auth.py, audits.py)
    └── services/ (screaming_frog.py, lighthouse.py, ai_analysis.py)
  ```


**2.2 Auth Endpoints** (3h)

- Zaimplementuj ([docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)):
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- Password hashing (bcrypt)
- JWT token generation (7-day expiry)

**2.3 Audit CRUD Endpoints** (4h)

- Zaimplementuj:
- POST `/api/audits` - create audit
- GET `/api/audits` - list (z paginacją)
- GET `/api/audits/:id` - single audit
- GET `/api/audits/:id/status` - polling
- DELETE `/api/audits/:id`
- Authorization (user może widzieć tylko swoje audyty)

**2.4 Rate Limiting** (2h)

- Dodaj SlowAPI middleware
- Limity:
- Register: 5/hour
- Login: 10/hour
- Create audit: 5/hour
- GET endpoints: 60/minute

**Pozostałe zadania Epic 2** (reszta dnia 2):

- Error handling middleware
- CORS configuration
- Health check endpoint
- Logging setup

**Deliverables**:

- [ ] Backend API działa lokalnie (localhost:8000)
- [ ] Swagger docs dostępne (/docs)
- [ ] Można się zarejestrować i zalogować
- [ ] Można utworzyć audit (status=pending)

**Czas**: 5 dni (tydzień 2)**Dokumentacja**: [docs/BACKLOG.md](docs/BACKLOG.md) Epic 2, [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)---

## 🕷️ ETAP 3: Crawlers & AI Pipeline (Tydzień 3 - 4 dni)

### Cel

Zintegrować Screaming Frog, Lighthouse i Claude API.

### Epic 3: Crawlers Integration (6 zadań)

**3.1 Screaming Frog Service** (3h)

- Stwórz `backend/app/services/screaming_frog.py`
- Funkcja: `async def crawl_url(url: str) -> dict`
- Uruchom Docker container z SF
- Parse JSON output
- Return structured data (zgodnie z [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md))

**3.2 Lighthouse Service** (3h)

- Stwórz `backend/app/services/lighthouse.py`
- Funkcje:
- `async def audit_url(url, device="desktop")`
- `async def audit_both(url)` - desktop + mobile
- Ekstrahuj Core Web Vitals (LCP, INP, CLS, TTFB)

### Epic 4: AI Analysis Pipeline (5 zadań)

**4.1 Claude API Setup** (1h)

- Stwórz `backend/app/services/ai_client.py`
- Initialize Anthropic client
- Retry logic (exponential backoff)
- Token usage logging

**4.2 Content Analysis Prompt** (3h)

- Implementuj `backend/app/services/ai_analysis.py`
- Funkcje (użyj promptów z [docs/AI_PROMPTS.md](docs/AI_PROMPTS.md)):
- `analyze_content()` - content quality + recommendations
- `analyze_local_seo()` - detect local business
- `analyze_performance()` - Core Web Vitals issues
- `analyze_competitive()` - porównanie z konkurentami
- Validate JSON responses (Pydantic models)

**4.3 Readability Scores** (1h)

- Użyj biblioteki `textstat`
- Funkcja: `calculate_readability(text)`
- Return: Flesch score, Fog Index, interpretacja

**4.4 Worker Process** (3h)

- Stwórz `backend/worker.py`
- Main loop: pobiera pending audits z DB
- Orchestrate pipeline:

1. Screaming Frog crawl
2. Lighthouse audit (desktop + mobile)
3. Competitors (parallel)
4. AI analysis
5. Update audit status = "completed"

- Error handling (mark as "failed" on timeout)

**Deliverables**:

- [ ] Screaming Frog integration działa
- [ ] Lighthouse integration działa
- [ ] Claude API zwraca rekomendacje
- [ ] Worker przetwarza audyty end-to-end
- [ ] Audit w DB ma pełne results JSONB

**Czas**: 4 dni (tydzień 3)**Dokumentacja**: [docs/BACKLOG.md](docs/BACKLOG.md) Epic 3-4, [docs/AI_PROMPTS.md](docs/AI_PROMPTS.md)---

## 🖥️ ETAP 4: Frontend Dashboard (Tydzień 4 - 5 dni)

### Cel

Zbudować Next.js dashboard z shadcn/ui.

### Epic 5: Frontend Dashboard (10 zadań)

**5.1 Next.js Project Setup** (2h)

- Initialize Next.js 14 (App Router)
- Setup Tailwind CSS
- Initialize shadcn/ui: `npx shadcn-ui@latest init`
- Dodaj komponenty: button, card, badge, table, form, input, dialog, tabs
- Struktura katalogów ([docs/FRONTEND_COMPONENTS.md](docs/FRONTEND_COMPONENTS.md))

**5.2 Auth Pages** (3h)

- Stwórz:
- `app/login/page.tsx`
- `app/register/page.tsx`
- Formularze z react-hook-form
- Client-side validation
- API integration (`lib/api.ts`)
- Token storage (localStorage)
- Redirect to dashboard on success

**5.3 Dashboard Page** (4h)

- `app/dashboard/page.tsx`
- AuditTable component:
- Lista audytów (DataTable)
- Kolumny: URL, Status, Score, Date, Actions
- Filters: status dropdown, search
- Pagination (20/page)
- NewAuditDialog:
- Form: URL + competitors (max 3)
- Submit → API call
- Status polling (co 10s jeśli audit = "processing")

**5.4 Audit Details Page** (5h)

- `app/audits/[id]/page.tsx`
- Sekcje:
- Header z overall score (circular progress)
- Score breakdown (SEO, Performance, Content)
- Tabs:
    - Overview (quick wins)
    - SEO Technical
    - Performance (Core Web Vitals)
    - Content (readability, keywords)
    - Competitors (jeśli są)
- Download PDF button
- Komponenty pomocnicze:
- ScoreDisplay (circular gauge)
- StatusBadge (color-coded)
- RecommendationCard (z code snippets)
- CodeBlock (syntax highlighting)

**5.5 Styling & Responsiveness** (2h)

- Mobile-responsive (Tailwind breakpoints)
- Dark mode support (opcjonalne)
- Loading states (spinners)
- Error boundaries

**Deliverables**:

- [ ] Frontend działa lokalnie (localhost:3000)
- [ ] Można się zarejestrować i zalogować
- [ ] Dashboard pokazuje listę audytów
- [ ] Można utworzyć nowy audit
- [ ] Audit details page wyświetla wyniki
- [ ] UI jest responsive (mobile + desktop)

**Czas**: 5 dni (tydzień 4)**Dokumentacja**: [docs/BACKLOG.md](docs/BACKLOG.md) Epic 5, [docs/FRONTEND_COMPONENTS.md](docs/FRONTEND_COMPONENTS.md)---

## 📄 ETAP 5: PDF Generation & Integration (Tydzień 5 - 3 dni)

### Cel

Wygenerować profesjonalne raporty PDF (35-45 stron).

### Epic 6: PDF Generation (4 zadania)

**6.1 Jinja2 Template** (4h)

- Stwórz `backend/templates/report.html`
- Struktura zgodna z [docs/REPORT_STRUCTURE.md](docs/REPORT_STRUCTURE.md):
- Cover page
- Executive Summary (2-3 strony)
- Table of Contents
- SEO Technical (5-8 stron)
- Performance (3-5 stron)
- Content Analysis (3-4 strony)
- Local SEO (conditional, 2 strony)
- Competitive Analysis (2-3 strony)
- Action Plan (2-3 strony)
- Appendix - gotowy kod (5-10 stron)
- Back Cover
- Styling CSS (WeasyPrint compatible):
- Typography (Inter font)
- Color coding (green/yellow/red scores)
- Code syntax highlighting
- Page breaks

**6.2 PDF Generator Service** (2h)

- Stwórz `backend/app/services/pdf_generator.py`
- Funkcja: `async def generate_pdf(audit_id: str) -> str`
- Flow:

1. Load audit data z DB
2. Render Jinja2 template
3. WeasyPrint: HTML → PDF
4. Save to `/tmp/audits/` or Railway volume
5. Return PDF URL

- Error handling (fallback na simple template jeśli fail)

**6.3 PDF Download Endpoint** (2h)

- Endpoint: `GET /api/audits/:id/pdf`
- Logic:
- Check if audit completed
- Check if PDF already exists (cache)
- Generate on-demand if missing
- Return FileResponse with proper headers
- Filename: `sitespector_audit_{domain}_{date}.pdf`

**6.4 Integration Testing** (2h)

- End-to-end test:

1. Create audit via API
2. Wait for completion (poll status)
3. Download PDF
4. Verify PDF opens (not corrupted)
5. Check file size (~2-5 MB)

**Deliverables**:

- [ ] PDF template renderuje poprawnie
- [ ] Można pobrać PDF z completed audit
- [ ] PDF zawiera wszystkie sekcje
- [ ] Code snippets są syntax-highlighted
- [ ] Testy end-to-end przechodzą

**Czas**: 3 dni (tydzień 5)**Dokumentacja**: [docs/BACKLOG.md](docs/BACKLOG.md) Epic 6, [docs/REPORT_STRUCTURE.md](docs/REPORT_STRUCTURE.md)---

## 🧪 ETAP 6: Testing & Deployment (Tydzień 6 - 5 dni)

### Cel

Testy, bug fixing, deployment na Railway production.

### Epic 7: Testing & Polish (6 zadań)

**7.1 Backend Unit Tests** (4h)

- Setup pytest + pytest-asyncio
- Testy w `backend/tests/`:
- `test_auth.py` - register, login, JWT
- `test_audits.py` - CRUD operations
- `test_screaming_frog.py` - service mocks
- `test_ai_analysis.py` - prompt validation
- Target: >80% coverage
- Run: `pytest --cov=app --cov-report=html`

**7.2 Frontend E2E Tests** (3h)

- Setup Playwright
- Testy w `frontend/e2e/`:
- `auth.spec.ts` - register → login → logout
- `dashboard.spec.ts` - list audits, filters
- `audit-creation.spec.ts` - create audit → wait → view results
- Run: `npx playwright test`

**7.3 Error Handling & Validation** (2h)

- Comprehensive error handling:
- Backend: custom exceptions + global handler
- Frontend: ErrorBoundary + toast notifications
- User-friendly error messages (no technical jargon)
- Logging setup (Railway logs)

**7.4 Performance Optimization** (3h)

- Backend:
- Database query optimization (select only needed columns)
- Connection pooling (SQLAlchemy)
- API response caching (opcjonalne)
- Frontend:
- Code splitting (dynamic imports)
- Image optimization (next/image)
- Lazy loading components
- Target: API <500ms, Frontend FCP <1.5s

**7.5 Documentation & README** (2h)

- Update README.md z:
- Quick start guide
- Link do docs/
- Demo screenshots
- User guide (opcjonalne)
- API documentation (Swagger already done)

**7.6 Production Deployment** (4h)

- Deploy do Railway:

1. Push code to GitHub main
2. Railway auto-deploy (webhook)
3. Configure services:

    - Backend (port 8000)
    - Worker (python worker.py)
    - Frontend (npm start)

1. Set environment variables (wszystkie services)
2. Run migrations: `railway run alembic upgrade head`
3. Configure custom domains:

    - sitespector.app → Frontend
    - api.sitespector.app → Backend

1. SSL certificates (auto by Railway)

- Smoke tests na production:
- Register user
- Create audit
- Download PDF
- Wszystkie endpointy działają

**Deliverables**:

- [ ] Testy backend >80% coverage
- [ ] E2E testy przechodzą
- [ ] Deploy na Railway sukces
- [ ] Custom domains działają (HTTPS)
- [ ] Smoke tests na production OK
- [ ] Dokumentacja zaktualizowana

**Czas**: 5 dni (tydzień 6)**Dokumentacja**: [docs/BACKLOG.md](docs/BACKLOG.md) Epic 7, [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md), [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)---

## 📊 Tracking & Metrics

### Success Criteria (MVP Launch)

- [ ] User może się zarejestrować
- [ ] User może utworzyć audit (URL + 3 competitors)
- [ ] Audit completes w <10 minut
- [ ] PDF report generuje się (35-45 stron)
- [ ] PDF zawiera AI recommendations z code snippets
- [ ] Dashboard pokazuje historię audytów
- [ ] Deployed na Railway z custom domain
- [ ] SSL active (HTTPS)
- [ ] 10 beta users przetestowało pomyślnie

### Post-Launch (Tydzień 7+)

- [ ] Product Hunt launch
- [ ] 100 signups w pierwszy miesiąc
- [ ] 20% conversion free → paid
- [ ] <10% monthly churn
- [ ] MRR: 5k PLN target

---

## 🔗 Kluczowe Dokumenty Reference

- **Codzienne**: [docs/BACKLOG.md](docs/BACKLOG.md) - szczegółowe zadania z Cursor prompts
- **Architektura**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - data flow, API structure
- **Database**: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - tabele, JSONB, queries
- **API Specs**: [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md) - wszystkie endpointy
- **AI Prompts**: [docs/AI_PROMPTS.md](docs/AI_PROMPTS.md) - Claude templates
- **Frontend**: [docs/FRONTEND_COMPONENTS.md](docs/FRONTEND_COMPONENTS.md) - komponenty UI
- **PDF Template**: [docs/REPORT_STRUCTURE.md](docs/REPORT_STRUCTURE.md) - struktura raportu
- **Setup**: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) - troubleshooting
- **Security**: [docs/SECURITY.md](docs/SECURITY.md) - best practices
- **FAQ**: [docs/FAQ.md](docs/FAQ.md) - 30+ pytań i odpowiedzi

---

## 💡 Wskazówki Implementacyjne

**Dla każdego zadania**:

1. Sprawdź BACKLOG.md → znajdź task
2. Skopiuj Cursor prompt z dokumentacji
3. Wklej do Cursor → wygeneruj kod
4. Review code → uruchom testy
5. Commit z dokładnym opisem zmian
6. **NIE PUSHUJ** bez wyboru opcji (czekaj na akceptację)

**Priorytety**:

- MVP = working code > perfect code
- Iteruj szybko, testuj często
- Użyj Cursor dla 90% generowania kodu
- Focus na deliverables każdego etapu

**Red Flags** (kiedy zatrzymać się i zapytać):

- Tests nie przechodzą >3 razy
- API response >2s (powinno być <500ms)
- PDF generation >2min (powinno być <30s)
- Docker image >2GB (za duży)
- Audyt trwa >15min (timeout po 10min)

---

## 🎯 Timeline Summary

| Etap | Czas | Deliverable ||------|------|-------------|| **0. Przygotowanie** | 1 dzień | Środowisko + dostępy || **1. Infrastructure** | 5 dni | Railway + Docker + DB || **2. Backend Core** | 5 dni | API + Auth + CRUD || **3. Crawlers & AI** | 4 dni | SF + Lighthouse + Claude || **4. Frontend** | 5 dni | Dashboard + UI || **5. PDF Generation** | 3 dni | Report template + export || **6. Testing & Deploy** | 5 dni | Tests + Production || **TOTAL** | **28 dni** | **MVP Live** |**Realistically**: 6 tygodni (30 dni roboczych) z buforem na bug fixing.---**Plan Status**: ✅ READY TO START**First Task**: Epic 1, Task 1.1 - Railway Project Setup**Documentation**: Wszystko w [docs/](docs/) folder