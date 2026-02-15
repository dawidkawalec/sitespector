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
3. **backend**: FastAPI REST API.
4. **worker**: Background processor for audits.
5. **postgres**: Local audit database.
6. **qdrant**: Vector store for audit-scoped RAG chat.
7. **screaming-frog**: Headless SEO crawler.
8. **lighthouse**: Performance auditing engine.

---
**Last Updated**: 2026-02-15
