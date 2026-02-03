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
**IP**: 77.42.79.46 (static)  
**Specs**: 2 vCPU, 8GB RAM, 40GB SSD  
**OS**: Ubuntu 22.04 LTS  
**Location**: `/opt/sitespector`

### Access

**SSH**: 
```bash
ssh root@77.42.79.46
```

**URLs**:
- Frontend: https://77.42.79.46
- API: https://77.42.79.46/api
- Health check: https://77.42.79.46/health

**Test credentials**:
- Email: info@craftweb.pl
- Password: Dawid132?

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
ssh root@77.42.79.46
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
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d backend worker
```

### Worker Changes

**Files**: `backend/worker.py`, `backend/app/services/*.py`

**Process**:
1. Same as backend
2. Restart worker: `docker compose -f docker-compose.prod.yml restart worker`
3. Check logs: `docker logs sitespector-worker --tail 100`

**Critical**: Worker shares backend image, so rebuild backend if needed

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

**Contents** (production):
```bash
# Database
DATABASE_URL=postgresql+asyncpg://sitespector_user:sitespector_password@postgres:5432/sitespector_db

# JWT
JWT_SECRET=9kL2mN4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY0zA2bC4dE6fG8h
JWT_EXPIRATION_DAYS=7

# Gemini API
GEMINI_API_KEY=AIzaSyDg_TyD46p9zym48pqVk_cGUeQHojO4cjQ

# Screaming Frog License
SCREAMING_FROG_USER=yahretzkee
SCREAMING_FROG_KEY=E291530FA6-1796688000-A11779DE65
SCREAMING_FROG_EMAIL=piotr.chabros@bespokesoft.pl

# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING

# CORS
CORS_ORIGINS=["https://77.42.79.46","http://77.42.79.46"]
```

### Updating Environment Variables

**Process**:
1. SSH to VPS: `ssh root@77.42.79.46`
2. Edit: `nano /opt/sitespector/.env`
3. Save and exit
4. Restart services:
```bash
docker compose -f docker-compose.prod.yml restart backend worker
```

**Frontend env vars** (build-time):
- Set in `docker-compose.prod.yml` under `args` or `environment`
- Requires rebuild if changed

---

## Common Deployment Tasks

### Full Deployment (All Services)

```bash
# 1. SSH to VPS
ssh root@77.42.79.46
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
ssh root@77.42.79.46
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
ssh root@77.42.79.46
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

### Current: Self-signed Certificate

**Location**: `/opt/sitespector/ssl/`

**Files**:
- `selfsigned.crt` - Certificate
- `selfsigned.key` - Private key

### Regenerate Self-signed Certificate

```bash
cd /opt/sitespector/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout selfsigned.key \
  -out selfsigned.crt \
  -subj "/C=PL/ST=Mazowieckie/L=Warsaw/O=SiteSpector/CN=77.42.79.46"

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Future: Let's Encrypt

**When domain registered**:

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot certonly --standalone -d yourdomain.com

# Update nginx config to use Let's Encrypt certs
# Restart nginx
```

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
8. Test frontend: Open https://77.42.79.46

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

## Security Considerations

### SSH Access

**Best practice** (not implemented):
- Use SSH keys instead of password
- Disable root login
- Use non-standard SSH port

### Firewall

**Current**: No firewall configured (Hetzner firewall used)

**Recommended** (not implemented):
```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### Docker Socket Access

**Worker needs Docker socket** for docker exec:
```yaml
# docker-compose.prod.yml
worker:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

**Security risk**: Worker has full Docker access

**Mitigation**: Worker code trusted (we wrote it)

---

## Quick Reference Commands

### Common Commands

```bash
# SSH to VPS
ssh root@77.42.79.46

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

**Last Updated**: 2025-02-03  
**Deployment target**: Hetzner VPS (77.42.79.46)  
**Status**: Production-ready, manual deployment workflow
