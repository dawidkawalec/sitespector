# SiteSpector - Complete Documentation Framework

**Generated**: 2025-02-01  
**For**: Dawid (solo developer)  
**Project**: SiteSpector SEO Audit Platform

---

## 📦 Package Contents

This package contains the complete documentation framework for the SiteSpector project, customized for your VPS-only workflow, Claude Sonnet 4.5 usage, and Context7 MCP integration.

### Files Included

```
sitespector-docs/
├── .cursorrules                           # Main project rules (place in project root)
│
├── .cursor/
│   └── rules/
│       └── user-preferences.md            # Your personal preferences
│
├── .context7/                             # Context7 MCP documentation
│   ├── project/
│   │   ├── OVERVIEW.md                    # ✅ Complete project overview
│   │   └── ARCHITECTURE.md                # ✅ System architecture (7 containers, flow)
│   │
│   └── frontend/
│       └── MISSING_FEATURES.md            # ✅ Critical TODO list
│
└── docs/
    ├── 00-STARTUP-PROMPT.md               # ✅ Agent initialization instructions
    ├── CONTEXT7_SETUP.md                  # ✅ Context7 MCP installation guide
    └── README.md                          # This file
```

---

## 🚀 Quick Start - Installation Guide

### Step 1: Copy Files to Your Project

```bash
# Navigate to your SiteSpector project
cd /Users/dawid/Desktop/projekty\ nowe/sitespector

# Copy .cursorrules to project root
cp /path/to/sitespector-docs/.cursorrules .

# Copy user preferences
mkdir -p .cursor/rules
cp /path/to/sitespector-docs/.cursor/rules/user-preferences.md .cursor/rules/

# Copy Context7 documentation
cp -r /path/to/sitespector-docs/.context7 .

# Copy startup docs
mkdir -p docs
cp /path/to/sitespector-docs/docs/* docs/
```

### Step 2: Setup Context7 MCP

**Follow**: `docs/CONTEXT7_SETUP.md` for complete installation instructions.

**Quick version**:
```bash
# 1. Install Context7 MCP server
npm install -g @context7/mcp-server

# 2. Configure Cursor
# Edit ~/.cursor/mcp.json (global) or .cursor/mcp.json (project):
{
  "mcpServers": {
    "context7": {
      "command": "context7",
      "args": ["server"],
      "env": {
        "CONTEXT7_ROOT": "${workspaceFolder}/.context7"
      }
    }
  }
}

# 3. Restart Cursor

# 4. Verify: Query docs in Cursor chat
"query-docs project overview"
```

### Step 3: Commit Documentation to Git

```bash
# Add to Git (Context7 docs should be versioned)
git add .cursorrules .cursor/ .context7/ docs/
git commit -m "docs: add complete documentation framework with Context7"

# Push (you'll need to confirm this as per your workflow)
git push origin release
```

### Step 4: Initialize AI Agent

When starting a new Cursor session:

1. Open `docs/00-STARTUP-PROMPT.md`
2. Copy **entire file** contents
3. Paste into Cursor chat with Claude Sonnet 4.5
4. Claude now has full project context

---

## 📚 Documentation Structure Explained

### `.cursorrules` - Project Rules
**Purpose**: Main project-specific rules that Cursor reads automatically.

**Contains**:
- VPS-only workflow (NO local Docker)
- Git rules (auto-commit YES, auto-push ASK)
- Tech stack specifics (FastAPI, Next.js, PostgreSQL)
- Context7 usage guidelines
- Current priorities (frontend rendering, PDF generator)

**When to update**: After architectural changes, new patterns, or workflow adjustments.

---

### `.cursor/rules/user-preferences.md` - Personal Preferences
**Purpose**: Your personal coding style and workflow preferences.

**Contains**:
- macOS + Cursor IDE setup
- AI model strategy (Claude Sonnet 4.5 primary, Gemini 3 Pro secondary)
- Communication style (English, moderate comments)
- Git workflow (auto-commit, never auto-push)
- VPS deployment workflow

**When to update**: When your preferences change (rarely).

---

### `.context7/` - Context7 MCP Documentation
**Purpose**: Single source of truth for all project knowledge.

**Structure**:
```
.context7/
├── project/           # High-level project info
│   ├── OVERVIEW.md    # What SiteSpector does, current state, priorities
│   └── ARCHITECTURE.md # 7 Docker containers, network flow, data flow
│
├── backend/           # Backend implementation (to be added)
│   ├── API.md         # All endpoints, request/response schemas
│   ├── MODELS.md      # Database models, schema
│   ├── WORKER.md      # Audit processing flow
│   └── AI_SERVICES.md # Gemini integration
│
├── frontend/          # Frontend implementation
│   ├── COMPONENTS.md  # React components (to be added)
│   ├── API_CLIENT.md  # API client types (to be added)
│   ├── PAGES.md       # Next.js pages (to be added)
│   └── MISSING_FEATURES.md # ✅ TODO list (3 critical rendering functions)
│
├── infrastructure/    # DevOps & infrastructure (to be added)
│   ├── DOCKER.md      # Docker Compose services
│   ├── NGINX.md       # Reverse proxy config
│   └── DATABASE.md    # PostgreSQL schema, migrations
│
└── decisions/         # Decision log (to be added)
    ├── DECISIONS_LOG.md    # Why we made certain choices
    └── BUGS_AND_FIXES.md   # Known issues, solutions
```

**How to use**:
```bash
# Before implementing:
query-docs "worker process flow"
query-docs "API endpoint pattern"
query-docs "missing frontend features"

# After implementing:
update-docs "frontend/MISSING_FEATURES.md" "Completed: renderSeoResults function"
update-docs "decisions/DECISIONS_LOG.md" "Decision: Use shadcn/ui Card for consistency"
```

**When to update**: **After every feature implementation** - keep docs in sync with code.

---

### `docs/00-STARTUP-PROMPT.md` - Agent Initialization
**Purpose**: Complete context for AI agents starting work on the project.

**Contains**:
- Project overview (what SiteSpector does)
- Critical rules (VPS workflow, Git rules, no local Docker)
- Current priorities (frontend rendering, PDF generator)
- Testing instructions (test audit ID, credentials)
- Common commands (Docker logs, database access)

**How to use**:
1. Copy entire file
2. Paste into Cursor chat (new session)
3. Agent is fully initialized with project context

**When to update**: When priorities change or major features are completed.

---

### `docs/CONTEXT7_SETUP.md` - Installation Guide
**Purpose**: Step-by-step Context7 MCP installation.

**Use once** during initial setup, then reference if troubleshooting.

---

## 🎯 Current Project State & Priorities

### ✅ What Works
- Backend API (auth, audits CRUD)
- Worker (background processing, Screaming Frog, Lighthouse, Gemini AI)
- Infrastructure (7 Docker containers on VPS)
- Frontend structure (login, dashboard, audit list, audit detail page)
- Basic score display (4 numbers: overall, SEO, performance, content)

### ❌ What's Broken / Missing

#### ✅ COMPLETED - Priority 1: Frontend Detail Rendering
**File**: `frontend/app/audits/[id]/page.tsx`

**Status**: ✅ **Implemented** (2025-02-03)

**Features**:
- `renderSeoResults(results)` - Implemented
- `renderPerformanceResults(results)` - Implemented
- `renderContentResults(results)` - Implemented

**Impact**: Users can now see all detailed audit data.

**Guide**: See `.context7/frontend/MISSING_FEATURES.md`.

#### 🟡 MEDIUM - Priority 2: PDF Generator
**File**: `backend/templates/report.html`

**Problem**: Sections 4-9 are empty (only headers, no data)

**Impact**: Users download PDF with blank pages.

---

## 🛠️ Workflow: How to Use This Documentation

### Daily Development Workflow

1. **Start Cursor**, open SiteSpector project

2. **Initialize agent** (new session):
   - Copy `docs/00-STARTUP-PROMPT.md` contents
   - Paste into Cursor chat
   - Agent has full context

3. **Query Context7** before implementing:
   ```bash
   "query-docs missing frontend features"
   "query-docs API endpoints"
   "query-docs worker process"
   ```

4. **Implement feature** locally in Cursor

5. **Commit** (auto):
   ```bash
   git commit -m "feat(frontend): implement renderSeoResults function"
   ```

6. **Push** (ask user first):
   ```bash
   # Agent asks: "Ready to push to origin/release?"
   # You confirm
   git push origin release
   ```

7. **Deploy to VPS**:
   ```bash
   ssh root@77.42.79.46
   cd /opt/sitespector
   git pull origin release
   
   # Backend/Worker:
   docker compose -f docker-compose.prod.yml restart backend worker
   
   # Frontend (requires rebuild):
   docker compose -f docker-compose.prod.yml build --no-cache frontend
   docker compose -f docker-compose.prod.yml up -d frontend
   ```

8. **Test**: https://77.42.79.46/audits/85d6ee6f-8c55-4c98-abd8-60dedfafa9df

9. **Update Context7**:
   ```bash
   update-docs "frontend/MISSING_FEATURES.md" "✅ Completed: renderSeoResults"
   update-docs "decisions/DECISIONS_LOG.md" "Used shadcn/ui Card for consistency"
   ```

10. **Commit updated docs**:
    ```bash
    git add .context7/
    git commit -m "docs: update Context7 after implementing renderSeoResults"
    git push origin release
    ```

---

## 🧪 Testing

### Test Credentials
**URL**: https://77.42.79.46  
**Email**: info@craftweb.pl  
**Password**: Dawid132?

### Test Audit (Use for Verification)
**Audit ID**: `85d6ee6f-8c55-4c98-abd8-60dedfafa9df`  
**URL**: https://meditrue.pl/  
**Status**: COMPLETED (has full results in database)  
**Link**: https://77.42.79.46/audits/85d6ee6f-8c55-4c98-abd8-60dedfafa9df

**Expected after frontend fix**:
- SEO tab: title, meta, H1 tags, images, links, technical SEO
- Performance tab: Core Web Vitals, desktop/mobile scores, metrics, diagnostics
- Content tab: AI summary, quality score, recommendations, local SEO

---

## 🔧 Troubleshooting

### Context7 Not Working

**Problem**: `query-docs` doesn't work in Cursor

**Solution**:
1. Check `~/.cursor/mcp.json` exists and is valid JSON
2. Restart Cursor completely
3. Check Cursor Settings → MCP Servers → context7 → View Logs
4. Verify Context7 installed: `which context7` in terminal

### Frontend Changes Not Reflecting

**Problem**: Code changes don't appear after deploy

**Solution**:
```bash
# Frontend requires REBUILD (not just restart)
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Verify
docker logs sitespector-frontend --tail 50
```

### Database Connection Issues

**Problem**: Backend can't connect to PostgreSQL

**Solution**:
```bash
# Check postgres container running
docker ps | grep postgres

# Check connection string
docker exec sitespector-backend printenv | grep DATABASE

# Test connection
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db
```

---

## 📝 Maintenance

### Weekly Tasks
- [ ] Review `MISSING_FEATURES.md`, mark completed items
- [ ] Update `DECISIONS_LOG.md` with new architectural decisions
- [ ] Check `BUGS_AND_FIXES.md`, add newly discovered issues

### After Major Features
- [ ] Update `OVERVIEW.md` (current state, priorities)
- [ ] Update `ARCHITECTURE.md` (if system design changed)
- [ ] Update relevant tech docs (API.md, MODELS.md, etc.)

### Git Commits for Docs
```bash
git add .context7/
git commit -m "docs(context7): update after implementing feature X"
git push origin release
```

---

## 🎓 Learning Resources

### Context7 MCP
- Docs: `docs/CONTEXT7_SETUP.md`
- Usage: Query before implementing, update after changes
- Philosophy: Single source of truth

### SiteSpector Architecture
- Overview: `.context7/project/OVERVIEW.md`
- Containers: `.context7/project/ARCHITECTURE.md`
- Current gaps: `.context7/frontend/MISSING_FEATURES.md`

### VPS Workflow
- Deployment: `.context7/project/DEPLOYMENT.md` (to be created)
- SSH access: `root@77.42.79.46`
- Docker commands: See `.cursorrules` or startup prompt

---

## ✅ Next Steps

1. **Setup Context7** (if not done):
   - Follow `docs/CONTEXT7_SETUP.md`
   - Install MCP server
   - Configure Cursor
   - Restart Cursor

2. **Implement Priority 2** (PDF Generator):
   - Fill sections 4-9 in `backend/templates/report.html`
   - Test PDF generation
   - Deploy to VPS
   - Update Context7 docs

3. **Ongoing**:
   - Keep Context7 docs updated
   - Commit docs changes regularly
   - Query docs before implementing new features

---

## 💬 Support

**Maintainer**: Dawid (solo developer)  
**AI Assistant**: Claude Sonnet 4.5 (primary), Gemini 3 Pro (occasional)  
**Project Status**: MVP deployed, active development  

For questions about this documentation framework, refer to:
- `.cursorrules` - Project rules
- `docs/00-STARTUP-PROMPT.md` - Agent initialization
- `.context7/project/OVERVIEW.md` - Project overview

---

**Last Updated**: 2025-02-01  
**Documentation Version**: 1.0  
**Framework Generated**: Custom for SiteSpector (VPS workflow, Context7, Claude Sonnet 4.5)

---

## 🔄 IMPORTANT: Context7 Update Workflow

**NEW FILE ADDED**: `docs/CONTEXT7_UPDATE_WORKFLOW.md`

This file contains **detailed, step-by-step instructions** on:
- **WHEN** to update Context7 (after features, bug fixes, decisions, schema changes)
- **HOW** to write updates (with good/bad examples)
- **WHICH FILES** to update (quick reference)
- **COMPLETE WORKFLOW** (10-step process from implementation to deployment)

**Critical rule**: Every feature implementation MUST update Context7 docs.

### Quick Example:
```bash
# 1. Implement feature
# 2. Commit code
git commit -m "feat(frontend): implement renderSeoResults"

# 3. Update Context7 (MANDATORY - don't skip!)
update-docs ".context7/frontend/MISSING_FEATURES.md" "✅ Completed: renderSeoResults"
update-docs ".context7/frontend/COMPONENTS.md" "Added renderSeoResults helper function"

# 4. Commit Context7 updates
git commit -m "docs(context7): update after renderSeoResults implementation"

# 5. Ask to push
# 6. Deploy to VPS
```

**Read this file**: It's essential for maintaining Context7 as single source of truth.

