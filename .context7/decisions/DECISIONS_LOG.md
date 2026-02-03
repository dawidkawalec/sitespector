# SiteSpector - Architectural Decisions Log

## Overview

This document tracks key architectural and technical decisions made during SiteSpector development.

---

## ADR-001: Use PostgreSQL with JSONB for Audit Results

**Date**: 2024-12-01

**Status**: ✅ Accepted

**Context**:
- Audit results have variable structure (some have local SEO, some don't)
- Need to store complex nested data (crawl, lighthouse, AI analysis)
- Options: Separate tables for each result type vs. JSONB column

**Decision**: Use single JSONB column (`audits.results`) to store all audit data

**Rationale**:
- Schema flexibility (audit structure can evolve without migrations)
- Single query to fetch all audit data (no 20+ joins)
- PostgreSQL JSONB is performant and indexable
- Simplifies worker code (just serialize dict to JSON)

**Consequences**:
- ✅ Faster development (no schema changes for new fields)
- ✅ Simpler queries (one SELECT vs many JOINs)
- ❌ Less type safety at database level (validated in Python)
- ❌ Harder to query specific JSONB fields (but can add indexes if needed)

**Related**: ADR-002

---

## ADR-002: Async Python with FastAPI

**Date**: 2024-12-01

**Status**: ✅ Accepted

**Context**:
- Audit processing is I/O-bound (HTTP requests, database, docker exec)
- Need to process multiple audits concurrently
- Options: Sync Django vs Async FastAPI vs Node.js

**Decision**: Use FastAPI with async/await throughout

**Rationale**:
- Non-blocking I/O → better resource utilization
- Process 3 audits concurrently on single VPS
- FastAPI has excellent async support (native)
- Python ecosystem for AI/ML tooling

**Consequences**:
- ✅ High concurrency with low memory usage
- ✅ FastAPI auto-generates OpenAPI docs
- ❌ Async learning curve for developers
- ❌ Must ensure all I/O operations are async

**Related**: ADR-003

---

## ADR-003: Worker as Polling Loop (Not Queue)

**Date**: 2024-12-05

**Status**: ✅ Accepted

**Context**:
- Need background processing for audits
- Options: Redis queue (Celery) vs Database polling vs Webhooks

**Decision**: Worker polls database every 10 seconds for PENDING audits

**Rationale**:
- Simple (no extra infrastructure like Redis)
- Reliable (PostgreSQL already deployed)
- Sufficient for MVP (<100 audits/day)
- Easy to debug (just SQL queries)

**Consequences**:
- ✅ Zero additional dependencies
- ✅ Simple deployment
- ❌ Not ideal for high throughput (100+ audits/second)
- ❌ 10-second delay before processing starts

**Future**: Migrate to Redis queue if scale requires

**Related**: ADR-004

---

## ADR-004: Docker Exec for External Tools

**Date**: 2024-12-05

**Status**: ✅ Accepted

**Context**:
- Need to run Screaming Frog and Lighthouse from worker
- Options: HTTP API, Docker exec, Binary in worker container

**Decision**: Run Screaming Frog and Lighthouse in separate containers, exec via Docker socket

**Rationale**:
- Isolation (crawlers can crash without affecting worker)
- Resource limits (can set memory/CPU per container)
- Easy to update tools (rebuild container only)
- Standard pattern for Docker Compose

**Consequences**:
- ✅ Clean separation of concerns
- ✅ Easy to swap tools (e.g., replace Screaming Frog)
- ❌ Worker needs Docker socket access (security risk)
- ❌ Slightly more complex setup

**Security note**: Worker has full Docker access (acceptable for solo project, review for production)

**Related**: ADR-005

---

## ADR-005: Next.js Standalone Build for Frontend

**Date**: 2024-12-10

**Status**: ✅ Accepted

**Context**:
- Need to deploy Next.js in Docker
- Options: Node.js server vs Standalone build vs Static export

**Decision**: Use Next.js standalone output (includes Node.js runtime)

**Rationale**:
- Optimized for Docker (minimal size)
- Includes Node.js server (no need for PM2/nginx internally)
- Server-side rendering works (vs static export)
- Official Next.js recommendation

**Consequences**:
- ✅ Smallest Docker image size
- ✅ Single executable (node server.js)
- ❌ Requires rebuild on code change (not hot reload)

**Related**: None

---

## ADR-006: Self-signed SSL for MVP

**Date**: 2024-12-15

**Status**: ✅ Accepted (temporary)

**Context**:
- Need HTTPS for production
- No domain registered yet
- Options: Let's Encrypt (needs domain), Self-signed, HTTP only

**Decision**: Use self-signed certificate for MVP, migrate to Let's Encrypt later

**Rationale**:
- Free and immediate
- Better than HTTP (encrypted traffic)
- Acceptable browser warning for internal testing
- Easy to replace when domain ready

**Consequences**:
- ✅ Encrypted communication
- ✅ Zero cost
- ❌ Browser warning on first visit
- ❌ Not suitable for production with real users

**Future**: Replace with Let's Encrypt certificate

**Related**: None

---

## ADR-007: Google Gemini over OpenAI GPT

**Date**: 2024-12-20

**Status**: ✅ Accepted

**Context**:
- Need AI for content analysis and recommendations
- Options: GPT-4, Claude, Gemini, Open-source models

**Decision**: Use Google Gemini (gemini-1.5-flash)

**Rationale**:
- Very cheap (~10x cheaper than GPT-4)
- Fast responses (~1-3s per call)
- Adequate quality for structured analysis
- 1M tokens/minute rate limit (sufficient)

**Consequences**:
- ✅ Low cost (~$0.10 per 1000 audits)
- ✅ Fast processing
- ❌ Not as smart as GPT-4 (but good enough)
- ❌ Google dependency (but acceptable)

**Alternative considered**: Claude (too expensive), GPT-4 (too expensive)

**Related**: None

---

## ADR-008: VPS-Only Development (No Local Docker)

**Date**: 2024-12-22

**Status**: ✅ Accepted

**Context**:
- Solo developer (Dawid)
- Local Docker has performance issues
- Need to test in production-like environment

**Decision**: All Docker runs on VPS only, code locally in Cursor, deploy via SSH

**Rationale**:
- Simpler (no local Docker setup)
- Faster (VPS has better specs)
- Production-like testing (what you deploy is what you test)
- Solo developer doesn't need separate dev environment

**Consequences**:
- ✅ No local Docker issues
- ✅ Always test in prod environment
- ❌ Deploy required to test changes
- ❌ Slower iteration (commit → push → SSH → restart)

**Workflow**: Code locally → commit → ask to push → SSH → git pull → restart

**Related**: ADR-009

---

## ADR-009: Git Auto-Commit Allowed, Auto-Push Forbidden

**Date**: 2025-01-05

**Status**: ✅ Accepted

**Context**:
- AI agent needs to commit changes
- User wants control over when code is pushed to remote

**Decision**: Agent can auto-commit, but MUST ask before pushing

**Rationale**:
- Auto-commit: Convenient for tracking changes
- Ask before push: User wants review before deployment
- Safety: Prevent accidental deployment

**Consequences**:
- ✅ Clear commit history
- ✅ User control over deployment
- ❌ Agent must always ask (extra step)

**Rule**: NEVER `git push` without explicit user permission

**Related**: ADR-008

---

## ADR-010: Context7 for Project Documentation

**Date**: 2025-02-01

**Status**: ✅ Accepted

**Context**:
- Need comprehensive project documentation
- AI agents need quick access to context
- Options: `/docs` folder vs `.context7` folder vs Wiki

**Decision**: Use `.context7/` folder with structured markdown files

**Rationale**:
- Version controlled (in Git)
- Easy to search (plain markdown)
- Organized by domain (project, backend, frontend, infrastructure, decisions)
- AI agents can read files directly

**Consequences**:
- ✅ Always up-to-date (commit with code)
- ✅ Structured and scannable
- ❌ Must remember to update docs

**Structure**:
```
.context7/
├── project/        # High-level overview
├── backend/        # Backend implementation
├── frontend/       # Frontend implementation
├── infrastructure/ # Docker, Nginx, Database
└── decisions/      # This file + bug tracking
```

**Related**: None

---

## ADR-011: TanStack Query over Redux

**Date**: 2024-12-12

**Status**: ✅ Accepted

**Context**:
- Need state management for frontend
- Options: Redux, Zustand, TanStack Query (React Query)

**Decision**: Use TanStack Query for server state, no global client state

**Rationale**:
- Most state is server state (audits, user)
- React Query handles caching, refetching, polling automatically
- No need for Redux boilerplate
- Optimistic updates built-in

**Consequences**:
- ✅ Less code (no reducers, actions)
- ✅ Automatic caching and background refetching
- ✅ Built-in loading and error states
- ❌ Learning curve (different mental model than Redux)

**Related**: None

---

## ADR-012: shadcn/ui over Material UI

**Date**: 2024-12-13

**Status**: ✅ Accepted

**Context**:
- Need UI component library
- Options: Material UI, Ant Design, shadcn/ui, Chakra UI

**Decision**: Use shadcn/ui (copy-paste components)

**Rationale**:
- Full control over code (not npm dependency)
- Built on Radix UI (accessible)
- Tailwind-based (consistent styling)
- Modern design

**Consequences**:
- ✅ Customizable (edit component code)
- ✅ No version conflicts
- ❌ Manual updates (copy new versions)
- ❌ More files in codebase

**Related**: None

---

## Future Decisions to Make

### FD-001: Subscription Enforcement

**Status**: ⏳ Pending

**Options**:
- Enforce free tier limits (5 audits/month)
- Keep unlimited for now
- Add Stripe integration

**Decision**: TBD

---

### FD-002: Database Backups

**Status**: ⏳ Pending

**Options**:
- Automated daily backups (cron + pg_dump)
- Manual backups only
- Use Hetzner backup service

**Decision**: TBD

---

### FD-003: Monitoring & Alerts

**Status**: ⏳ Pending

**Options**:
- Add Sentry for error tracking
- Add Prometheus + Grafana for metrics
- Keep logs only

**Decision**: TBD

---

**Last Updated**: 2025-02-03  
**Total Decisions**: 12 accepted, 3 pending  
**Review**: Update when making significant architectural changes
