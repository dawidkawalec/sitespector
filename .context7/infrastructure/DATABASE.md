# SiteSpector - Database Schema & Management

## Overview

SiteSpector uses **PostgreSQL 15** with async operations via **asyncpg** driver.

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

**Last Updated**: 2025-02-03  
**Database**: PostgreSQL 15  
**Tables**: 3 (users, audits, competitors)  
**Indexes**: 7  
**JSONB columns**: 2 (audits.results, competitors.results)
