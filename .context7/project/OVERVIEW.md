# SiteSpector - Project Overview

## Project Identity

**Name**: SiteSpector  
**Type**: SEO & Technical Audit Platform (SaaS)  
**Market**: Polish market (B2B, agencies, website owners)  
**Stage**: MVP deployed, partial functionality  
**Status**: Active development - fixing critical gaps

## What SiteSpector Does

Automated website auditing platform that combines:
- **SEO Crawling** (Screaming Frog) - Technical SEO analysis
- **Performance Testing** (Lighthouse) - Core Web Vitals, page speed
- **AI Analysis** (Google Gemini) - Content quality, recommendations
- **PDF Reports** - Professional downloadable audit reports
- **Competitive Analysis** - Compare with up to 3 competitors

**Target Users**: Marketing agencies, SEO consultants, business owners who need professional website audits.

## Current State (As of 2025-02-01)

### ✅ What Works
- Backend API (FastAPI)
  - User authentication (JWT)
  - Audit CRUD operations
  - Authorization checks (ownership)
- Worker System
  - Background audit processing
  - Screaming Frog integration (Docker exec)
  - Lighthouse integration (desktop + mobile)
  - Gemini AI analysis (4 functions)
  - Score calculation (SEO, Performance, Content)
- Infrastructure
  - 7 Docker containers on Hetzner VPS
  - Nginx reverse proxy + SSL
  - PostgreSQL database
- Frontend (Partial)
  - Login/Register/Logout
  - Dashboard (audit list)
  - Create audit form (+ competitors)
  - Audit detail page structure
  - Status display (pending/processing/completed/failed)
  - Polling (every 5s during processing)
  - Basic score cards (4 numbers)

### ❌ What Doesn't Work / Missing
- **Frontend Detail Rendering** (CRITICAL)
  - `renderSeoResults()` - Function doesn't exist
  - `renderPerformanceResults()` - Function doesn't exist
  - `renderContentResults()` - Function doesn't exist
  - **Effect**: Users see only 4 scores, no detailed data (title, meta, H1, metrics, recommendations)
  
- **PDF Generator** (MEDIUM)
  - Sections 4-9 are EMPTY (only headers, no data)
  - **Effect**: Users download PDF with blank pages
  
- **Documentation** (HIGH - being fixed now)
  - `.cursor/rules/global.mdc` - Outdated (references Railway, nonexistent /docs/ folder)
  - No Context7 setup
  - No coding agent guidelines

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              77.42.79.46 (Hetzner VPS)                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐   HTTPS (443)                         │
│  │    Nginx     │ ─────────────────────────────────►    │
│  │ Reverse Proxy│                                        │
│  │   (80→443)   │                                        │
│  └──────┬───────┘                                        │
│         │                                                 │
│         ├─────► Frontend (Next.js :3000)                │
│         └─────► Backend (FastAPI :8000)                 │
│                     │                                     │
│                     ├──► Worker (Python async)          │
│                     │        │                           │
│                     │        ├──► Screaming Frog        │
│                     │        ├──► Lighthouse             │
│                     │        └──► Gemini API             │
│                     │                                     │
│                     └──► PostgreSQL (:5432)              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**See**: `.context7/project/ARCHITECTURE.md` for detailed container interaction

## Tech Stack Summary

- **Backend**: FastAPI (Python 3.11) + SQLAlchemy 2.0 + PostgreSQL 15
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Infrastructure**: Docker Compose + Nginx + Self-signed SSL
- **AI**: Google Gemini API (gemini-1.5-flash)
- **SEO Tools**: Screaming Frog (Docker), Lighthouse (Docker)
- **PDF**: WeasyPrint (HTML → PDF)

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
   - Email + password
   - JWT token stored in localStorage
   
2. **Dashboard** (`/dashboard`)
   - See list of all audits
   - Click "New Audit" → Dialog opens
   
3. **Create Audit**
   - Enter website URL
   - Optionally add 3 competitor URLs
   - Submit → Redirected to audit detail page
   
4. **Watch Processing** (`/audits/[id]`)
   - See status: pending → processing → completed
   - Real-time polling every 5s
   - View 4 score cards when completed
   
5. **View Results** (PARTIALLY IMPLEMENTED)
   - See overview (4 scores, local business detection)
   - ❌ SEO tab (EMPTY - missing renderSeoResults)
   - ❌ Performance tab (EMPTY - missing renderPerformanceResults)
   - ❌ Content tab (EMPTY - missing renderContentResults)
   - Competition tab (shows if competitors exist)
   
6. **Download PDF** (PARTIALLY IMPLEMENTED)
   - Click "Download PDF" button
   - Get PDF with cover + summary
   - ❌ Sections 4-9 empty

## Database Schema

### `users` table
- `id` (UUID) - Primary key
- `email` (VARCHAR, UNIQUE) - Login email
- `password_hash` (VARCHAR) - Hashed password
- `full_name` (VARCHAR, nullable)
- `is_active` (BOOLEAN) - Default true
- `subscription_tier` (VARCHAR) - 'free' or 'premium' (not enforced)
- `audits_count` (INTEGER) - Number of audits created
- `created_at`, `updated_at` (TIMESTAMP)

### `audits` table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `url` (VARCHAR) - Audited website URL
- `status` (VARCHAR) - 'pending', 'processing', 'completed', 'failed'
- `overall_score`, `seo_score`, `performance_score`, `content_score` (FLOAT, nullable)
- `is_local_business` (BOOLEAN)
- `results` (JSONB) - Full audit results (crawl, lighthouse, AI analysis)
- `pdf_url` (VARCHAR, nullable)
- `error_message` (TEXT, nullable)
- `created_at`, `started_at`, `completed_at` (TIMESTAMP)

### `competitors` table
- `id` (UUID) - Primary key
- `audit_id` (UUID) - Foreign key to audits
- `url` (VARCHAR) - Competitor URL
- `status` (VARCHAR) - 'pending', 'completed', 'failed'
- `results` (JSONB) - Competitor audit results
- `created_at` (TIMESTAMP)

**See**: `.context7/infrastructure/DATABASE.md` for detailed schema

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

## Current Priorities (2025-02-01)

### Priority 1: Documentation & Context7 ✅ (IN PROGRESS)
- Setup Context7 MCP
- Create all `.context7/*.md` files
- Document current state accurately
- Create startup prompt for agents

### Priority 2: Frontend Detail Rendering 🔴 CRITICAL
**Location**: `frontend/app/audits/[id]/page.tsx`

Implement 3 missing functions:
1. `renderSeoResults(results)` - Display crawl data, SEO recommendations
2. `renderPerformanceResults(results)` - Display Lighthouse metrics, Core Web Vitals
3. `renderContentResults(results)` - Display AI summary, content quality, local SEO

**Impact**: HIGH - Users currently can't see most audit data

### Priority 3: PDF Generator 🟡 HIGH
**Location**: `backend/templates/report.html`

Fill in sections 4-9:
- Section 4: SEO Technical Analysis (use `results.crawl`)
- Section 5: Performance Analysis (use `results.lighthouse`)
- Section 6: Content Analysis (use `results.content_analysis`)
- Section 7: Local SEO (conditional, use `results.local_seo`)
- Section 8: Competitive Analysis (conditional, use `results.competitive_analysis`)
- Section 9: Action Plan (aggregate recommendations)

**Impact**: MEDIUM - Users want comprehensive PDF reports

### Priority 4: Documentation Cleanup 🟢 LOW
- Update/remove outdated `.cursor/rules/global.mdc`
- Sync `main` branch with `release` or archive
- Add any missing inline code comments

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

**Last Updated**: 2025-02-01  
**Status**: MVP deployed, critical features missing  
**Next**: Complete frontend rendering, fill PDF generator  
**Maintainer**: Dawid (solo developer)
