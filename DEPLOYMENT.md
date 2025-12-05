# SiteSpector - Deployment Guide

Przewodnik wdrożenia aplikacji SiteSpector na Railway.app.

---

## 📋 Wymagania Przed Deployment

### 1. Konta i Dostępy

- ✅ Konto Railway: https://railway.app
- ✅ Konto GitHub (repo połączone)
- ✅ Claude API key: https://console.anthropic.com
- ✅ Domeny (opcjonalne): sitespector.app, api.sitespector.app

### 2. Zmienne Środowiskowe

Przygotuj następujące wartości:

```bash
# Database (automatycznie z Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Authentication (wygeneruj bezpieczny klucz)
JWT_SECRET=<64-character-random-string>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7
BCRYPT_COST=12

# Claude AI
CLAUDE_API_KEY=sk-ant-<your-key>
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=8000
CLAUDE_TEMPERATURE=0.3

# Application
ENVIRONMENT=production
DEBUG=false
APP_NAME=SiteSpector
API_VERSION=v1

# CORS (Twoje domeny)
CORS_ORIGINS=https://sitespector.app,https://api.sitespector.app

# Rate Limiting
RATE_LIMIT_REGISTER=5/hour
RATE_LIMIT_LOGIN=10/hour
RATE_LIMIT_AUDIT_CREATE=5/hour
RATE_LIMIT_GET=60/minute

# Worker
WORKER_POLL_INTERVAL=10
WORKER_MAX_CONCURRENT_AUDITS=3
AUDIT_TIMEOUT_MINUTES=10

# File Storage
PDF_STORAGE_PATH=/app/tmp/audits
PDF_CACHE_ENABLED=true
PDF_MAX_SIZE_MB=10

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

---

## 🚀 Deployment na Railway

### Krok 1: Utwórz Projekt Railway

```bash
# Zaloguj się do Railway CLI (opcjonalne)
npm install -g @railway/cli
railway login

# LUB użyj Dashboard: https://railway.app/new
```

### Krok 2: Dodaj PostgreSQL

1. W Railway Dashboard → **New** → **Database** → **PostgreSQL**
2. Poczekaj na provisionowanie (1-2 minuty)
3. PostgreSQL automatycznie utworzy `DATABASE_URL`

### Krok 3: Deploy Backend

1. **New** → **GitHub Repo** → Wybierz `sitespector`
2. Railway wykryje `backend/Dockerfile`
3. **Root Directory:** Ustaw na `backend`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Dodaj zmienne środowiskowe (Variables):
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<your-generated-secret>
CLAUDE_API_KEY=<your-claude-key>
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://sitespector.app
```

5. **Deploy!**

### Krok 4: Uruchom Migracje

```bash
# Z Railway CLI
railway run alembic upgrade head

# LUB przez Dashboard
# Settings → Deploy → Add Command:
# alembic upgrade head
```

### Krok 5: Deploy Worker

1. **New Service** → **GitHub Repo** (to samo repo)
2. **Root Directory:** `backend`
3. **Start Command:** `python worker.py`
4. Skopiuj te same zmienne środowiskowe co Backend
5. **Deploy!**

### Krok 6: Deploy Frontend

1. **New Service** → **GitHub Repo** (to samo repo)
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Start Command:** `npm start`

Dodaj zmienną:
```
NEXT_PUBLIC_API_URL=https://sitespector-backend.up.railway.app
```

5. **Deploy!**

### Krok 7: Konfiguracja Domen

#### Backend API

1. Backend Service → **Settings** → **Networking**
2. **Generate Domain** → Skopiuj URL (np. `sitespector-backend.up.railway.app`)
3. Jeśli masz własną domenę:
   - **Custom Domain** → `api.sitespector.app`
   - W DNS dodaj CNAME: `api.sitespector.app` → `sitespector-backend.up.railway.app`

#### Frontend

1. Frontend Service → **Settings** → **Networking**
2. **Custom Domain** → `sitespector.app`
3. W DNS dodaj:
   - **A Record:** `@` → IP Railway
   - **CNAME:** `www` → `sitespector.app`

### Krok 8: SSL Certificates

Railway automatycznie generuje certyfikaty SSL przez Let's Encrypt.
Poczekaj 1-5 minut po dodaniu domeny.

---

## 🔧 Post-Deployment

### 1. Smoke Tests

```bash
# Health check
curl https://api.sitespector.app/health

# Create test user
curl -X POST https://api.sitespector.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Login
curl -X POST https://api.sitespector.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### 2. Monitoring

Railway Dashboard → Service → **Metrics**:
- CPU usage
- Memory usage
- Network traffic
- Logs (real-time)

### 3. Logs

```bash
# Railway CLI
railway logs

# Dashboard
Service → Deployments → View Logs
```

### 4. Backup Database

```bash
# Railway CLI
railway pg:dump > backup_$(date +%Y%m%d).sql

# Restore
railway pg:restore backup_20250105.sql
```

---

## 🔄 Continuous Deployment

### Auto-deploy z GitHub

Railway automatycznie deployuje po push do `main`:

```bash
git add .
git commit -m "feat: new feature"
git push origin main
# Railway auto-deploys w 2-5 minut
```

### Deploy Branches

Production: `main` → Railway Production
Staging: `develop` → Railway Staging (osobny projekt)

---

## 🐛 Troubleshooting

### Problem: Backend nie startuje

**Sprawdź logi:**
```bash
railway logs --service backend
```

**Typowe przyczyny:**
- Brak `DATABASE_URL` → Dodaj w Variables
- Błąd migracji → Uruchom `alembic upgrade head`
- Port conflict → Railway używa `$PORT` automatycznie

### Problem: Frontend nie łączy się z Backend

**Sprawdź:**
1. `NEXT_PUBLIC_API_URL` w Frontend Variables
2. CORS w Backend: `CORS_ORIGINS` zawiera frontend URL
3. SSL certificate aktywny (Railway → Networking)

### Problem: Worker nie przetwarza audytów

**Sprawdź:**
1. Worker service działa (Railway Dashboard)
2. Worker ma dostęp do `DATABASE_URL`
3. Logi: `railway logs --service worker`

### Problem: Migracje nie działają

```bash
# Sprawdź aktualną wersję
railway run alembic current

# Reset (UWAGA: Usuwa dane!)
railway run alembic downgrade base
railway run alembic upgrade head
```

### Problem: Brak miejsca na dysku (PDF)

Railway Hobby plan: 1GB storage
- Usuń stare PDF: `rm /app/tmp/audits/*.pdf`
- Lub upgrade do Pro plan (5GB)
- LUB użyj external storage (AWS S3)

---

## 📊 Monitoring & Alerts

### 1. Railway Metrics

Dashboard → Metrics:
- Request rate
- Response time
- Error rate
- Database connections

### 2. Sentry (opcjonalne)

```bash
# Backend
pip install sentry-sdk
# W app/main.py:
import sentry_sdk
sentry_sdk.init(dsn="<your-sentry-dsn>")

# Frontend  
npm install @sentry/nextjs
# W next.config.js: dodaj Sentry config
```

### 3. Uptime Monitoring

UptimeRobot: https://uptimerobot.com
- Monitor: `https://api.sitespector.app/health`
- Interval: 5 minutes
- Alert: Email/SMS

---

## 💰 Pricing

### Railway Hobby (Darmowy)

- $5 credit/miesiąc
- 512 MB RAM per service
- 1 GB storage
- Unlimited deployments
- **Koszt SiteSpector:** ~$5-10/miesiąc

### Railway Pro ($20/miesiąc)

- Unlimited credit
- 8 GB RAM per service
- 5 GB storage
- Priority support
- **Rekomendowane dla production**

### Claude API

- $3 per million input tokens
- $15 per million output tokens
- **Koszt audytu:** ~$0.10-0.15
- **100 audytów/miesiąc:** ~$10-15

**Total:** ~$40-50/miesiąc (Railway Pro + Claude API)

---

## 🔐 Security Checklist

- [ ] `DEBUG=false` w production
- [ ] `JWT_SECRET` minimum 64 znaki (random)
- [ ] CORS tylko dozwolone domeny
- [ ] SSL certificates aktywne
- [ ] Rate limiting włączony
- [ ] Database backup włączony
- [ ] Sentry error tracking (opcjonalnie)
- [ ] Environment variables zabezpieczone (nie w git)

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **SiteSpector Issues:** https://github.com/dawidkawalec/sitespector/issues

---

**Last Updated:** 2025-12-05

