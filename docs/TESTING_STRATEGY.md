# Testing Strategy
## SiteSpector.app - Comprehensive Test Plan

**Last Updated:** 2025-12-04  
**Coverage Target:** >80%

---

## 🎯 Testing Pyramid

```
       /\
      /E2E\        <- 10% (Critical user flows)
     /------\
    /Integration\ <- 30% (API + Services)
   /------------\
  / Unit Tests   \ <- 60% (Functions + Components)
 /----------------\
```

---

## 🧪 1. Unit Tests (Backend)

### Tools
- `pytest` - Test framework
- `pytest-asyncio` - Async support
- `pytest-cov` - Coverage reporting
- `httpx.AsyncClient` - API testing

### Structure
```
backend/tests/
├── conftest.py              # Fixtures
├── test_auth.py             # Auth logic
├── test_audits.py           # Audit CRUD
├── test_screaming_frog.py   # SF service
├── test_lighthouse.py       # Lighthouse service
├── test_ai_analysis.py      # AI prompts
└── test_pdf_generator.py    # PDF creation
```

### Example: test_auth.py
```python
import pytest
from app.auth import create_access_token, verify_password, hash_password

def test_password_hashing():
    password = "SecurePass123!"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("WrongPass", hashed)

def test_jwt_token_creation():
    token = create_access_token(data={"sub": "user@example.com"})
    
    assert isinstance(token, str)
    assert len(token) > 20

@pytest.mark.asyncio
async def test_register_endpoint(test_client):
    response = await test_client.post("/api/auth/register", json={
        "email": "new@example.com",
        "password": "SecurePass123!"
    })
    
    assert response.status_code == 201
    assert "access_token" in response.json()
```

### Fixtures (conftest.py)
```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.main import app
from app.database import Base, get_db

@pytest.fixture
async def test_db():
    """Clean test database"""
    engine = create_async_engine("postgresql+asyncpg://test:test@localhost/test_db")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def test_client(test_db):
    """HTTP client for API testing"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def test_user(test_db):
    """Create test user"""
    # Create user in DB
    return {"id": "123", "email": "test@example.com"}

@pytest.fixture
def auth_headers(test_user):
    """JWT auth headers"""
    token = create_access_token(data={"sub": test_user["email"]})
    return {"Authorization": f"Bearer {token}"}
```

### Running Tests
```bash
# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific file
pytest tests/test_auth.py -v

# With markers
pytest -m "not slow"
```

---

## 🧪 2. Integration Tests (Backend)

### What to Test
- Database operations (CRUD)
- API endpoint flows
- Service integrations (SF + Lighthouse + AI)

### Example: test_audit_flow.py
```python
@pytest.mark.asyncio
async def test_complete_audit_flow(test_client, auth_headers):
    # 1. Create audit
    response = await test_client.post(
        "/api/audits",
        json={"url": "https://example.com"},
        headers=auth_headers
    )
    assert response.status_code == 201
    audit_id = response.json()["id"]
    
    # 2. Check status is pending
    response = await test_client.get(f"/api/audits/{audit_id}", headers=auth_headers)
    assert response.json()["status"] == "pending"
    
    # 3. Simulate worker processing (mock services)
    with patch('app.services.screaming_frog.crawl_url') as mock_sf:
        mock_sf.return_value = {"meta_tags": {...}}
        # Trigger worker
        await process_audit(audit_id)
    
    # 4. Check status is completed
    response = await test_client.get(f"/api/audits/{audit_id}", headers=auth_headers)
    assert response.json()["status"] == "completed"
    assert response.json()["overall_score"] > 0
    
    # 5. Download PDF
    response = await test_client.get(f"/api/audits/{audit_id}/pdf", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
```

---

## 🧪 3. Unit Tests (Frontend)

### Tools
- `Jest` - Test runner
- `React Testing Library` - Component testing
- `@testing-library/user-event` - User interactions

### Structure
```
frontend/__tests__/
├── components/
│   ├── AuditCard.test.tsx
│   ├── StatusBadge.test.tsx
│   └── NewAuditDialog.test.tsx
├── lib/
│   └── api.test.ts
└── utils/
    └── formatters.test.ts
```

### Example: AuditCard.test.tsx
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditCard } from '@/components/AuditCard';

describe('AuditCard', () => {
  const mockAudit = {
    id: '123',
    url: 'https://example.com',
    status: 'completed',
    overall_score: 75,
    seo_score: 80,
    performance_score: 70,
    content_score: 75,
    created_at: new Date('2025-01-01'),
  };
  
  it('renders audit URL and scores', () => {
    render(<AuditCard audit={mockAudit} onView={jest.fn()} onDelete={jest.fn()} />);
    
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument(); // overall score
  });
  
  it('shows loading state for processing audits', () => {
    const processingAudit = { ...mockAudit, status: 'processing' };
    render(<AuditCard audit={processingAudit} onView={jest.fn()} onDelete={jest.fn()} />);
    
    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
  });
  
  it('calls onView when View Report clicked', () => {
    const onView = jest.fn();
    render(<AuditCard audit={mockAudit} onView={onView} onDelete={jest.fn()} />);
    
    fireEvent.click(screen.getByText('View Report'));
    expect(onView).toHaveBeenCalledWith('123');
  });
  
  it('disables View Report for non-completed audits', () => {
    const pendingAudit = { ...mockAudit, status: 'pending' };
    render(<AuditCard audit={pendingAudit} onView={jest.fn()} onDelete={jest.fn()} />);
    
    const button = screen.getByText('View Report');
    expect(button).toBeDisabled();
  });
});
```

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific file
npm test AuditCard.test.tsx
```

---

## 🧪 4. E2E Tests (Playwright)

### Tools
- `@playwright/test` - E2E framework
- Supports Chrome, Firefox, Safari

### Structure
```
frontend/e2e/
├── auth.spec.ts           # Register, login, logout
├── dashboard.spec.ts      # List audits, filters
├── audit-creation.spec.ts # Create audit flow
└── audit-view.spec.ts     # View results, download PDF
```

### Example: audit-creation.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test.describe('Audit Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
  });
  
  test('should create new audit and show in list', async ({ page }) => {
    // Click "New Audit" button
    await page.click('text=New Audit');
    
    // Fill in URL
    await page.fill('[name="url"]', 'https://example.com');
    
    // Submit
    await page.click('text=Create Audit');
    
    // Wait for dialog to close
    await expect(page.locator('role=dialog')).not.toBeVisible();
    
    // Check audit appears in list
    await expect(page.locator('text=https://example.com')).toBeVisible();
    
    // Check status is "pending" or "processing"
    await expect(page.locator('text=Pending').or(page.locator('text=Processing'))).toBeVisible();
  });
  
  test('should wait for audit completion and allow viewing', async ({ page }) => {
    // Create audit (already tested above, assume it exists)
    // ...
    
    // Poll for completion (max 5 minutes)
    await page.waitForSelector('text=Completed', { timeout: 300000 });
    
    // Click "View Report"
    await page.click('text=View Report');
    
    // Check we're on audit details page
    await page.waitForURL('**/audits/**');
    
    // Verify score is displayed
    await expect(page.locator('text=/Score: \\d+/100')).toBeVisible();
    
    // Verify tabs are present
    await expect(page.locator('role=tab[name="Overview"]')).toBeVisible();
    await expect(page.locator('role=tab[name="SEO Technical"]')).toBeVisible();
  });
  
  test('should download PDF report', async ({ page }) => {
    // Navigate to completed audit
    await page.goto('http://localhost:3000/audits/123'); // completed audit
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('text=Download PDF');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    expect(download.suggestedFilename()).toMatch(/sitespector-.*\\.pdf/);
  });
});
```

### Running E2E Tests
```bash
# Install browsers
npx playwright install

# Run tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Run specific test
npx playwright test audit-creation

# Generate report
npx playwright show-report
```

---

## 🧪 5. Load Testing (Optional)

### Tools
- `locust` - Python load testing

### Example: locustfile.py
```python
from locust import HttpUser, task, between

class SiteSpectorUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "SecurePass123!"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def list_audits(self):
        self.client.get("/api/audits", headers=self.headers)
    
    @task(1)
    def create_audit(self):
        self.client.post("/api/audits", headers=self.headers, json={
            "url": "https://example.com"
        })
    
    @task(2)
    def get_audit(self):
        self.client.get("/api/audits/123", headers=self.headers)
```

**Run:**
```bash
locust -f locustfile.py --host=http://localhost:8000
# Open http://localhost:8089
# Set users: 100, spawn rate: 10
```

---

## 📊 Coverage Targets

| Component | Target | Current |
|-----------|--------|---------|
| Backend API | 85% | TBD |
| Backend Services | 80% | TBD |
| Frontend Components | 75% | TBD |
| E2E Critical Flows | 100% | TBD |

---

## 🚀 CI/CD Integration

### GitHub Actions (.github/workflows/test.yml)
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage
  
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          npx playwright install --with-deps
      
      - name: Run E2E tests
        run: |
          cd frontend
          npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## ✅ Pre-Deployment Checklist

- [ ] All unit tests passing (backend + frontend)
- [ ] Integration tests passing
- [ ] E2E tests passing for critical flows
- [ ] Coverage > 80% on backend
- [ ] Coverage > 75% on frontend
- [ ] No critical security vulnerabilities (npm audit)
- [ ] Load test completed (100 concurrent users)
- [ ] Manual smoke test on staging environment

---

**Document Status:** ✅ COMPLETE  
**Next:** DEPLOYMENT_CHECKLIST.md
