# SiteSpector - API Documentation

## Base URL

**Production**: `https://sitespector.app/api` (IP fallback: `https://77.42.79.46/api`)  
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
  "competitors": [
    "https://competitor1.com",
    "https://competitor2.com",
    "https://competitor3.com"
  ]
}
```

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

---

### Delete Audit

#### `DELETE /api/audits/{audit_id}`

Delete an audit (cascades to competitors).

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
- **Query Params**: `area` (optional) - `seo|performance|visibility|backlinks|links|images`
- **Response**: `{ "status": "completed", "areas_analyzed": [...], "message": "..." }`
- **Notes**: If `area` not specified, regenerates all areas + cross_tool + roadmap + executive_summary.
- **Behavior**: For full regeneration (`area` not provided) endpoint recalculates `results.ai_contexts`, `results.cross_tool`, `results.roadmap`, and `results.executive_summary`.

---

## CORS

**Allowed origins**:
- `https://sitespector.app`
- `https://www.sitespector.app`
- `https://77.42.79.46`

**Allowed methods**: All (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`)

**Allowed headers**: All

**Credentials**: Yes

---

## OpenAPI Documentation

**Swagger UI**: `https://sitespector.app/api/docs`  
**ReDoc**: `https://sitespector.app/api/redoc`  
**OpenAPI JSON**: `https://sitespector.app/api/openapi.json`

---

**Last Updated**: 2026-02-11  
**API Version**: v1  
**Base URL**: https://sitespector.app/api
