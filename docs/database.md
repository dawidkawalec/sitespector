# SiteSpector - Database Schema & Management

## Overview

SiteSpector uses **dual database**: **VPS PostgreSQL** (this file) for audits/schedules and **Supabase PostgreSQL** for users, workspaces, **projects**, project_members, subscriptions. Projects (one per website within a workspace) live in Supabase; `audits.project_id` and `audit_schedules.project_id` on VPS reference them by UUID (no FK). See `supabase/schema.sql` for `projects` and `project_members` tables and RLS.

VPS uses **PostgreSQL 15** with async operations via **asyncpg** driver.

**Container**: `sitespector-postgres`  
**Image**: `postgres:16-alpine`  
**Port**: 5432 (internal only)

---

## Database Connection

**URL**: `postgresql+asyncpg://sitespector_user:sitespector_password@postgres:5432/sitespector_db`

**Connection pooling**:
- Pool size: 10
- Max overflow: 20
- Pool pre-ping: Yes (health check)
- Pool recycle: 3600s (1 hour)

---

## Tables

### 1. users

**Purpose**: User accounts and authentication

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    audits_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Columns**:
- `id` - UUID primary key
- `email` - Unique, indexed
- `password_hash` - bcrypt hash (cost factor: 12)
- `subscription_tier` - Enum: 'free', 'pro', 'enterprise'
- `stripe_customer_id` - For future payment integration
- `audits_count` - Cached count of user's audits
- `created_at`, `updated_at` - Auto-managed timestamps

---

### 2. audits

**Purpose**: Website audit records

```sql
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    overall_score FLOAT,
    seo_score FLOAT,
    performance_score FLOAT,
    content_score FLOAT,
    is_local_business BOOLEAN NOT NULL DEFAULT FALSE,
    results JSONB,
    pdf_url VARCHAR(2048),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at);
```

**Columns**:
- `id` - UUID primary key
- `user_id` - Foreign key to users (cascade delete)
- `url` - Audited website URL
- `status` - Enum: 'pending', 'processing', 'completed', 'failed'
- `overall_score`, `seo_score`, `performance_score`, `content_score` - 0-100 or NULL
- `is_local_business` - Detected by AI
- `results` - JSONB (full audit data)
- `pdf_url` - Generated PDF location
- `error_message` - If failed, reason
- `created_at` - When audit was created
- `started_at` - When worker started processing
- `completed_at` - When worker finished

---

### 3. competitors

**Purpose**: Competitor URLs for competitive analysis

```sql
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competitors_audit_id ON competitors(audit_id);
```

**Columns**:
- `id` - UUID primary key
- `audit_id` - Foreign key to audits (cascade delete)
- `url` - Competitor URL
- `status` - Enum: 'pending', 'completed', 'failed'
- `results` - JSONB (Lighthouse data only)
- `created_at` - When competitor was added

---

### 4. public_submissions (Contact & Newsletter)

**Purpose**: Store contact form submissions and newsletter subscriptions

```sql
CREATE TABLE public_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'contact' or 'newsletter'
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_type ON public_submissions(type);
CREATE INDEX idx_submissions_email ON public_submissions(email);
```

---

## Relationships

```
users (1) ───→ (N) audits
                    ↓
                    └──→ (N) competitors
```

**Cascade delete**:
- Delete user → Delete all audits → Delete all competitors
- Delete audit → Delete all competitors

---

## JSONB Structure

### audits.results

```json
{
  "crawl": {
    "title": "string",
    "title_length": 0,
    "meta_description": "string",
    "meta_description_length": 0,
    "h1_tags": ["string"],
    "h1_count": 0,
    "status_code": 200,
    "word_count": 0,
    "size_bytes": 0,
    "load_time": 0.0,
    "total_images": 0,
    "images_without_alt": 0,
    "internal_links_count": 0,
    "has_sitemap": true
  },
  "lighthouse": {
    "desktop": {
      "url": "string",
      "device": "desktop",
      "performance_score": 85,
      "accessibility_score": 92,
      "best_practices_score": 88,
      "seo_score": 95,
      "ttfb": 450,
      "fcp": 1200,
      "lcp": 2100,
      "cls": 0.05,
      "total_blocking_time": 150,
      "speed_index": 1800,
      "status_code": 200
    },
    "mobile": { /* same structure */ }
  },
  "content_analysis": {
    "quality_score": 85,
    "readability_score": 75,
    "recommendations": ["string"],
    "word_count": 850,
    "has_title": true,
    "has_meta_description": true,
    "has_h1": true
  },
  "local_seo": {
    "is_local_business": true,
    "has_nap": false,
    "has_schema_markup": false,
    "recommendations": ["string"]
  },
  "performance_analysis": {
    "issues": ["string"],
    "recommendations": ["string"],
    "ttfb_desktop": 450,
    "lcp_desktop": 2100,
    "performance_score": 85,
    "impact": "low"
  },
  "competitive_analysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "recommendations": ["string"],
    "competitors_analyzed": 3
  }
}
```

### competitors.results

```json
{
  "lighthouse": {
    "url": "string",
    "device": "desktop",
    "performance_score": 75,
    "accessibility_score": 90,
    "best_practices_score": 85,
    "seo_score": 92
  }
}
```

---

## Common Queries

### Get recent audits

```sql
SELECT id, url, status, overall_score, created_at
FROM audits
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY created_at DESC
LIMIT 20;
```

### Get pending audits (worker)

```sql
SELECT id, url, user_id
FROM audits
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 3;
```

### Get audit with competitors

```sql
SELECT a.*, 
       json_agg(c.*) AS competitors
FROM audits a
LEFT JOIN competitors c ON c.audit_id = a.id
WHERE a.id = '85d6ee6f-8c55-4c98-abd8-60dedfafa9df'
GROUP BY a.id;
```

### Get timeout audits

```sql
SELECT id, url, started_at
FROM audits
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '10 minutes';
```

### Aggregate stats

```sql
-- Audits by status
SELECT status, COUNT(*) AS count
FROM audits
GROUP BY status;

-- Average scores
SELECT 
    AVG(overall_score) AS avg_overall,
    AVG(seo_score) AS avg_seo,
    AVG(performance_score) AS avg_performance,
    AVG(content_score) AS avg_content
FROM audits
WHERE status = 'completed';

-- Top users by audit count
SELECT u.email, u.audits_count
FROM users u
ORDER BY u.audits_count DESC
LIMIT 10;
```

---

## Database Access

### From VPS

```bash
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db
```

### Useful psql commands

```sql
-- List tables
\dt

-- Describe table
\d audits

-- List indexes
\di

-- Database size
SELECT pg_size_pretty(pg_database_size('sitespector_db'));

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Backup & Restore

### Backup

```bash
# Full backup
docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db > backup.sql

# Compressed backup
docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db | gzip > backup.sql.gz

# Schema only
docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db --schema-only > schema.sql
```

### Restore

```bash
# From SQL file
cat backup.sql | docker exec -i sitespector-postgres psql -U sitespector_user sitespector_db

# From compressed file
gunzip -c backup.sql.gz | docker exec -i sitespector-postgres psql -U sitespector_user sitespector_db
```

---

## Migrations

**Tool**: Alembic

**Location**: `backend/alembic/versions/`

### Current migration

`20251205_0925_30ef0ad04684_initial_migration_users_audits_.py`

**Creates**:
- users table
- audits table
- competitors table
- All indexes
- Foreign keys

### Run migrations

```bash
# Upgrade to latest
docker exec sitespector-backend alembic upgrade head

# Create new migration
docker exec sitespector-backend alembic revision --autogenerate -m "description"

# Rollback one version
docker exec sitespector-backend alembic downgrade -1

# View migration history
docker exec sitespector-backend alembic history
```

---

## Performance Optimization

### Current indexes

- `users.email` (unique)
- `users.subscription_tier`
- `users.created_at`
- `audits.user_id`
- `audits.status`
- `audits.created_at`
- `competitors.audit_id`

### Future optimizations (if needed)

**JSONB indexing**:
```sql
-- GIN index for JSONB containment
CREATE INDEX idx_audits_results_gin ON audits USING GIN (results);

-- Index specific JSONB field
CREATE INDEX idx_audits_lighthouse_score ON audits ((results->'lighthouse'->'desktop'->>'performance_score'));
```

**Partial indexes**:
```sql
-- Index only completed audits
CREATE INDEX idx_audits_completed ON audits(created_at) WHERE status = 'completed';

-- Index only processing audits
CREATE INDEX idx_audits_processing ON audits(started_at) WHERE status = 'processing';
```

---

## Data Retention

**Current**: No retention policy (keep all data)

**Future** (if needed):

```sql
-- Delete old failed audits (>30 days)
DELETE FROM audits
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '30 days';

-- Archive old completed audits
INSERT INTO audits_archive
SELECT * FROM audits
WHERE status = 'completed'
  AND created_at < NOW() - INTERVAL '1 year';

DELETE FROM audits
WHERE id IN (SELECT id FROM audits_archive);
```

---

## Monitoring

### Connection stats

```sql
SELECT 
    datname,
    count(*) AS connections
FROM pg_stat_activity
GROUP BY datname;
```

### Long-running queries

```sql
SELECT 
    pid,
    now() - query_start AS duration,
    query
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '1 minute'
ORDER BY duration DESC;
```

### Table stats

```sql
SELECT 
    relname AS table_name,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

---

## Operational Runbook: Baseline Reset (Projects + Audits + Chat)

When testing requires a clean baseline after project/audit model changes, perform a coordinated reset:

1. **VPS Postgres** (`sitespector-postgres`):
   - Truncate runtime data tables: `audits`, `competitors`, `audit_tasks`, `audit_schedules`, `chat_conversations`, `chat_messages`, `chat_attachments`, `chat_message_feedback`, `chat_shares`, `chat_usage`
   - Reset user audit counters: `UPDATE users SET audits_count = 0`
2. **Supabase**:
   - Delete all rows from `projects`, `project_members`
   - Reset usage counters: `UPDATE subscriptions SET audits_used_this_month = 0`
3. **Verify**:
   - `count(*) = 0` on all reset tables
   - no non-zero usage counters (`users.audits_count`, `subscriptions.audits_used_this_month`)

This reset keeps schema, triggers, policies, users, profiles, workspaces, and memberships intact.

---

**Last Updated**: 2026-02-25  
**Database**: PostgreSQL 15  
**Scope Note**: This document covers VPS Postgres plus Supabase linkage for `project_id`.
# SiteSpector - Database Models

## Overview

SiteSpector uses **PostgreSQL 15** with **SQLAlchemy 2.0** (async) ORM.

**Key features**:
- JSONB columns for flexible audit results storage
- UUID primary keys
- Async database operations (asyncpg driver)
- Automatic timestamps (created_at, updated_at)
- Relationship management (users → audits → competitors)

---

## Database Schema

### Tables

1. **users** - User accounts
2. **audits** - Website audit records
3. **competitors** - Competitor URLs linked to audits
4. **agent_types** - Predefined/custom chat agents
5. **chat_conversations** - Audit-scoped conversation threads
6. **chat_messages** - Messages in a conversation
7. **chat_shares** - Sharing conversations within a workspace
8. **chat_usage** - Monthly message counters (rate limiting)

---

## Models

### User Model

**Location**: `backend/app/models.py`

```python
class User(Base):
    __tablename__ = "users"
    
    # Primary key
    id: UUID  # UUID v4
    
    # Authentication
    email: str  # Unique, indexed, max 255 chars
    password_hash: str  # bcrypt hash, max 255 chars
    
    # Subscription
    subscription_tier: SubscriptionTier  # Enum: 'free', 'pro', 'enterprise'
    stripe_customer_id: str | None  # Stripe customer ID (future use)
    
    # Stats
    audits_count: int  # Default: 0
    
    # Timestamps
    created_at: datetime  # Auto-set on insert
    updated_at: datetime  # Auto-updated on change
    
    # Relationships
    audits: list[Audit]  # One-to-many, cascade delete
```

**Indexes**:
- `email` (unique)
- `subscription_tier`
- `created_at`

**Enums**:
```python
class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"
```

---

### Audit Model

**Location**: `backend/app/models.py`

```python
class Audit(Base):
    __tablename__ = "audits"
    
    # Primary key
    id: UUID  # UUID v4
    
    # Foreign keys
    user_id: UUID  # References users.id, indexed (legacy)
    workspace_id: UUID | None  # Multi-tenancy
    project_id: UUID | None  # Project (website) within workspace
    
    # Audit data
    url: str  # Max 2048 chars
    status: AuditStatus  # Enum: 'pending', 'processing', 'completed', 'failed'
    
    # Scores (0-100)
    overall_score: float | None
    seo_score: float | None
    performance_score: float | None
    content_score: float | None
    
    # Business type
    is_local_business: bool  # Default: False
    
    # Results (JSONB)
    results: dict | None  # Full audit results (crawl, lighthouse, AI)
    
    # PDF export
    pdf_url: str | None  # URL to generated PDF (max 2048 chars)
    
    # Error tracking
    error_message: str | None  # Text field (unlimited)
    
    # Timestamps
    created_at: datetime  # Auto-set on insert
    started_at: datetime | None  # When worker starts processing
    completed_at: datetime | None  # When worker finishes
    
    # Relationships
    user: User  # Many-to-one
    competitors: list[Competitor]  # One-to-many, cascade delete
```

**Indexes**:
- `user_id`, `workspace_id`, `project_id`
- `status`
- `created_at`

**Enums**:
```python
class AuditStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
```

**JSONB Structure** (`results` column):

```json
{
  "crawl": {
    "title": "string",
    "title_length": 0,
    "meta_description": "string",
    "meta_description_length": 0,
    "h1_tags": ["string"],
    "h1_count": 0,
    "status_code": 200,
    "word_count": 0,
    "size_bytes": 0,
    "load_time": 0.0,
    "total_images": 0,
    "images_without_alt": 0,
    "internal_links_count": 0,
    "has_sitemap": true
  },
  "lighthouse": {
    "desktop": { "performance_score": 85, ... },
    "mobile": { "performance_score": 78, ... }
  },
  "content_analysis": {
    "quality_score": 85,
    "readability_score": 75,
    "recommendations": ["..."],
    "word_count": 850
  },
  "local_seo": {
    "is_local_business": true,
    "has_nap": false,
    "has_schema_markup": false,
    "recommendations": ["..."]
  },
  "performance_analysis": {
    "issues": [],
    "recommendations": ["..."],
    "ttfb_desktop": 450,
    "lcp_desktop": 2100
  },
  "competitive_analysis": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."],
    "competitors_analyzed": 3
  }
}
```

---

### Competitor Model

**Location**: `backend/app/models.py`

```python
class Competitor(Base):
    __tablename__ = "competitors"
    
    # Primary key
    id: UUID  # UUID v4
    
    # Foreign key
    audit_id: UUID  # References audits.id, indexed
    
    # Competitor data
    url: str  # Max 2048 chars
    status: CompetitorStatus  # Enum: 'pending', 'completed', 'failed'
    
    # Results (JSONB)
    results: dict | None  # Lighthouse data only
    
    # Timestamp
    created_at: datetime  # Auto-set on insert
    
    # Relationships
    audit: Audit  # Many-to-one
```

**Indexes**:
- `audit_id`

**Enums**:
```python
class CompetitorStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
```

**JSONB Structure** (`results` column):

```json
{
  "lighthouse": {
    "url": "https://competitor.com",
    "device": "desktop",
    "performance_score": 75,
    "accessibility_score": 90,
    "best_practices_score": 85,
    "seo_score": 92
  }
}
```

---

## Database Relationships

```
User (1) ─────→ (N) Audit
Workspace (Supabase) ──→ (N) Project (Supabase)
Project (Supabase) ──→ (N) Audit [project_id on VPS]
                     ↓
                     └─→ (N) Competitor
```

**Projects** live in **Supabase** (`projects`, `project_members`). VPS tables `audits` and `audit_schedules` have optional `project_id` (UUID, no FK) linking to Supabase project. Access is enforced in app layer via `verify_project_access`.

**Cascade rules**:
- Delete User → Delete all Audits → Delete all Competitors
- Delete Audit → Delete all Competitors

**Implemented via**:
```python
# User model
audits = relationship("Audit", back_populates="user", cascade="all, delete-orphan")

# Audit model
user = relationship("User", back_populates="audits")
competitors = relationship("Competitor", back_populates="audit", cascade="all, delete-orphan")

# Competitor model
audit = relationship("Audit", back_populates="competitors")
```

---

## Database Configuration

**Location**: `backend/app/database.py`

### Connection

```python
DATABASE_URL = "postgresql+asyncpg://sitespector_user:password@postgres:5432/sitespector_db"

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,          # Max 10 persistent connections
    max_overflow=20,       # +20 overflow connections
    pool_pre_ping=True,    # Check connection health before use
    pool_recycle=3600,     # Recycle connections after 1 hour
    echo=False             # Don't log SQL (performance)
)
```

### Session Management

```python
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False  # Don't expire objects after commit
)

async def get_db() -> AsyncSession:
    """FastAPI dependency for database sessions."""
    async with AsyncSessionLocal() as session:
        yield session
```

---

## Migrations

**Tool**: Alembic

**Location**: `backend/alembic/`

**Config**: `backend/alembic.ini`

### Current Migrations

1. **20251205_0925_30ef0ad04684_initial_migration_users_audits_.py**
   - Create `users` table
   - Create `audits` table
   - Create `competitors` table
   - Add indexes
   - Add foreign keys

### Creating New Migration

```bash
# Generate migration
docker exec sitespector-backend alembic revision --autogenerate -m "add new column"

# Apply migration
docker exec sitespector-backend alembic upgrade head

# Rollback migration
docker exec sitespector-backend alembic downgrade -1
```

---

## Common Queries

### Get User by Email

```python
from sqlalchemy import select

result = await db.execute(
    select(User).where(User.email == "user@example.com")
)
user = result.scalar_one_or_none()
```

### Get Audit with Competitors

```python
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Audit)
    .options(selectinload(Audit.competitors))
    .where(Audit.id == audit_id)
)
audit = result.scalar_one()
```

### Get Pending Audits (Worker)

```python
result = await db.execute(
    select(Audit)
    .where(Audit.status == AuditStatus.PENDING)
    .order_by(Audit.created_at)
    .limit(3)
)
pending_audits = result.scalars().all()
```

### Update Audit Status

```python
audit.status = AuditStatus.PROCESSING
audit.started_at = datetime.utcnow()
await db.commit()
```

### Create Audit with Competitors

```python
audit = Audit(user_id=user.id, url="https://example.com")
db.add(audit)
await db.flush()  # Get audit.id

for comp_url in competitor_urls:
    competitor = Competitor(audit_id=audit.id, url=comp_url)
    db.add(competitor)

await db.commit()
```

---

## Performance Considerations

### JSONB Indexing

**Current**: No indexes on JSONB fields (not needed for MVP)

**Future** (if needed):
```sql
-- Index specific JSONB field
CREATE INDEX idx_audit_results_lighthouse 
ON audits USING GIN ((results->'lighthouse'));

-- Index JSONB existence
CREATE INDEX idx_audit_has_crawl
ON audits ((results ? 'crawl'));
```

### Query Optimization

**Always use eager loading** for relationships:

```python
# ✅ GOOD - Single query
select(Audit).options(selectinload(Audit.competitors))

# ❌ BAD - N+1 queries
audit = await db.get(Audit, audit_id)
for comp in audit.competitors:  # Each iteration = 1 query
    print(comp.url)
```

---

## Data Integrity

### Constraints

- **Primary keys**: UUID (unique, not null)
- **Foreign keys**: ON DELETE CASCADE
- **Unique constraints**: `users.email`
- **Check constraints**: None (validation in Pydantic schemas)

### Validation

**Database level**: Minimal (type constraints only)

**Application level**: Extensive (Pydantic schemas)

**Rationale**: Keep database simple, validate in application code

---

## Backup Strategy

**Current**: No automated backups

**Manual backup**:
```bash
docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db > backup.sql
```

**Restore**:
```bash
cat backup.sql | docker exec -i sitespector-postgres psql -U sitespector_user sitespector_db
```

---

## Chat Models (Agent Chat + RAG)

**Location**: `backend/app/models.py`

Notes:
- Chat ownership uses **Supabase user UUID** (stored as `UUID` but **no FK** to the legacy `users` table).
- Conversations are strictly scoped by `workspace_id` + `audit_id`.

### AgentType
- Table: `agent_types`
- Fields: `slug` (unique), `system_prompt`, `tools_config` (JSONB), `sort_order` (int)

### ChatConversation
- Table: `chat_conversations`
- FK: `audit_id -> audits.id`
- FK: `agent_type_id -> agent_types.id`
- Fields: `verbosity` (`concise|balanced|detailed`), `tone` (`technical|professional|simple`)

### ChatMessage
- Table: `chat_messages`
- FK: `conversation_id -> chat_conversations.id` (CASCADE)
- Enum: `chatmessagerole` (`user|assistant|system`)

### ChatAttachment
- Table: `chat_attachments`
- FK: `conversation_id -> chat_conversations.id` (CASCADE)
- FK: `message_id -> chat_messages.id` (SET NULL)
- Notes: stored on VPS volume under `settings.CHAT_ATTACHMENTS_PATH`

### ChatMessageFeedback
- Table: `chat_message_feedback`
- Unique: `(message_id, user_id)`
- Field: `rating` (`+1|-1`)

### ChatShare
- Table: `chat_shares`
- Unique: `(conversation_id, shared_with_user_id)`
- Enum: `chatsharepermission` (`read|write`)

### ChatUsage
- Table: `chat_usage`
- Unique: `(user_id, month)` where `month` is `YYYY-MM`

---

**Last Updated**: 2026-02-15  
**Database**: PostgreSQL 15  
**ORM**: SQLAlchemy 2.0 (async)  
**Driver**: asyncpg
