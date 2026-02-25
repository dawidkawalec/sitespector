# SiteSpector - System Architecture

## High-Level Architecture
SiteSpector is a containerized microservices application running on a single VPS.

```mermaid
graph TD
    User((User)) --> Nginx[Nginx Reverse Proxy]
    Nginx --> Frontend[Next.js Frontend]
    Nginx --> Backend[FastAPI Backend]
    Frontend --> SupabaseAuth[Supabase Auth]
    Backend --> SupabaseDB[(Supabase DB - Users/Teams)]
    Backend --> VPS_DB[(VPS PostgreSQL - Audits)]
    Backend --> Qdrant[(Qdrant - RAG Vectors)]
    Backend --> Worker[Python Worker]
    Worker --> ScreamingFrog[Screaming Frog Container]
    Worker --> Lighthouse[Lighthouse Container]
    Worker --> GeminiAPI[Google Gemini API]
```

## Dual Database Strategy
- **Supabase PostgreSQL**: Stores user profiles, workspaces, team memberships, and subscriptions. Protected by Row Level Security (RLS).
- **VPS PostgreSQL**: Stores high-volume audit results and competitor data in JSONB format for fast worker access.

## Container Services
1. **nginx**: Handles SSL termination (Let's Encrypt) and routing.
2. **frontend**: Next.js 14 standalone build.
3. **landing**: Next.js marketing site (mem_limit: 512m).
4. **backend**: FastAPI REST API.
5. **worker**: Background processor for audits.
6. **postgres**: Local audit database.
7. **qdrant**: Vector store for audit-scoped RAG chat.
8. **screaming-frog**: Headless SEO crawler.
9. **lighthouse**: Performance auditing engine.
10. **dozzle**: Docker log viewer (SSH tunnel only, not publicly exposed).

---
## Frontend Layout Notes (App UX)

The authenticated app has a persistent right-side ChatPanel (desktop) which reduces the available width of the main content area.

**Important UI decision**:
- The scrollable content area (`frontend/app/(app)/layout.tsx` → `<main>`) is marked as a CSS container (`@container`)
- App pages use Tailwind container-query utilities (`@md:`, `@lg:`, `@xl:`) so the layout adapts to the *content container width*, not just the viewport width

This avoids "squished" grids/cards when the chat is open by default.

---
**Last Updated**: 2026-02-25
