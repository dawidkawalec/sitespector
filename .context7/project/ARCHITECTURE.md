# SiteSpector - System Architecture

## High-Level Architecture

SiteSpector is a containerized microservices application running on a single VPS. All services communicate via Docker network.

```
Internet (HTTPS) → Nginx → Frontend (Next.js) → API (FastAPI) → PostgreSQL
                                                       ↓
                                                    Worker
                                                       ↓
                                   ┌───────────────────┼───────────────────┐
                                   ↓                   ↓                   ↓
                            Screaming Frog        Lighthouse          Gemini API
                            (Docker container)   (Docker container)   (External HTTP)
```

---

## Container Architecture

### Docker Compose Services (7 containers)

**Production config**: `docker-compose.prod.yml`

#### 1. `nginx` - Reverse Proxy & SSL Termination
```yaml
container_name: sitespector-nginx
image: nginx:alpine
ports:
  - "80:80"   # HTTP → HTTPS redirect
  - "443:443" # HTTPS (SSL)
volumes:
  - /opt/sitespector/ssl:/etc/nginx/ssl
  - /opt/sitespector/docker/nginx/nginx.conf:/etc/nginx/nginx.conf
```

**Purpose**: 
- Route HTTPS requests to appropriate backend
- `/` → frontend:3000
- `/api/*` → backend:8000
- Terminate SSL (self-signed certificate)

**Config**: See `.context7/infrastructure/NGINX.md`

#### 2. `frontend` - Next.js App (Standalone)
```yaml
container_name: sitespector-frontend
build: ./frontend
ports:
  - "3000:3000"
environment:
  - NEXT_PUBLIC_API_URL=https://sitespector.app
```

**Purpose**: Serve React UI (server-side rendered)

**Build mode**: Standalone (optimized for Docker)

**Internal URL**: http://frontend:3000

#### 3. `backend` - FastAPI Server
```yaml
container_name: sitespector-backend
build: ./backend
ports:
  - "8000:8000"
environment:
  - DATABASE_URL=postgresql+asyncpg://sitespector_user:...@postgres:5432/sitespector_db
  - GEMINI_API_KEY=...
  - JWT_SECRET=...
  - CORS_ORIGINS=["https://sitespector.app","https://www.sitespector.app","https://77.42.79.46"]
depends_on:
  - postgres
```

**Purpose**: REST API (auth, audits CRUD)

**Internal URL**: http://backend:8000

**Endpoints**: See `.context7/backend/API.md`

#### 4. `worker` - Background Processor
```yaml
container_name: sitespector-worker
build: ./backend  # Same image as backend
command: python worker.py
environment:
  # Same as backend
depends_on:
  - postgres
  - screaming-frog
  - lighthouse
```

**Purpose**: Async audit processing (polls for PENDING audits every 10s)

**Process**: See `.context7/backend/WORKER.md`

**No exposed ports** - internal communication only

#### 5. `postgres` - Database
```yaml
container_name: sitespector-postgres
image: postgres:15-alpine
ports:
  - "5432:5432"
environment:
  - POSTGRES_USER=sitespector_user
  - POSTGRES_PASSWORD=sitespector_password
  - POSTGRES_DB=sitespector_db
volumes:
  - postgres_data:/var/lib/postgresql/data
```

**Purpose**: Persistent data storage (users, audits, competitors)

**Schema**: See `.context7/infrastructure/DATABASE.md`

#### 6. `screaming-frog` - SEO Crawler
```yaml
container_name: sitespector-screaming-frog
build: ./docker/screaming-frog
volumes:
  - /opt/sitespector/docker/screaming-frog/crawl.sh:/app/crawl.sh
environment:
  - SF_USER=...
  - SF_KEY=...
  - SF_EMAIL=...
```

**Purpose**: Run Screaming Frog headless crawler

**Execution**: Worker calls `docker exec sitespector-screaming-frog /app/crawl.sh <url>`

**Output**: CSV file with crawl data (parsed by worker)

**No exposed ports** - exec only

#### 7. `lighthouse` - Performance Auditor
```yaml
container_name: sitespector-lighthouse
build: ./docker/lighthouse
volumes:
  - /opt/sitespector/docker/lighthouse/audit.sh:/app/audit.sh
```

**Purpose**: Run Google Lighthouse audits

**Execution**: Worker calls `docker exec sitespector-lighthouse /app/audit.sh <url> <strategy>`
- `strategy=desktop` or `strategy=mobile`

**Output**: JSON file with audit results (parsed by worker)

**No exposed ports** - exec only

---

## Network Flow

### User Request Flow (Frontend Page Load)

```
User Browser
    ↓ HTTPS request
Nginx (443)
    ↓ proxy_pass /
Frontend Container (3000)
    ↓ Next.js SSR
HTML Response
    ↓
User Browser (renders page)
```

### API Request Flow (e.g., Create Audit)

```
User Browser
    ↓ POST /api/audits (HTTPS, Bearer token)
Nginx (443)
    ↓ proxy_pass /api/*
Backend Container (8000)
    ↓ FastAPI endpoint
    ├─ Validate JWT
    ├─ Check user owns audit (if GET/DELETE)
    ├─ Create audit in DB (status=PENDING)
    └─ Return audit object
PostgreSQL Container (5432)
    ↓
Backend
    ↓ JSON response
Nginx
    ↓
User Browser (React Query updates state)
```

### Worker Audit Processing Flow

```
Worker Container (Python async loop, every 10s)
    ↓ SELECT * FROM audits WHERE status='PENDING' LIMIT 3
PostgreSQL
    ↓ Returns PENDING audits
Worker
    ├─ Update status=PROCESSING
    │
    ├─ Screaming Frog Crawl
    │   ↓ docker exec sitespector-screaming-frog /app/crawl.sh <url>
    │   ← CSV output (title, meta, H1, images, links)
    │
    ├─ Lighthouse Audit
    │   ↓ docker exec sitespector-lighthouse /app/audit.sh <url> desktop
    │   ← JSON output (scores, metrics, diagnostics)
    │   ↓ docker exec sitespector-lighthouse /app/audit.sh <url> mobile
    │   ← JSON output
    │
    ├─ Competitor Processing (parallel)
    │   ↓ For each competitor URL: repeat crawl + lighthouse
    │   ← Competitor results
    │
    ├─ AI Analysis (Gemini API)
    │   ↓ 4 HTTP requests to Gemini:
    │   ├─ analyze_content(crawl_data)
    │   ├─ analyze_local_seo(crawl_data)
    │   ├─ analyze_performance(lighthouse_data)
    │   └─ analyze_competitive(audit_data, competitors)
    │   ← AI recommendations, summaries
    │
    ├─ Calculate Scores
    │   ├─ calculate_seo_score(crawl_data)
    │   ├─ calculate_performance_score(lighthouse_data)
    │   ├─ calculate_content_score(ai_analysis)
    │   └─ overall = (seo + performance + content) / 3
    │
    └─ Update Database
        ↓ UPDATE audits SET status='COMPLETED', results={...}, scores={...}
PostgreSQL
```

### Frontend Polling Flow

```
Frontend (useQuery, refetchInterval=5000 if status=processing)
    ↓ GET /api/audits/{id}
Nginx → Backend
    ↓ SELECT * FROM audits WHERE id=...
PostgreSQL
    ↓ Returns audit object
Backend
    ↓ JSON response
Frontend
    ├─ If status=PROCESSING → keep polling
    └─ If status=COMPLETED → stop polling, render results
```

---

## Docker Networking

**Default bridge network**: `sitespector_default`

All containers can communicate via container names:
- `frontend:3000`
- `backend:8000`
- `postgres:5432`
- `screaming-frog` (no port, exec only)
- `lighthouse` (no port, exec only)

**External access**:
- Nginx: 80, 443 (mapped to host)
- PostgreSQL: 5432 (mapped to host for debugging)

**Internal only**:
- Frontend: 3000
- Backend: 8000
- Worker: no ports
- Screaming Frog: no ports
- Lighthouse: no ports

---

## Data Persistence

### Docker Volumes

```yaml
volumes:
  postgres_data:  # Database persistence
    driver: local
```

**Location on VPS**: `/var/lib/docker/volumes/sitespector_postgres_data`

**Backup strategy**: Not implemented (manual pg_dump needed)

### File Storage

**SSL certificates**: `/opt/sitespector/ssl/` (bind mount)

**Logs**: Docker logs (viewed via `docker logs sitespector-<service>`)

**Uploaded files**: Not implemented (audits use URLs, no file uploads)

---

## Concurrency & Parallelism

### Worker Concurrency

```python
# worker.py
MAX_CONCURRENT_AUDITS = 3  # Process up to 3 audits simultaneously

async def worker_loop():
    while True:
        # Fetch up to 3 PENDING audits
        pending = await get_pending_audits(limit=3)
        
        # Process in parallel (asyncio.gather)
        await asyncio.gather(
            *[process_audit(audit.id) for audit in pending]
        )
        
        await asyncio.sleep(10)  # Poll every 10 seconds
```

**Why 3?** - Balance between speed and resource usage (8GB RAM VPS)

### Competitor Processing

```python
# Within process_audit()
if audit.competitors:
    # Process all competitors in parallel
    competitor_results = await asyncio.gather(
        *[process_competitor(comp) for comp in audit.competitors]
    )
```

**Why parallel?** - Competitors are independent (no shared state)

---

## External Dependencies

### Google Gemini API

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent`

**Rate limit**: ~60 requests/minute (not a bottleneck for MVP)

**Cost**: Minimal (gemini-3-flash is cheapest tier)

**Timeout**: 30 seconds per request (handled by httpx)

**Calls per audit**: 4
1. Content analysis
2. Local SEO analysis
3. Performance analysis
4. Competitive analysis (if competitors exist)

### Screaming Frog (Licensed)

**Type**: Desktop SEO crawler (headless mode)

**License**: Commercial license (details in env vars)

**Resource usage**: High CPU during crawl (10-30s per site)

**Depth**: 1 level (homepage + direct links)

### Lighthouse

**Type**: Google's performance auditor

**Strategies**: Desktop + Mobile (2 runs per site)

**Resource usage**: High CPU during audit (20-40s per run)

**Output**: JSON with scores (0-100), metrics (timing), diagnostics

---

## Error Handling & Resilience

### Worker Timeout

```python
async def process_audit(audit_id: str):
    try:
        async with asyncio.timeout(1800):  # 30 minutes
            # ... processing
    except asyncio.TimeoutError:
        await mark_audit_failed(audit_id, "Timeout exceeded (30min)")
```

**Why 30min?** - Worst case: large site + 3 competitors + slow Gemini responses

### Container Restart Policy

```yaml
restart: unless-stopped  # All containers auto-restart on failure
```

### Database Connection Pooling

```python
# app/database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,          # Max 10 connections
    max_overflow=20,       # +20 overflow connections
    pool_pre_ping=True,    # Check connection health
    pool_recycle=3600      # Recycle after 1 hour
)
```

---

## Security

### SSL/TLS

- **Certificate**: Self-signed (development grade)
- **Protocol**: TLS 1.2+
- **Cipher suites**: Modern secure ciphers only

**Limitation**: Browser warnings on first visit (user must accept)

### CORS

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sitespector.app", "https://www.sitespector.app", "https://77.42.79.46"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Why both HTTP/HTTPS?** - Development convenience (though prod uses HTTPS)

### JWT Authentication

- **Algorithm**: HS256 (symmetric)
- **Expiry**: 7 days (configurable)
- **Storage**: localStorage (frontend)
- **Transmission**: Bearer token in Authorization header

### Database Access

- **User**: sitespector_user (limited privileges)
- **Password**: Strong random string
- **Network**: Only accessible from within Docker network (+ host for debugging)

---

## Monitoring & Logging

### Current State: Minimal

**Logs**: Docker stdout/stderr only

```bash
docker logs sitespector-backend --tail 50 -f
docker logs sitespector-worker --tail 50 -f
```

**Metrics**: None (no Prometheus, Grafana)

**Alerts**: None

**Health checks**: Docker-level only (container running = healthy)

### Future Improvements

- Structured logging (JSON)
- Centralized logging (e.g., Loki)
- Application-level health checks (`/health` endpoint)
- Metrics (request counts, processing times)
- Error tracking (e.g., Sentry)

---

## Scaling Considerations

### Current Bottlenecks (8GB VPS)

1. **Worker concurrency**: Limited to 3 parallel audits
2. **Database connections**: Shared pool between backend + worker
3. **CPU**: Screaming Frog + Lighthouse are CPU-intensive

### Horizontal Scaling Path (Future)

```
Load Balancer
    ↓
Frontend Containers (N instances)
    ↓
Backend Containers (N instances)
    ↓
Shared PostgreSQL (managed DB)
    ↓
Worker Containers (N instances)
    ↓
Shared Redis (job queue, instead of DB polling)
```

**What would change**:
- Replace DB polling with Redis queue (Bull, Celery)
- Use managed PostgreSQL (more connections)
- Add load balancer (Nginx, Traefik)
- Separate Screaming Frog + Lighthouse to dedicated runners

**Not needed for MVP** - current VPS handles expected load (<100 audits/day)

---

## Disaster Recovery

### Current State: Minimal

**Backups**: None automated

**Recovery plan**:
1. SSH to VPS
2. `docker compose down`
3. Restore PostgreSQL volume from backup (if exists)
4. `docker compose up -d`

### Recommended Improvements

```bash
# Daily backup cron job (not implemented)
0 2 * * * docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db > /opt/backups/db_$(date +\%Y\%m\%d).sql
```

**Backup retention**: Keep 7 days

**Restoration**:
```bash
cat /opt/backups/db_20250201.sql | docker exec -i sitespector-postgres psql -U sitespector_user sitespector_db
```

---

## Deployment Architecture

### Current: Single VPS

**Provider**: Hetzner Cloud  
**Region**: Europe (likely Germany)  
**IP**: 77.42.79.46 (static)  
**Specs**: 2 vCPU, 8GB RAM, 40GB disk  

**Pros**:
- Simple (one server)
- Cheap (~€10/month)
- Sufficient for MVP

**Cons**:
- Single point of failure
- No horizontal scaling
- Limited to VPS resources

### Future: Multi-tier Architecture (If needed)

```
CDN (Cloudflare)
    ↓
Load Balancer (Hetzner LB or Nginx)
    ↓
Frontend Containers (K8s or Docker Swarm)
    ↓
Backend Containers (K8s or Docker Swarm)
    ↓
Managed PostgreSQL (Hetzner or AWS RDS)
    ↓
Redis Cluster (job queue)
    ↓
Worker Containers (auto-scaling)
```

**Not planned** - MVP works on single VPS

---

## Development vs Production Differences

### Development (Not Used - VPS Only)

**Local setup**: `docker-compose.yml` exists but not used

**Why?** - No local Docker, all development on VPS

### Production

**Config**: `docker-compose.prod.yml`

**Environment**: Production `.env` on VPS

**Build**: Production-optimized (Next.js standalone, minified)

**Debugging**: SSH + Docker logs only

---

## Container Communication Examples

### Backend → Database

```python
# Hostname: postgres
# Port: 5432
DATABASE_URL = "postgresql+asyncpg://sitespector_user:password@postgres:5432/sitespector_db"
```

### Worker → Screaming Frog

```python
# Docker exec (not HTTP)
docker_client.containers.get("sitespector-screaming-frog").exec_run(
    cmd=f"/app/crawl.sh {url}",
    stdout=True,
    stderr=True
)
```

### Backend → Gemini API

```python
# External HTTP (internet)
async with httpx.AsyncClient() as client:
    response = await client.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent",
        headers={"Content-Type": "application/json"},
        json={"contents": [...]}
    )
```

### Nginx → Frontend

```nginx
# Reverse proxy
location / {
    proxy_pass http://frontend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

**Last Updated**: 2025-02-01  
**Deployment**: Hetzner VPS (77.42.79.46)  
**Complexity**: Medium (7 containers, moderate orchestration)  
**Status**: Stable, production-ready for MVP scale
