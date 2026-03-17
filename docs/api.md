# SiteSpector - API Documentation

## Base URL

**Production**: `https://sitespector.app/api`  
**Local** (not used): `http://localhost:8000/api`

---

## Authentication

### JWT Bearer Token

**All endpoints except** `/auth/register`, `/auth/login`, `/contact`, and `/newsletter` require authentication.

**Header format**:
```
Authorization: Bearer <jwt_token>
```

**Token expiry**: 7 days (configurable via `JWT_EXPIRATION_DAYS`)

**Token storage**: Frontend stores in `localStorage` (key: `sitespector_token`)

---

## API Endpoints

### Health Check

#### `GET /health`

**Public endpoint** (no auth required)

**Response** (200):
```json
{
  "status": "ok",
  "version": "v1",
  "database": "connected",
  "timestamp": "2025-02-03T10:30:00Z"
}
```

---

## Public Endpoints (No Auth)

### Contact Form

#### `POST /api/contact`

Submit a public contact form.

**Request body**:
```json
{
  "name": "Jan Kowalski",
  "email": "jan@example.com",
  "subject": "Pytanie o produkt",
  "message": "Treść wiadomości (min. 20 znaków)..."
}
```

**Response** (201):
```json
{
  "message": "Dziękujemy! Odpowiemy w ciągu 24 godzin."
}
```

---

### Newsletter Subscription

#### `POST /api/newsletter`

Subscribe to the newsletter.

**Request body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (201):
```json
{
  "message": "Dziękujemy za zapis! Będziemy Cię informować o nowościach."
}
```

---

## Authentication Endpoints

### Register User

#### `POST /api/auth/register`

Create a new user account.

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Validation**:
- Email: Valid email format, unique
- Password: Min 8 chars, must contain uppercase, lowercase, digit

**Response** (201):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "subscription_tier": "free",
  "audits_count": 0,
  "created_at": "2025-02-03T10:00:00Z",
  "updated_at": "2025-02-03T10:00:00Z"
}
```

**Errors**:
- `409 Conflict`: Email already registered
- `422 Validation Error`: Invalid email or weak password

---

### Login

#### `POST /api/auth/login`

Authenticate user and receive JWT token.

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:
- `401 Unauthorized`: Invalid credentials

---

### Get Current User

#### `GET /api/auth/me`

Get authenticated user information.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "subscription_tier": "free",
  "audits_count": 5,
  "created_at": "2025-02-03T10:00:00Z",
  "updated_at": "2025-02-03T10:30:00Z"
}
```

**Errors**:
- `401 Unauthorized`: Invalid/expired token

---

## Audit Endpoints

### Create Audit

#### `POST /api/audits`

Create a new website audit.

**Headers**: `Authorization: Bearer <token>`

**Request body**:
```json
{
  "url": "https://example.com",
  "competitors": ["https://competitor1.com", "https://competitor2.com"],
  "senuto_country_id": 200,
  "senuto_fetch_mode": "subdomain",
  "run_ai_pipeline": true,
  "run_execution_plan": true,
  "crawler_user_agent": "SiteSpector/1.0 example.com-authorized"
}
```
- **crawler_user_agent** (optional): Custom User-Agent for Screaming Frog crawl; use when site owner whitelists it in Cloudflare/WAF to avoid 403.

**Validation**:
- URL: Auto-prepends `https://` if missing
- Competitors: Max 3 URLs, auto-prepends `https://`

**Response** (201):
```json
{
  "id": "85d6ee6f-8c55-4c98-abd8-60dedfafa9df",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "url": "https://example.com",
  "status": "pending",
  "overall_score": null,
  "seo_score": null,
  "performance_score": null,
  "content_score": null,
  "is_local_business": false,
  "results": null,
  "pdf_url": null,
  "error_message": null,
  "created_at": "2025-02-03T10:00:00Z",
  "started_at": null,
  "completed_at": null,
  "competitors": [
    {
      "id": "competitor-uuid-1",
      "audit_id": "85d6ee6f-8c55-4c98-abd8-60dedfafa9df",
      "url": "https://competitor1.com",
      "status": "pending",
      "results": null,
      "created_at": "2025-02-03T10:00:00Z"
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `422 Validation Error`: Invalid URL format

---

### List Audits

#### `GET /api/audits`

List all audits for authenticated user with pagination.

**Headers**: `Authorization: Bearer <token>`

**Query parameters**:
- `page` (int, default: 1): Page number
- `page_size` (int, default: 20, max: 100): Items per page
- `status` (string, optional): Filter by status (`pending`, `processing`, `completed`, `failed`)

**Example**: `/api/audits?page=1&page_size=20&status=completed`

**Response** (200):
```json
{
  "total": 42,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "85d6ee6f-8c55-4c98-abd8-60dedfafa9df",
      "url": "https://example.com",
      "status": "completed",
      "overall_score": 85.5,
      "seo_score": 88.0,
      "performance_score": 82.0,
      "content_score": 86.5,
      "is_local_business": true,
      "created_at": "2025-02-03T10:00:00Z",
      "completed_at": "2025-02-03T10:05:30Z",
      "competitors": []
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated

---

### Get Audit

#### `GET /api/audits/{audit_id}`

Get detailed audit information by ID.

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Response** (200):
```json
{
  "id": "85d6ee6f-8c55-4c98-abd8-60dedfafa9df",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "url": "https://meditrue.pl",
  "status": "completed",
  "ai_status": "completed",
  "processing_step": "completed",
  "progress_percent": 100,
  "processing_logs": [],
  "overall_score": 85.5,
  "seo_score": 88.0,
  "performance_score": 82.0,
  "content_score": 86.5,
  "is_local_business": true,
  "results": {
    "crawl": {
      "title": "Meditrue - Medical Center",
      "title_length": 45,
      "meta_description": "Professional medical services...",
      "meta_description_length": 155,
      "h1_tags": ["Meditrue Medical Center"],
      "h1_count": 1,
      "status_code": 200,
      "word_count": 850,
      "size_bytes": 42500,
      "load_time": 0.85,
      "total_images": 12,
      "images_without_alt": 2,
      "internal_links_count": 45,
      "has_sitemap": true
    },
    "lighthouse": {
      "desktop": {
        "url": "https://meditrue.pl",
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
        "speed_index": 1800
      },
      "mobile": {
        "url": "https://meditrue.pl",
        "device": "mobile",
        "performance_score": 78,
        "accessibility_score": 92,
        "best_practices_score": 88,
        "seo_score": 95,
        "ttfb": 550,
        "fcp": 1800,
        "lcp": 3200,
        "cls": 0.08,
        "total_blocking_time": 300,
        "speed_index": 2800
      }
    },
    "content_analysis": {
      "quality_score": 85,
      "readability_score": 75,
      "recommendations": [
        "✅ Title tag ma optymalną długość",
        "✅ Meta description ma optymalną długość",
        "⚠️ 2 z 12 obrazów bez atrybutu ALT"
      ],
      "word_count": 850,
      "has_title": true,
      "has_meta_description": true,
      "has_h1": true
    },
    "local_seo": {
      "is_local_business": true,
      "has_nap": false,
      "has_schema_markup": false,
      "recommendations": [
        "✅ Wykryto lokalny biznes",
        "• Schema.org LocalBusiness markup",
        "• Profil Google My Business"
      ]
    },
    "performance_analysis": {
      "issues": [],
      "recommendations": [
        "✅ TTFB < 600ms - dobry czas odpowiedzi serwera",
        "✅ LCP < 2.5s - dobry czas renderowania"
      ],
      "ttfb_desktop": 450,
      "lcp_desktop": 2100,
      "performance_score": 85,
      "impact": "low"
    },
    "competitive_analysis": {
      "strengths": [
        "✅ Lepsza wydajność niż 2 z 3 konkurentów"
      ],
      "weaknesses": [],
      "opportunities": [
        "Przeprowadź szczegółową analizę treści konkurencji"
      ],
      "recommendations": [],
      "competitors_analyzed": 3
    }
  },
  "pdf_url": null,
  "error_message": null,
  "created_at": "2025-02-03T10:00:00Z",
  "started_at": "2025-02-03T10:00:15Z",
  "completed_at": "2025-02-03T10:05:30Z",
  "competitors": [
    {
      "id": "competitor-uuid-1",
      "audit_id": "85d6ee6f-8c55-4c98-abd8-60dedfafa9df",
      "url": "https://competitor1.com",
      "status": "completed",
      "results": {
        "lighthouse": {
          "performance_score": 75
        }
      },
      "created_at": "2025-02-03T10:00:00Z"
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Audit belongs to another user
- `404 Not Found`: Audit not found

---

### Get Audit Status (Polling)

#### `GET /api/audits/{audit_id}/status`

Get lightweight audit status for polling (no full results).

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Response** (200):
```json
{
  "id": "85d6ee6f-8c55-4c98-abd8-60dedfafa9df",
  "status": "processing",
  "overall_score": null,
  "error_message": null,
  "completed_at": null
}
```

**Use case**: Frontend polls this endpoint every 5s while status is `processing` or `pending`

**Errors**: Same as `GET /api/audits/{audit_id}`

**ACL note (Mar 2026)**:
- Audit-scoped endpoints now enforce a unified access rule:
  - workspace membership is required for workspace audits,
  - if audit has `project_id`, `verify_project_access` is also required,
  - legacy audits (without workspace) fall back to owner check (`audit.user_id`).

---

### Delete Audit

#### `DELETE /api/audits/{audit_id}`

Delete an audit. Cascades to competitors, tasks, chat conversations (DB). RAG vectors for this audit are removed from Qdrant (best-effort; deletion proceeds even if Qdrant cleanup fails).

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Response** (204): No content

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Audit belongs to another user
- `404 Not Found`: Audit not found

---

### Download PDF Report

#### `GET /api/audits/{audit_id}/pdf`

Download audit as PDF report.

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Response** (200):
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename=sitespector_audit_{audit_id}.pdf`

**Errors**:
- `400 Bad Request`: Audit not completed yet
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Audit belongs to another user
- `404 Not Found`: Audit not found
- `500 Internal Server Error`: PDF generation failed

---

### Download Raw Data (ZIP)

#### `GET /api/audits/{audit_id}/raw`

Download raw audit data as ZIP file (JSON files).

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Response** (200):
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename=audit_{audit_id}_raw.zip`

**ZIP contents**:
- `audit.json` - Full audit object
- `crawl.json` - Screaming Frog crawl data
- `lighthouse_desktop.json` - Desktop Lighthouse data
- `lighthouse_mobile.json` - Mobile Lighthouse data
- `ai_analysis.json` - AI recommendations

**Errors**: Same as PDF endpoint

---

### Admin: Get Audit Detail (Read-Only)

#### `GET /api/admin/audits/{audit_id}`

Read-only diagnostic endpoint for super admins. Returns full audit payload (including `results`, `processing_logs`, and competitors) without exposing mutating operations.

**Headers**: `Authorization: Bearer <token>`

**Auth**:
- Requires valid Supabase JWT
- Requires `profiles.is_super_admin = true`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Response** (200):
- Same core fields as `GET /api/audits/{audit_id}` plus operational metadata used by admin inspector UI.

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Super admin access required
- `404 Not Found`: Audit not found

---

### Admin: Start Impersonation Session (Single Audit)

#### `POST /api/admin/impersonation/sessions`

Create a short-lived admin impersonation token scoped to a single audit.

**Headers**: `Authorization: Bearer <token>`

**Auth**:
- Requires valid Supabase JWT
- Requires `profiles.is_super_admin = true`

**Body**:
```json
{
  "audit_id": "85d6ee6f-8c55-4c98-abd8-60dedfafa9df",
  "ttl_minutes": 30
}
```

**Response** (200):
```json
{
  "impersonation_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2026-03-05T12:00:00+00:00",
  "audit_id": "85d6ee6f-8c55-4c98-abd8-60dedfafa9df",
  "workspace_id": "11111111-2222-3333-4444-555555555555",
  "project_id": "66666666-7777-8888-9999-aaaaaaaaaaaa"
}
```

**Errors**:
- `400 Bad Request`: Audit is not workspace-scoped or workspace owner missing
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Super admin access required
- `404 Not Found`: Audit not found

---

### Impersonation Policy (Single Audit, Read+Export)

When `X-Impersonation-Token` is present, API access is deny-by-default and limited to:
- `GET /api/audits/{audit_id}`
- `GET /api/audits/{audit_id}/status`
- `GET /api/audits/{audit_id}/pdf`
- `GET /api/audits/{audit_id}/raw`

All other endpoints during impersonation return `403`, including all `/api/chat/*` and all mutating methods (`POST`, `PATCH`, `DELETE`).

---

## Tasks Endpoints

Execution plan tasks generated by the AI pipeline. Tasks are scoped to an audit and support interactive status tracking.

All tasks endpoints require **Supabase JWT** authentication and enforce workspace membership for the audit.

### List Tasks

#### `GET /api/audits/{audit_id}/tasks`

List all tasks for an audit with optional filters.

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Query parameters**:
- `module` (string, optional): Filter by module (`seo`, `performance`, `visibility`, etc.)
- `priority` (string, optional): Filter by priority (`critical`, `high`, `medium`, `low`)
- `status` (string, optional): Filter by status (`pending`, `done`)
- `is_quick_win` (bool, optional): Filter quick wins only

**Response** (200):
```json
{
  "total": 24,
  "items": [
    {
      "id": "task-uuid",
      "audit_id": "audit-uuid",
      "title": "Add missing ALT attributes to images",
      "description": "2 out of 12 images lack ALT text...",
      "category": "on-page",
      "priority": "high",
      "impact": "medium",
      "effort": "low",
      "fix_data": null,
      "status": "pending",
      "notes": null,
      "module": "seo",
      "is_quick_win": true,
      "sort_order": 1,
      "created_at": "2025-02-03T10:05:30Z",
      "completed_at": null
    }
  ]
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not a member of the workspace
- `404 Not Found`: Audit not found

---

### Get Task Summary

#### `GET /api/audits/{audit_id}/tasks/summary`

Get aggregated task statistics for an audit.

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Response** (200):
```json
{
  "total": 24,
  "pending": 18,
  "done": 6,
  "quick_wins_total": 8,
  "quick_wins_done": 3,
  "by_module": {
    "seo": { "total": 10, "pending": 7, "done": 3 },
    "performance": { "total": 8, "pending": 6, "done": 2 }
  },
  "by_priority": {
    "critical": 2,
    "high": 8,
    "medium": 10,
    "low": 4
  }
}
```

**Errors**: Same as `GET /api/audits/{audit_id}/tasks`

---

### Update Task

#### `PATCH /api/audits/{audit_id}/tasks/{task_id}`

Update a single task (status, notes, priority).

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID
- `task_id` (UUID): Task ID

**Request body** (all fields optional):
```json
{
  "status": "done",
  "notes": "Fixed in deploy v2.3",
  "priority": "high"
}
```

**Response** (200): Updated `AuditTask` object

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not a member of the workspace
- `404 Not Found`: Audit or task not found

---

### Bulk Update Tasks

#### `PATCH /api/audits/{audit_id}/tasks/bulk`

Bulk update multiple tasks at once.

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `audit_id` (UUID): Audit ID

**Request body**:
```json
{
  "task_ids": ["task-uuid-1", "task-uuid-2"],
  "status": "done",
  "priority": "medium"
}
```

**Response** (200):
```json
{
  "updated": 2
}
```

**Errors**: Same as `PATCH /api/audits/{audit_id}/tasks/{task_id}`

---

## Billing Endpoints

Stripe-based billing for workspace subscriptions. All endpoints (except webhook) require **Supabase JWT** authentication.

### Create Checkout Session

#### `POST /api/billing/create-checkout-session`

Create a Stripe checkout session for upgrading a workspace subscription.

**Headers**: `Authorization: Bearer <token>`

**Auth**: Requires workspace **owner** role.

**Request body**:
```json
{
  "workspace_id": "workspace-uuid",
  "price_id": "price_1234abc"
}
```

**Response** (200):
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_..."
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Only workspace owners can upgrade
- `404 Not Found`: Subscription not found
- `400 Bad Request`: Stripe error

---

### Stripe Webhook

#### `POST /api/billing/webhook`

Handle Stripe webhook events. **No JWT auth** — verified via Stripe signature.

**Headers**: `Stripe-Signature: <signature>`

**Handled events**:
- `checkout.session.completed` — Activate subscription (pro/enterprise)
- `customer.subscription.updated` — Sync subscription status and period
- `customer.subscription.deleted` — Downgrade to free plan
- `invoice.paid` — Record invoice

**Response** (200):
```json
{
  "status": "success"
}
```

**Errors**:
- `400 Bad Request`: Invalid payload or signature

---

### Create Portal Session

#### `POST /api/billing/create-portal-session`

Create a Stripe Customer Portal session for managing subscription (update payment method, cancel, view invoices).

**Headers**: `Authorization: Bearer <token>`

**Auth**: Requires workspace **owner** role.

**Query parameters**:
- `workspace_id` (string, required): Workspace ID

**Response** (200):
```json
{
  "portal_url": "https://billing.stripe.com/p/session/..."
}
```

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Only workspace owners can manage billing
- `404 Not Found`: No Stripe customer found
- `400 Bad Request`: Stripe error

---

## Schedules Endpoints

Recurring audit schedules scoped to a workspace (and optionally a project). All endpoints require **Supabase JWT** authentication and workspace membership.

### Create Schedule

#### `POST /api/schedules`

Create a new recurring audit schedule.

**Headers**: `Authorization: Bearer <token>`

**Request body**:
```json
{
  "workspace_id": "workspace-uuid",
  "project_id": "project-uuid-or-null",
  "url": "https://example.com",
  "frequency": "weekly",
  "include_competitors": true,
  "competitors_urls": ["https://competitor1.com"]
}
```

- `frequency`: `daily` | `weekly` | `monthly`
- `project_id` (optional): Link schedule to a project (project must belong to workspace)

**Response** (201): `AuditSchedule` object

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not a workspace member (or not authorized for project)
- `400 Bad Request`: Project does not belong to workspace

---

### List Schedules

#### `GET /api/schedules`

List all schedules for a workspace, optionally filtered by project.

**Headers**: `Authorization: Bearer <token>`

**Query parameters**:
- `workspace_id` (UUID, required): Workspace ID
- `project_id` (UUID, optional): Filter by project

**Response** (200): Array of `AuditSchedule` objects

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not a workspace member

---

### Update Schedule

#### `PATCH /api/schedules/{schedule_id}`

Update a schedule (frequency, active status, competitors).

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `schedule_id` (UUID): Schedule ID

**Request body** (all fields optional):
```json
{
  "frequency": "monthly",
  "is_active": false,
  "include_competitors": false,
  "competitors_urls": []
}
```

**Response** (200): Updated `AuditSchedule` object

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not a workspace member
- `404 Not Found`: Schedule not found

---

### Delete Schedule

#### `DELETE /api/schedules/{schedule_id}`

Delete a schedule. Requires workspace **admin** role.

**Headers**: `Authorization: Bearer <token>`

**Path parameters**:
- `schedule_id` (UUID): Schedule ID

**Response** (204): No content

**Errors**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Admin role required
- `404 Not Found`: Schedule not found

---

## Data Models

### User

```typescript
interface User {
  id: string  // UUID
  email: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
  audits_count: number
  created_at: string  // ISO 8601
  updated_at: string  // ISO 8601
}
```

### Audit

```typescript
interface Audit {
  id: string  // UUID
  user_id: string  // UUID
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  ai_status?: 'processing' | 'completed' | 'failed' | 'skipped' | null
  processing_step?: string | null
  processing_logs?: Array<{
    timestamp: string
    step: string
    status: 'running' | 'success' | 'warning' | 'error' | 'skipped'
    message: string
    duration_ms?: number | null
  }> | null
  overall_score: number | null  // 0-100
  seo_score: number | null  // 0-100
  performance_score: number | null  // 0-100
  content_score: number | null  // 0-100
  is_local_business: boolean
  results: AuditResults | null
  pdf_url: string | null
  error_message: string | null
  created_at: string  // ISO 8601
  started_at: string | null  // ISO 8601
  completed_at: string | null  // ISO 8601
  competitors: Competitor[]
}
```

### AuditResults

```typescript
interface AuditResults {
  crawl: CrawlData
  lighthouse: {
    desktop: LighthouseData
    mobile: LighthouseData
  }
  content_analysis: ContentAnalysis
  local_seo: LocalSeoAnalysis
  performance_analysis: PerformanceAnalysis
  competitive_analysis: CompetitiveAnalysis
}
```

### CrawlData

```typescript
interface CrawlData {
  title: string
  title_length: number
  meta_description: string
  meta_description_length: number
  h1_tags: string[]
  h1_count: number
  status_code: number
  word_count: number
  size_bytes: number
  load_time: number  // seconds
  total_images: number
  images_without_alt: number
  internal_links_count: number
  has_sitemap: boolean
  structured_data?: Record<string, any>
  structured_data_v2?: {
    found: boolean
    total_items: number
    types: string[]
    items: Array<{
      type: string
      priority: 'critical' | 'high' | 'medium' | 'low'
      missing_required: string[]
      missing_recommended: string[]
      has_issues: boolean
    }>
    missing_priority_types: string[]
    ai_crawler_readiness: {
      score: number
      status: 'good' | 'partial' | 'poor'
      notes: string[]
    }
  }
  render_nojs?: {
    score: number
    status: 'good' | 'partial' | 'poor'
    issues: string[]
    recommendations: string[]
  }
  soft_404?: {
    soft_404_count: number
    low_content_count: number
    soft_404_samples: Array<Record<string, any>>
    low_content_samples: Array<Record<string, any>>
  }
  directives_hreflang?: {
    noindex_count: number
    nofollow_count: number
    x_robots_count: number
    hreflang_count: number
    issues: string[]
  }
  semantic_html?: {
    score: number
    issues: string[]
    recommendations: string[]
    elements: Record<string, number>
  }
}
```

### LighthouseData

```typescript
interface LighthouseData {
  url: string
  device: 'desktop' | 'mobile'
  performance_score: number  // 0-100
  accessibility_score: number  // 0-100
  best_practices_score: number  // 0-100
  seo_score: number  // 0-100
  ttfb: number  // milliseconds
  fcp: number  // milliseconds
  lcp: number  // milliseconds
  cls: number  // Cumulative Layout Shift
  total_blocking_time: number  // milliseconds
  speed_index: number  // milliseconds
}
```

### ContentAnalysis

```typescript
interface ContentAnalysis {
  quality_score: number  // 0-100
  readability_score: number  // 0-100
  recommendations: string[]
  word_count: number
  has_title: boolean
  has_meta_description: boolean
  has_h1: boolean
}
```

### LocalSeoAnalysis

```typescript
interface LocalSeoAnalysis {
  is_local_business: boolean
  has_nap: boolean  // Name, Address, Phone
  has_schema_markup: boolean
  recommendations: string[]
}
```

### PerformanceAnalysis

```typescript
interface PerformanceAnalysis {
  issues: string[]
  recommendations: string[]
  ttfb_desktop: number
  lcp_desktop: number
  performance_score: number
  impact: 'low' | 'medium' | 'high'
}
```

### CompetitiveAnalysis

```typescript
interface CompetitiveAnalysis {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  recommendations: string[]
  competitors_analyzed: number
}
```

### Competitor

```typescript
interface Competitor {
  id: string  // UUID
  audit_id: string  // UUID
  url: string
  status: 'pending' | 'completed' | 'failed'
  results: {
    lighthouse: LighthouseData
  } | null
  created_at: string  // ISO 8601
}
```

### AuditTask

```typescript
interface AuditTask {
  id: string
  audit_id: string
  title: string
  description: string
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: string
  effort: string
  fix_data: Record<string, any> | null
  status: 'pending' | 'done'
  notes: string | null
  module: string
  is_quick_win: boolean
  sort_order: number
  created_at: string
  completed_at: string | null
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "detail": "Error message"
}
```

### Validation Error Format

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "Invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

---

## HTTP Status Codes

- `200 OK` - Successful GET request
- `201 Created` - Successful POST (resource created)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request (e.g., audit not completed for PDF)
- `401 Unauthorized` - Invalid/missing authentication token
- `403 Forbidden` - Not authorized to access resource
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., email taken)
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

---

## Projects Endpoints

Projects live in Supabase; access is enforced via `verify_project_access` (workspace owner/admin see all; workspace members see only projects they are in).

- `POST /api/projects?workspace_id=...` — Create project (workspace admin/owner). Body: `{ name, url, description? }`.
- `GET /api/projects?workspace_id=...` — List projects (filtered by access).
- `GET /api/projects/{project_id}` — Get project with stats (audits_count, latest_audit_score, schedule_active).
- `PATCH /api/projects/{project_id}` — Update project (workspace admin/owner or project manager).
- `DELETE /api/projects/{project_id}` — Delete project, unlink audits/schedules (workspace admin/owner only).
- `GET /api/projects/{project_id}/members` — List project members (with email/full_name when available).
- `POST /api/projects/{project_id}/members` — Add member. Body: `{ user_id, role }` (`manager`|`member`|`viewer`). User must be workspace member.
- `PATCH /api/projects/{project_id}/members/{member_id}` — Update role.
- `DELETE /api/projects/{project_id}/members/{member_id}` — Remove member.

Audits and schedules support optional `project_id`: `POST/GET /api/audits`, `GET /api/audits/history`, `POST/GET /api/schedules` accept `project_id` query/body to scope to a project.

---

## Chat Endpoints (Agent Chat + RAG)

All chat endpoints use **Supabase JWT** (`Authorization: Bearer <token>`) and enforce **workspace membership** for the audit's workspace.

### Agents

- `GET /api/chat/agents`
  - Optional query: `workspace_id` (includes workspace-scoped custom agents)
  - Returns predefined agents + custom agents. Ordering:
    - system agents first
    - then by `sort_order` (fallback: `name`)

- `POST /api/chat/agents`
  - Body: `{ workspace_id, name, description?, icon?, system_prompt, tools_config, sort_order? }`
  - Creates a workspace-scoped custom agent (`is_system=false`)

- `PUT /api/chat/agents/{agent_id}?workspace_id=...`
  - Updates a custom agent (system agents cannot be edited/deleted)

- `DELETE /api/chat/agents/{agent_id}?workspace_id=...`

- `PATCH /api/chat/agents/order`
  - Body: `{ workspace_id, items: [{ id, sort_order }] }`
  - Updates ordering for custom agents in this workspace

### Conversations

- `POST /api/chat/conversations`
  - Body: `{ audit_id, workspace_id, agent_slug }`
  - Creates a new conversation thread for a given audit + agent

- `GET /api/chat/conversations?workspace_id=...&audit_id=...&agent_slug=...`
  - Lists conversations for the current user (includes shared conversations)

- `GET /api/chat/conversations/{conversation_id}`
  - Returns `{ conversation, agent, messages }`

- `PATCH /api/chat/conversations/{conversation_id}`
  - Body: `{ title?, is_shared?, verbosity?, tone? }`
  - `verbosity`: `concise|balanced|detailed`
  - `tone`: `technical|professional|simple`

- `DELETE /api/chat/conversations/{conversation_id}`

### Messaging (SSE)

- `POST /api/chat/conversations/{conversation_id}/messages/stream`
  - Body: `{ content, attachment_ids? }`
  - Response: `text/event-stream` (SSE). Emits:
    - `data: {"status":"searching|generating|streaming"}` (UX phases)
    - `data: {"token":"..."}` chunks (true streaming when available)
    - `data: {"suggestions":["...","...","..."]}` (follow-up message suggestions)
    - `data: [DONE]` sentinel
  - Notes:
    - Uses POST (not EventSource) because it requires auth header + request body.
    - RAG retrieval is filtered by `audit_id` and the agent's allowed sections.

### Attachments

- `POST /api/chat/attachments/upload` (multipart/form-data)
  - Fields: `conversation_id`, `file`
  - Returns attachment metadata `{ id, filename, mime_type, size_bytes, created_at }`

- `GET /api/chat/attachments/{attachment_id}`
  - Returns the raw file (auth required)

### Feedback

- `POST /api/chat/messages/{message_id}/feedback`
  - Body: `{ rating }` where rating is `+1` or `-1`

### Sharing

- `POST /api/chat/conversations/{conversation_id}/share`
  - Body: `{ shared_with_user_id, permission }` (`read|write`)

- `DELETE /api/chat/conversations/{conversation_id}/share/{shared_with_user_id}`

### Usage / Rate Limiting

- `GET /api/chat/usage?workspace_id=...`
  - Returns `{ month, messages_sent, limit, subscription_tier }`
  - Limits (monthly): Free=100, Pro=500, Enterprise=unlimited

---

## Rate Limiting

**Current state**: Not implemented

**Future** (planned):
- Login: 10 requests/hour per IP
- Register: 5 requests/hour per IP
- Audit creation: 5 requests/hour per user
- GET endpoints: 60 requests/minute per user

---

## AI Trigger Endpoints

### `POST /api/audits/{audit_id}/run-ai`
Manually trigger full AI analysis for a completed audit.
- **Auth**: Required
- **Response**: `{ "status": "ai_started", "message": "..." }`
- **Notes**: Launches AI pipeline in background. Use when audit was created with `run_ai_pipeline=false`.
- **UI Guidance**: Frontend should poll `GET /api/audits/{id}` while `ai_status="processing"` and show explicit "AI analysis in progress" state.

### `POST /api/audits/{audit_id}/run-ai-context`
Trigger contextual AI analysis for specific area(s).
- **Auth**: Required
- **Query Params**: `area` (optional) - `seo|performance|visibility|ai_overviews|backlinks|links|images`
- **Response**: `{ "status": "completed", "areas_analyzed": [...], "message": "..." }`
- **Notes**: If `area` not specified, regenerates all areas + cross_tool + roadmap + executive_summary.
- **Behavior**: For full regeneration (`area` not provided) endpoint recalculates `results.ai_contexts`, `results.cross_tool`, `results.roadmap`, `results.executive_summary`, and unified `results.quick_wins`.

### `GET /api/audits/{audit_id}/quick-wins`
- Returns unified quick wins from all AI modules when available.
- Source of truth priority:
  1) aggregated `results.ai_contexts.*.quick_wins` + roadmap + ROI actions,
  2) cached `results.quick_wins`,
  3) legacy rule-based fallback generation.

---

## RAG / Chat Recovery

### `POST /api/audits/{audit_id}/reindex-rag`
Manually trigger audit-scoped RAG re-indexing for the agent chat (Qdrant).
- **Auth**: Required (workspace membership enforced; same access rules as `GET /api/audits/{audit_id}`)
- **Response**: `{ "status": "indexed" }`
- **Notes**:
  - Safe to call multiple times; it deletes existing points for `audit_id` and re-inserts.
  - Use when chat keeps responding with missing/empty context due to transient embedding/quota issues.

### `GET /api/audits/{audit_id}/rag-status`
Check whether RAG index is ready for a given audit.
- **Auth**: Required (same access rules)
- **Response**:
  ```json
  { "status": "ready|pending|not_applicable", "indexed_at": "ISO or null", "audit_status": "completed|..." }
  ```
- **Statuses**:
  - `ready` — `rag_indexed_at` is set; chat has full context.
  - `pending` — audit completed but RAG not yet indexed (show banner in UI).
  - `not_applicable` — audit still running.
- **Frontend**: ChatPanel polls this every 5s while status != "ready" and shows an amber banner.

---

## Senuto Data Contract (in `GET /api/audits/{id}`)

`audit.results.senuto` now contains expanded payload:

- `senuto._meta.positions_total` - total available keywords from Senuto pagination.
- `senuto.visibility.positions|wins|losses` - high-cap paginated datasets.
- `senuto.visibility.sections_subdomains` - subdomains statistics list.
- `senuto.visibility.sections_urls` - URL-level sections statistics list.
- `senuto.visibility.ai_overviews.statistics` - aggregate AIO metrics.
- `senuto.visibility.ai_overviews.keywords` - keyword-level AIO rows with intentions and AIO text metadata.
- `senuto.visibility.ai_overviews.competitors` - AIO competitor comparison dataset.

AI contextual analyses can include:
- `results.ai_contexts.ai_overviews` (when AIO data is available)

Raw ZIP export now includes:
- `senuto/ai_overviews.json`
- `senuto/sections_detail.json`

### Schema Normalization (Feb 2026)

The `GET /api/audits/{id}` endpoint performs on-the-fly normalization for older audits to ensure UI consistency:
- **Senuto Backlinks**: Injects `backlinks_count` and `domains_count` into `senuto.backlinks.statistics` if missing.
- **Sitemap Detection**: Performs best-effort sitemap detection (robots.txt + common endpoints) if the stored crawl results lack sitemap info.

### Metric Value Normalization for Consumers (Mar 2026)

No new API fields were introduced, but consumers (PDF/UI) must treat Senuto aggregate metrics as nested structures where value can be present in:
- `current`
- `recent_value`
- (legacy fallbacks) `value` / `previous`

This is especially important for:
- `senuto.visibility.statistics.statistics.*`
- `senuto.visibility.ai_overviews.statistics.*`
- `senuto.visibility.competitors[].statistics.*`
- `senuto.backlinks.link_attributes` (domain-keyed object with attribute arrays)

Recommended consumer rule:
- prefer `current`,
- fallback to `recent_value`,
- never assume flat numeric fields at top level.

---

## CORS

**Allowed origins**:
- `https://sitespector.app`
- `https://www.sitespector.app`
- (Deprecated) direct IP access is not documented; use `https://sitespector.app`

**Allowed methods**: All (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`)

**Allowed headers**: All

**Credentials**: Yes

---

## OpenAPI Documentation

**Swagger UI**: `https://sitespector.app/api/docs`  
**ReDoc**: `https://sitespector.app/api/redoc`  
**OpenAPI JSON**: `https://sitespector.app/api/openapi.json`

> **Note**: Swagger/OpenAPI is **disabled in production** (returns 404).

---

### Monitoring Endpoints

#### `GET /api/system/status`

**Auth**: `X-Admin-Token` header OR Supabase Bearer JWT (dual auth).

Returns health status of all critical services.

**Response** (200):
```json
{
  "timestamp": "2026-02-15T18:00:00.000000",
  "version": "2.0.0",
  "services": {
    "screaming_frog": { "status": "online", "version": "Commercial/CLI" },
    "lighthouse": { "status": "online", "version": "12.x.x" },
    "worker": { "status": "online", "pid": "1" },
    "database": { "status": "online", "message": "accepting connections" },
    "senuto": { "status": "online", "version": "API v2" },
    "qdrant": { "status": "online", "version": "v1.13.2", "collections": 0 }
  }
}
```

**Service statuses**: `online` | `offline` | `error`

**Auth behavior**:
- Missing token -> `401` with: `Provide X-Admin-Token header or Bearer token`
- Invalid bearer token -> `401` (never escalated to `500`)

**Resilience behavior**:
- Individual service check failures are reported per service (`offline`/`error`).
- Endpoint should continue returning a status payload instead of failing whole response for single-check errors.

#### `GET /api/logs/worker`

**Auth**: `X-Admin-Token` header only.  
**Query**: `lines` (int, default 100, max 1000)

#### `GET /api/logs/backend`

**Auth**: `X-Admin-Token` header only.  
**Query**: `lines` (int, default 100, max 1000)

---

**Last Updated**: 2026-03-17  
**API Version**: v1  
**Base URL**: https://sitespector.app/api
