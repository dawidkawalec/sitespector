---
name: Deploy Clean Release VPS
overview: Create clean release branch without dev cruft, apply critical fixes, and deploy SiteSpector MVP to Hetzner VPS with production-ready Docker Compose configuration.
todos:
  - id: 1-create-branch
    content: Create release branch from main
    status: completed
  - id: 2-delete-cruft
    content: Delete docs/, tests/, CI configs, dev files (27 items)
    status: completed
  - id: 3-apply-fixes
    content: Apply Screaming Frog fixes to crawl.sh and screaming_frog.py
    status: completed
  - id: 4-create-prod-compose
    content: Create docker-compose.prod.yml with production config
    status: completed
  - id: 5-create-nginx
    content: Create Nginx reverse proxy (Dockerfile + nginx.conf)
    status: completed
  - id: 6-create-env-example
    content: Create .env.example template
    status: completed
  - id: 7-commit-push
    content: Commit all changes and push release branch to GitHub (ASK USER FIRST)
    status: completed
  - id: 8-ssh-connect
    content: "SSH: Connect to VPS and update system (ASK USER FIRST)"
    status: completed
  - id: 9-install-docker
    content: "SSH: Install Docker, Docker Compose, Git"
    status: completed
  - id: 10-firewall
    content: "SSH: Configure UFW firewall (ports 22, 80, 443)"
    status: completed
  - id: 11-clone-repo
    content: "SSH: Clone release branch to /opt/sitespector"
    status: completed
  - id: 12-create-env
    content: "SSH: Create production .env files with secrets"
    status: completed
  - id: 13-docker-build
    content: "SSH: Build and start all containers"
    status: completed
  - id: 14-migrations
    content: "SSH: Run Alembic database migrations"
    status: completed
  - id: 15-verify
    content: "Test: Register, login, create audit, download PDF (ASK USER)"
    status: pending
isProject: false
---

# SiteSpector - Clean Release & VPS Deployment

## Deployment Target

- **Server:** Hetzner VPS (8GB RAM, x86 Ubuntu)
- **IP:** 77.42.79.46
- **Branch:** `release` (clean, production-ready)

---

## Phase 1: Create Clean Release Branch

### Step 1.1: Create Branch

```bash
git checkout -b release
```

### Step 1.2: Delete Dev Cruft (27 items)

**Documentation folder (not needed on server):**

- `docs/` - entire directory (24 files including BACKLOG.md, PRD.md, AI_PROMPTS.md, etc.)

**Test files (not needed in production):**

- `backend/app/tests/` - unit tests folder
- `backend/pytest.ini` - pytest config
- `frontend/e2e/` - Playwright E2E tests
- `frontend/playwright.config.ts` - Playwright config

**CI/CD configs (manual deployment):**

- `.github/` - GitHub Actions workflows
- `railway.json` - Railway platform config

**Dev convenience files:**

- `Makefile` - dev commands
- `CONTRIBUTING.md` - contribution guidelines
- `DEPLOYMENT.md` - deployment docs
- `LICENCJE_SETUP.md` - license setup
- `SETUP_LOCAL.md` - local setup guide

**Duplicate folders:**

- `frontend/docker/screaming-frog/` - duplicate of `docker/screaming-frog/`

### Step 1.3: Production File Structure (What Stays)

```
sitespector/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/                  # Application code (without tests/)
│   ├── templates/            # PDF templates
│   ├── Dockerfile
│   ├── requirements.txt
│   └── worker.py
├── frontend/                 # Next.js (without e2e/)
├── docker/
│   ├── lighthouse/
│   ├── screaming-frog/
│   └── nginx/               # NEW - reverse proxy
├── docker-compose.prod.yml  # NEW - production config
├── .gitignore
├── .dockerignore
└── README.md
```

---

## Phase 2: Apply Code Fixes & Create Production Files

### Step 2.1: Screaming Frog Optimization (Already Modified Locally)

Files with uncommitted changes:

- [docker/screaming-frog/crawl.sh](docker/screaming-frog/crawl.sh)
  - Remove `--save-crawl` flag (prevents gigabyte dumps)
  - Add `--crawl-depth 1` (scan only homepage)
- [backend/app/services/screaming_frog.py](backend/app/services/screaming_frog.py)
  - Fix CSV parser to read all data, not just first row
  - Fix image/link counting using correct CSV columns

### Step 2.2: Create docker-compose.prod.yml

Production Docker Compose with:

- Backend: Remove `--reload`, use production mode
- Frontend: `NEXT_PUBLIC_API_URL=http://77.42.79.46/api`
- CORS: Add server IP to allowed origins
- Nginx: Reverse proxy service on port 80
- No code volume mounts (use built images)
- Healthchecks for all services

### Step 2.3: Create Nginx Reverse Proxy

New files:

- `docker/nginx/Dockerfile` - Nginx container
- `docker/nginx/nginx.conf` - Route config:
  - `/` → frontend:3000
  - `/api/` → backend:8000

### Step 2.4: Production .env Template

Create `.env.example` with placeholders (actual secrets go on server, not in repo):

```
DATABASE_URL=postgresql+asyncpg://sitespector_user:CHANGE_ME@postgres:5432/sitespector_db
JWT_SECRET=GENERATE_64_CHAR_SECRET
GEMINI_API_KEY=your_key_here
SCREAMING_FROG_USER=your_user
SCREAMING_FROG_KEY=your_key
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
```

---

## Phase 3: Commit & Push Release Branch

### Step 3.1: Stage All Changes

```bash
git add .
git commit -m "Release v1.0: Clean production build with Screaming Frog fixes"
```

### Step 3.2: Push to GitHub

```bash
git push -u origin release
```

**USER CONFIRMATION REQUIRED BEFORE PUSH**

---

## Phase 4: VPS Server Setup (SSH)

### Step 4.1: Connect to Server

```bash
ssh root@77.42.79.46
# Password: EbLNNNstpCHURWX3EEpH
```

**USER CONFIRMATION REQUIRED BEFORE SSH**

### Step 4.2: System Update

```bash
apt update && apt upgrade -y
```

### Step 4.3: Install Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

### Step 4.4: Install Docker Compose Plugin

```bash
apt install docker-compose-plugin -y
docker compose version  # Verify
```

### Step 4.5: Install Git

```bash
apt install git -y
```

### Step 4.6: Configure Firewall

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS (future)
ufw --force enable
ufw status
```

---

## Phase 5: Deploy Application

### Step 5.1: Clone Release Branch

```bash
cd /opt
git clone -b release https://github.com/DAWID_USERNAME/sitespector.git
cd sitespector
```

### Step 5.2: Create Production .env

```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://sitespector_user:sitespector_password@postgres:5432/sitespector_db
JWT_SECRET=<GENERATE_64_CHAR_RANDOM_STRING>
GEMINI_API_KEY=AIzaSyDg_TyD46p9zym48pqVk_cGUeQHojO4cjQ
SCREAMING_FROG_USER=yahretzkee
SCREAMING_FROG_KEY=E291530FA6-1796688000-A11779DE65
SCREAMING_FROG_EMAIL=piotr.chabros@bespokesoft.pl
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
EOF
```

### Step 5.3: Create Frontend .env.local

```bash
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://77.42.79.46/api
HOSTNAME=0.0.0.0
EOF
```

### Step 5.4: Build & Start All Services

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 5.5: Wait for Services (60s)

```bash
sleep 60
docker compose -f docker-compose.prod.yml ps
```

### Step 5.6: Run Database Migrations

```bash
docker exec sitespector-backend alembic upgrade head
```

### Step 5.7: Check Logs

```bash
docker compose -f docker-compose.prod.yml logs --tail=50
```

---

## Phase 6: Verification & Testing

### Step 6.1: Service Health Check

```bash
curl http://localhost/api/health
# Expected: {"status": "healthy"}
```

### Step 6.2: Frontend Access

Open browser: `http://77.42.79.46`

- Should see SiteSpector homepage

### Step 6.3: User Registration Test

1. Click "Register"
2. Create account
3. Verify login works

### Step 6.4: Audit Test (Critical)

1. Login
2. Create new audit with test URL
3. Wait for completion (~2-3 min)
4. Verify results show Screaming Frog + Lighthouse data
5. Download PDF report

**USER MANUAL TESTING REQUIRED**

---

## Stop Points (User Confirmation)

1. **Before Git Push** - Review files to be committed on release branch
2. **Before SSH** - Confirm server access
3. **After Deployment** - Manual testing of full audit flow

---

## Rollback Plan (If Deployment Fails)

On server:

```bash
docker compose -f docker-compose.prod.yml down
docker system prune -af
```

Fix issues locally → push to release branch → pull on server → rebuild.

---

## Post-Deployment Next Steps (Optional)

1. **Domain Setup:** Point DNS A record to 77.42.79.46
2. **SSL Certificate:** Use Certbot for HTTPS
3. **Monitoring:** Set up Uptime monitoring
4. **Backups:** PostgreSQL daily backups

