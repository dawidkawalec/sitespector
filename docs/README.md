# SiteSpector Documentation

Welcome to SiteSpector's documentation. This directory contains essential guides and references.

## 📚 Documentation Structure

### Main Documentation (You are here: `/docs`)
- **[00-STARTUP-PROMPT.md](00-STARTUP-PROMPT.md)** - Quick context for new AI agent sessions
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete VPS deployment procedures
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - End-to-end testing procedures
- **[SAAS_TRANSFORMATION_SUMMARY.md](SAAS_TRANSFORMATION_SUMMARY.md)** - Historical: POC → Professional SaaS

### Technical Documentation (`.context7/` directory)

**Always check Context7 files BEFORE implementing features!**

Located in: `/.context7/`

#### Project Overview (`project/`)
- `OVERVIEW.md` - Project summary, current status, features
- `ARCHITECTURE.md` - System architecture, containers, data flow
- `STACK.md` - Tech stack details, versions, rationale
- `DEPLOYMENT.md` - Deployment workflows, VPS setup

#### Backend (`backend/`)
- `API.md` - All API endpoints, request/response schemas
- `MODELS.md` - SQLAlchemy models, database schema
- `WORKER.md` - Worker process, audit flow, integrations
- `AI_SERVICES.md` - Gemini integration, AI functions

#### Frontend (`frontend/`)
- `COMPONENTS.md` - React components, UI patterns
- `API_CLIENT.md` - API client functions, types
- `PAGES.md` - Next.js pages, routing, route groups
- `MISSING_FEATURES.md` - TODO list, known gaps

#### Infrastructure (`infrastructure/`)
- `DOCKER.md` - Docker Compose services, configurations
- `NGINX.md` - Nginx reverse proxy setup
- `DATABASE.md` - PostgreSQL schemas (Supabase + VPS)

#### Decisions (`decisions/`)
- `DECISIONS_LOG.md` - Architectural Decision Records (ADRs)
- `BUGS_AND_FIXES.md` - Known issues, solutions

## 🚀 Quick Start

### For New AI Agents
1. Read: [00-STARTUP-PROMPT.md](00-STARTUP-PROMPT.md)
2. Query Context7 for specific topics
3. Check cursor rules: `/.cursor/rules/global.mdc`

### For Deployment
1. Read: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Check: `.context7/project/DEPLOYMENT.md`
3. Verify: Environment variables on VPS

### For Development
1. **Before implementing**: Query `.context7/` for patterns
2. **While coding**: Follow patterns in Context7 docs
3. **After completing**: Update relevant `.context7/` files

## 📖 Other Documentation Locations

- **Supabase Setup**: `/supabase/README.md` - Database schema, RLS policies
- **Cursor Rules**: `/.cursor/rules/global.mdc` - Development guidelines
- **User Preferences**: `/.cursor/rules/user-preferences.md` - Dawid's preferences
- **Root README**: `/README.md` - Project overview for GitHub

## 🔄 Keeping Documentation Updated

**Golden Rule**: 
- **BEFORE** any task → Query Context7
- **AFTER** any task → Update Context7

Context7 is the single source of truth. Keep it updated!

---

**Last Updated**: 2026-02-09
**Maintainer**: Dawid
