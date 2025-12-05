# Error Handling Guide
## SiteSpector.app - Comprehensive Error Management

---

## 🎯 Error Philosophy

**Principles:**
1. **User-friendly messages** (no technical jargon)
2. **Actionable guidance** (tell user what to do)
3. **Graceful degradation** (partial results > no results)
4. **Detailed logging** (for debugging, not shown to user)

---

## 📊 Error Response Format (API)

### Standard Error Response
```json
{
  "detail": "User-friendly error message",
  "error_code": "AUDIT_NOT_FOUND",
  "timestamp": "2025-12-04T10:30:00Z",
  "request_id": "req_abc123",
  "suggestions": [
    "Check if the audit ID is correct",
    "Ensure you have permission to view this audit"
  ]
}
```

### HTTP Status Codes
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (no token or expired)
- `403` - Forbidden (no permission)
- `404` - Not Found (resource doesn't exist)
- `422` - Validation Error (Pydantic)
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
- `503` - Service Unavailable (maintenance)

---

## 🔴 Backend Error Handling

### Custom Exceptions
```python
# backend/app/exceptions.py
class SiteSpectorException(Exception):
    """Base exception"""
    def __init__(self, detail: str, error_code: str):
        self.detail = detail
        self.error_code = error_code

class AuditNotFoundError(SiteSpectorException):
    def __init__(self, audit_id: str):
        super().__init__(
            detail=f"Audit {audit_id} not found",
            error_code="AUDIT_NOT_FOUND"
        )

class UnauthorizedError(SiteSpectorException):
    def __init__(self):
        super().__init__(
            detail="You don't have permission to access this resource",
            error_code="UNAUTHORIZED"
        )

class RateLimitError(SiteSpectorException):
    def __init__(self, retry_after: int):
        super().__init__(
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds",
            error_code="RATE_LIMIT_EXCEEDED"
        )
        self.retry_after = retry_after
```

### Global Exception Handler
```python
# backend/app/main.py
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(SiteSpectorException)
async def sitespector_exception_handler(request: Request, exc: SiteSpectorException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request.state.request_id,
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log full traceback
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Return generic error to user
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred. Our team has been notified.",
            "error_code": "INTERNAL_ERROR",
            "request_id": request.state.request_id,
        }
    )
```

---

## 🟡 Service-Level Error Handling

### Screaming Frog Errors
```python
async def crawl_url(url: str) -> dict:
    try:
        result = await run_screaming_frog(url)
        return result
    except subprocess.TimeoutExpired:
        logger.warning(f"SF timeout for {url}")
        raise AuditTimeoutError("Crawl took too long (>10 minutes)")
    except subprocess.CalledProcessError as e:
        logger.error(f"SF failed: {e.stderr}")
        # Graceful degradation: Return empty result
        return {"meta_tags": {}, "status": "partial"}
```

### Claude API Errors
```python
async def analyze_content(text: str) -> dict:
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = await claude_client.messages.create(...)
            return parse_response(response)
        except anthropic.RateLimitError:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                await asyncio.sleep(wait_time)
            else:
                raise AIServiceError("Claude API rate limit exceeded")
        except anthropic.APIError as e:
            logger.error(f"Claude API error: {e}")
            raise AIServiceError("AI analysis temporarily unavailable")
```

---

## 🔵 Frontend Error Handling

### API Client with Retry
```typescript
// frontend/lib/api.ts
import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;
    
    // Retry on 5xx errors (max 3 attempts)
    if (error.response?.status >= 500 && config.retries < 3) {
      config.retries = (config.retries || 0) + 1;
      await new Promise(resolve => setTimeout(resolve, 1000 * config.retries));
      return api(config);
    }
    
    return Promise.reject(error);
  }
);

// Error handling wrapper
export async function createAudit(url: string) {
  try {
    const response = await api.post('/api/audits', { url });
    return { data: response.data, error: null };
  } catch (error: AxiosError) {
    if (error.response?.status === 429) {
      return {
        data: null,
        error: {
          message: 'You've reached your hourly audit limit. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      };
    }
    
    return {
      data: null,
      error: {
        message: error.response?.data?.detail || 'Failed to create audit',
        code: error.response?.data?.error_code || 'UNKNOWN_ERROR'
      }
    };
  }
}
```

### Toast Notifications
```typescript
// frontend/lib/toast.ts
import { toast } from 'sonner';

export function showError(message: string) {
  toast.error(message, {
    duration: 5000,
    action: {
      label: 'Dismiss',
      onClick: () => toast.dismiss(),
    },
  });
}

export function showSuccess(message: string) {
  toast.success(message, { duration: 3000 });
}

// Usage
const { error } = await createAudit(url);
if (error) {
  showError(error.message);
}
```

### Error Boundary (React)
```typescript
// frontend/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-gray-600 mt-2">
            We're sorry for the inconvenience. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🚨 Critical Error Scenarios

### Scenario 1: Audit Timeout
**Problem:** Audit takes >10 minutes  
**Solution:**
```python
# Set status to "failed"
audit.status = "failed"
audit.error_message = "Audit timed out. The website may be too slow or unreachable."

# Notify user via email (optional)
send_email(user.email, subject="Audit Failed", body=...)
```

### Scenario 2: Claude API Down
**Problem:** Claude API returns 503  
**Solution:**
```python
# Graceful degradation: Complete audit without AI
audit.status = "completed_partial"
audit.results = {
    "screaming_frog": {...},  # Technical data available
    "lighthouse": {...},
    "ai_analysis": None,  # AI unavailable
}

# Show message in report: "AI analysis temporarily unavailable"
```

### Scenario 3: Database Connection Lost
**Problem:** PostgreSQL unreachable  
**Solution:**
```python
# Retry with exponential backoff
@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=60))
async def get_audit(audit_id: str):
    async with get_db() as db:
        return await db.get(Audit, audit_id)

# If all retries fail, return 503 Service Unavailable
```

---

## ✅ Error Handling Checklist

### Backend
- [ ] All endpoints have try/catch
- [ ] Custom exceptions for common errors
- [ ] Global exception handler in FastAPI
- [ ] Graceful degradation for service failures
- [ ] Retry logic for external APIs
- [ ] Detailed logging (not shown to user)

### Frontend
- [ ] API errors handled in all calls
- [ ] Toast notifications for user feedback
- [ ] Error boundary for React crashes
- [ ] Retry logic for 5xx errors
- [ ] Loading states for async operations
- [ ] Offline detection

---

**Document Status:** ✅ COMPLETE
