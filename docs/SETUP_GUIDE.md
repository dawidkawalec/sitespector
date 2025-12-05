# Setup Guide - SiteSpector.app
## Environment Setup & Deployment

**Last Updated:** 2025-12-04  
**Target Audience:** Developers setting up local environment

---

## 🎯 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 20.x LTS | Frontend (Next.js) |
| **Python** | 3.11+ | Backend (FastAPI) |
| **Docker** | 24.x+ | Containers (Screaming Frog, Lighthouse) |
| **Docker Compose** | 2.x+ | Local multi-container setup |
| **Git** | 2.x+ | Version control |
| **PostgreSQL** | 16.x | Database (local or Railway) |

### Optional (Recommended)

- **VSCode** with extensions:
  - Python (Microsoft)
  - ESLint
  - Prettier
  - Docker
  - PostgreSQL (Chris Kolkman)
- **Postman** or **Insomnia** (API testing)
- **Railway CLI** (deployment)

---

## 📦 Installation Steps

### 1. Clone Repository

```bash
# Create project directory
mkdir sitespector && cd sitespector

# Initialize git (if starting fresh)
git init

# Or clone existing repo
git clone https://github.com/your-org/sitespector.git
cd sitespector
```

### 2. Project Structure

```
sitespector/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py       # FastAPI app entry point
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── database.py   # DB connection
│   │   ├── auth.py       # JWT authentication
│   │   ├── services/
│   │   │   ├── screaming_frog.py
│   │   │   ├── lighthouse.py
│   │   │   └── ai_analysis.py
│   │   └── routers/
│   │       ├── auth.py
│   │       └── audits.py
│   ├── worker.py         # Background job processor
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
├── frontend/             # Next.js application
│   ├── app/
│   │   ├── page.tsx      # Home page
│   │   ├── login/
│   │   ├── dashboard/
│   │   └── audits/
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts        # API client
│   │   └── utils.ts
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
├── docker/               # Docker images
│   ├── screaming-frog/
│   │   └── Dockerfile
│   └── lighthouse/
│       └── Dockerfile
├── docs/                 # Documentation
│   └── (all .md files)
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🐍 Backend Setup (FastAPI)

### Step 1: Create Virtual Environment

```bash
cd backend

# Create venv
python3.11 -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### Step 2: Install Dependencies

```bash
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt
```

**requirements.txt:**
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
asyncpg==0.29.0
alembic==1.13.1
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
anthropic==0.25.0
textstat==0.7.3
weasyprint==61.0
jinja2==3.1.3
slowapi==0.1.9
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0
```

### Step 3: Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**.env (backend):**
```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/sitespector

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# Claude API
CLAUDE_API_KEY=sk-ant-api03-xxxxx

# App Config
ENVIRONMENT=development
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Rate Limiting
RATE_LIMIT_AUDITS_PER_HOUR=5
```

### Step 4: Database Setup

```bash
# Start PostgreSQL with Docker
docker run -d \
  --name sitespector-postgres \
  -e POSTGRES_DB=sitespector \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16

# Wait for PostgreSQL to start
sleep 5

# Run migrations
alembic upgrade head
```

**First migration (create):**
```bash
# Initialize Alembic (if not done)
alembic init alembic

# Create first migration
alembic revision --autogenerate -m "Initial tables"

# Apply migration
alembic upgrade head
```

### Step 5: Run Backend Server

```bash
# Development server (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Access:
# - API: http://localhost:8000
# - Swagger Docs: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
```

### Step 6: Test Backend

```bash
# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Open coverage report
open htmlcov/index.html
```

---

## ⚛️ Frontend Setup (Next.js)

### Step 1: Install Dependencies

```bash
cd frontend

# Install packages
npm install
```

**package.json (key dependencies):**
```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "typescript": "5.3.3",
    "tailwindcss": "3.4.1",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.0",
    "tailwind-merge": "2.2.0",
    "lucide-react": "0.312.0",
    "axios": "1.6.5",
    "date-fns": "3.2.0"
  },
  "devDependencies": {
    "@types/node": "20.11.5",
    "@types/react": "18.2.48",
    "eslint": "8.56.0",
    "prettier": "3.2.4"
  }
}
```

### Step 2: Environment Variables

```bash
# Copy example
cp .env.local.example .env.local

# Edit
nano .env.local
```

**.env.local (frontend):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SiteSpector
```

### Step 3: Initialize shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
```

### Step 4: Run Frontend Server

```bash
# Development server
npm run dev

# Access: http://localhost:3000
```

### Step 5: Build for Production

```bash
# Build
npm run build

# Start production server
npm start

# Test production build locally
open http://localhost:3000
```

---

## 🐳 Docker Setup (Full Stack)

### Step 1: Build Docker Images

```bash
# From project root
cd sitespector

# Build all images
docker-compose build
```

### Step 2: Start All Services

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:16
    container_name: sitespector-db
    environment:
      POSTGRES_DB: sitespector
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI Backend
  backend:
    build: ./backend
    container_name: sitespector-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/sitespector
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /tmp/audits:/tmp/audits
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Background Worker
  worker:
    build: ./backend
    container_name: sitespector-worker
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/sitespector
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    depends_on:
      - db
      - backend
    volumes:
      - ./backend:/app
      - /tmp/audits:/tmp/audits
    command: python worker.py

  # Screaming Frog Container
  screaming_frog:
    build: ./docker/screaming-frog
    container_name: sitespector-sf
    volumes:
      - /tmp/audits:/output

  # Lighthouse Container
  lighthouse:
    build: ./docker/lighthouse
    container_name: sitespector-lighthouse
    volumes:
      - /tmp/audits:/output
    cap_add:
      - SYS_ADMIN

  # Next.js Frontend
  frontend:
    build: ./frontend
    container_name: sitespector-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

### Step 3: Verify All Services Running

```bash
# Check status
docker-compose ps

# Should show:
# sitespector-db         running
# sitespector-backend    running
# sitespector-worker     running
# sitespector-frontend   running
# sitespector-sf         running
# sitespector-lighthouse running
```

---

## 🚀 Railway Deployment

### Step 1: Install Railway CLI

```bash
# macOS
brew install railway

# Linux/Windows
npm install -g @railway/cli

# Login
railway login
```

### Step 2: Initialize Railway Project

```bash
# From project root
railway init

# Link to existing project (if already created)
railway link
```

### Step 3: Create Services

**Via Railway Dashboard:**

1. **Create PostgreSQL Database**
   - Dashboard → New → Database → PostgreSQL
   - Note: DATABASE_URL auto-injected into other services

2. **Create Backend Service**
   - Dashboard → New → GitHub Repo → Select `backend` folder
   - Settings:
     - Root Directory: `/backend`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     ```
     CLAUDE_API_KEY=sk-ant-api03-xxxxx
     JWT_SECRET_KEY=your-secret-key
     ENVIRONMENT=production
     ```

3. **Create Worker Service**
   - Dashboard → New → GitHub Repo → Same repo, `backend` folder
   - Settings:
     - Root Directory: `/backend`
     - Start Command: `python worker.py`
   - Environment Variables: Same as backend

4. **Create Frontend Service**
   - Dashboard → New → GitHub Repo → Select `frontend` folder
   - Settings:
     - Root Directory: `/frontend`
     - Build Command: `npm run build`
     - Start Command: `npm start`
   - Environment Variables:
     ```
     NEXT_PUBLIC_API_URL=https://api.sitespector.app
     ```

### Step 4: Configure Custom Domains

**In Railway Dashboard:**

1. Backend Service → Settings → Networking
   - Add domain: `api.sitespector.app`
   - Railway provides CNAME record
   - Add CNAME in your DNS provider

2. Frontend Service → Settings → Networking
   - Add domain: `sitespector.app`
   - Add CNAME in your DNS provider

**DNS Configuration (e.g., Cloudflare):**
```
Type   Name  Target
CNAME  @     railway-frontend-xxx.up.railway.app
CNAME  api   railway-backend-xxx.up.railway.app
```

### Step 5: Deploy

```bash
# Push to GitHub main branch
git add .
git commit -m "Initial deployment"
git push origin main

# Railway auto-deploys on push
```

### Step 6: Run Database Migrations

```bash
# Connect to Railway backend service
railway run bash

# Inside container
alembic upgrade head

# Exit
exit
```

### Step 7: Verify Deployment

```bash
# Check backend health
curl https://api.sitespector.app/health

# Check frontend
open https://sitespector.app
```

---

## 🔧 Troubleshooting

### Issue: PostgreSQL Connection Failed

**Error:**
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql+asyncpg://user:pass@host:5432/dbname

# Test connection manually
psql $DATABASE_URL
```

---

### Issue: Screaming Frog CLI Not Found

**Error:**
```
FileNotFoundError: screamingfrog command not found
```

**Solution:**
```bash
# Rebuild Screaming Frog Docker image
cd docker/screaming-frog
docker build -t sitespector-sf .

# Test CLI
docker run sitespector-sf screamingfrog --version
```

---

### Issue: Claude API Rate Limit

**Error:**
```
anthropic.RateLimitError: Rate limit exceeded
```

**Solution:**
```python
# Add exponential backoff in ai_analysis.py
import time
from anthropic import RateLimitError

max_retries = 3
for i in range(max_retries):
    try:
        response = client.messages.create(...)
        break
    except RateLimitError:
        if i < max_retries - 1:
            time.sleep(2 ** i)  # 1s, 2s, 4s
        else:
            raise
```

---

### Issue: PDF Generation Fails

**Error:**
```
OSError: cannot load font
```

**Solution:**
```bash
# Install missing fonts in Docker container
# Add to backend/Dockerfile:
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    fontconfig

# Rebuild
docker-compose build backend
```

---

### Issue: Frontend Can't Connect to Backend

**Error:**
```
AxiosError: Network Error
```

**Solution:**
```bash
# Check NEXT_PUBLIC_API_URL in frontend/.env.local
cat frontend/.env.local

# Should be:
# Dev: http://localhost:8000
# Prod: https://api.sitespector.app

# Verify CORS in backend
# backend/app/main.py should have:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://sitespector.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📋 Quick Reference Commands

### Development Workflow

```bash
# Start backend only
cd backend && uvicorn app.main:app --reload

# Start frontend only
cd frontend && npm run dev

# Start everything (Docker)
docker-compose up

# Run tests
cd backend && pytest
cd frontend && npm test

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head

# Format code
cd backend && black .
cd frontend && npm run format
```

### Production Deployment

```bash
# Deploy to Railway (auto on git push)
git push origin main

# Manual deploy via CLI
railway up

# View logs
railway logs

# Run command in production
railway run bash
```

---

## ✅ Setup Checklist

**Local Development:**
- [ ] Python 3.11+ installed
- [ ] Node.js 20.x installed
- [ ] Docker + Docker Compose running
- [ ] PostgreSQL accessible (port 5432)
- [ ] Backend starts without errors (localhost:8000)
- [ ] Frontend starts without errors (localhost:3000)
- [ ] Can create test user via API
- [ ] Can create test audit
- [ ] Swagger docs accessible (/docs)

**Production Deployment:**
- [ ] Railway account created
- [ ] GitHub repo connected
- [ ] PostgreSQL service provisioned
- [ ] Backend service deployed
- [ ] Worker service deployed
- [ ] Frontend service deployed
- [ ] Custom domains configured (DNS propagated)
- [ ] SSL certificates active (HTTPS working)
- [ ] Environment variables set (all services)
- [ ] Database migrations run
- [ ] Can register user on production
- [ ] Can create audit on production
- [ ] PDF download works

---

## 🔗 Useful Links

- **Railway Dashboard:** https://railway.app/dashboard
- **GitHub Repo:** https://github.com/your-org/sitespector
- **Swagger Docs (Local):** http://localhost:8000/docs
- **Swagger Docs (Prod):** https://api.sitespector.app/docs
- **Frontend (Local):** http://localhost:3000
- **Frontend (Prod):** https://sitespector.app

---

**Document Status:** ✅ READY  
**Next Steps:** Follow step-by-step → Report issues in GitHub  
**Support:** Check TROUBLESHOOTING.md or open issue
