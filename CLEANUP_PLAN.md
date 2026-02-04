# Documentation Cleanup & Reorganization Plan

## Current State Analysis

### Root Level - Files to DELETE (temporary/outdated):
- ✅ `ULTIMATE_FIX_GUIDE.md` - temporary RLS fix guide
- ✅ `COMPLETE_FIX_GUIDE.md` - temporary RLS fix guide
- ✅ `RLS_INFINITE_RECURSION_FIX.md` - temporary RLS fix guide
- ✅ `WORKSPACE_FIX_VERIFICATION.md` - temporary verification
- ✅ `SUPABASE_VERIFICATION_REPORT.md` - temporary verification
- ✅ `INSTRUKCJA_INSTALACJI_PL.md` - old Polish installation (merge into docs/)
- ✅ `INSTALLATION_CHECKLIST.md` - old installation checklist (merge into docs/)

### Root Level - Files to KEEP:
- ✅ `README.md` - main project README

### docs/ - Files Status:
- ✅ `00-STARTUP-PROMPT.md` - KEEP (useful for new sessions)
- ✅ `CONTEXT7_SETUP.md` - DELETE (outdated, context7 already setup)
- ✅ `CONTEXT7_UPDATE_WORKFLOW.md` - MERGE into cursor rules
- ✅ `DEPLOYMENT_GUIDE.md` - KEEP & UPDATE (add new SaaS deployment steps)
- ✅ `KAWASAAS_COMPONENTS.md` - DELETE (already integrated)
- ✅ `PHASE0_SETUP_CHECKLIST.md` - DELETE (phase 0 completed)
- ✅ `README.md` - UPDATE (docs index)
- ✅ `SAAS_TRANSFORMATION_SUMMARY.md` - KEEP (historical record)
- ✅ `TESTING_CHECKLIST.md` - KEEP & UPDATE

### supabase/ - Files Status:
- ✅ `README.md` - KEEP (Supabase setup guide)
- Note: All SQL files are needed

### .context7/ - Current Structure:
```
.context7/
├── backend/         ✅ GOOD
├── decisions/       ✅ GOOD
├── frontend/        ✅ GOOD
├── infrastructure/  ✅ GOOD
└── project/         ✅ GOOD
```

## Actions to Take

### 1. Delete Temporary Files (7 files)
```bash
rm ULTIMATE_FIX_GUIDE.md
rm COMPLETE_FIX_GUIDE.md
rm RLS_INFINITE_RECURSION_FIX.md
rm WORKSPACE_FIX_VERIFICATION.md
rm SUPABASE_VERIFICATION_REPORT.md
rm INSTRUKCJA_INSTALACJI_PL.md
rm INSTALLATION_CHECKLIST.md
```

### 2. Delete Outdated docs/ Files (3 files)
```bash
rm docs/CONTEXT7_SETUP.md
rm docs/CONTEXT7_UPDATE_WORKFLOW.md
rm docs/KAWASAAS_COMPONENTS.md
rm docs/PHASE0_SETUP_CHECKLIST.md
```

### 3. Update .context7/ Files

#### Update: `.context7/project/OVERVIEW.md`
- Change status from "MVP deployed" to "Professional SaaS Platform"
- Update features: add Supabase, Teams, Billing, Workspaces
- Remove "MISSING" items that are now done

#### Update: `.context7/project/ARCHITECTURE.md`
- Add Supabase layer (Auth, RLS, User/Team management)
- Update flow diagrams to include workspace context
- Document dual-database strategy

#### Update: `.context7/project/STACK.md`
- Add Supabase to stack
- Update auth: "JWT (legacy)" → "Supabase Auth"
- Add new dependencies

#### Update: `.context7/backend/API.md`
- Document workspace_id parameter in audit endpoints
- Add workspace verification logic
- Update auth from JWT to Supabase

#### Update: `.context7/frontend/COMPONENTS.md`
- Add WorkspaceContext, WorkspaceSwitcher
- Add Sidebar, MobileSidebar
- Add new shadcn/ui components

#### Update: `.context7/frontend/PAGES.md`
- Update route structure: add (app) route group
- Document new pages: /pricing, /settings/*

#### Update: `.context7/frontend/MISSING_FEATURES.md`
- Remove completed items
- Add new TODO items if any

#### Update: `.context7/decisions/DECISIONS_LOG.md`
- Add: "Decision to use Supabase for SaaS features"
- Add: "Decision to use dual-database strategy"
- Add: "Decision to use route groups for layout consistency"
- Add: "Decision to fix RLS with simple policies"

#### Update: `.context7/decisions/BUGS_AND_FIXES.md`
- Add: RLS infinite recursion bug and fix
- Add: Workspace context null issue and fix

### 4. Rewrite Cursor Rules

#### New `global.mdc` Structure (MAX 300 lines):
```markdown
# CRITICAL: Context7 Workflow (READ THIS FIRST!)

**BEFORE starting ANY task:**
1. Query `.context7/` to understand current state
2. Check relevant files for implementation patterns
3. Verify no duplicate work

**AFTER completing ANY task:**
1. Update relevant `.context7/` files
2. Add decisions to DECISIONS_LOG.md
3. Document bugs/fixes in BUGS_AND_FIXES.md

---

## Project: SiteSpector - Professional SaaS Platform

**Stack**: Next.js 14, FastAPI, Supabase, PostgreSQL, Docker
**Status**: Production-ready SaaS with Teams, Billing, Workspaces

---

## Core Rules

1. **Architecture**
   - Dual-database: Supabase (users/teams) + VPS PostgreSQL (audits)
   - Next.js 14 App Router with route groups
   - Workspace-based multi-tenancy

2. **Development Workflow**
   - Edit locally in Cursor
   - Auto-commit ALLOWED ✅
   - Auto-push FORBIDDEN ❌ (always ask first)
   - Deploy to VPS via SSH

3. **Code Patterns**
   - TypeScript strict mode
   - React Query for data fetching
   - Supabase RLS for access control
   - shadcn/ui components

4. **Deployment**
   - VPS: 77.42.79.46 (Hetzner)
   - Docker Compose (7 containers)
   - Frontend rebuild required for changes

---

## Quick Commands

```bash
# Deploy to VPS
ssh root@77.42.79.46
cd /opt/sitespector
git pull origin release
docker compose -f docker-compose.prod.yml restart backend worker
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

---

## Context7 Files Index

- `project/` - Overview, architecture, stack, deployment
- `backend/` - API, models, worker, AI services
- `frontend/` - Components, pages, API client
- `infrastructure/` - Docker, nginx, database
- `decisions/` - Decision log, bugs & fixes

**Always check these BEFORE implementing!**
```

#### Keep `user-preferences.md` as-is (it's good)

### 5. Update docs/README.md (Documentation Index)

Create clear navigation:
```markdown
# SiteSpector Documentation

## Getting Started
- [00-STARTUP-PROMPT.md](00-STARTUP-PROMPT.md) - Quick context for new sessions

## Deployment & Operations
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - VPS deployment steps
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Testing procedures

## Historical
- [SAAS_TRANSFORMATION_SUMMARY.md](SAAS_TRANSFORMATION_SUMMARY.md) - POC → SaaS transformation

## Technical Details
See `.context7/` directory for detailed technical documentation.
```

## Summary of Changes

- **DELETE**: 11 files (temporary/outdated docs)
- **UPDATE**: 10+ .context7 files (current state)
- **REWRITE**: global.mdc (728 → ~150 lines)
- **KEEP**: user-preferences.md

## Result

Clean, organized documentation structure:
- Root: Only README.md
- docs/: Essential guides only (3-4 files)
- .context7/: Complete technical docs (up-to-date)
- .cursor/rules/: Clear, concise rules with Context7 workflow on top
