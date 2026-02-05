# SiteSpector - Professional Website Audit Platform

AI-powered SaaS platform for comprehensive website audits. SEO analysis, performance metrics, content quality, and competitor comparison with AI recommendations.

**Status**: Production-ready (v2.0 - SaaS)  
**Domain**: [sitespector.app](https://sitespector.app)  
**Market**: B2B (Agencies, SEO consultants, businesses)

---

## Features

### Core Audit Capabilities
- **SEO Crawling**: Technical SEO analysis via Screaming Frog
- **Performance Testing**: Lighthouse audits (desktop + mobile)
- **AI Analysis**: Content quality and recommendations via Google Gemini
- **Competitor Analysis**: Compare with up to 3 competitors
- **PDF Reports**: Professional downloadable reports
- **Real-time Processing**: Async worker with live status updates

### SaaS Features (v2.0)
- **Supabase Auth**: Email/password, OAuth (Google, GitHub), Magic links
- **Team Workspaces**: Collaborate with team members
- **Role-based Access**: Owner, Admin, Member roles
- **Stripe Billing**: Subscription plans with usage limits
- **Modern UI**: Sidebar navigation, dark mode, mobile responsive
- **Usage Tracking**: Per-workspace audit limits

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.109 (Python 3.11)
- **Database**: PostgreSQL 16 (async via asyncpg)
- **ORM**: SQLAlchemy 2.0
- **Auth**: Supabase Auth (JWT verification)
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Billing**: Stripe
- **PDF**: WeasyPrint (HTML → PDF)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (React Query)
- **Auth**: Supabase JS SDK
- **Theme**: next-themes (dark mode support)

### Infrastructure
- **Hosting**: Hetzner VPS (8GB RAM)
- **Containers**: Docker Compose (8 services)
- **Proxy**: Nginx (reverse proxy + SSL)
- **SSL**: Let's Encrypt
- **External Tools**: Screaming Frog (commercial), Lighthouse

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     sitespector.app                          │
│                                                               │
│  User → Supabase Auth (OAuth, Email, Magic Links)           │
│           ↓                                                   │
│  Next.js Frontend ──→ FastAPI Backend ──→ Worker            │
│           ↓               ↓                    ↓              │
│  Supabase DB      VPS PostgreSQL        Screaming Frog      │
│  (users, teams)   (audits, results)     Lighthouse          │
│                           ↓                    ↓              │
│                    Stripe Webhooks       Gemini AI           │
└─────────────────────────────────────────────────────────────┘
```

**Dual Database Strategy**:
- **Supabase**: User accounts, teams, subscriptions (RLS security)
- **VPS PostgreSQL**: Audit data with large JSONB results (fast worker access)

---

## Setup

### Prerequisites
- Supabase account (free tier works)
- Stripe account (test mode for development)
- Hetzner VPS or similar (8GB+ RAM recommended)
- Domain name (for production)

### Local Development

**Note**: This project uses VPS-only Docker. Local setup is for code editing only.

1. **Clone repository**
```bash
git clone https://github.com/yourusername/sitespector.git
cd sitespector
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend (if running locally)
cd backend
pip install -r requirements.txt
```

3. **Configure Supabase**

See [`supabase/README.md`](supabase/README.md) for complete setup guide.

Quick steps:
- Create Supabase project
- Run `supabase/schema.sql` in SQL Editor
- Run `supabase/policies.sql` in SQL Editor
- Configure OAuth providers
- Copy API keys to `.env`

4. **Deploy to VPS**

See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) for complete guide.

---

## Subscription Plans

| Feature | Free | Pro ($29/mo) | Enterprise ($99/mo) |
|---------|------|--------------|---------------------|
| Audits/month | 5 | 50 | Unlimited |
| Team workspaces | ❌ | ✅ | ✅ |
| Competitor analysis | ❌ | ✅ (3 max) | ✅ (unlimited) |
| PDF reports | ✅ | ✅ White-label | ✅ Custom |
| API access | ❌ | ✅ | ✅ |
| Support | Email | Priority | Dedicated |

---

## Documentation

Complete documentation in [`docs/`](docs/) and [`.context7/`](.context7/):

### Setup & Deployment
- [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [`docs/TESTING_CHECKLIST.md`](docs/TESTING_CHECKLIST.md) - Testing checklist
- [`supabase/README.md`](supabase/README.md) - Supabase configuration

### Architecture & Technical
- [`.context7/project/ARCHITECTURE.md`](.context7/project/ARCHITECTURE.md) - System architecture
- [`.context7/project/STACK.md`](.context7/project/STACK.md) - Technology stack details
- [`.context7/backend/API.md`](.context7/backend/API.md) - API endpoints
- [`.context7/backend/WORKER.md`](.context7/backend/WORKER.md) - Worker process
- [`.context7/backend/MODELS.md`](.context7/backend/MODELS.md) - Database models

### Development
- [`.kilocode/rules/project.md`](.kilocode/rules/project.md) - Project rules for AI agents
- [`.context7/decisions/DECISIONS_LOG.md`](.context7/decisions/DECISIONS_LOG.md) - Architectural decisions

---

## Development Workflow

**Standard workflow** (VPS-only Docker):

1. Edit code locally in KiloCode
2. Commit changes: `git commit -m "feat: description"`
3. Push to remote: `git push origin release` (ask first!)
4. SSH to VPS: `ssh root@77.42.79.46`
5. Pull and deploy:
   ```bash
   cd /opt/sitespector
   git pull origin release
   docker compose -f docker-compose.prod.yml restart backend worker
   # Or rebuild frontend if needed:
   docker compose -f docker-compose.prod.yml build --no-cache frontend
   docker compose -f docker-compose.prod.yml up -d frontend
   ```

See [`.context7/project/DEPLOYMENT.md`](.context7/project/DEPLOYMENT.md) for details.

---

## API

**Base URL**: `https://sitespector.app/api`

### Authentication
```bash
# Login (returns Supabase JWT)
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

### Audits
```bash
# Create audit (requires workspace_id)
POST /api/audits?workspace_id={workspace_id}
{
  "url": "https://example.com",
  "competitors": ["https://competitor.com"]
}

# List workspace audits
GET /api/audits?workspace_id={workspace_id}

# Get audit details
GET /api/audits/{audit_id}

# Download PDF
GET /api/audits/{audit_id}/pdf
```

### Billing
```bash
# Create checkout session
POST /api/billing/create-checkout-session
{
  "workspace_id": "xxx",
  "price_id": "price_pro_monthly"
}

# Stripe webhook
POST /api/billing/webhook
```

Full API documentation: [`.context7/backend/API.md`](.context7/backend/API.md)

---

## Environment Variables

### Backend (`.env`)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/sitespector_db

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# AI
GEMINI_API_KEY=AIzaSy...

# Screaming Frog License
SCREAMING_FROG_USER=...
SCREAMING_FROG_KEY=...
SCREAMING_FROG_EMAIL=...

# App
FRONTEND_URL=https://sitespector.app
CORS_ORIGINS=["https://sitespector.app"]
```

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=https://sitespector.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Project Structure

```
sitespector/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic (worker, AI, PDF)
│   │   ├── lib/             # Utilities (Supabase client)
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth_supabase.py # Supabase auth verification
│   │   └── main.py          # FastAPI app
│   ├── scripts/             # Migration scripts
│   ├── worker.py            # Background audit processor
│   └── requirements.txt
├── frontend/                # Next.js frontend
│   ├── app/                 # Pages (App Router)
│   │   ├── auth/            # Auth pages (callback)
│   │   ├── dashboard/       # Dashboard + layout
│   │   ├── audits/[id]/     # Audit detail page
│   │   ├── settings/        # Settings pages
│   │   ├── pricing/         # Pricing page
│   │   └── invite/[token]/  # Accept invite
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Sidebar, MobileSidebar
│   │   └── teams/           # Team components
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   ├── WorkspaceContext.tsx # Workspace state
│   │   └── api.ts           # API client
│   └── package.json
├── supabase/                # Supabase schema & policies
│   ├── schema.sql           # Database schema
│   ├── policies.sql         # RLS policies
│   └── README.md            # Setup guide
├── docker/                  # Docker configs
│   ├── nginx/               # Nginx reverse proxy
│   ├── screaming-frog/      # SEO crawler
│   └── lighthouse/          # Performance auditor
├── docs/                    # Documentation
│   ├── DEPLOYMENT_GUIDE.md  # Deployment guide
│   ├── TESTING_CHECKLIST.md # Testing guide
│   └── SAAS_TRANSFORMATION_SUMMARY.md
├── .context7/               # AI agent documentation
│   ├── project/             # Project overview
│   ├── backend/             # Backend docs
│   ├── frontend/            # Frontend docs
│   └── decisions/           # ADRs
└── docker-compose.prod.yml  # Production orchestration
```

---

## Contributing

This is a solo project by Dawid. Not accepting external contributions at this time.

---

## License

Proprietary - All rights reserved.

---

## Support

- **Issues**: Check troubleshooting guides in `docs/`
- **Email**: support@sitespector.app
- **Documentation**: See `.context7/` and `docs/` folders

---

**Version**: 2.0 (SaaS)  
**Last Updated**: 2025-02-03  
**Status**: ✅ Production-ready
