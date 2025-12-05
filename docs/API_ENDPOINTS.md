# API Endpoints Documentation
## SiteSpector.app Backend API

**Base URL (Dev):** `http://localhost:8000`  
**Base URL (Prod):** `https://api.sitespector.app`  
**API Version:** v1  
**Framework:** FastAPI 0.109+

---

## 🔐 Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer {access_token}
```

**Token expiration:** 7 days  
**Refresh:** Not implemented in MVP (user must re-login)

---

## 📋 Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **Authentication** ||||
| POST | `/api/auth/register` | ❌ | Create new user account |
| POST | `/api/auth/login` | ❌ | Login & get JWT token |
| GET | `/api/auth/me` | ✅ | Get current user info |
| POST | `/api/auth/logout` | ✅ | Logout (client-side token removal) |
| **Audits** ||||
| POST | `/api/audits` | ✅ | Create new audit |
| GET | `/api/audits` | ✅ | List user's audits |
| GET | `/api/audits/{audit_id}` | ✅ | Get single audit details |
| GET | `/api/audits/{audit_id}/status` | ✅ | Poll audit status |
| GET | `/api/audits/{audit_id}/pdf` | ✅ | Download PDF report |
| DELETE | `/api/audits/{audit_id}` | ✅ | Delete audit |
| **Health** ||||
| GET | `/health` | ❌ | Health check |
| GET | `/docs` | ❌ | Swagger UI |

---

## 🔒 Authentication Endpoints

### POST /api/auth/register

Create a new user account.

**Request:**
```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Request Schema:**
```typescript
{
  email: string;     // Valid email format
  password: string;  // Min 8 chars, must include uppercase, lowercase, number
}
```

**Response 201 (Success):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "subscription_tier": "free",
    "audits_count": 0,
    "created_at": "2025-12-04T10:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
```json
// 400 - Email already exists
{
  "detail": "Email already registered"
}

// 422 - Validation error
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "Password must be at least 8 characters",
      "type": "value_error"
    }
  ]
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters optional but recommended

---

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200 (Success):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 604800
}
```

**Errors:**
```json
// 401 - Invalid credentials
{
  "detail": "Incorrect email or password"
}

// 422 - Validation error
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

### GET /api/auth/me

Get current authenticated user information.

**Request:**
```http
GET /api/auth/me HTTP/1.1
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "subscription_tier": "professional",
  "audits_count": 15,
  "audits_limit": 50,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-12-04T10:00:00Z"
}
```

**Errors:**
```json
// 401 - Invalid/expired token
{
  "detail": "Could not validate credentials"
}
```

---

## 🔍 Audit Endpoints

### POST /api/audits

Create a new audit.

**Request:**
```http
POST /api/audits HTTP/1.1
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "url": "https://example.com",
  "competitors": [
    "https://competitor1.com",
    "https://competitor2.com",
    "https://competitor3.com"
  ]
}
```

**Request Schema:**
```typescript
{
  url: string;           // Required, valid HTTPS URL
  competitors?: string[]; // Optional, max 3 URLs
}
```

**Validation Rules:**
- `url` must start with `http://` or `https://`
- `url` must be valid domain (no localhost in production)
- `competitors` array max 3 items
- Each competitor must be valid URL
- User must not exceed audit limit (based on subscription tier)

**Response 201 (Success):**
```json
{
  "audit_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "url": "https://example.com",
  "status": "pending",
  "competitors": [
    {
      "id": "comp-uuid-1",
      "url": "https://competitor1.com",
      "status": "pending"
    }
  ],
  "created_at": "2025-12-04T10:00:00Z",
  "estimated_completion": "2025-12-04T10:10:00Z"
}
```

**Errors:**
```json
// 400 - Invalid URL
{
  "detail": "Invalid URL format"
}

// 429 - Rate limit exceeded
{
  "detail": "Rate limit exceeded. You can create 5 audits per hour.",
  "retry_after": 3600
}

// 403 - Subscription limit reached
{
  "detail": "Monthly audit limit reached (10/10). Upgrade to Professional for more audits.",
  "upgrade_url": "https://sitespector.app/pricing"
}
```

---

### GET /api/audits

List all audits for authenticated user.

**Request:**
```http
GET /api/audits?status=completed&limit=20&offset=0 HTTP/1.1
Authorization: Bearer {access_token}
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter: `all`, `pending`, `processing`, `completed`, `failed` |
| `limit` | integer | 20 | Items per page (max 100) |
| `offset` | integer | 0 | Pagination offset |
| `sort_by` | string | created_at | Sort field: `created_at`, `overall_score`, `url` |
| `sort_order` | string | desc | Sort order: `asc`, `desc` |
| `search` | string | - | Search by URL (partial match) |

**Response 200:**
```json
{
  "total": 45,
  "limit": 20,
  "offset": 0,
  "audits": [
    {
      "id": "audit-uuid-1",
      "url": "https://example.com",
      "status": "completed",
      "overall_score": 72,
      "seo_score": 65,
      "performance_score": 80,
      "content_score": 70,
      "is_local_business": true,
      "created_at": "2025-12-04T10:00:00Z",
      "completed_at": "2025-12-04T10:08:00Z"
    },
    {
      "id": "audit-uuid-2",
      "url": "https://another-site.com",
      "status": "processing",
      "overall_score": null,
      "created_at": "2025-12-04T10:15:00Z",
      "completed_at": null
    }
  ]
}
```

---

### GET /api/audits/{audit_id}

Get detailed audit results.

**Request:**
```http
GET /api/audits/7c9e6679-7425-40de-944b-e07fc1f90ae7 HTTP/1.1
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "user_id": "user-uuid",
  "url": "https://example.com",
  "status": "completed",
  "overall_score": 72,
  "seo_score": 65,
  "performance_score": 80,
  "content_score": 70,
  "is_local_business": true,
  "created_at": "2025-12-04T10:00:00Z",
  "started_at": "2025-12-04T10:00:30Z",
  "completed_at": "2025-12-04T10:08:15Z",
  "duration_seconds": 465,
  "pdf_url": "https://storage.railway.app/audits/7c9e6679.pdf",
  
  "results": {
    "screaming_frog": {...},
    "lighthouse": {...},
    "ai_analysis": {...}
  },
  
  "competitors": [
    {
      "id": "comp-uuid-1",
      "url": "https://competitor1.com",
      "status": "completed",
      "results": {...}
    }
  ],
  
  "quick_wins": [
    {
      "title": "Add meta description",
      "priority": "HIGH",
      "estimated_time": 15,
      "impact": "+15 SEO points"
    }
  ]
}
```

**Errors:**
```json
// 404 - Audit not found
{
  "detail": "Audit not found"
}

// 403 - Not authorized (audit belongs to another user)
{
  "detail": "Not authorized to access this audit"
}
```

---

### GET /api/audits/{audit_id}/status

Poll audit processing status (for loading UI).

**Request:**
```http
GET /api/audits/7c9e6679-7425-40de-944b-e07fc1f90ae7/status HTTP/1.1
Authorization: Bearer {access_token}
```

**Response 200:**
```json
{
  "audit_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "processing",
  "progress": {
    "current_step": "Running Lighthouse analysis",
    "steps_completed": 2,
    "total_steps": 4,
    "percentage": 50
  },
  "estimated_time_remaining": 180,
  "started_at": "2025-12-04T10:00:30Z",
  "elapsed_seconds": 285
}
```

**Status Values:**
- `pending` - Waiting in queue
- `processing` - Currently running
- `completed` - Finished successfully
- `failed` - Error occurred

**Progress Steps:**
1. Scraping with Screaming Frog
2. Running Lighthouse analysis
3. AI content analysis
4. Generating PDF report

---

### GET /api/audits/{audit_id}/pdf

Download PDF report.

**Request:**
```http
GET /api/audits/7c9e6679-7425-40de-944b-e07fc1f90ae7/pdf HTTP/1.1
Authorization: Bearer {access_token}
```

**Response 200:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="sitespector_audit_example.com_20251204.pdf"

[Binary PDF data]
```

**Errors:**
```json
// 404 - PDF not yet generated
{
  "detail": "PDF report not available yet. Audit status: processing"
}

// 500 - PDF generation failed
{
  "detail": "PDF generation failed. Please try again or contact support."
}
```

---

### DELETE /api/audits/{audit_id}

Delete an audit (soft delete - mark as deleted, keep in DB).

**Request:**
```http
DELETE /api/audits/7c9e6679-7425-40de-944b-e07fc1f90ae7 HTTP/1.1
Authorization: Bearer {access_token}
```

**Response 204:**
```
No Content
```

**Errors:**
```json
// 404 - Audit not found
{
  "detail": "Audit not found"
}

// 403 - Not authorized
{
  "detail": "Not authorized to delete this audit"
}
```

---

## 🏥 Health & Utility Endpoints

### GET /health

Health check endpoint (for monitoring).

**Request:**
```http
GET /health HTTP/1.1
```

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-04T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "claude_api": "healthy",
    "worker": "healthy"
  }
}
```

---

### GET /docs

Swagger UI (interactive API documentation).

**URL:** `http://localhost:8000/docs`

---

## 🔢 Rate Limiting

**Limits (MVP):**

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/register` | 5 requests | per hour |
| `/api/auth/login` | 10 requests | per hour |
| `/api/audits` (POST) | 5 audits | per hour |
| `/api/audits` (GET) | 60 requests | per minute |
| `/api/audits/{id}` | 60 requests | per minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1733308800
```

**429 Response:**
```json
{
  "detail": "Rate limit exceeded",
  "retry_after": 3600
}
```

---

## 🛡️ Error Handling

### Standard Error Response Format

```json
{
  "detail": "Human-readable error message",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2025-12-04T10:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation error (Pydantic) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (logged) |
| 503 | Service Unavailable | Maintenance mode |

---

## 📝 Request/Response Examples

### Complete Flow: Register → Login → Create Audit → Poll → Download

```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Response: {"access_token":"eyJ...","user":{...}}

# 2. Login (if already registered)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Create audit
curl -X POST http://localhost:8000/api/audits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://example.com",
    "competitors":["https://competitor.com"]
  }'

# Response: {"audit_id":"7c9e6679...","status":"pending"}

# Save audit ID
AUDIT_ID="7c9e6679-7425-40de-944b-e07fc1f90ae7"

# 4. Poll status (repeat until status="completed")
curl -X GET http://localhost:8000/api/audits/$AUDIT_ID/status \
  -H "Authorization: Bearer $TOKEN"

# Response: {"status":"processing","progress":{"percentage":50}}

# 5. Get full results
curl -X GET http://localhost:8000/api/audits/$AUDIT_ID \
  -H "Authorization: Bearer $TOKEN"

# 6. Download PDF
curl -X GET http://localhost:8000/api/audits/$AUDIT_ID/pdf \
  -H "Authorization: Bearer $TOKEN" \
  -o report.pdf
```

---

## 🧪 Testing Endpoints

### Using httpx (Python)

```python
import httpx

BASE_URL = "http://localhost:8000"

# Register
response = httpx.post(
    f"{BASE_URL}/api/auth/register",
    json={"email": "test@example.com", "password": "SecurePass123!"}
)
token = response.json()["access_token"]

# Create audit
response = httpx.post(
    f"{BASE_URL}/api/audits",
    json={"url": "https://example.com"},
    headers={"Authorization": f"Bearer {token}"}
)
audit_id = response.json()["audit_id"]

# Get results
response = httpx.get(
    f"{BASE_URL}/api/audits/{audit_id}",
    headers={"Authorization": f"Bearer {token}"}
)
print(response.json())
```

---

## ✅ API Checklist

**Development:**
- [ ] All endpoints documented in Swagger UI
- [ ] Request/response schemas validated (Pydantic)
- [ ] Error handling covers all edge cases
- [ ] Rate limiting implemented
- [ ] CORS configured for frontend domain
- [ ] API tests written (pytest)

**Production:**
- [ ] HTTPS enforced
- [ ] Rate limits tuned for production traffic
- [ ] API versioning strategy decided
- [ ] Monitoring/logging configured
- [ ] API keys secured (environment variables)

---

**Document Status:** ✅ COMPLETE  
**Related:** ARCHITECTURE.md, DATABASE_SCHEMA.md  
**Next:** AI_PROMPTS.md (Claude prompt templates)
