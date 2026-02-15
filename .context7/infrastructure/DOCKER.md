# SiteSpector - Docker Configuration (Production)

## Overview

SiteSpector runs as **9 Docker containers** orchestrated by Docker Compose on the VPS.

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
**Services**: 9 containers  
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
