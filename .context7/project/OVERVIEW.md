# SiteSpector - Project Overview

## Project Identity

**Name**: SiteSpector
**Type**: Professional SEO & Technical Audit Platform (SaaS)
**Market**: Polish market (B2B, agencies, website owners)
**Stage**: Production SaaS Platform
**Status**: Fully operational with Teams, Billing, Workspaces
**IDE**: KiloCode (migrated from Cursor Feb 2026)

## Migration Notes

**Migrated from Cursor to KiloCode** (2026-02-04)

**Archived**:
- Old Cursor plans → `.archive/old-plans/`
- Temporary documentation → `.archive/temp-docs/`
- SQL fix files → `.archive/sql-fixes/`

**Kept**:
- `.context7/` - Complete technical documentation
- `.cursor/rules/` - Personal preferences (for reference)
- `docs/` - Deployment guides and checklists

## What SiteSpector Does

Professional SaaS platform for automated website auditing that combines:
- **SEO Crawling** (Screaming Frog) - Technical SEO analysis
- **Performance Testing** (Lighthouse) - Core Web Vitals, page speed
- **AI Analysis** (Google Gemini) - Content quality, recommendations
- **PDF Reports** - Professional downloadable audit reports
- **Competitive Analysis** - Compare with up to 3 competitors
- **Team Workspaces** - Collaborate with team members
- **Subscription Billing** - Free, Pro, Enterprise tiers (Stripe integration)
- **Multi-tenancy** - Personal and team workspaces with role-based access

**Target Users**: Marketing agencies, SEO consultants, business owners, and teams who need professional website audits with collaboration features.

## Current State (As of 2026-02-04)

### ✅ What Works (Production-Ready)

**Authentication & User Management**
- Supabase Auth (email/password, OAuth ready for Google/GitHub, magic links)
- User profiles with metadata
- Automatic personal workspace creation on signup
- JWT-based API authentication

**Workspace & Team Management**
- Personal workspaces (1 per user, auto-created)
- Team workspaces (create, invite members, role-based access)
- Workspace switcher UI (sidebar dropdown)
- Member management (owners can add/remove members)
- Team invitations via email

**Subscription & Billing**
- Three tiers: Free (5 audits/month), Pro (50/month), Enterprise (unlimited)
- Stripe integration (checkout, customer portal, webhooks)
- Usage tracking (audits used per workspace)
- Subscription management UI (upgrade, manage, view invoices)
- Audit limit enforcement

**Backend API (FastAPI)**
- Workspace-scoped audit operations
- Supabase JWT verification
- Row Level Security (RLS) for data isolation
- Billing endpoints (checkout, portal, webhooks)
- Worker system (background processing)

**Worker System**
- Screaming Frog SEO crawling
- Lighthouse performance testing (desktop + mobile)
- Gemini AI analysis (4 functions)
- Score calculation (SEO, Performance, Content)
- Parallel competitor processing

**Infrastructure**
- 7 Docker containers on Hetzner VPS
- Nginx reverse proxy with SSL
- Dual database: Supabase (users/teams) + VPS PostgreSQL (audits)
- Auto-scaling ready architecture

**Frontend (Next.js 14 App Router)**
- Modern sidebar layout with workspace switcher
- Dashboard with audit list and stats
- Settings pages (Profile, Team, Billing, Appearance, Notifications)
- Pricing page with subscription tiers
- Audit creation and detail view
- Real-time status polling
- Dark mode support (next-themes)
- Responsive design (mobile-friendly)

### 🔨 In Progress / To Be Completed
- **Audit Detail Rendering**: Basic structure exists, needs enhancement
- **PDF Generator**: Template complete, sections 4-9 need data population
- **OAuth Providers**: Supabase configured, frontend buttons ready (needs provider activation)
- **Stripe Live Mode**: Currently using test mode, ready for production keys
- **Domain & SSL**: Configured for sitespector.app, Let's Encrypt setup pending

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│              77.42.79.46 (Hetzner VPS)                          │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   HTTPS (443)                                │
│  │    Nginx     │ ──────────────────────────────────►          │
│  │ Reverse Proxy│                                               │
│  │   (80→443)   │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ├─────► Frontend (Next.js :3000)                       │
│         │           │                                            │
│         │           └──► Supabase (External)                   │
│         │                   - Auth (JWT)                        │
│         │                   - Users, Teams, Subscriptions       │
│         │                   - RLS Policies                      │
│         │                                                        │
│         └─────► Backend (FastAPI :8000)                        │
│                     │                                            │
│                     ├──► VPS PostgreSQL (:5432)                │
│                     │      - Audits & Results                   │
│                     │                                            │
│                     ├──► Worker (Python async)                 │
│                     │        │                                   │
│                     │        ├──► Screaming Frog               │
│                     │        ├──► Lighthouse                    │
│                     │        └──► Gemini API                    │
│                     │                                            │
│                     └──► Stripe API (Webhooks)                 │
│                            - Subscriptions                       │
│                            - Payments                            │
│                                                                  │
└────────────────────────────────────────────────────────────────┘

DUAL DATABASE STRATEGY:
- Supabase PostgreSQL: Users, Teams, Workspaces, Subscriptions (with RLS)
- VPS PostgreSQL: Audits, Results, Competitors (high-volume data)
```

**See**: `.context7/project/ARCHITECTURE.md` for detailed container interaction

## Tech Stack Summary

**Frontend**
- Next.js 14 (App Router with route groups)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui components
- TanStack Query (React Query)
- Supabase JS Client (@supabase/supabase-js)
- next-themes (dark mode)

**Backend**
- FastAPI (Python 3.11)
- SQLAlchemy 2.0 (async)
- PostgreSQL 15 (VPS + Supabase)
- Supabase Auth (JWT verification)
- Stripe Python SDK
- Google Gemini API

**Infrastructure**
- Docker Compose (7 containers)
- Nginx (reverse proxy)
- Self-signed SSL (Let's Encrypt ready)
- Hetzner VPS (8GB RAM)

**External Services**
- Supabase (Auth, User DB, RLS)
- Stripe (Payment processing)
- Google Gemini (AI analysis)

**See**: `.context7/project/STACK.md` for detailed versions and rationale

## Key Features

### 1. Audit Creation & Processing
- User creates audit (URL + optional 3 competitors)
- Backend saves as PENDING
- Worker picks up (polls every 10s)
- Sequential processing:
  1. Screaming Frog crawl (10-30s)
  2. Lighthouse desktop + mobile (20-40s)
  3. Competitor processing (parallel)
  4. AI analysis (4 Gemini calls, 10-20s)
  5. Score calculation
  6. Save as COMPLETED with full results

### 2. Real-time Status Updates
- Frontend polls every 5s when status = PROCESSING
- Shows: pending → processing → completed
- Displays error message if failed

### 3. Comprehensive Scoring
- **Overall Score**: Average of SEO + Performance + Content
- **SEO Score**: Based on crawl data (title, meta, H1, images, technical)
- **Performance Score**: Lighthouse average (desktop + mobile)
- **Content Score**: AI-determined quality

### 4. AI-Powered Recommendations
- Content quality analysis
- Local SEO detection
- Performance optimization suggestions
- Competitive comparison

### 5. Professional PDF Reports
- (Intended) Complete audit report with all sections
- (Current) Cover page + summary only, rest empty

## Data Flow

```
USER → Frontend → Backend API → Database (PENDING)
                                      ↓
                                   Worker
                                      ↓
            ┌─────────────────────────┼─────────────────────────┐
            ↓                         ↓                         ↓
      Screaming Frog             Lighthouse            Process Competitors
       (SEO crawl)           (Performance test)            (parallel)
            ↓                         ↓                         ↓
            └─────────────────────────┼─────────────────────────┘
                                      ↓
                            Gemini AI Analysis
                         (4 functions: content,
                          local SEO, performance,
                          competitive)
                                      ↓
                           Calculate Scores
                                      ↓
                        Database (COMPLETED + results)
                                      ↓
                        Frontend (polls, displays)
```

**See**: `.context7/backend/WORKER.md` for detailed process flow

## User Journey

1. **Sign Up / Log In** (`/login`, `/register`)
   - Email + password authentication
   - OAuth ready (Google, GitHub)
   - Magic link option
   - Automatic personal workspace creation
   - Supabase Auth JWT token
   
2. **Dashboard** (`/dashboard`)
   - Modern sidebar layout with workspace switcher
   - View all audits in current workspace
   - Usage stats (total, completed, processing)
   - System status indicators
   - Click "New Audit" → Dialog opens
   
3. **Workspace Management**
   - Switch between personal and team workspaces
   - Create team workspaces (`Create Team` button)
   - View current workspace info
   
4. **Team Collaboration** (`/settings/team`)
   - View team members with roles
   - Invite new members by email
   - Manage member roles (owner/admin only)
   - Remove members
   - Accept invitations (`/invite/[token]`)
   
5. **Subscription Management** (`/settings/billing`)
   - View current plan (Free/Pro/Enterprise)
   - See audit usage and limits
   - Upgrade plan via Stripe Checkout
   - Manage subscription via Stripe Customer Portal
   - View invoice history
   
6. **Create Audit**
   - Enter website URL
   - Optionally add 3 competitor URLs
   - Workspace-scoped (audit belongs to current workspace)
   - Usage limit enforcement
   - Submit → Redirected to audit detail page
   
7. **Watch Processing** (`/audits/[id]`)
   - See status: pending → processing → completed
   - Real-time polling every 5 seconds
   - View 4 score cards when completed
   - Access from any page (consistent sidebar)
   
8. **View Results**
   - Overview tab (scores, local business detection)
   - SEO tab (crawl data, recommendations)
   - Performance tab (Lighthouse metrics, Core Web Vitals)
   - Content tab (AI analysis, content quality)
   - Competition tab (if competitors exist)
   
9. **Download PDF**
   - Click "Download PDF" button
   - Professional audit report
   - Sections 4-9 being populated
   
10. **Settings** (`/settings/*`)
    - Profile: Update name, view email
    - Team: Manage workspace members
    - Billing: Subscription and invoices
    - Appearance: Light/Dark/System theme
    - Notifications: Email preferences

## Database Schema

### Supabase PostgreSQL (SaaS Features)

**`auth.users`** (Supabase managed)
- Standard Supabase auth table
- Email, password, OAuth providers
- Metadata: full_name

**`profiles`** (public schema)
- `id` (UUID) - References auth.users.id
- `full_name` (VARCHAR)
- `avatar_url` (VARCHAR, nullable)
- `created_at`, `updated_at` (TIMESTAMP)

**`workspaces`** (public schema)
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Workspace display name
- `slug` (VARCHAR, UNIQUE) - URL-friendly identifier
- `type` (VARCHAR) - 'personal' or 'team'
- `owner_id` (UUID) - References auth.users.id
- `created_at`, `updated_at` (TIMESTAMP)

**`workspace_members`** (public schema)
- `id` (UUID) - Primary key
- `workspace_id` (UUID) - References workspaces.id
- `user_id` (UUID) - References auth.users.id
- `role` (VARCHAR) - 'owner', 'admin', or 'member'
- `created_at` (TIMESTAMP)

**`invites`** (public schema)
- `id` (UUID) - Primary key
- `workspace_id` (UUID) - References workspaces.id
- `email` (VARCHAR) - Invited user email
- `role` (VARCHAR) - 'admin' or 'member'
- `invited_by` (UUID) - References auth.users.id
- `token` (VARCHAR, UNIQUE) - Invite token
- `status` (VARCHAR) - 'pending' or 'accepted'
- `created_at`, `expires_at` (TIMESTAMP)

**`subscriptions`** (public schema)
- `id` (UUID) - Primary key
- `workspace_id` (UUID) - References workspaces.id
- `plan` (VARCHAR) - 'free', 'pro', or 'enterprise'
- `status` (VARCHAR) - 'active', 'canceled', 'past_due'
- `stripe_customer_id`, `stripe_subscription_id` (VARCHAR, nullable)
- `audit_limit` (INTEGER) - Max audits per month
- `audits_used_this_month` (INTEGER)
- `current_period_start`, `current_period_end` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

**`invoices`** (public schema)
- `id` (UUID) - Primary key
- `workspace_id` (UUID) - References workspaces.id
- `stripe_invoice_id` (VARCHAR)
- `amount` (INTEGER) - Amount in cents
- `currency` (VARCHAR)
- `status` (VARCHAR) - 'paid', 'open', 'uncollectible'
- `invoice_pdf` (VARCHAR) - URL to Stripe PDF
- `created_at` (TIMESTAMP)

### VPS PostgreSQL (Audit Data)

**`audits`** table
- `id` (UUID) - Primary key
- `user_id` (UUID, nullable) - Legacy, for backwards compatibility
- `workspace_id` (UUID) - References Supabase workspaces.id
- `url` (VARCHAR) - Audited website URL
- `status` (VARCHAR) - 'pending', 'processing', 'completed', 'failed'
- `overall_score`, `seo_score`, `performance_score`, `content_score` (FLOAT, nullable)
- `is_local_business` (BOOLEAN)
- `results` (JSONB) - Full audit results (crawl, lighthouse, AI analysis)
- `pdf_url` (VARCHAR, nullable)
- `error_message` (TEXT, nullable)
- `created_at`, `started_at`, `completed_at` (TIMESTAMP)

**`competitors`** table
- `id` (UUID) - Primary key
- `audit_id` (UUID) - Foreign key to audits
- `url` (VARCHAR) - Competitor URL
- `status` (VARCHAR) - 'pending', 'completed', 'failed'
- `results` (JSONB) - Competitor audit results
- `created_at` (TIMESTAMP)

**See**: `.context7/infrastructure/DATABASE.md` for detailed schema and indexes

## Deployment

- **Hosting**: Hetzner VPS (IP: 77.42.79.46, 8GB RAM)
- **Access**: SSH as root@77.42.79.46
- **Location**: `/opt/sitespector`
- **Environment**: `/opt/sitespector/.env`
- **SSL**: Self-signed cert at `/opt/sitespector/ssl/`
- **Branch**: `release` (most up-to-date)

**Development Workflow**:
1. Code locally in Cursor
2. Commit (auto)
3. Push to `release` (ask first)
4. SSH to VPS: `ssh root@77.42.79.46`
5. Pull: `cd /opt/sitespector && git pull origin release`
6. Restart services: `docker compose -f docker-compose.prod.yml restart backend worker`
7. Frontend changes: Rebuild required (see DEPLOYMENT.md)

**See**: `.context7/project/DEPLOYMENT.md` for complete workflow

## Current Priorities (2026-02-04)

### ✅ COMPLETED: SaaS Transformation
- Supabase Auth integration
- Workspace & Team management
- Subscription & Billing UI
- Modern sidebar layout
- RLS policies fixed
- Documentation reorganization

### 🔴 Priority 1: Audit Detail Enhancement
**Location**: `frontend/app/(app)/audits/[id]/page.tsx`

Enhance existing audit detail rendering:
- Improve SEO tab data display
- Add visual charts for Performance metrics
- Enhance Content analysis presentation
- Add export/share functionality

**Impact**: HIGH - Better UX for viewing audit results

### 🟡 Priority 2: PDF Generator Completion
**Location**: `backend/templates/report.html`

Complete PDF sections 4-9:
- Section 4: SEO Technical Analysis
- Section 5: Performance Analysis
- Section 6: Content Analysis
- Section 7: Local SEO (conditional)
- Section 8: Competitive Analysis (conditional)
- Section 9: Action Plan

**Impact**: HIGH - Professional reports for clients

### 🟢 Priority 3: OAuth & Production Setup
- Activate Google/GitHub OAuth in Supabase
- Configure Let's Encrypt SSL for sitespector.app
- Switch Stripe to live mode
- Setup email notifications (Supabase Email)

**Impact**: MEDIUM - Production readiness

### 🔵 Priority 4: Additional Features
- Scheduled recurring audits
- Email notifications (audit completed)
- Audit history comparison
- Custom branding (white-label PDFs)
- API for third-party integrations

**See**: `.context7/frontend/MISSING_FEATURES.md` for detailed TODO list

## Access & Credentials

**Production URL**: https://77.42.79.46  
**Test User**: info@craftweb.pl (password: Dawid132?)  
**Test Audit**: 85d6ee6f-8c55-4c98-abd8-60dedfafa9df (https://meditrue.pl/)  
**SSH**: root@77.42.79.46  

**Environment variables**: See `/opt/sitespector/.env` on VPS

## Known Limitations

- **SSL**: Self-signed certificate (browser warning on first visit)
- **No staging**: Direct deployment to production VPS
- **No local Docker**: All containers run only on VPS
- **Worker**: Max 3 concurrent audits, 30min timeout per audit
- **Subscription tiers**: Defined in DB but not enforced (all users = free)
- **Audit limits**: No enforcement (users can create unlimited audits)

## Success Metrics (Intended)

- Audit completion rate: >95% (currently unknown)
- Average processing time: <2 minutes (currently 1-3min)
- User satisfaction: PDF reports rated useful (not measured yet)
- Local SEO detection accuracy: >80% (not validated)

## Future Roadmap (Not Prioritized)

- Subscription enforcement (free vs premium limits)
- Stripe payment integration
- Email notifications (audit completed)
- Scheduled recurring audits
- API for third-party integrations
- White-label PDF reports
- Team accounts & sharing

---

**Last Updated**: 2026-02-05
**Status**: Production SaaS Platform with Teams & Billing
**Next**: Audit detail enhancements, PDF completion, OAuth activation
**Maintainer**: Dawid (solo developer)
