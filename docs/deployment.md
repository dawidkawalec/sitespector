# SiteSpector - Deployment Guide

## Critical Rules - READ FIRST

### VPS-Only Development Workflow

**⚠️ NO LOCAL DOCKER** - All containers run ONLY on VPS

**Standard workflow**:
1. ✅ Code locally in Cursor
2. ✅ Auto-commit allowed
3. ❌ **NEVER auto-push** - ALWAYS ASK USER FIRST
4. ✅ Deploy to VPS via SSH after user confirms push

---

## Production Environment

### VPS Details

**Provider**: Hetzner Cloud  
**IP**: 46.225.134.48 (current)  
**Specs**: 8 vCPU (AMD), 16GB RAM, 40GB SSD (CPX42)  
**OS**: Ubuntu 24.04 LTS  
**Location**: `/opt/sitespector`

### Access

**SSH**: 
```bash
# Production VPS uses SSH keys only.
# Root SSH login is disabled; use the deploy user.
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48

# If you have an SSH config entry (recommended), this also works:
# ssh sitespector-prod
```

**URLs**:
- Frontend: https://sitespector.app
- API: https://sitespector.app/api
- Health check: https://sitespector.app/health

**Test credentials**:
- Email: YOUR_TEST_EMAIL
- Password: YOUR_TEST_PASSWORD

---

## Deployment Workflow

### Step 1: Local Development

Make changes locally in Cursor:

```bash
# Edit files (backend/app/*.py, frontend/app/**/*.tsx)
# Test logic mentally or via code review
```

### Step 2: Commit Changes (Auto-Allowed)

```bash
git add .
git commit -m "feat(frontend): add SEO details rendering"
```

**Commit message format**:
```
<type>(<scope>): <description>

Types: feat, fix, docs, refactor, test, chore
Scopes: frontend, backend, worker, infra, docs
```

### Step 3: Push to Remote (ASK FIRST - MANDATORY)

**Agent must ask**:
```
I've committed 3 changes:
- feat(frontend): SEO rendering
- fix(api): null safety  
- docs: update Context7

Ready to push to origin/release?
```

**User confirms** → Then push:

```bash
git push origin release
```

### Step 4: Deploy to VPS

**SSH to VPS**:

```bash
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48
cd /opt/sitespector
git pull origin release
```

### Step 5: Restart Services

**For backend/worker changes**:

```bash
docker compose -f docker-compose.prod.yml restart backend worker
```

**For frontend changes** (REQUIRES REBUILD):

```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

**For infrastructure changes** (nginx, docker-compose.prod.yml):

```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Step 5a: Chat / RAG (Qdrant) Notes

- Qdrant is deployed as part of `docker-compose.prod.yml` (service: `qdrant`).
- No ports are exposed publicly; backend/worker access it via the internal Docker network as `http://qdrant:6333`.
- Required env vars on VPS `.env`:
  - `QDRANT_URL=http://qdrant:6333` (or `QDRANT_HOST=qdrant` + `QDRANT_PORT=6333`)

### Step 6: Monitor Logs

```bash
# View logs
docker logs sitespector-backend --tail 50 -f
docker logs sitespector-worker --tail 50 -f
docker logs sitespector-frontend --tail 50 -f

# Check container status
docker ps

# View all services
docker compose -f docker-compose.prod.yml ps
```

---

## Service-Specific Deployment

### Backend Changes

**Files**: `backend/app/*.py`, `backend/requirements.txt`

**Process**:
1. Commit changes
2. Push (after asking)
3. SSH to VPS
4. `git pull origin release`
5. Restart backend: `docker compose -f docker-compose.prod.yml restart backend`
6. Check logs: `docker logs sitespector-backend --tail 100`

**If requirements.txt changed**:
```bash
docker compose -f docker-compose.prod.yml build --no-cache backend worker
docker compose -f docker-compose.prod.yml up -d backend worker
```

### Worker Changes

**Files**: `backend/worker.py`, `backend/app/services/*.py`

**Process**:
1. Same as backend
2. Restart worker: `docker compose -f docker-compose.prod.yml restart worker`
3. Check logs: `docker logs sitespector-worker --tail 100`

**Note**: In production, `backend` and `worker` are built from the same Dockerfile but as separate images.
If you change Python dependencies or shared code, rebuild both:
`docker compose -f docker-compose.prod.yml build --no-cache backend worker`

### Frontend Changes

**Files**: `frontend/app/**/*.tsx`, `frontend/components/*.tsx`, `frontend/lib/*.ts`

**Process** (REQUIRES REBUILD):
1. Commit changes
2. Push (after asking)
3. SSH to VPS
4. `git pull origin release`
5. **REBUILD** (critical): `docker compose -f docker-compose.prod.yml build --no-cache frontend`
6. Restart: `docker compose -f docker-compose.prod.yml up -d frontend`
7. Check logs: `docker logs sitespector-frontend --tail 100`

**Why rebuild?** Next.js standalone build embeds code at build time (not runtime)

### Landing Changes

**Files**: `landing/src/**/*.tsx`, `landing/src/assets/scss/**/*.scss`, `landing/content/**`

**Process** (REQUIRES REBUILD):
1. Commit changes
2. Push (after asking)
3. SSH to VPS
4. `git pull origin release`
5. **REBUILD** (critical): `docker compose -f docker-compose.prod.yml build --no-cache landing`
6. Restart: `docker compose -f docker-compose.prod.yml up -d landing`
7. Check logs: `docker logs sitespector-landing --tail 100`

**Why rebuild?** Landing is also a Next.js standalone build (code baked at build time).

### Database Changes (Migrations)

**Files**: `backend/app/models.py`

**Process**:
1. Edit models locally
2. Commit changes
3. Push (after asking)
4. SSH to VPS
5. `git pull origin release`
6. Create migration:
```bash
docker exec sitespector-backend alembic revision --autogenerate -m "add new column"
```
7. Apply migration:
```bash
docker exec sitespector-backend alembic upgrade head
```

### Chat Tables Migration (Feb 2026)

When deploying agent chat, apply migrations after pulling code:

```bash
docker exec sitespector-backend alembic upgrade head
```

If Python deps changed (e.g. added `qdrant-client`), rebuild `backend` and `worker` before running migrations:

```bash
docker compose -f docker-compose.prod.yml build --no-cache backend worker
docker compose -f docker-compose.prod.yml up -d backend worker
```
8. Restart backend: `docker compose -f docker-compose.prod.yml restart backend worker`

**Rollback** (if needed):
```bash
docker exec sitespector-backend alembic downgrade -1
```

### Infrastructure Changes

**Files**: `docker-compose.prod.yml`, `docker/nginx/nginx.conf`, `.env`

**Process**:
1. Commit changes
2. Push (after asking)
3. SSH to VPS
4. `git pull origin release`
5. **Full restart**:
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```
6. Check all services: `docker ps`

**For nginx only**:
```bash
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Environment Variables

### Location: `/opt/sitespector/.env`

**Never commit** .env to Git

### SSL Certificates (Let's Encrypt)

- Certbot standalone requires DNS to already point to the VPS IP and inbound port 80 reachable.
- If DNS is still propagating during first deploy, you can temporarily use a short-lived self-signed cert
  to bring the stack up, then rerun Certbot once DNS is correct.

**Contents** (production):
```bash
# Database
DATABASE_URL=postgresql+asyncpg://sitespector_user:YOUR_DATABASE_PASSWORD@postgres:5432/sitespector_db

# JWT
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_EXPIRATION_DAYS=7

# Gemini API
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Screaming Frog License
SCREAMING_FROG_USER=YOUR_SF_USER_HERE
SCREAMING_FROG_KEY=YOUR_SF_KEY_HERE
SCREAMING_FROG_EMAIL=YOUR_SF_EMAIL_HERE

# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING

# CORS
CORS_ORIGINS=["https://sitespector.app","https://www.sitespector.app"]
```

### Updating Environment Variables

**Process**:
1. SSH to VPS: `ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48`
2. Edit: `nano /opt/sitespector/.env`
3. Save and exit
4. Restart services:
```bash
docker compose -f docker-compose.prod.yml restart backend worker
```

**Frontend env vars** (build-time):
- `NEXT_PUBLIC_API_URL=https://sitespector.app` (and Supabase URLs)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...` (opcjonalnie; weryfikacja Google Search Console)
- Set in `docker-compose.prod.yml` under `args` or `environment`
- Requires rebuild if changed

---

## Common Deployment Tasks

### Full Deployment (All Services)

```bash
# 1. SSH to VPS
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48
cd /opt/sitespector

# 2. Pull latest code
git pull origin release

# 3. Rebuild all containers
docker compose -f docker-compose.prod.yml build --no-cache

# 4. Restart all services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 5. Check status
docker ps
docker logs sitespector-backend --tail 50
docker logs sitespector-worker --tail 50
docker logs sitespector-frontend --tail 50
```

### Quick Backend Fix

```bash
# 1. SSH to VPS
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48
cd /opt/sitespector

# 2. Pull latest code
git pull origin release

# 3. Restart backend + worker
docker compose -f docker-compose.prod.yml restart backend worker

# 4. Monitor logs
docker logs sitespector-backend --tail 100 -f
```

### Check Service Health

```bash
# Container status
docker ps

# Specific service
docker compose -f docker-compose.prod.yml ps backend

# Health endpoint
curl http://localhost:8000/health

# Database connection
docker exec -it sitespector-backend python -c "from app.database import engine; import asyncio; asyncio.run(engine.connect())"
```

---

## Monitoring & Debugging

### View Logs

**Real-time logs**:
```bash
docker logs sitespector-backend --tail 50 -f
docker logs sitespector-worker --tail 50 -f
docker logs sitespector-frontend --tail 50 -f
docker logs sitespector-nginx --tail 50 -f
```

**Last N lines**:
```bash
docker logs sitespector-backend --tail 100
```

**Logs since timestamp**:
```bash
docker logs sitespector-backend --since 2025-02-01T10:00:00
```

### Container Status

**All containers**:
```bash
docker ps
```

**Specific service**:
```bash
docker compose -f docker-compose.prod.yml ps backend
```

**Resource usage**:
```bash
docker stats
```

### Database Inspection

**Access PostgreSQL**:
```bash
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db
```

**Useful queries**:
```sql
-- List recent audits
SELECT id, url, status, created_at FROM audits ORDER BY created_at DESC LIMIT 10;

-- Check specific audit
SELECT * FROM audits WHERE id='85d6ee6f-8c55-4c98-abd8-60dedfafa9df';

-- User audit counts
SELECT email, audits_count FROM users;

-- Processing audits
SELECT id, url, status, started_at FROM audits WHERE status='processing';
```

### Environment Variable Check

```bash
# Backend
docker exec sitespector-backend printenv | grep -E "DATABASE|JWT|GEMINI|SCREAMING"

# Frontend
docker exec sitespector-frontend printenv | grep NEXT_PUBLIC
```

### Restart Individual Service

```bash
docker compose -f docker-compose.prod.yml restart <service>

# Examples:
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart worker
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart nginx
```

### Execute Commands in Container

```bash
# Backend shell
docker exec -it sitespector-backend bash

# Worker shell
docker exec -it sitespector-worker bash

# Database shell
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db
```

---

## Rollback Strategy

### Rollback to Previous Commit

```bash
# 1. SSH to VPS
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48
cd /opt/sitespector

# 2. View commit history
git log --oneline -10

# 3. Rollback to specific commit
git reset --hard <commit-hash>

# 4. Restart services
docker compose -f docker-compose.prod.yml restart backend worker frontend

# 5. If frontend changed, rebuild
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### Rollback Database Migration

```bash
docker exec sitespector-backend alembic downgrade -1
docker compose -f docker-compose.prod.yml restart backend worker
```

---

## Backup & Restore

### Database Backup

**Create backup**:
```bash
docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db > /opt/backups/db_$(date +%Y%m%d_%H%M%S).sql
```

**Automated backup** (cron job - not implemented):
```bash
# Add to crontab: crontab -e
0 2 * * * docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db > /opt/backups/db_$(date +\%Y\%m\%d).sql
```

### Database Restore

```bash
cat /opt/backups/db_20250203.sql | docker exec -i sitespector-postgres psql -U sitespector_user sitespector_db
```

### Code Backup

**Git is the backup** - all code committed and pushed to GitHub

---

## SSL Certificate Management

### Current: Let's Encrypt (sitespector.app)

**Location on host**: `/etc/letsencrypt/live/sitespector.app/`

**Files**:
- `fullchain.pem` - Certificate
- `privkey.pem` - Private key

**Nginx**: Mount full `/etc/letsencrypt:/etc/letsencrypt:ro` so symlinks resolve. Certbot renewal: `certbot renew` (or systemd timer).

### Regenerate / Renew

```bash
certbot certonly --standalone -d sitespector.app -d www.sitespector.app --non-interactive --agree-tos -m your@email.com
docker compose -f docker-compose.prod.yml restart nginx
```

### Fallback: Self-signed (e.g. for IP-only access)

**Location**: `/opt/sitespector/ssl/` – `selfsigned.crt`, `selfsigned.key`. Use only if not using domain.

---

## Disaster Recovery

### Full System Failure

**Prerequisites**:
- SSH access to VPS
- Git repository accessible
- Database backup available

**Recovery steps**:
1. SSH to VPS
2. Navigate to project: `cd /opt/sitespector`
3. Pull latest code: `git pull origin release`
4. Restore database (if needed):
   ```bash
   cat /opt/backups/db_latest.sql | docker exec -i sitespector-postgres psql -U sitespector_user sitespector_db
   ```
5. Restart all services:
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d
   ```
6. Verify services: `docker ps`
7. Check logs: `docker logs sitespector-backend --tail 100`
8. Test frontend: Open https://sitespector.app

---

## Performance Optimization

### Backend Performance

**Database connection pooling** (already configured):
```python
# backend/app/database.py
pool_size=10
max_overflow=20
```

**Worker concurrency** (configured in config.py):
```python
WORKER_MAX_CONCURRENT_AUDITS = 3
```

### Frontend Performance

**Next.js optimizations** (already enabled):
- Standalone output
- Automatic code splitting
- Image optimization

**Rebuild for production**:
```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
```

---

## Troubleshooting

### Frontend Not Loading

**Check**:
1. Frontend container running: `docker ps | grep frontend`
2. Frontend logs: `docker logs sitespector-frontend --tail 100`
3. Nginx routing: `docker logs sitespector-nginx --tail 100`
4. Rebuild if needed: `docker compose -f docker-compose.prod.yml build --no-cache frontend && docker compose up -d frontend`

### API Returning 500 Errors

**Check**:
1. Backend logs: `docker logs sitespector-backend --tail 100`
2. Database connection: `docker exec sitespector-backend python -c "from app.database import engine; print('OK')"`
3. Environment variables: `docker exec sitespector-backend printenv | grep DATABASE_URL`

### Worker Not Processing Audits

**Check**:
1. Worker logs: `docker logs sitespector-worker --tail 100`
2. Worker running: `docker ps | grep worker`
3. Database connection: Same as backend
4. Screaming Frog container: `docker ps | grep screaming-frog`
5. Lighthouse container: `docker ps | grep lighthouse`

### Database Connection Issues

**Check**:
1. PostgreSQL running: `docker ps | grep postgres`
2. Connection from backend: `docker exec sitespector-backend python -c "from app.database import engine; import asyncio; asyncio.run(engine.connect())"`
3. PostgreSQL logs: `docker logs sitespector-postgres --tail 100`

---

## Security Configuration (Hardened 2026-02-15)

### SSH Access

**Status**: ✅ HARDENED
- SSH key-only authentication (password disabled)
- Root login disabled (`PermitRootLogin no`)
- Only `deploy` user allowed (`AllowUsers deploy`)
- MaxAuthTries: 3, LoginGraceTime: 30s
- SSH key: `~/.ssh/hetzner_sitespector_2026`

### Firewall (UFW)

**Status**: ✅ HARDENED - Anti-DDoS configuration
```
Default: deny incoming, deny outgoing, deny routed
Inbound:  22/tcp (SSH), 80/tcp (HTTP), 443/tcp (HTTPS)
Outbound: 80/tcp, 443/tcp (HTTP/HTTPS), 53/udp+tcp (DNS only)
ALL OTHER OUTBOUND UDP BLOCKED (prevents UDP flood DDoS)
```

### fail2ban

**Status**: ✅ ACTIVE
- SSH jail: maxretry=5, bantime=1h

### Docker Security

- Docker socket mounts: **read-only (`:ro`)** on worker, backend, dozzle
- Docker NOT exposed on TCP (no port 2375)
- Network segmentation: `internal` (no internet) + `external` (internet)
- Dozzle pinned to `v8.8.1`, NOT publicly accessible (SSH tunnel only)
- Only nginx exposes ports to host (80, 443)

### API Security

- Swagger/OpenAPI/ReDoc **disabled** in production
- `/api/logs/*` and `/api/system/status` require `X-Admin-Token` header
- Rate limiting: 10r/s on /api/, 3r/s on /login and /register
- Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

### Monitoring

- Security check script runs every 5 minutes (`/opt/sitespector/security-check.sh`)
- Monitors: suspicious processes, executable files in /tmp, unauthorized SSH keys, Docker TCP exposure, unexpected ports
- Alerts logged to `/var/log/sitespector-security.log`
- Certbot auto-renewal via systemd timer + cron backup

---

## Quick Reference Commands

### Common Commands

```bash
# SSH to VPS
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48

# Navigate to project
cd /opt/sitespector

# Pull latest code
git pull origin release

# Restart services
docker compose -f docker-compose.prod.yml restart backend worker

# Rebuild frontend
docker compose -f docker-compose.prod.yml build --no-cache frontend && docker compose up -d frontend

# View logs
docker logs sitespector-backend --tail 100 -f

# Check status
docker ps

# Database access
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db

# Environment variables
docker exec sitespector-backend printenv | grep -E "DATABASE|JWT|GEMINI"
```

---

**Last Updated**: 2026-02-15  
**Deployment target**: Hetzner VPS (46.225.134.48), domain sitespector.app  
**Status**: Production-ready, Let's Encrypt SSL, fully hardened (SSH key-only, UFW anti-DDoS, fail2ban, Docker read-only sockets, network segmentation, API auth, rate limiting, security monitoring)

# SiteSpector - Docker Configuration (Production)

## Overview

SiteSpector runs as **10 Docker containers** orchestrated by Docker Compose on the VPS.

- **Config file**: `docker-compose.prod.yml`
- **Project dir on VPS**: `/opt/sitespector`
- **Branch**: `release`
- **External ports exposed on host**: **only** `80` and `443` via `sitespector-nginx`

## Networks (Hardening)

Production uses 2 networks:

- `sitespector-internal` (**internal: true**) - for services that should not need internet egress
- `sitespector-external` - for services that need internet (e.g. crawlers / Lighthouse)

This is defense-in-depth in addition to host-level UFW.

## Services (Production)

### 1) `nginx` (Reverse Proxy)

- Exposes **host ports** `80` and `443`
- Mounts Let’s Encrypt certs from host:
  - `/etc/letsencrypt:/etc/letsencrypt:ro`
- Routes:
  - `/api/*` -> `backend:8000`
  - `/health` -> `backend:8000/health`
  - `/` -> `frontend:3000`
  - selected marketing/auth routes -> `landing:3001`

### 2) `frontend` (Next.js app)

- Internal only (no host port binding)
- Requires rebuild on code changes (standalone build)

### 3) `landing` (Next.js landing/content/auth)

- Internal only (no host port binding)
- Serves marketing pages, `/login`, `/register`, and the public docs route `/docs` (landing docs, **not** FastAPI Swagger)

### 4) `backend` (FastAPI)

- Internal only (no host port binding)
- Healthcheck: `/health`
- **Swagger/OpenAPI disabled in production** (see `ENVIRONMENT=production`)
- Uses `.env` for database + secrets

### 5) `worker` (Background processor)

- Internal only (no host port binding)
- Executes audits by `docker exec` into other containers
- `docker.sock` mount is **read-only**:
  - `/var/run/docker.sock:/var/run/docker.sock:ro`

### 6) `postgres`

- Internal only
- Persistent volume: `postgres_data`
- Credentials are provided via `.env` variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)

### 7) `screaming-frog`

- Needs external network access (downloads, crawling)
- Controlled via `docker exec` from worker

### 8) `lighthouse`

- Needs external network access (fetching pages)
- Controlled via `docker exec` from worker

### 9) `dozzle` (Docker logs viewer)
### 10) `qdrant` (Vector DB for RAG)

- Internal only (no host port binding)
- Stores audit-scoped embeddings for agent chat
- Used by backend/worker via internal DNS: `http://qdrant:6333`
- Persistent volume: `qdrant_data`


- Runs but is **NOT exposed publicly** via nginx
- Intended access: SSH tunnel to container port `8080` (internal)
- Docker socket mount is **read-only** (`:ro`)

## Docker Socket Safety

Docker socket mounts must be `:ro` (read-only) in production.
If stronger isolation is required, use a Docker socket proxy (see `SECURITY_HARDENING_PLAN.md` Phase 2).

## Common Commands (VPS)

```bash
cd /opt/sitespector

# Start / restart
docker compose -f docker-compose.prod.yml up -d

# Full restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Status
docker ps

# Logs
docker logs sitespector-backend --tail 100
```

---
**Last Updated**: 2026-02-15  
**Services**: 10 containers  
**Orchestration**: Docker Compose  
**Networks**: `sitespector-internal` (internal=true) + `sitespector-external`

## Dockerfiles

### Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Default command (overridden in docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### Frontend Dockerfile (`frontend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Build stages**:
1. deps: Install dependencies
2. builder: Build Next.js app
3. runner: Production runtime (minimal)

**Output**: Standalone build (includes Node.js runtime)

---

## Common Commands

### Start all services

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Stop all services

```bash
docker compose -f docker-compose.prod.yml down
```

### Restart service

```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Rebuild service

```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### View logs

```bash
docker logs sitespector-backend --tail 100 -f
```

### Execute command in container

```bash
docker exec -it sitespector-backend bash
docker exec sitespector-backend alembic upgrade head
```

---

## Environment Variables

**Loaded from**: `.env` file (production only)

**Backend/Worker**:
- `DATABASE_URL`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `SCREAMING_FROG_USER`, `KEY`, `EMAIL`

**Frontend**:
- `NEXT_PUBLIC_API_URL` (build-time)

---

## Networking

**Container-to-container**:
- `backend:8000` (from worker)
- `postgres:5432` (from backend/worker)
- `frontend:3000` (from nginx)

**External access**:
- Nginx: 80, 443 (host ports)

---

## Restart Policy

**All services**: `restart: unless-stopped`

**Behavior**:
- Auto-restart on crash
- Don't restart if manually stopped
- Restart on host reboot

---

**Last Updated**: 2026-02-15  
**Services**: 9 containers  
**Orchestration**: Docker Compose  
**Networks**: `sitespector-internal` (internal=true) + `sitespector-external`

# SiteSpector - Nginx Configuration

## Overview

Nginx acts as reverse proxy and SSL termination for SiteSpector.

**Config file**: `docker/nginx/nginx.conf`

**Container**: `sitespector-nginx`

**Ports**: 80 (HTTP), 443 (HTTPS)

---

## Configuration Structure

### Global Settings

```nginx
events {
    worker_connections 1024;  # Max connections per worker
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript 
               application/xml+rss application/rss+xml 
               font/truetype font/opentype 
               application/vnd.ms-fontobject 
               image/svg+xml;
}
```

---

## Upstream Servers

```nginx
upstream backend {
    server backend:8000;
}

upstream landing {
    server landing:3001;
}

upstream frontend {
    server frontend:3000;
}
```

**Purpose**: Define backend services for load balancing and routing.

---

## HTTP Server (Port 80)

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

**Purpose**: Redirect all HTTP to HTTPS

---

## HTTPS Server (Port 443)

### SSL Configuration

```nginx
server {
    listen 443 ssl;
    server_name sitespector.app www.sitespector.app;

    # SSL certificates (Let's Encrypt; host mounts full /etc/letsencrypt)
    ssl_certificate /etc/letsencrypt/live/sitespector.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sitespector.app/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Max upload size (for PDF reports)
    client_max_body_size 20M;
}
```

**SSL**: Let's Encrypt (production)

**TLS versions**: 1.2, 1.3 only (secure)

---

### API Routes

```nginx
location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts for long-running audits
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

**Routing**: `/api/*` → `backend:8000`

**Timeouts**: 5 minutes (300s) for PDF generation

---

### Health Check Endpoint

```nginx
location /health {
    proxy_pass http://backend/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

**Routing**: `/health` → `backend:8000/health`

**Purpose**: Backend health check (no `/api` prefix)

---

### Frontend Routes

```nginx
location / {
    proxy_pass http={frontend};
    # ...
}
```

**Routing**: Everything else → `frontend:3000`

### Landing Page Routes (SiteSpector Landing)

The landing page application handles the root URL, auth pages, and all marketing/content pages.

```nginx
location = / { proxy_pass http://landing; }
location /login { proxy_pass http://landing; }
location /register { proxy_pass http://landing; }
location /regulamin { proxy_pass http://landing; }
location /polityka-prywatnosci { proxy_pass http://landing; }
location /polityka-cookies { proxy_pass http://landing; }
location /kontakt { proxy_pass http://landing; }
location /o-nas { proxy_pass http://landing; }
location /sitemap { proxy_pass http://landing; }
location /blog { proxy_pass http://landing; }
location /docs { proxy_pass http://landing; }
location /case-study { proxy_pass http://landing; }
location /porownanie { proxy_pass http://landing; }
location /cennik { proxy_pass http://landing; }
location /changelog { proxy_pass http://landing; }

# SEO & AI crawlers
location /sitemap.xml { proxy_pass http://landing; }
location /robots.txt { proxy_pass http://landing; }
location /llms.txt { proxy_pass http://frontend; add_header Content-Type text/markdown; }
```

**Notes**:
- `/docs` is a **landing** route (public content). It is **not** FastAPI Swagger.
- FastAPI Swagger/OpenAPI/ReDoc are disabled in production; verify with:
  - `curl -I https://sitespector.app/api/docs` -> 404
  - `curl -I https://sitespector.app/api/openapi.json` -> 404
- `landing` implements `sitemap.xml` and `robots.txt` via Next.js App Router metadata routes:
  - `landing/src/app/sitemap.ts`
  - `landing/src/app/robots.ts`
- Social sharing images are generated dynamically by `landing` at `/og` (`landing/src/app/og/route.tsx`).

**WebSocket support**: Yes (upgrade header)

---

### Next.js Static Files

```nginx
location /_next/static {
    proxy_pass http://frontend;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, max-age=3600, immutable";
}
```

**Caching**: 60 minutes for static assets

**Purpose**: Optimize Next.js asset delivery

---

## SSL Certificate

### Current: Let's Encrypt

**Location**: `/etc/letsencrypt/live/sitespector.app/`

**Files**:
- `fullchain.pem` - Certificate
- `privkey.pem` - Private key

**Generate**:
```bash
certbot certonly --standalone -d sitespector.app -d www.sitespector.app
```

**Nginx Volume**:
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

---
## Security Hardening (Edge)

Production nginx applies:

- **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- **Reduced fingerprinting**: `server_tokens off` (do not expose nginx version)
- **Rate limiting**:
  - `/api/` -> 10 r/s (burst 20)
  - `/login` + `/register` -> 3 r/s (burst 5)

Monitoring endpoints are protected at the **application layer** (FastAPI `X-Admin-Token`).

---

## Request Flow Examples

### Frontend Page Load

```
Browser
  ↓ HTTPS request: https://sitespector.app/
Nginx (443)
  ↓ proxy_pass / → frontend:3000
Frontend Container (Next.js)
  ↓ Server-side render
HTML Response
  ↓
Browser (renders page)
```

### API Request

```
Browser
  ↓ POST https://sitespector.app/api/audits (Bearer token)
Nginx (443)
  ↓ proxy_pass /api/* → backend:8000
Backend Container (FastAPI)
  ↓ Process request
JSON Response
  ↓
Nginx
  ↓
Browser (React Query updates)
```

---

## Logging

**Access log**: `/var/log/nginx/access.log`  
**Error log**: `/var/log/nginx/error.log`

**View logs**:
```bash
docker logs sitespector-nginx --tail 100
```

---

## Common Issues

### 502 Bad Gateway

**Cause**: Backend/frontend container not running

**Fix**:
```bash
docker ps  # Check if backend/frontend running
docker compose -f docker-compose.prod.yml restart backend frontend
```

### SSL Certificate Warning

**Cause**: If using IP only with self-signed cert, browser shows warning.

**Fix**: Use https://sitespector.app (Let's Encrypt – no warning). For IP-only, accept browser warning.

### 413 Payload Too Large

**Cause**: File upload exceeds `client_max_body_size`

**Fix**: Increase limit in nginx.conf
```nginx
client_max_body_size 50M;
```

---

## Performance Tuning

### Enable HTTP/2

```nginx
listen 443 ssl http2;
```

### Increase Worker Processes

```nginx
worker_processes auto;  # Use all CPU cores
```

### Optimize Gzip Compression

```nginx
gzip_comp_level 6;  # Compression level (1-9)
gzip_buffers 16 8k;
```

---

## Testing Configuration

### Test config syntax

```bash
docker exec sitespector-nginx nginx -t
```

### Reload without downtime

```bash
docker exec sitespector-nginx nginx -s reload
```

---

**Last Updated**: 2026-03-17
**Version**: Nginx (container reports `nginx/1.29.5`)
**SSL**: Let's Encrypt (`sitespector.app`, `www.sitespector.app`)
**Status**: Production-ready (hardened: headers + rate limiting)
