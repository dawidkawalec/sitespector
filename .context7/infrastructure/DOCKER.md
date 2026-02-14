# SiteSpector - Docker Configuration

## Overview

SiteSpector runs as 7 Docker containers orchestrated by Docker Compose.

**Config file**: `docker-compose.prod.yml` (production)

**Network**: Bridge network (`sitespector-network`)

---

## Services

### 1. nginx (Reverse Proxy)

```yaml
nginx:
  build:
    context: ./docker/nginx
    dockerfile: Dockerfile
  container_name: sitespector-nginx
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
  depends_on:
    - frontend
    - backend
  networks:
    - sitespector-network
  restart: unless-stopped
```

**Purpose**: SSL termination, reverse proxy, static file serving

**Routing**:
- `/` → frontend:3000
- `/api/*` → backend:8000

---

### 2. frontend (Next.js)

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=https://sitespector.app
    container_name: sitespector-frontend
    command: node server.js
    environment:
      - NEXT_PUBLIC_API_URL=https://sitespector.app
    - HOSTNAME=0.0.0.0
  depends_on:
    - backend
  networks:
    - sitespector-network
  restart: unless-stopped
```

**Build mode**: Standalone (optimized for Docker)

**Port**: 3000 (internal only)

**Rebuild required**: Yes (on code changes)

---

### 3. backend (FastAPI)

```yaml
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sitespector-backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    environment:
      - DATABASE_URL=postgresql+asyncpg://sitespector_user:sitespector_password@postgres:5432/sitespector_db
      - ENVIRONMENT=production
      - DEBUG=false
      # Prefer setting CORS in `/opt/sitespector/.env` (not hardcoded in compose).
      # Example:
      # CORS_ORIGINS=["https://sitespector.app","https://www.sitespector.app"]
    env_file:
      - .env
  volumes:
    - ./tmp/audits:/tmp/audits
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - sitespector-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**Port**: 8000 (internal only)

**Health check**: `/health` endpoint

---

### 4. worker (Background Processor)

```yaml
worker:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: sitespector-worker
  command: python worker.py
  environment:
    - DATABASE_URL=postgresql+asyncpg://sitespector_user:sitespector_password@postgres:5432/sitespector_db
    - ENVIRONMENT=production
    - DEBUG=false
  env_file:
    - .env
  volumes:
    - ./tmp/audits:/tmp/audits
    - /var/run/docker.sock:/var/run/docker.sock
  dns:
    - 8.8.8.8
    - 1.1.1.1
  healthcheck:
    test: ["CMD-SHELL", "pgrep -f worker.py || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
  depends_on:
    postgres:
      condition: service_healthy
    backend:
      condition: service_started
  networks:
    - sitespector-network
  restart: unless-stopped
```

**Docker socket**: Mounted to exec into other containers

**No ports**: Internal communication only

---

### 5. postgres (Database)

```yaml
postgres:
  image: postgres:16-alpine
  container_name: sitespector-postgres
  environment:
    POSTGRES_USER: sitespector_user
    POSTGRES_PASSWORD: sitespector_password
    POSTGRES_DB: sitespector_db
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U sitespector_user -d sitespector_db"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - sitespector-network
  restart: unless-stopped
```

**Volume**: `postgres_data` (persistent)

**Port**: 5432 (internal only)

---

### 6. landing (SiteSpector Landing Page)

```yaml
  landing:
    build:
      context: ./landing
      dockerfile: Dockerfile
    container_name: sitespector-landing
    # ...
```

**Purpose**: Marketing website, blog, documentation, and authentication pages.

---

### 7. screaming-frog (SEO Crawler)

```yaml
screaming-frog:
  platform: linux/amd64
  build:
    context: ./docker/screaming-frog
    dockerfile: Dockerfile
  container_name: sitespector-screaming-frog
  entrypoint: ["tail", "-f", "/dev/null"]
  env_file:
    - .env
  dns:
    - 8.8.8.8
    - 1.1.1.1
  volumes:
    - ./tmp/crawls:/tmp/crawls
  networks:
    - sitespector-network
  restart: unless-stopped
```

**Entrypoint**: `tail -f /dev/null` (keep alive)

**Execution**: Docker exec from worker

---

### 7. lighthouse (Performance Auditor)

```yaml
lighthouse:
  build:
    context: ./docker/lighthouse
    dockerfile: Dockerfile
  container_name: sitespector-lighthouse
  entrypoint: ["tail", "-f", "/dev/null"]
  dns:
    - 8.8.8.8
    - 1.1.1.1
  volumes:
    - ./tmp/lighthouse:/tmp/lighthouse
  networks:
    - sitespector-network
  restart: unless-stopped
```

**Entrypoint**: `tail -f /dev/null` (keep alive)

**Execution**: Docker exec from worker

---

## Volumes

```yaml
volumes:
  postgres_data:
    driver: local
```

**Location**: `/var/lib/docker/volumes/sitespector_postgres_data`

---

## Network

```yaml
networks:
  sitespector-network:
    driver: bridge
```

**Internal DNS**: Containers resolve by name (e.g., `backend:8000`, `postgres:5432`)

---

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

**Last Updated**: 2025-02-03  
**Services**: 7 containers  
**Orchestration**: Docker Compose  
**Network**: Bridge (sitespector-network)
