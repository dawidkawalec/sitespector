# System Architecture
## SiteSpector.app

**Last Updated:** 2025-12-04  
**Version:** 1.0 (MVP)

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RAILWAY PLATFORM                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              NEXT.JS FRONTEND (SSR)                        │ │
│  │  • Dashboard • Auth Pages • Results View                  │ │
│  └───────────────────────┬────────────────────────────────────┘ │
│                          │ REST API                              │
│  ┌───────────────────────▼────────────────────────────────────┐ │
│  │              FASTAPI BACKEND                               │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │ Auth Service │  │ Audit Service│  │   AI Service    │ │ │
│  │  │  (JWT)       │  │ (Orchestrator)│  │ (Claude API)   │ │ │
│  │  └──────────────┘  └───────┬──────┘  └─────────────────┘ │ │
│  │                             │                              │ │
│  │                    ┌────────▼─────────┐                    │ │
│  │                    │  Audit Worker    │                    │ │
│  │                    │  (Background)    │                    │ │
│  │                    └────────┬─────────┘                    │ │
│  └─────────────────────────────┼──────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────▼──────────────────────────────┐ │
│  │              POSTGRESQL DATABASE                           │ │
│  │  • users • audits • competitors • results                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  DOCKER CONTAINERS  │
                    │                     │
                    │  • Screaming Frog  │
                    │  • Lighthouse      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  EXTERNAL APIs      │
                    │                     │
                    │  • Claude Sonnet 4 │
                    │  • (future: Ahrefs)│
                    └─────────────────────┘
```

---

## 🔄 Data Flow: User Creates Audit

### Step-by-Step Flow

```
1. USER submits URL
   ↓
2. FRONTEND validates & sends POST /api/audits/create
   ↓
3. BACKEND creates audit record (status: pending)
   ↓
4. BACKEND returns audit_id → FRONTEND polls status
   ↓
5. WORKER picks up audit job
   ↓
6. WORKER runs Screaming Frog CLI
   │   ├─ Crawls URL
   │   ├─ Extracts meta tags, headers, images
   │   └─ Exports JSON
   ↓
7. WORKER runs Lighthouse (2x: desktop + mobile)
   │   ├─ Measures Core Web Vitals
   │   └─ Exports JSON
   ↓
8. WORKER sends data to Claude API
   │   ├─ Prompt: Analyze this website...
   │   ├─ Claude returns recommendations
   │   └─ Stores AI insights
   ↓
9. WORKER generates PDF report
   │   ├─ Jinja2 template + data
   │   ├─ WeasyPrint → PDF
   │   └─ Uploads to storage
   ↓
10. WORKER updates audit (status: completed)
    ↓
11. FRONTEND receives status update → shows results
    ↓
12. USER downloads PDF
```

**Total time:** 5-10 minutes per audit

---

## 🗄️ Database Schema

### ERD (Entity Relationship Diagram)

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)            │ UUID
│ email              │ VARCHAR(255) UNIQUE
│ password_hash      │ VARCHAR(255)
│ subscription_tier  │ VARCHAR(50)
│ stripe_customer_id │ VARCHAR(255)
│ created_at         │ TIMESTAMP
│ updated_at         │ TIMESTAMP
└──────────┬──────────┘
           │ 1
           │
           │ N
┌──────────▼──────────┐
│      audits         │
├─────────────────────┤
│ id (PK)            │ UUID
│ user_id (FK)       │ UUID → users.id
│ url                │ VARCHAR(2048)
│ status             │ VARCHAR(50) [pending, processing, completed, failed]
│ overall_score      │ INT (0-100)
│ seo_score          │ INT (0-100)
│ performance_score  │ INT (0-100)
│ content_score      │ INT (0-100)
│ is_local_business  │ BOOLEAN
│ results            │ JSONB (full audit data)
│ pdf_url            │ VARCHAR(2048)
│ error_message      │ TEXT
│ created_at         │ TIMESTAMP
│ started_at         │ TIMESTAMP
│ completed_at       │ TIMESTAMP
└──────────┬──────────┘
           │ 1
           │
           │ N
┌──────────▼──────────┐
│    competitors      │
├─────────────────────┤
│ id (PK)            │ UUID
│ audit_id (FK)      │ UUID → audits.id
│ url                │ VARCHAR(2048)
│ status             │ VARCHAR(50)
│ results            │ JSONB
│ created_at         │ TIMESTAMP
└─────────────────────┘
```

### SQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Audits table
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', 
    overall_score INT,
    seo_score INT,
    performance_score INT,
    content_score INT,
    is_local_business BOOLEAN DEFAULT FALSE,
    results JSONB,
    pdf_url VARCHAR(2048),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);

-- Competitors table
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_competitors_audit_id ON competitors(audit_id);
```

### Sample JSONB Structure (audits.results)

```json
{
  "screaming_frog": {
    "meta_tags": {
      "title": "Example Site - Home",
      "description": "Welcome to our site...",
      "robots": "index, follow",
      "canonical": "https://example.com/"
    },
    "headers": {
      "h1": ["Main Heading"],
      "h2": ["Subheading 1", "Subheading 2"],
      "h3": ["Detail 1", "Detail 2"]
    },
    "images": [
      {
        "src": "/images/hero.jpg",
        "alt": "Hero image",
        "size_kb": 450
      }
    ],
    "internal_links": 12,
    "orphan_pages": ["/privacy-policy"],
    "duplicates": {
      "meta_description": ["url1.com", "url2.com"]
    },
    "schema_org": {
      "detected": false,
      "types": []
    }
  },
  "lighthouse": {
    "desktop": {
      "performance_score": 85,
      "lcp": 1.2,
      "inp": 45,
      "cls": 0.25,
      "ttfb": 0.3,
      "speed_index": 2.1
    },
    "mobile": {
      "performance_score": 72,
      "lcp": 2.1,
      "inp": 120,
      "cls": 0.15,
      "ttfb": 0.5,
      "speed_index": 3.4
    }
  },
  "ai_analysis": {
    "content_quality": {
      "score": 68,
      "readability": {
        "flesch_score": 42,
        "fog_index": 12,
        "interpretation": "Difficult (academic level)"
      },
      "tone": "Professional but uses jargon",
      "word_count": 850,
      "keyword_density": {
        "primary": 1.2,
        "secondary": 0.8
      }
    },
    "recommendations": [
      {
        "category": "SEO",
        "priority": "HIGH",
        "issue": "Missing meta description",
        "impact": "Lost ~20% potential CTR",
        "fix": "Add meta description...",
        "code": "<meta name=\"description\" content=\"...\">"
      }
    ],
    "local_seo": {
      "detected": true,
      "address": "ul. Mokotowska 12, Warszawa",
      "phone": "+48 123 456 789",
      "schema_present": false
    }
  }
}
```

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Audits

```
POST   /api/audits/create
GET    /api/audits
GET    /api/audits/:id
GET    /api/audits/:id/status
GET    /api/audits/:id/pdf
DELETE /api/audits/:id
```

### Detailed Endpoint Specs

#### POST /api/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "subscription_tier": "free"
  },
  "access_token": "jwt-token-here"
}
```

**Errors:**
- 400: Email already exists
- 422: Invalid email format / weak password

---

#### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "access_token": "jwt-token-here",
  "token_type": "bearer"
}
```

**Errors:**
- 401: Invalid credentials

---

#### POST /api/audits/create

**Request:**
```json
{
  "url": "https://example.com",
  "competitors": [
    "https://competitor1.com",
    "https://competitor2.com"
  ]
}
```

**Response (201):**
```json
{
  "audit_id": "uuid-here",
  "status": "pending",
  "created_at": "2025-12-04T10:00:00Z"
}
```

**Errors:**
- 400: Invalid URL
- 429: Rate limit exceeded (5/hour)

---

#### GET /api/audits/:id/status

**Response (200):**
```json
{
  "audit_id": "uuid-here",
  "status": "processing", // pending | processing | completed | failed
  "progress": {
    "current_step": "Running Lighthouse",
    "steps_completed": 2,
    "total_steps": 4
  },
  "estimated_time_remaining": 300 // seconds
}
```

---

#### GET /api/audits/:id

**Response (200):**
```json
{
  "id": "uuid-here",
  "url": "https://example.com",
  "status": "completed",
  "overall_score": 72,
  "seo_score": 65,
  "performance_score": 80,
  "content_score": 70,
  "is_local_business": true,
  "results": {...}, // Full JSONB data
  "pdf_url": "https://storage.railway.app/audits/xyz.pdf",
  "created_at": "2025-12-04T10:00:00Z",
  "completed_at": "2025-12-04T10:08:00Z"
}
```

---

## ⚙️ Background Worker Architecture

### Worker Process Flow

```python
# worker.py
import asyncio
from sqlalchemy import select
from database import AsyncSession, Audit

async def process_audits():
    """Main worker loop"""
    while True:
        async with AsyncSession() as session:
            # Get pending audits
            result = await session.execute(
                select(Audit)
                .where(Audit.status == "pending")
                .order_by(Audit.created_at)
                .limit(1)
            )
            audit = result.scalar_one_or_none()
            
            if audit:
                await run_audit(audit)
            else:
                await asyncio.sleep(10)  # Wait 10s before next check

async def run_audit(audit: Audit):
    """Run complete audit pipeline"""
    try:
        # Update status
        audit.status = "processing"
        await session.commit()
        
        # Step 1: Screaming Frog
        sf_data = await run_screaming_frog(audit.url)
        
        # Step 2: Lighthouse
        lh_data = await run_lighthouse(audit.url)
        
        # Step 3: Competitors (parallel)
        comp_data = await asyncio.gather(*[
            run_competitor_audit(url) 
            for url in audit.competitor_urls
        ])
        
        # Step 4: AI Analysis
        ai_insights = await analyze_with_claude({
            "screaming_frog": sf_data,
            "lighthouse": lh_data,
            "competitors": comp_data
        })
        
        # Step 5: Generate PDF
        pdf_url = await generate_pdf_report(audit.id, {
            "sf": sf_data,
            "lh": lh_data,
            "ai": ai_insights
        })
        
        # Update audit
        audit.status = "completed"
        audit.results = {...}
        audit.pdf_url = pdf_url
        audit.completed_at = datetime.now()
        await session.commit()
        
    except Exception as e:
        audit.status = "failed"
        audit.error_message = str(e)
        await session.commit()
```

### Concurrency Strategy (MVP)

**MVP:** Sequential processing (1 audit at a time)
- Simple, no race conditions
- Acceptable for < 100 audits/day

**Etap 2:** Redis queue + multiple workers
- Celery or RQ (Python job queues)
- Horizontal scaling (5+ workers)

---

## 🐳 Docker Architecture

### Container Breakdown

```yaml
# docker-compose.yml
version: '3.8'

services:
  # FastAPI Backend
  web:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    depends_on:
      - db
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Background Worker
  worker:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    depends_on:
      - db
      - screaming_frog
      - lighthouse
    command: python worker.py

  # Screaming Frog CLI
  screaming_frog:
    build: ./docker/screaming-frog
    volumes:
      - /tmp/audits:/output

  # Lighthouse CLI
  lighthouse:
    build: ./docker/lighthouse
    volumes:
      - /tmp/audits:/output

  # PostgreSQL (local dev only)
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

## 🚀 Deployment Architecture (Railway)

### Railway Services

```
railway.app
├── backend (FastAPI)
│   ├── Dockerfile: ./backend/Dockerfile
│   ├── Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
│   └── Environment Variables:
│       - DATABASE_URL (auto-injected by Railway)
│       - CLAUDE_API_KEY
│       - JWT_SECRET_KEY
│
├── worker (Background Jobs)
│   ├── Dockerfile: ./backend/Dockerfile
│   ├── Start Command: python worker.py
│   └── Environment Variables:
│       - DATABASE_URL
│       - CLAUDE_API_KEY
│
├── frontend (Next.js)
│   ├── Build: npm run build
│   ├── Start: npm start
│   └── Environment Variables:
│       - NEXT_PUBLIC_API_URL=https://api.sitespector.app
│
└── postgres (Managed Database)
    ├── Version: 16
    ├── Storage: 10 GB (start)
    └── Backups: Daily automatic
```

### Domain Setup

```
sitespector.app (frontend)
  └─> Railway Next.js service

api.sitespector.app (backend)
  └─> Railway FastAPI service
```

---

## 🔐 Security Architecture

### Authentication Flow

```
1. User submits email + password
   ↓
2. Backend hashes password (bcrypt)
   ↓
3. If valid → generate JWT token
   ↓
4. Frontend stores token (localStorage)
   ↓
5. Frontend sends token in Authorization header:
   "Authorization: Bearer {token}"
   ↓
6. Backend validates token on each request
   ↓
7. If valid → allow request
   If expired/invalid → 401 Unauthorized
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/audits/create")
@limiter.limit("5/hour")  # Max 5 audits per hour per IP
async def create_audit(request: Request, ...):
    ...
```

### Environment Variables (Secrets)

**Never commit to Git:**
- `CLAUDE_API_KEY`
- `JWT_SECRET_KEY`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`

**Store in Railway:**
- Railway dashboard → Service → Variables → Add

---

## 📊 Monitoring & Logging (Post-MVP)

### Log Levels

```python
import logging

logger = logging.getLogger(__name__)

# INFO: Normal operations
logger.info(f"Audit {audit_id} started")

# WARNING: Potential issues
logger.warning(f"Audit {audit_id} taking longer than expected")

# ERROR: Failures
logger.error(f"Audit {audit_id} failed: {error}")
```

### Metrics to Track (Etap 2)

- Audit success rate (%)
- Average audit duration (seconds)
- API response times (p50, p95, p99)
- Database query times
- Claude API latency
- Error rates by type

**Tools:**
- Sentry (error tracking)
- Datadog (metrics + APM)
- Railway built-in logs (MVP sufficient)

---

## 🔄 Scalability Considerations

### Current Bottlenecks

1. **Sequential audit processing** → Add Redis queue (Etap 2)
2. **Single worker** → Deploy multiple workers (Etap 2)
3. **PDF generation slowness** → Pre-render templates, cache

### Scaling Path

**0-100 audits/day (MVP):**
- Single worker: OK
- Railway Starter plan: $20/mo

**100-1000 audits/day (Etap 2):**
- 3-5 workers
- Redis job queue
- Railway Pro plan: $50/mo

**1000+ audits/day (Etap 3):**
- 10+ workers
- Kubernetes (migrate off Railway?)
- CDN for PDF storage
- Multiple Claude API keys (rate limit distribution)

---

## 🧪 Testing Architecture

### Test Pyramid

```
         /\
        /  \  E2E Tests (Playwright)
       /    \  - Complete user flows
      /------\
     /        \ Integration Tests (pytest)
    /          \ - API endpoints + DB
   /------------\
  /              \ Unit Tests (pytest)
 /                \ - Pure functions
/__________________\
```

### Test Coverage Goals

- **Unit tests:** 80%+ coverage
- **Integration tests:** All API endpoints
- **E2E tests:** Critical paths (register → create audit → download PDF)

---

## ✅ Architecture Checklist

Before launch:
- [ ] Database migrations run successfully
- [ ] All API endpoints documented (Swagger UI)
- [ ] Docker containers build without errors
- [ ] Railway deployment successful
- [ ] Environment variables configured
- [ ] SSL certificates active (HTTPS)
- [ ] Rate limiting tested
- [ ] Error handling covers edge cases
- [ ] Logs visible in Railway dashboard
- [ ] Backup strategy confirmed (Railway auto-backups)

---

**Document Status:** ✅ APPROVED  
**Dependencies:** PRD.md, TECH_STACK.md  
**Next:** DATABASE_SCHEMA.md (detailed)
