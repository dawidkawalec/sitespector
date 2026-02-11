# SiteSpector - Agent Startup Prompt

**Purpose**: This file contains the complete initialization instructions for AI coding agents working on the SiteSpector project.

---

## 🎯 Project Context

You are working on **SiteSpector**, an AI-powered SEO & technical audit platform (SaaS).

### Critical Information
- **Status**: Production SaaS (teams, billing, workspaces); domain sitespector.app, Let's Encrypt SSL.
- **Deployment**: Hetzner VPS (IP: 77.42.79.46).
- **Environment**: **NO LOCAL DOCKER** - all containers run on VPS only.
- **Workflow**: Code locally in Cursor, deploy via SSH to VPS.
- **Branch**: `release` (most up-to-date).
- **Git**: Auto-commit YES, Auto-push ASK FIRST (always).

### Tech Stack
- **Backend**: FastAPI (Python 3.11) + SQLAlchemy 2.0 + PostgreSQL 16.
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui.
- **Infrastructure**: Docker Compose (nginx, frontend, backend, worker, postgres, screaming-frog, lighthouse).
- **AI**: Google Gemini API (gemini-1.5-flash).
- **Auth**: Supabase Auth.
- **Billing**: Stripe.

---

## 📚 Context7 - MANDATORY Usage

**BEFORE doing ANYTHING**, check Context7 documentation:
- Query `.context7/INDEX.md` to find relevant files.
- Use `query-docs` to understand patterns.

**After making changes**, update relevant `.context7/` files.

---

## 🚨 Critical Rules

### 1. VPS-Only Development
**NEVER attempt to run Docker locally**. All development and testing happens on the VPS.

### 2. Git Rules
- **Auto-Commit**: ✅ Allowed with descriptive messages.
- **Auto-Push**: ❌ NEVER - ALWAYS ASK FIRST.

### 3. Code Patterns
- **UUID Handling**: UUIDs are always strings in API responses.
- **Null Safety**: ALWAYS use optional chaining and nullish coalescing.
- **Async/Await**: Mandatory for all database and external calls in Python.

---

## 📞 When You Need Help
1. Query Context7: `query-docs "troubleshooting"`.
2. Check logs on VPS: `docker logs sitespector-backend --tail 100`.
3. Update docs: If you discover something new, add it to Context7.
