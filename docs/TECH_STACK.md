# Technology Stack & Justification
## SiteSpector.app

**Last Updated:** 2025-12-04  
**Status:** Finalized for MVP

---

## 🎯 Technology Selection Philosophy

**Guiding Principles:**
1. **Pragmatism over Hype** - proven technologies, not bleeding edge
2. **Developer Velocity** - fast iteration, good DX (Developer Experience)
3. **Railway-First** - optimized for Railway deployment
4. **AI-Native** - easy integration with Claude API
5. **Cost-Effective** - minimize infrastructure costs in MVP phase

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│    Next.js 14 + TypeScript + Tailwind + shadcn/ui       │
└────────────────┬────────────────────────────────────────┘
                 │ HTTPS/REST API
┌────────────────▼────────────────────────────────────────┐
│                      BACKEND                             │
│              FastAPI + Python 3.11                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Auth Service │  │ Audit Service│  │  AI Service  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────┬───────────────┬────────────────┬──────────┘
             │               │                │
       ┌─────▼─────┐   ┌────▼─────┐    ┌────▼──────┐
       │PostgreSQL │   │  Docker  │    │Claude API │
       │ (Railway) │   │Containers│    │ Sonnet 4  │
       └───────────┘   └──────────┘    └───────────┘
                            │
                   ┌────────▼────────┐
                   │ Screaming Frog  │
                   │   + Lighthouse  │
                   └─────────────────┘
```

---

## 🖥️ Frontend Stack

### Next.js 14 (App Router)
**Why Next.js over alternatives?**

| Feature | Next.js | Create React App | Remix | Astro |
|---------|---------|------------------|-------|-------|
| SSR/SSG | ✅ Built-in | ❌ Client-only | ✅ Yes | ✅ Yes |
| API Routes | ✅ Yes | ❌ No | ✅ Yes | ⚠️ Limited |
| Railway Deploy | ✅ Zero-config | ⚠️ Static only | ✅ Good | ✅ Good |
| DX (Dev Experience) | ✅ Excellent | ⚠️ OK | ✅ Good | ✅ Good |
| Ecosystem | ✅ Huge | ⚠️ Declining | ⚠️ Growing | ⚠️ Growing |

**Decision:** ✅ Next.js 14
- Best Railway integration (automatic builds)
- App Router = modern, performant
- Huge ecosystem (solutions for every problem)
- Team likely familiar with React

**Version:** 14.2+ (App Router stable)

---

### TypeScript 5.x
**Why TypeScript over JavaScript?**

**Benefits:**
- ✅ Type safety (catch bugs at compile time)
- ✅ Better IDE autocomplete (faster development)
- ✅ Self-documenting code (types = inline docs)
- ✅ Easier refactoring (safe renames, find usages)

**Trade-offs:**
- ⚠️ Slight learning curve (but team should know TS)
- ⚠️ Build step required (but Next.js handles this)

**Decision:** ✅ TypeScript
- Mandatory for professional projects
- Prevents entire classes of bugs

**Config highlights:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

### Tailwind CSS 3.x
**Why Tailwind over alternatives?**

| Approach | Tailwind | CSS Modules | Styled Components | Material-UI |
|----------|----------|-------------|-------------------|-------------|
| Learning Curve | ⚠️ Medium | ✅ Easy | ⚠️ Medium | ⚠️ Medium |
| Bundle Size | ✅ Small (purge) | ✅ Small | ❌ Large | ❌ Large |
| Customization | ✅ Full control | ✅ Full | ✅ Full | ⚠️ Limited |
| Design System | ✅ Tailwind Pro | ❌ DIY | ❌ DIY | ✅ Built-in |

**Decision:** ✅ Tailwind CSS
- Fast prototyping (utility-first)
- **You own Tailwind UI Pro** (massive time saver!)
- Small bundle (unused classes purged)
- Consistent design tokens

**Add-ons:**
- `@tailwindcss/forms` (form styling)
- `@tailwindcss/typography` (prose content)

---

### shadcn/ui
**Why shadcn/ui over component libraries?**

**Comparison:**
- **Ant Design / Material-UI:** ❌ Opinionated, heavy bundle
- **Chakra UI:** ⚠️ Good but more React-specific
- **Headless UI:** ✅ Great, but requires manual styling
- **shadcn/ui:** ✅ Headless + Tailwind + Copy-paste (you own the code!)

**Decision:** ✅ shadcn/ui
- Components you can customize (source code in your repo)
- Built on Radix UI (accessible, tested)
- Integrates perfectly with Tailwind

**Key components for SiteSpector:**
- `Button`, `Card`, `Badge` (dashboard)
- `Table`, `DataTable` (audit list)
- `Dialog`, `Sheet` (modals)
- `Form`, `Input`, `Select` (audit creation)
- `Tabs`, `Accordion` (report sections)

---

## ⚙️ Backend Stack

### FastAPI (Python 3.11)
**Why FastAPI over alternatives?**

| Framework | FastAPI | Django | Flask | Express (Node) |
|-----------|---------|--------|-------|----------------|
| Performance | ✅ Fast (async) | ⚠️ Slower | ⚠️ Slower | ✅ Fast |
| API-first | ✅ Yes | ⚠️ No (DRF addon) | ⚠️ Manual | ✅ Yes |
| Type Hints | ✅ Native | ⚠️ Limited | ❌ No | ⚠️ TS only |
| Auto Docs | ✅ Swagger/ReDoc | ❌ No | ❌ No | ⚠️ Manual |
| AI Integration | ✅ Excellent | ✅ Good | ✅ Good | ⚠️ OK |

**Decision:** ✅ FastAPI
- **Python = best ecosystem for AI** (Claude SDK, langchain, textstat)
- Async/await = handle many audits concurrently
- Auto-generated API docs (Swagger UI)
- Modern, type-safe (Pydantic models)

**Why Python specifically?**
```python
# Example: AI integration is trivial in Python
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4000,
    messages=[{"role": "user", "content": prompt}]
)
```

**Version:** Python 3.11+ (performance improvements over 3.10)

---

### PostgreSQL 16
**Why PostgreSQL over alternatives?**

| Database | PostgreSQL | MySQL | MongoDB | SQLite |
|----------|-----------|-------|---------|--------|
| Relations | ✅ Strong | ✅ Good | ❌ No | ✅ Basic |
| JSON Support | ✅ Excellent | ⚠️ Limited | ✅ Native | ⚠️ Basic |
| Full-Text | ✅ Built-in | ⚠️ Basic | ✅ Good | ❌ No |
| Railway Support | ✅ Managed | ✅ Managed | ⚠️ Self-host | ❌ Local only |

**Decision:** ✅ PostgreSQL
- Best all-around relational database
- JSON columns (perfect for storing audit results)
- pgvector extension (future: semantic search on reports)
- Railway provides managed PostgreSQL (zero ops)

**Schema highlights:**
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audits table
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    overall_score INT,
    results JSONB, -- Full audit data
    pdf_url VARCHAR(2048),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Competitors table (many-to-one with audits)
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    results JSONB
);
```

---

### ORM: SQLAlchemy 2.0
**Why SQLAlchemy over alternatives?**

**Options:**
- **Raw SQL:** ❌ Verbose, no type safety
- **Django ORM:** ⚠️ Tied to Django
- **SQLAlchemy:** ✅ Industry standard
- **Tortoise ORM:** ⚠️ Newer, less mature

**Decision:** ✅ SQLAlchemy 2.0
- New async support (perfect for FastAPI)
- Type-safe queries (with mypy plugin)
- Mature, battle-tested

**Example:**
```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_user_audits(session: AsyncSession, user_id: str):
    result = await session.execute(
        select(Audit).where(Audit.user_id == user_id)
    )
    return result.scalars().all()
```

---

## 🤖 AI & Analysis Tools

### Claude API (Sonnet 4)
**Model:** `claude-sonnet-4-20250514`

**Why Claude over alternatives?**

| Model | Claude Sonnet 4 | GPT-4 Turbo | Gemini 1.5 Pro | Llama 3 (OSS) |
|-------|----------------|-------------|----------------|---------------|
| Context Window | 200k tokens | 128k | 1M | 8k |
| Cost (per 1M input) | $3 | $10 | $1.25 | Free (self-host) |
| Code Understanding | ✅ Excellent | ✅ Excellent | ✅ Good | ⚠️ OK |
| Structured Output | ✅ Great | ✅ Great | ⚠️ OK | ⚠️ Unreliable |
| Speed | ✅ Fast | ⚠️ Slower | ✅ Fast | ✅ Fast |

**Decision:** ✅ Claude Sonnet 4
- **Best balance: intelligence × cost × speed**
- Excellent at understanding code (Schema.org, meta tags)
- Reliable structured outputs (JSON mode)
- 200k context = can fit entire scraped HTML

**Cost estimate per audit:**
```
Input: ~15k tokens (HTML + metrics)
Output: ~5k tokens (recommendations)
Total: 20k tokens

Cost: (15k × $3/1M) + (5k × $15/1M) = $0.045 + $0.075 = $0.12 per audit

With 1000 audits/month: $120/month
Revenue at 29 PLN/audit: 29k PLN = ~$7k USD → margin: 98%
```

---

### Screaming Frog SEO Spider CLI
**Version:** 20.x (latest stable)

**Why Screaming Frog over custom crawler?**

**Alternatives:**
- **Scrapy (Python):** ⚠️ Requires custom logic for SEO data
- **Playwright:** ⚠️ Slow for large sites
- **Puppeteer:** ⚠️ Node.js (different stack)
- **Screaming Frog CLI:** ✅ Purpose-built for SEO

**Decision:** ✅ Screaming Frog CLI
- Industry-standard tool (trusted by SEO professionals)
- Handles complex sites (JS rendering, redirects)
- Exports structured data (CSV, JSON)
- CLI mode = scriptable

**Licensing Check:**
- ⚠️ **Need to verify commercial licensing**
- Fallback: Build custom crawler with Playwright

**Docker image:**
```dockerfile
FROM python:3.11-slim

# Install Screaming Frog CLI
RUN apt-get update && apt-get install -y \
    wget \
    default-jre \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://download.screamingfrog.co.uk/products/seo-spider/ScreamingFrogSEOSpider-20.0.deb \
    && dpkg -i ScreamingFrogSEOSpider-20.0.deb

CMD ["screamingfrog", "--help"]
```

**Usage:**
```bash
screamingfrog --crawl https://example.com \
  --output-folder /tmp/audit \
  --export-format json \
  --max-crawl-depth 1 # Single URL only in MVP
```

---

### Google Lighthouse CLI
**Version:** 12.x

**Why Lighthouse over alternatives?**

**Alternatives:**
- **PageSpeed Insights API:** ⚠️ Rate limited (free tier: 25k/day)
- **WebPageTest API:** ⚠️ Paid, complex
- **Lighthouse CLI:** ✅ Free, unlimited, local

**Decision:** ✅ Lighthouse CLI
- Official Google tool (most accurate Core Web Vitals)
- Runs locally (no API rate limits)
- JSON output (easy to parse)

**Docker image:**
```dockerfile
FROM node:20-slim

# Install Chromium for Lighthouse
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g lighthouse

CMD ["lighthouse", "--help"]
```

**Usage:**
```bash
lighthouse https://example.com \
  --output json \
  --output-path /tmp/report.json \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo
```

**Note:** Run Lighthouse 2x (desktop + mobile)

---

### Readability Analysis: textstat
**Library:** `textstat` (Python)

**What it does:**
- Flesch Reading Ease
- Flesch-Kincaid Grade
- Fog Index
- SMOG Index
- Coleman-Liau Index

**Example:**
```python
import textstat

text = "Your website content here..."
flesch_score = textstat.flesch_reading_ease(text)  # 0-100
fog_index = textstat.gunning_fog(text)  # years of education

# Interpretation
if flesch_score >= 60:
    readability = "Good (Standard)"
elif flesch_score >= 50:
    readability = "Fair (Fairly difficult)"
else:
    readability = "Poor (Difficult)"
```

**Why not alternatives?**
- **language-tool-python:** ⚠️ Grammar checking (overkill for MVP)
- **textstat:** ✅ Simple, fast, exactly what we need

---

## 📦 Infrastructure & DevOps

### Railway.app
**Why Railway over alternatives?**

| Platform | Railway | Vercel | Heroku | AWS | DigitalOcean |
|----------|---------|--------|--------|-----|--------------|
| Ease of Setup | ✅ Simple | ✅ Simple | ⚠️ OK | ❌ Complex | ⚠️ Manual |
| Docker Support | ✅ Native | ❌ Limited | ✅ Yes | ✅ Yes | ⚠️ Manual |
| Database | ✅ Managed | ❌ No | ✅ Yes | ⚠️ DIY | ⚠️ DIY |
| Cost (MVP) | ✅ $20-50/mo | ✅ $20/mo | ⚠️ $50/mo | ⚠️ $100+/mo | ⚠️ $50/mo |
| Auto-scaling | ✅ Yes | ✅ Yes | ⚠️ Limited | ✅ Yes | ❌ No |

**Decision:** ✅ Railway
- **Best balance: simplicity × features × cost**
- Git push to deploy (like Heroku, but better)
- Managed PostgreSQL (no ops)
- Generous free tier for testing
- Automatic HTTPS (SSL certs)

**Services we'll deploy:**
1. **Backend (FastAPI)** - Python container
2. **PostgreSQL** - Managed database
3. **Worker (Audit Runner)** - Separate container for long-running audits

**Why not Vercel?**
- Vercel is optimized for Next.js frontends
- Backend (FastAPI) would require Vercel Functions → not ideal for long-running audits
- Railway better for full-stack Python apps

---

### Docker & Docker Compose
**Why Docker?**

**Benefits:**
- ✅ Consistent environments (dev = staging = prod)
- ✅ Easy to run Screaming Frog + Lighthouse in containers
- ✅ Railway native support

**Structure:**
```
docker-compose.yml
├── web (FastAPI backend)
├── worker (Audit runner)
├── db (PostgreSQL - local dev only)
└── redis (Job queue - Etap 2)
```

**Example docker-compose.yml:**
```yaml
version: '3.8'

services:
  web:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://...
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    depends_on:
      - db

  worker:
    build: ./backend
    command: python worker.py
    environment:
      - DATABASE_URL=postgresql://...
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: sitespector
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

### Frontend Hosting: Railway (Next.js)
**Why host Next.js on Railway vs Vercel?**

**Option A: Vercel (separate from backend)**
- ✅ Optimized for Next.js
- ✅ Edge functions
- ❌ Separate domain/deploy (more complexity)
- ❌ Need to configure CORS between Vercel ↔ Railway

**Option B: Railway (same as backend)**
- ✅ Single domain (sitespector.app)
- ✅ No CORS issues (same origin)
- ✅ Simpler deployment (one platform)
- ⚠️ Slightly more expensive (~$10/mo extra)

**Decision:** ✅ Railway for everything
- Simplicity > slight cost difference
- One platform to manage

---

## 🔐 Authentication & Security

### JWT (JSON Web Tokens)
**Why JWT over sessions?**

| Approach | JWT | Session Cookies | OAuth2 |
|----------|-----|-----------------|--------|
| Stateless | ✅ Yes | ❌ No (needs Redis) | ⚠️ Depends |
| Mobile-friendly | ✅ Yes | ⚠️ Limited | ✅ Yes |
| Scalability | ✅ Easy | ⚠️ Needs shared state | ✅ Easy |

**Decision:** ✅ JWT
- Stateless (no Redis needed in MVP)
- Standard for API auth
- Easy to implement with FastAPI

**Implementation:**
```python
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key-here"  # From env var
ALGORITHM = "HS256"

def create_access_token(user_id: str):
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
```

**Security measures:**
- ✅ HTTPS only (no token leakage)
- ✅ 7-day expiration (balance: UX vs security)
- ✅ Refresh tokens (Etap 2)
- ✅ Rate limiting (5 audits/hour per user)

---

### Password Hashing: bcrypt
**Why bcrypt?**

**Alternatives:**
- **MD5/SHA256:** ❌ Too fast (vulnerable to brute-force)
- **Argon2:** ✅ Modern, best security (but overkill for MVP)
- **bcrypt:** ✅ Industry standard, proven

**Decision:** ✅ bcrypt
- Cost factor: 12 (good balance)
- Library: `passlib` (Python)

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash password
hashed = pwd_context.hash("user_password")

# Verify
is_valid = pwd_context.verify("user_password", hashed)
```

---

## 📊 PDF Generation

### WeasyPrint (HTML to PDF)
**Why WeasyPrint over alternatives?**

| Library | WeasyPrint | ReportLab | pdfkit | Playwright |
|---------|-----------|-----------|--------|-----------|
| Input | HTML/CSS | Python code | HTML | HTML |
| Styling | ✅ Full CSS | ⚠️ Manual | ✅ CSS | ✅ CSS |
| Charts | ✅ SVG support | ⚠️ Manual | ✅ Yes | ✅ Yes |
| Speed | ⚠️ Slower | ✅ Fast | ⚠️ Slower | ❌ Slow |

**Decision:** ✅ WeasyPrint
- Write HTML/CSS → get PDF (no manual positioning)
- Supports modern CSS (flexbox, grid)
- SVG charts render perfectly
- Jinja2 templates (reusable)

**Alternative if WeasyPrint fails:** Playwright PDF export (slower but reliable)

**Example:**
```python
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader

# Load template
env = Environment(loader=FileSystemLoader('templates'))
template = env.get_template('report.html')

# Render with data
html_content = template.render(audit_data=data)

# Generate PDF
HTML(string=html_content).write_pdf('/tmp/report.pdf')
```

---

## 📈 Monitoring & Logging (Post-MVP)

**MVP:** Basic Railway logs  
**Etap 2:** Sentry + Datadog

**Why not in MVP?**
- Railway provides basic logs (stdout/stderr)
- Can debug manually during beta
- Add proper monitoring when we have paying users

---

## 🔧 Development Tools

### Code Quality
- **Linter (Python):** Black (auto-formatter)
- **Linter (TS):** ESLint + Prettier
- **Type Checker:** mypy (Python), tsc (TypeScript)

### Testing
- **Backend:** pytest + pytest-asyncio
- **Frontend:** Vitest (faster than Jest)
- **E2E:** Playwright

### Version Control
- **Git:** GitHub (private repo)
- **Branching:** main (prod), dev (staging), feature branches

---

## 💰 Cost Estimate (MVP - 1000 audits/month)

| Service | Cost/Month |
|---------|-----------|
| Railway (Backend + DB) | $30 |
| Railway (Frontend) | $10 |
| Claude API (1000 audits × $0.12) | $120 |
| Domain (sitespector.app) | $10/year |
| **TOTAL** | **~$160/month** |

**Revenue at 1000 audits:**
- Pay-per-report: 1000 × 29 PLN = 29k PLN = ~$7k USD
- **Profit margin:** 97%

---

## ✅ Final Stack Summary

**Frontend:**
- Next.js 14 + TypeScript + Tailwind + shadcn/ui

**Backend:**
- FastAPI + Python 3.11 + SQLAlchemy 2.0

**Database:**
- PostgreSQL 16 (Railway managed)

**AI & Tools:**
- Claude Sonnet 4 API
- Screaming Frog CLI (Docker)
- Lighthouse CLI (Docker)
- textstat (readability)

**Infrastructure:**
- Railway (all services)
- Docker + Docker Compose

**Auth:**
- JWT tokens + bcrypt

**PDF:**
- WeasyPrint (HTML → PDF)

---

## 🚀 Next Steps
1. Setup Railway project
2. Create Docker containers (Screaming Frog, Lighthouse)
3. Bootstrap FastAPI app
4. Bootstrap Next.js app
5. Begin development (see BACKLOG.md)

---

**Document Status:** ✅ APPROVED  
**Dependencies:** PRD.md (completed)  
**Next:** ARCHITECTURE.md (system design)
