# Production Deployment Checklist
## SiteSpector.app - Launch Ready

**Last Updated:** 2025-12-04  
**Target:** Railway Production Environment

---

## ✅ PRE-DEPLOYMENT (1 Week Before)

### Code & Tests
- [ ] All 51 tasks from BACKLOG.md completed
- [ ] All unit tests passing (`pytest` backend, `npm test` frontend)
- [ ] E2E tests passing (`playwright test`)
- [ ] Code coverage > 80% backend, >75% frontend
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No linting errors (`eslint`, `black`, `isort`)
- [ ] All API endpoints documented in Swagger UI
- [ ] README.md updated with production URLs

### Security Audit
- [ ] No exposed API keys in code (checked with `git-secrets`)
- [ ] All secrets in environment variables
- [ ] Password requirements enforced (min 12 chars, complexity)
- [ ] JWT token expiration set (7 days)
- [ ] Rate limiting active (5 audits/hour, 60 GET/min)
- [ ] CORS configured (only allow sitespector.app)
- [ ] `npm audit fix` run (no critical vulnerabilities)
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input sanitization)

### Database
- [ ] All Alembic migrations applied
- [ ] Indexes created (see DATABASE_SCHEMA.md)
- [ ] Foreign keys working
- [ ] Backup strategy configured (Railway auto-backups)
- [ ] Connection pooling enabled (max_connections=20)

### Infrastructure
- [ ] Railway project created: "sitespector-prod"
- [ ] PostgreSQL provisioned (Hobby plan minimum)
- [ ] Environment variables set (see below)
- [ ] Custom domains configured:
  - `sitespector.app` → Frontend
  - `api.sitespector.app` → Backend
- [ ] SSL certificates active (auto by Railway)
- [ ] Health check endpoints working:
  - `GET /health` (backend)
  - `GET /` (frontend)

---

## 🔐 ENVIRONMENT VARIABLES

### Backend Service
```bash
# Database (auto-injected by Railway)
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET_KEY=<generate with: openssl rand -hex 32>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# AI
CLAUDE_API_KEY=<from Anthropic Console>
CLAUDE_MODEL=claude-sonnet-4-20250514

# App
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://sitespector.app
RATE_LIMIT_ENABLED=true

# Worker (if separate service)
WORKER_CONCURRENCY=1  # MVP: single worker
```

### Frontend Service
```bash
NEXT_PUBLIC_API_URL=https://api.sitespector.app
NEXT_PUBLIC_ENV=production
```

### Verification
```bash
# Check all variables set
railway run env | grep -E "DATABASE_URL|CLAUDE_API_KEY|JWT_SECRET"
```

---

## 🚀 DEPLOYMENT DAY

### Step 1: Database Migration
```bash
# Connect to Railway
railway link

# Run migrations on production
railway run alembic upgrade head

# Verify tables exist
railway run python -c "from app.database import engine; ..."
```

### Step 2: Deploy Backend
```bash
# Push to main branch (triggers auto-deploy)
git push origin main

# Or manual deploy
cd backend
railway up

# Check deployment status
railway status

# View logs
railway logs
```

### Step 3: Deploy Frontend
```bash
cd frontend
railway up

# Check build logs
railway logs --service frontend
```

### Step 4: Deploy Worker (if separate)
```bash
cd backend
railway up --service worker
```

### Step 5: Verify Deployment
```bash
# Backend health
curl https://api.sitespector.app/health
# Expected: {"status": "ok", "database": "connected"}

# Frontend
curl -I https://sitespector.app
# Expected: HTTP/2 200

# API docs
open https://api.sitespector.app/docs
```

---

## 🧪 POST-DEPLOYMENT SMOKE TESTS

### Test 1: Registration & Login
```bash
# Register new user
curl -X POST https://api.sitespector.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Login
curl -X POST https://api.sitespector.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Expected: {"access_token": "...", "token_type": "bearer"}
```

### Test 2: Create Audit
```bash
# Save token from login
TOKEN="<token_from_above>"

# Create audit
curl -X POST https://api.sitespector.app/api/audits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Expected: {"id": "...", "status": "pending", ...}
```

### Test 3: Wait for Completion
```bash
AUDIT_ID="<id_from_above>"

# Poll status (every 10 seconds)
watch -n 10 "curl -H 'Authorization: Bearer $TOKEN' \
  https://api.sitespector.app/api/audits/$AUDIT_ID/status"

# Wait until status == "completed" (5-10 minutes)
```

### Test 4: Download PDF
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.sitespector.app/api/audits/$AUDIT_ID/pdf \
  -o report.pdf

# Verify PDF
file report.pdf
# Expected: report.pdf: PDF document, version 1.x

ls -lh report.pdf
# Expected: ~2-5 MB
```

### Test 5: Frontend Flow
1. Open https://sitespector.app
2. Click "Get Started" → Register
3. Login → Dashboard
4. Click "New Audit" → Enter URL
5. Wait for completion
6. Click "View Report" → Check all tabs load
7. Click "Download PDF" → PDF downloads

---

## 🔍 MONITORING SETUP

### Railway Metrics (Built-in)
- [ ] CPU usage < 50% average
- [ ] Memory usage < 1GB (backend), < 512MB (frontend)
- [ ] Response time < 500ms (P95)
- [ ] Error rate < 1%

### Custom Monitoring (Optional)
```python
# backend/app/middleware.py
from prometheus_client import Counter, Histogram

# Track API calls
api_calls = Counter('api_calls_total', 'Total API calls', ['endpoint', 'status'])
api_duration = Histogram('api_duration_seconds', 'API response time', ['endpoint'])
```

### Logging
```python
# backend/app/config.py
import logging

logging.basicConfig(
    level=logging.INFO if ENVIRONMENT == "production" else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

**View logs:**
```bash
railway logs --tail 100
```

---

## 🚨 ROLLBACK PLAN

If deployment fails:

### Option 1: Revert to Previous Deployment
```bash
# Railway auto-keeps previous deployments
railway rollback
```

### Option 2: Git Revert
```bash
git revert HEAD
git push origin main
# Railway auto-deploys previous version
```

### Option 3: Database Rollback
```bash
# If migration caused issues
railway run alembic downgrade -1
```

---

## 📊 SUCCESS CRITERIA

Deployment is successful when:
- [ ] All health checks passing
- [ ] Can register new user via UI
- [ ] Can create audit via UI
- [ ] Audit completes within 10 minutes
- [ ] PDF downloads successfully
- [ ] No errors in Railway logs (5 minutes observation)
- [ ] Response time < 500ms (P95)
- [ ] SSL certificates valid (A+ rating on SSL Labs)

---

## 🎉 POST-LAUNCH (First 24 Hours)

### Hour 1-4: Monitor Closely
- [ ] Check Railway metrics every 30 minutes
- [ ] Watch for error spikes in logs
- [ ] Test rate limiting (create >5 audits in 1 hour)
- [ ] Test concurrent users (5-10 simultaneous)

### Hour 4-24: Gradual Release
- [ ] Share with 10 beta users
- [ ] Monitor Claude API usage (should be ~$0.12/audit)
- [ ] Check database growth (should be ~1-2 MB/audit)
- [ ] Verify email notifications (if implemented)

### Day 2-7: Stabilize
- [ ] Review logs daily for errors
- [ ] Optimize slow queries (>100ms)
- [ ] Add missing indexes if needed
- [ ] Document any issues in GitHub

---

## 📞 SUPPORT SETUP

- [ ] Support email active: hello@sitespector.app
- [ ] Status page (optional): status.sitespector.app
- [ ] Bug report form in app
- [ ] GitHub Issues enabled for public repo

---

## 🔄 MAINTENANCE PLAN

### Weekly
- [ ] Check Railway usage (stay under plan limits)
- [ ] Review error logs
- [ ] Check Claude API costs

### Monthly
- [ ] Database backup verification
- [ ] Security updates (`npm audit`, `pip list --outdated`)
- [ ] Performance review (response times)
- [ ] Cost review (Railway + Claude)

---

**Document Status:** ✅ COMPLETE  
**Next:** PRICING_STRATEGY.md
