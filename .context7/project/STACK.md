# SiteSpector - Technology Stack

## Overview

SiteSpector is built with a modern, scalable stack optimized for SEO audit processing. All technologies chosen for reliability, async performance, and Docker compatibility.

---

## Backend Stack

### Core Framework: **FastAPI 0.104+**

**Why FastAPI?**
- Native async/await support (critical for I/O-heavy audits)
- Automatic OpenAPI docs (Swagger UI)
- Fast (comparable to Node.js, Go)
- Type hints + Pydantic validation
- Dependency injection system

**Alternatives considered**:
- Django: Too heavy, sync-first
- Flask: No native async
- Express.js: Chose Python for AI/data tooling

### Language: **Python 3.11**

**Why Python 3.11?**
- Latest stable version (as of project start)
- 10-60% faster than 3.10
- Improved async performance
- Better error messages
- Industry standard for AI/ML tooling

### Database: **PostgreSQL 15**

**Why PostgreSQL?**
- JSONB column type (perfect for `audit.results`)
- Full-text search (future feature)
- ACID compliance
- Excellent async support (asyncpg)
- Battle-tested scalability

**ORM**: SQLAlchemy 2.0 (async mode)

**Why not NoSQL?**
- Need relational integrity (users → audits → competitors)
- JSONB gives NoSQL flexibility where needed
- Transactions critical for audit status updates

### ORM: **SQLAlchemy 2.0 (Async)**

**Why SQLAlchemy 2.0?**
- Native async support (asyncio + asyncpg)
- Type-safe queries
- Automatic migrations (Alembic)
- Complex relationships (users → audits → competitors)

**Driver**: asyncpg (fastest PostgreSQL driver for Python)

### Migrations: **Alembic**

**Why Alembic?**
- Official SQLAlchemy migration tool
- Version control for database schema
- Auto-generate migrations from models
- Rollback support

**Current migration**: `20251205_0925_30ef0ad04684_initial_migration_users_audits_.py`

### API Validation: **Pydantic 2.x**

**Why Pydantic?**
- Automatic request/response validation
- Type coercion (strings → ints, etc.)
- Custom validators (e.g., URL format, password strength)
- JSON serialization

**Schemas**: `backend/app/schemas.py`

### Authentication: **JWT (python-jose)**

**Why JWT?**
- Stateless (no session storage)
- Scalable (no sticky sessions)
- Standard (RFC 7519)
- 7-day expiry (configurable)

**Algorithm**: HS256 (symmetric)  
**Library**: python-jose  
**Password hashing**: bcrypt (cost factor: 12)

### HTTP Client: **httpx**

**Why httpx?**
- Native async support
- Modern API (similar to requests)
- HTTP/2 support
- Used for Gemini API calls

### AI Provider: **Google Gemini API**

**Model**: gemini-1.5-flash

**Why Gemini?**
- Very cheap (10x cheaper than GPT-4)
- Fast responses (~1-3s per call)
- Good quality for structured analysis
- 1M tokens/minute rate limit (sufficient)

**Alternative**: Claude (Anthropic) - considered but more expensive

**Calls per audit**: 4
1. Content analysis
2. Local SEO detection
3. Performance recommendations
4. Competitive comparison

### SEO Crawler: **Screaming Frog SEO Spider**

**Why Screaming Frog?**
- Industry standard SEO tool
- Comprehensive crawl data (meta, H1, images, links)
- Headless mode (scriptable)
- Docker compatible

**License**: Commercial (required for CLI mode)

**Execution**: Docker exec via worker

**Output**: CSV → parsed to dict

### Performance Auditor: **Google Lighthouse**

**Why Lighthouse?**
- Official Google tool
- Core Web Vitals compliance
- Desktop + Mobile audits
- JSON output (easy parsing)
- Maintained by Chrome team

**Execution**: Docker exec via worker

**Strategies**: Desktop + Mobile (2 runs per audit)

### PDF Generator: **WeasyPrint**

**Why WeasyPrint?**
- HTML → PDF (uses existing HTML templates)
- CSS support (modern layout)
- Python native (no external binaries)
- Embedded fonts

**Alternative**: Puppeteer - requires Node.js in Python container

### Async Runtime: **asyncio + uvloop**

**Why asyncio?**
- Native Python async
- Non-blocking I/O
- Perfect for audit processing (many I/O operations)

**uvloop**: Optional faster event loop (used in production)

### Server: **Uvicorn**

**Why Uvicorn?**
- ASGI server (async)
- Fast (uvloop + httptools)
- Hot reload (development)
- Production-ready

**Workers**: 4 (configured in docker-compose.prod.yml)

---

## Frontend Stack

### Framework: **Next.js 14 (App Router)**

**Why Next.js 14?**
- Server-side rendering (SEO-friendly)
- App Router (React Server Components)
- File-based routing
- API routes (not used, backend separate)
- Optimized production builds
- Standalone mode (Docker-friendly)

**Alternatives considered**:
- Vite + React Router: No SSR out-of-box
- Remix: Less mature ecosystem
- SvelteKit: Team not familiar with Svelte

### Language: **TypeScript 5.x**

**Why TypeScript?**
- Type safety (catch errors at compile time)
- Better IDE autocomplete
- Self-documenting (types as docs)
- Standard for modern React

**Config**: Strict mode enabled

### UI Library: **React 18**

**Why React?**
- Industry standard
- Huge ecosystem
- Next.js built on React
- Concurrent rendering (React 18)

### Styling: **Tailwind CSS 3.x**

**Why Tailwind?**
- Utility-first (fast development)
- Purge unused CSS (small bundle)
- Responsive design (mobile-first)
- Dark mode support (built-in)

**Config**: `tailwind.config.ts`

### Component Library: **shadcn/ui**

**Why shadcn/ui?**
- Copy-paste components (no npm dependency)
- Built on Radix UI (accessible)
- Tailwind-based (consistent styling)
- Customizable (full control over code)

**Components used**:
- Button
- Card
- Badge
- Dialog
- Tabs
- Alert Dialog
- Input
- Label
- Scroll Area

**Location**: `frontend/components/ui/`

### State Management: **TanStack Query (React Query)**

**Why React Query?**
- Server state management (perfect for API data)
- Automatic caching
- Background refetching
- Polling (used for audit status)
- Optimistic updates

**Config**: `frontend/components/Providers.tsx`

### HTTP Client: **Fetch API (native)**

**Why not axios?**
- Native browser API (no dependency)
- Adequate for simple REST calls
- Wrapped in api.ts helper

**Location**: `frontend/lib/api.ts`

### Build Tool: **Next.js (Turbopack)**

**Why Turbopack?**
- Next.js default (Next.js 14)
- Faster than Webpack
- Rust-based

**Build mode**: Standalone (optimized for Docker)

```javascript
// next.config.js
output: 'standalone'
```

---

## Infrastructure Stack

### Containerization: **Docker + Docker Compose**

**Why Docker?**
- Consistent environments (dev = prod)
- Easy deployment (single command)
- Service isolation
- Portable

**Compose file**: `docker-compose.prod.yml`

**Containers**: 7 (nginx, frontend, backend, worker, postgres, screaming-frog, lighthouse)

### Reverse Proxy: **Nginx (Alpine)**

**Why Nginx?**
- Battle-tested
- SSL termination
- Static file serving
- Load balancing (future)
- Low memory footprint

**Config**: `docker/nginx/nginx.conf`

### Hosting: **Hetzner VPS**

**Why Hetzner?**
- Cheap (€10/month for 8GB RAM)
- EU data center (GDPR compliant)
- Reliable uptime
- Static IP included

**Specs**: 2 vCPU, 8GB RAM, 40GB SSD

**Alternative**: DigitalOcean - similar but slightly more expensive

### OS: **Ubuntu 22.04 LTS**

**Why Ubuntu?**
- LTS (long-term support)
- Wide community
- Docker official support
- Familiar to developers

### SSL: **Self-signed Certificate**

**Why self-signed?**
- MVP phase (no domain yet)
- Free
- Easy generation

**Future**: Let's Encrypt (when domain registered)

**Location**: `/opt/sitespector/ssl/`

### Version Control: **Git + GitHub**

**Branch strategy**:
- `release` - Production (most up-to-date)
- `main` - Outdated (needs sync or archival)

**Deployment**: Manual push → SSH → git pull → restart

---

## Development Tools

### Code Quality: **flake8** (Python), **ESLint + Prettier** (TypeScript)

**flake8**:
- PEP 8 compliance
- Max line length: 100
- Config: `backend/.flake8`

**ESLint**:
- TypeScript rules
- React hooks rules
- Config: `frontend/.eslintrc.json`

**Prettier**:
- Auto-formatting
- Config: `frontend/.prettierrc`

### Package Management

**Python**: pip + requirements.txt  
**Node.js**: npm (lockfile: package-lock.json)

### Environment Variables

**Management**: .env file (not committed)

**Backend vars**:
- DATABASE_URL
- JWT_SECRET
- GEMINI_API_KEY
- SCREAMING_FROG_USER, KEY, EMAIL

**Frontend vars**:
- NEXT_PUBLIC_API_URL

**Location**: `/opt/sitespector/.env` (VPS only)

---

## External Services

### Google Gemini API

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

**Rate limit**: 60 requests/minute (not hit with current usage)

**Cost**: ~$0.01 per 1000 requests (gemini-1.5-flash)

---

## Version Summary

```yaml
Backend:
  Python: 3.11
  FastAPI: 0.104+
  SQLAlchemy: 2.0
  PostgreSQL: 15
  Uvicorn: latest
  
Frontend:
  Node.js: 20 LTS
  Next.js: 14
  React: 18
  TypeScript: 5.x
  Tailwind: 3.x

Infrastructure:
  Docker: 24+
  Docker Compose: 2.x
  Nginx: 1.25 (Alpine)
  Ubuntu: 22.04 LTS

External:
  Screaming Frog: 19+ (licensed)
  Lighthouse: 11+
  Gemini: gemini-1.5-flash
```

---

## Dependency Files

**Backend**: `backend/requirements.txt`

Key dependencies:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
alembic==1.12.1
pydantic==2.5.0
python-jose[cryptography]==3.3.0
bcrypt==4.1.1
httpx==0.25.1
weasyprint==60.1
beautifulsoup4==4.12.2
google-generativeai==0.3.1
```

**Frontend**: `frontend/package.json`

Key dependencies:
```json
{
  "next": "14.0.4",
  "react": "18.2.0",
  "typescript": "5.3.3",
  "tailwindcss": "3.4.0",
  "@tanstack/react-query": "5.12.2",
  "lucide-react": "0.294.0"
}
```

---

## Architecture Decisions

### Why Microservices (Docker Compose)?

- **Separation of concerns**: Worker, API, Frontend, Crawlers isolated
- **Independent scaling**: Can scale worker separately in future
- **Technology flexibility**: Can swap Screaming Frog for another crawler
- **Development**: Easier to test individual services

### Why Async Python vs. Sync?

- **I/O-bound workload**: 90% of audit time is waiting (HTTP, database)
- **Concurrency**: Process 3 audits simultaneously
- **Resource efficiency**: Non-blocking = less memory

### Why PostgreSQL JSONB vs. Separate Tables?

- **Schema flexibility**: Audit results vary by URL (some have local SEO, some don't)
- **Performance**: Single query to get all audit data
- **Simplicity**: No 20+ joins to reconstruct full audit
- **Future**: Can index JSONB fields if needed

### Why Next.js vs. SPA?

- **SEO**: Server-side rendering (though app is behind auth)
- **Performance**: Faster initial load
- **Developer experience**: File-based routing, built-in optimizations

---

**Last Updated**: 2025-02-03  
**Status**: Stable, production-ready  
**Future upgrades**: Consider Gemini 2.0 when available
