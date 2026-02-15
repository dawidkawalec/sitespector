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
    
    # Foreign key
    user_id: UUID  # References users.id, indexed
    
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
- `user_id`
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
                     ↓
                     └─→ (N) Competitor
```

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
- Fields: `slug` (unique), `system_prompt`, `tools_config` (JSONB)

### ChatConversation
- Table: `chat_conversations`
- FK: `audit_id -> audits.id`
- FK: `agent_type_id -> agent_types.id`

### ChatMessage
- Table: `chat_messages`
- FK: `conversation_id -> chat_conversations.id` (CASCADE)
- Enum: `chatmessagerole` (`user|assistant|system`)

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
