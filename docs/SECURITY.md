# Security Best Practices
## SiteSpector.app

---

## 🔐 Authentication & Authorization

### Password Policy
- Minimum 12 characters
- Must include: uppercase, lowercase, number, symbol
- Check against leaked passwords (HaveIBeenPwned API)
- Bcrypt hashing (cost factor: 12)

### JWT Tokens
- Expiration: 7 days
- Refresh token: Not in MVP (implement in Etap 2)
- HttpOnly cookies (future: store token in cookie, not localStorage)
- Secret rotation: Every 90 days

### Rate Limiting
- Login: 5 attempts per 15 minutes (account lockout after)
- Register: 3 per hour per IP
- API: 5 audits/hour, 60 GET/minute

---

## 🛡️ Data Protection (GDPR)

### Personal Data Collected
- Email (required for account)
- Password (hashed, never stored plain)
- Audit URLs (user-generated content)

### User Rights
- **Right to access:** Export all data (JSON)
- **Right to delete:** Delete account + all audits
- **Right to portability:** Download all reports (PDF)

### Data Retention
- Active accounts: Indefinite
- Deleted accounts: 30 days (soft delete), then permanent
- Audit reports: 6 months, then auto-delete
- Logs: 90 days

---

## 🚨 Input Validation

### URL Validation
```python
from pydantic import HttpUrl, validator

class AuditCreate(BaseModel):
    url: HttpUrl  # Must be valid HTTPS
    
    @validator('url')
    def must_be_https(cls, v):
        if not v.scheme == 'https':
            raise ValueError('Only HTTPS URLs allowed')
        return v
```

### SQL Injection Prevention
- Use SQLAlchemy ORM (parameterized queries)
- Never use raw SQL with user input
- Example: ❌ `f"SELECT * FROM users WHERE email = '{email}'"`
- Example: ✅ `session.query(User).filter(User.email == email)`

### XSS Prevention
- Next.js auto-escapes (React)
- Backend: Sanitize all text fields
- CSP headers: `Content-Security-Policy: default-src 'self'`

---

## 🔒 Secret Management

### Environment Variables
```bash
# Never commit these!
JWT_SECRET_KEY=<openssl rand -hex 32>
CLAUDE_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
```

### Railway Secrets
- Use Railway's encrypted environment variables
- Rotate secrets every 90 days
- Use different secrets for dev/prod

### Git Secrets Prevention
```bash
# Install git-secrets
brew install git-secrets

# Setup in repo
cd sitespector
git secrets --install
git secrets --register-aws  # Add more patterns
```

---

## 🌐 Network Security

### HTTPS Only
- Force HTTPS redirect (Railway handles)
- HSTS header: `Strict-Transport-Security: max-age=31536000`

### CORS
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sitespector.app"],  # Prod only
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)
```

### CSP Headers
```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
```

---

## 📊 Logging & Monitoring

### What to Log
- Authentication attempts (success/failure)
- Audit creation/completion
- API errors (500, 429)
- Rate limit hits

### What NOT to Log
- Passwords (even hashed)
- JWT tokens
- Full request bodies (may contain sensitive data)
- User's audit URLs (PII)

### Log Retention
- Application logs: 90 days
- Security logs: 1 year
- Access logs: 30 days

---

## 🚨 Incident Response Plan

### If API Key Leaked
1. Immediately rotate key (new CLAUDE_API_KEY)
2. Revoke old key in Anthropic Console
3. Check usage logs for abuse
4. Deploy new key to Railway
5. Monitor for 24 hours

### If Database Breach
1. Take service offline immediately
2. Change all passwords (DATABASE_URL, admin accounts)
3. Restore from backup (last known good)
4. Notify users within 72 hours (GDPR requirement)
5. Forensics: Determine attack vector
6. Fix vulnerability before relaunch

---

## ✅ Security Checklist

### Before Production
- [ ] All API keys in environment variables
- [ ] Password hashing enabled (bcrypt)
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] CORS configured (production domain only)
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] CSRF protection (if using cookies)
- [ ] Security headers (HSTS, CSP, X-Frame-Options)

### Monthly Review
- [ ] Check for leaked secrets (GitHub)
- [ ] Review access logs for suspicious activity
- [ ] Update dependencies (`npm audit`, `pip list --outdated`)
- [ ] Rotate JWT secret if >90 days old
- [ ] Check Railway security advisories

---

**Document Status:** ✅ COMPLETE
