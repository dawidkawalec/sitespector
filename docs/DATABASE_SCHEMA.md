# Database Schema
## SiteSpector.app - PostgreSQL 16

**Last Updated:** 2025-12-04  
**Version:** 1.0 (MVP)

---

## 🗄️ Overview

**Database:** PostgreSQL 16  
**ORM:** SQLAlchemy 2.0 (async)  
**Migration Tool:** Alembic  

**Total Tables:** 3 (MVP)
1. `users` - User accounts & subscriptions
2. `audits` - Audit records & results
3. `competitors` - Competitor URLs per audit

---

## 📊 Entity Relationship Diagram

```
┌─────────────────────┐
│       users         │
│─────────────────────│
│ id (PK)            │──────┐
│ email              │      │
│ password_hash      │      │ 1
│ subscription_tier  │      │
│ stripe_customer_id │      │
│ audits_count       │      │
│ created_at         │      │
│ updated_at         │      │
└─────────────────────┘      │
                             │
                             │ N
                    ┌────────▼──────────┐
                    │      audits       │
                    │───────────────────│
                    │ id (PK)          │──────┐
                    │ user_id (FK)     │      │
                    │ url              │      │ 1
                    │ status           │      │
                    │ overall_score    │      │
                    │ seo_score        │      │
                    │ performance_score│      │
                    │ content_score    │      │
                    │ is_local_business│      │
                    │ results (JSONB)  │      │
                    │ pdf_url          │      │
                    │ error_message    │      │
                    │ created_at       │      │
                    │ started_at       │      │
                    │ completed_at     │      │
                    └───────────────────┘      │
                                               │ N
                                      ┌────────▼──────────┐
                                      │   competitors     │
                                      │───────────────────│
                                      │ id (PK)          │
                                      │ audit_id (FK)    │
                                      │ url              │
                                      │ status           │
                                      │ results (JSONB)  │
                                      │ created_at       │
                                      └───────────────────┘
```

---

## 📋 Table Definitions

### 1. `users` Table

**Purpose:** Store user accounts, authentication, and subscription data

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    audits_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `email` | VARCHAR(255) | NO | - | User email (unique) |
| `password_hash` | VARCHAR(255) | NO | - | bcrypt hash |
| `subscription_tier` | VARCHAR(50) | NO | 'free' | free, starter, professional, agency |
| `stripe_customer_id` | VARCHAR(255) | YES | NULL | Stripe customer ID |
| `audits_count` | INTEGER | NO | 0 | Total audits created (for limits) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | Last update timestamp |

**Constraints:**
- `email` must be unique
- `subscription_tier` IN ('free', 'starter', 'professional', 'agency')

**Sample Data:**
```sql
INSERT INTO users (email, password_hash, subscription_tier) VALUES
('user@example.com', '$2b$12$...', 'professional'),
('demo@sitespector.app', '$2b$12$...', 'free');
```

---

### 2. `audits` Table

**Purpose:** Store audit requests and results

```sql
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    overall_score INTEGER,
    seo_score INTEGER,
    performance_score INTEGER,
    content_score INTEGER,
    is_local_business BOOLEAN DEFAULT FALSE,
    results JSONB,
    pdf_url VARCHAR(2048),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT audits_status_check CHECK (
        status IN ('pending', 'processing', 'completed', 'failed')
    ),
    CONSTRAINT audits_scores_check CHECK (
        overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)
    )
);

-- Indexes
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX idx_audits_url ON audits(url);
CREATE INDEX idx_audits_results_gin ON audits USING GIN (results);
```

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `user_id` | UUID | NO | - | Foreign key → users.id |
| `url` | VARCHAR(2048) | NO | - | URL being audited |
| `status` | VARCHAR(50) | NO | 'pending' | pending, processing, completed, failed |
| `overall_score` | INTEGER | YES | NULL | 0-100 composite score |
| `seo_score` | INTEGER | YES | NULL | 0-100 SEO score |
| `performance_score` | INTEGER | YES | NULL | 0-100 performance score |
| `content_score` | INTEGER | YES | NULL | 0-100 content score |
| `is_local_business` | BOOLEAN | NO | FALSE | Auto-detected local business |
| `results` | JSONB | YES | NULL | Full audit data (see structure below) |
| `pdf_url` | VARCHAR(2048) | YES | NULL | URL to generated PDF report |
| `error_message` | TEXT | YES | NULL | Error details if status='failed' |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | When audit was requested |
| `started_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | When processing started |
| `completed_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | When processing finished |

**Constraints:**
- `user_id` references `users(id)` with CASCADE delete
- `status` must be one of: pending, processing, completed, failed
- `overall_score` must be 0-100 if not NULL

**Sample Data:**
```sql
INSERT INTO audits (user_id, url, status, overall_score) VALUES
('user-uuid-here', 'https://example.com', 'completed', 72);
```

---

### 3. `competitors` Table

**Purpose:** Store competitor URLs analyzed alongside main audit

```sql
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT competitors_status_check CHECK (
        status IN ('pending', 'completed', 'failed')
    )
);

-- Indexes
CREATE INDEX idx_competitors_audit_id ON competitors(audit_id);
CREATE INDEX idx_competitors_url ON competitors(url);
```

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `audit_id` | UUID | NO | - | Foreign key → audits.id |
| `url` | VARCHAR(2048) | NO | - | Competitor URL |
| `status` | VARCHAR(50) | NO | 'pending' | pending, completed, failed |
| `results` | JSONB | YES | NULL | Competitor audit data |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | NOW() | When added |

**Constraints:**
- `audit_id` references `audits(id)` with CASCADE delete
- `status` must be one of: pending, completed, failed

**Sample Data:**
```sql
INSERT INTO competitors (audit_id, url, status) VALUES
('audit-uuid-here', 'https://competitor1.com', 'completed');
```

---

## 📦 JSONB Structure

### `audits.results` JSONB Schema

```json
{
  "screaming_frog": {
    "meta_tags": {
      "title": "Example Site - Home",
      "description": "Welcome to our site...",
      "robots": "index, follow",
      "canonical": "https://example.com/",
      "og_title": "Example Site",
      "og_description": "Social media description",
      "og_image": "https://example.com/og.jpg"
    },
    "headers": {
      "h1": ["Main Heading"],
      "h2": ["Subheading 1", "Subheading 2"],
      "h3": ["Detail 1", "Detail 2"],
      "h4": []
    },
    "images": [
      {
        "src": "/images/hero.jpg",
        "alt": "Hero image",
        "size_kb": 450,
        "width": 1920,
        "height": 1080,
        "format": "jpg"
      }
    ],
    "links": {
      "internal": 12,
      "external": 5,
      "broken": 0,
      "redirects": 2
    },
    "orphan_pages": [
      "/privacy-policy",
      "/terms"
    ],
    "duplicates": {
      "meta_title": [],
      "meta_description": ["url1.com", "url2.com"],
      "h1": []
    },
    "schema_org": {
      "detected": false,
      "types": [],
      "errors": []
    },
    "http_status": {
      "200": 50,
      "301": 5,
      "404": 3,
      "500": 0
    },
    "robots_txt": {
      "exists": true,
      "sitemap_declared": true,
      "issues": []
    },
    "sitemap_xml": {
      "exists": true,
      "url_count": 48,
      "issues": ["3 invalid URLs"]
    }
  },
  
  "lighthouse": {
    "desktop": {
      "scores": {
        "performance": 85,
        "accessibility": 92,
        "best_practices": 95,
        "seo": 88
      },
      "metrics": {
        "first_contentful_paint": 0.9,
        "largest_contentful_paint": 1.2,
        "interaction_to_next_paint": 45,
        "cumulative_layout_shift": 0.25,
        "time_to_first_byte": 0.3,
        "speed_index": 2.1,
        "total_blocking_time": 120
      },
      "opportunities": [
        {
          "id": "unused-css-rules",
          "title": "Remove unused CSS",
          "description": "Reduce unused CSS to improve performance",
          "score": 0.7,
          "savings_ms": 300
        }
      ]
    },
    "mobile": {
      "scores": {
        "performance": 72,
        "accessibility": 92,
        "best_practices": 95,
        "seo": 88
      },
      "metrics": {
        "first_contentful_paint": 1.5,
        "largest_contentful_paint": 2.1,
        "interaction_to_next_paint": 120,
        "cumulative_layout_shift": 0.15,
        "time_to_first_byte": 0.5,
        "speed_index": 3.4,
        "total_blocking_time": 250
      },
      "opportunities": []
    }
  },
  
  "ai_analysis": {
    "content_quality": {
      "score": 68,
      "readability": {
        "flesch_score": 42,
        "fog_index": 12,
        "avg_sentence_length": 22,
        "complex_words_pct": 18,
        "interpretation": "Difficult (academic level)"
      },
      "tone": "Professional but uses jargon",
      "word_count": 850,
      "optimal_word_count": 1200,
      "keyword_analysis": {
        "primary_keyword": "dentysta",
        "primary_density": 1.2,
        "secondary_keywords": ["warszawa", "implanty"],
        "missing_keywords": ["bezbolesne", "stomatolog"]
      }
    },
    
    "recommendations": [
      {
        "id": "rec_001",
        "category": "SEO",
        "priority": "HIGH",
        "issue": "Missing meta description",
        "current_value": null,
        "impact": "Lost ~20% potential CTR from search results",
        "fix_description": "Add descriptive meta description (155 chars) with CTA",
        "code_snippet": "<meta name=\"description\" content=\"Dentysta w Warszawie Mokotów. Implanty, protetyka, stomatologia estetyczna. ✨ Bezbolesne zabiegi. Umów wizytę: 📞 +48 123 456 789\">",
        "estimated_time_minutes": 15,
        "expected_improvement": "+15 points SEO score"
      },
      {
        "id": "rec_002",
        "category": "Performance",
        "priority": "HIGH",
        "issue": "CLS (Cumulative Layout Shift) too high: 0.25",
        "current_value": 0.25,
        "impact": "Poor user experience, users may misclick elements",
        "fix_description": "Add explicit width/height to images to reserve space",
        "code_snippet": "<img src=\"hero.jpg\" width=\"1920\" height=\"1080\" alt=\"...\">",
        "estimated_time_minutes": 30,
        "expected_improvement": "CLS → 0.05 (PASS)"
      }
    ],
    
    "local_seo": {
      "detected": true,
      "confidence": 0.95,
      "found_elements": {
        "address": "ul. Mokotowska 12, Warszawa",
        "phone": "+48 123 456 789",
        "opening_hours": null
      },
      "schema_present": false,
      "google_maps_embed": false,
      "recommendations": [
        {
          "title": "Add LocalBusiness Schema",
          "priority": "HIGH",
          "code_snippet": "{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Dentist\",\n  \"name\": \"Dentysta Premium\",\n  \"address\": {...}\n}"
        }
      ]
    },
    
    "competitive_insights": {
      "position_vs_competitors": "middle",
      "strengths": [
        "Better LCP than 2/3 competitors",
        "Good accessibility score"
      ],
      "weaknesses": [
        "No Schema.org (all competitors have it)",
        "Shorter content (850 vs avg 1400 words)"
      ],
      "opportunities": [
        "Add VideoObject schema (competitor C has 3x CTR from this)",
        "Expand content with FAQ section"
      ]
    }
  }
}
```

### `competitors.results` JSONB Schema

```json
{
  "url": "https://competitor1.com",
  "lighthouse": {
    "desktop": {
      "scores": {
        "performance": 90,
        "seo": 85
      },
      "metrics": {
        "lcp": 1.8,
        "cls": 0.05
      }
    }
  },
  "content": {
    "word_count": 1400,
    "has_schema": true,
    "meta_description_present": true
  }
}
```

---

## 🔍 Query Examples

### Get User's Recent Audits

```sql
SELECT 
    a.id,
    a.url,
    a.status,
    a.overall_score,
    a.created_at,
    a.completed_at
FROM audits a
WHERE a.user_id = 'user-uuid-here'
ORDER BY a.created_at DESC
LIMIT 20;
```

### Find Pending Audits for Worker

```sql
SELECT id, url
FROM audits
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

### Get Audit with Competitors

```sql
SELECT 
    a.*,
    json_agg(
        json_build_object(
            'id', c.id,
            'url', c.url,
            'status', c.status,
            'results', c.results
        )
    ) AS competitors
FROM audits a
LEFT JOIN competitors c ON c.audit_id = a.id
WHERE a.id = 'audit-uuid-here'
GROUP BY a.id;
```

### Calculate Average Scores by User

```sql
SELECT 
    u.email,
    COUNT(a.id) AS total_audits,
    AVG(a.overall_score) AS avg_score,
    AVG(a.seo_score) AS avg_seo,
    AVG(a.performance_score) AS avg_performance
FROM users u
LEFT JOIN audits a ON a.user_id = u.id
WHERE a.status = 'completed'
GROUP BY u.id, u.email;
```

### Find Audits with Local Business Detected

```sql
SELECT 
    url,
    overall_score,
    results->'ai_analysis'->'local_seo'->>'address' AS address,
    results->'ai_analysis'->'local_seo'->>'phone' AS phone
FROM audits
WHERE is_local_business = TRUE
  AND status = 'completed'
ORDER BY created_at DESC;
```

### Search Audits by Domain

```sql
SELECT id, url, overall_score, created_at
FROM audits
WHERE url LIKE '%example.com%'
  AND status = 'completed'
ORDER BY created_at DESC;
```

---

## 🔐 Permissions & Security

### Role-Based Access (Future: Etap 2)

```sql
-- Add roles column to users
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';

-- Possible roles: user, admin, analyst
-- user: can only see own audits
-- admin: can see all audits
-- analyst: can see audits in assigned projects
```

### Row-Level Security (RLS) - PostgreSQL Feature

```sql
-- Enable RLS on audits table
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own audits
CREATE POLICY user_audits_policy ON audits
    FOR SELECT
    USING (user_id = current_setting('app.user_id')::uuid);

-- In application, set user_id in session:
-- SET app.user_id = 'user-uuid-here';
```

---

## 📈 Performance Optimization

### Indexes Strategy

**Already Created:**
- `idx_users_email` (UNIQUE) - Fast login lookup
- `idx_audits_user_id` - Fast user audit queries
- `idx_audits_status` - Fast worker polling
- `idx_audits_created_at` - Fast recent audits query
- `idx_audits_results_gin` - Fast JSONB queries

**Future Indexes (if needed):**
```sql
-- If searching by URL becomes common
CREATE INDEX idx_audits_url_gin ON audits USING GIN (url gin_trgm_ops);

-- If querying specific JSONB fields often
CREATE INDEX idx_audits_overall_score ON audits(overall_score) 
WHERE overall_score IS NOT NULL;
```

### Query Optimization Tips

1. **Use EXPLAIN ANALYZE** to check query plans
```sql
EXPLAIN ANALYZE
SELECT * FROM audits WHERE user_id = 'xxx';
```

2. **Avoid SELECT *** when JSONB is large
```sql
-- Bad (loads entire JSONB)
SELECT * FROM audits WHERE id = 'xxx';

-- Good (only needed columns)
SELECT id, url, status, overall_score FROM audits WHERE id = 'xxx';
```

3. **Use JSONB operators for specific keys**
```sql
-- Get only AI recommendations
SELECT 
    id,
    url,
    results->'ai_analysis'->'recommendations' AS recommendations
FROM audits
WHERE id = 'xxx';
```

---

## 🔄 Migration Strategy

### Initial Migration (Alembic)

```python
# alembic/versions/001_initial_tables.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('subscription_tier', sa.String(50), server_default='free', nullable=False),
        sa.Column('stripe_customer_id', sa.String(255)),
        sa.Column('audits_count', sa.Integer, server_default='0', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now())
    )
    
    # Create audits table
    op.create_table(
        'audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('url', sa.String(2048), nullable=False),
        sa.Column('status', sa.String(50), server_default='pending', nullable=False),
        sa.Column('overall_score', sa.Integer),
        sa.Column('seo_score', sa.Integer),
        sa.Column('performance_score', sa.Integer),
        sa.Column('content_score', sa.Integer),
        sa.Column('is_local_business', sa.Boolean, server_default='false', nullable=False),
        sa.Column('results', postgresql.JSONB),
        sa.Column('pdf_url', sa.String(2048)),
        sa.Column('error_message', sa.Text),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True))
    )
    
    # Create competitors table
    op.create_table(
        'competitors',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('audit_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('audits.id', ondelete='CASCADE'), nullable=False),
        sa.Column('url', sa.String(2048), nullable=False),
        sa.Column('status', sa.String(50), server_default='pending', nullable=False),
        sa.Column('results', postgresql.JSONB),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now())
    )
    
    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_audits_user_id', 'audits', ['user_id'])
    op.create_index('idx_audits_status', 'audits', ['status'])
    op.create_index('idx_audits_created_at', 'audits', ['created_at'])
    op.create_index('idx_competitors_audit_id', 'competitors', ['audit_id'])

def downgrade():
    op.drop_table('competitors')
    op.drop_table('audits')
    op.drop_table('users')
```

### Running Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Check current version
alembic current
```

---

## ✅ Database Checklist

**Setup:**
- [ ] PostgreSQL 16 installed/provisioned
- [ ] Database created (`sitespector`)
- [ ] Extensions enabled (if needed: `pgcrypto`, `pg_trgm`)
- [ ] Initial migrations run
- [ ] Indexes created
- [ ] Sample data inserted (for testing)

**Security:**
- [ ] Strong database password
- [ ] Connection limited to backend services only
- [ ] SSL/TLS enabled (production)
- [ ] Regular backups configured

**Monitoring:**
- [ ] Query performance logs enabled
- [ ] Slow query threshold set (>1s)
- [ ] Connection pool configured (SQLAlchemy)
- [ ] Database size monitored

---

**Document Status:** ✅ COMPLETE  
**Next:** API_ENDPOINTS.md (detailed API specs)
