# Cursor Quick Start Guide
## How to Use These Docs with Cursor AI

**For:** Developers new to Cursor + SiteSpector

---

## 🚀 Getting Started with Cursor

### 1. Install Cursor
```bash
# Download from: https://cursor.sh
# Or via Homebrew (Mac)
brew install --cask cursor
```

### 2. Open SiteSpector Project
```bash
# Create project directory
mkdir sitespector && cd sitespector

# Open in Cursor
cursor .
```

### 3. Start with Epic 1, Task 1.1

**Open:** `/docs/BACKLOG.md`  
**Find:** Epic 1, Task 1.1: Railway Project Setup

**Copy this prompt to Cursor:**
```
Create a Railway project setup guide for SiteSpector.

Steps:
1. Initialize Railway CLI
2. Create new project "sitespector"
3. Add PostgreSQL plugin (version 16)
4. Get DATABASE_URL and save to .env
5. Setup custom domain: api.sitespector.app

Generate:
- railway.json configuration file
- .env.example with all required variables
- README with deployment instructions
```

### 4. Cursor Generates Code

Cursor will:
- Create `railway.json`
- Create `.env.example`
- Write deployment README

### 5. Review & Run
```bash
# Run generated commands
railway link
railway add postgresql
railway env
```

---

## 💡 Pro Tips for Using Cursor

### Tip 1: Reference Other Docs
In your prompt, tell Cursor to reference specific docs:
```
Using the database schema from /docs/DATABASE_SCHEMA.md,
create the SQLAlchemy models in backend/app/models.py
```

### Tip 2: Iterative Refinement
If Cursor's first output isn't perfect:
```
The User model is missing the subscription_tier field.
Add it as Enum with values: free, starter, professional, agency
```

### Tip 3: Ask for Explanations
```
Explain why you used bcrypt with cost factor 12
instead of 10 for password hashing
```

### Tip 4: Request Tests
```
Now write pytest tests for the auth endpoints
with at least 80% coverage
```

---

## 📋 Typical Workflow

### Step 1: Read Task in BACKLOG.md
Example: Task 2.2: Auth Endpoints

### Step 2: Copy Cursor Prompt
```
Implement authentication endpoints for SiteSpector.

Use specifications from API_ENDPOINTS.md:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

Requirements:
- Password hashing with bcrypt (passlib)
- JWT token generation (python-jose)
- Token expiration: 7 days
- Pydantic schemas for request/response validation

Create:
1. app/routers/auth.py (endpoints)
2. app/schemas.py (UserCreate, UserLogin, UserResponse, Token)
3. app/auth.py (create_access_token, verify_password, etc.)

Follow API_ENDPOINTS.md for exact request/response formats.
```

### Step 3: Cursor Generates Files
- `backend/app/routers/auth.py` ✅
- `backend/app/schemas.py` ✅
- `backend/app/auth.py` ✅

### Step 4: Review Code
Check:
- Imports correct?
- Functions match specs?
- Error handling present?

### Step 5: Test
```bash
pytest backend/tests/test_auth.py -v
```

### Step 6: If Tests Fail, Ask Cursor
```
The test_register_endpoint is failing with:
ValidationError: 1 validation error for UserCreate
  password
    ensure this value has at least 12 characters

Fix the password validation in schemas.py
```

### Step 7: Commit & Move to Next Task
```bash
git add .
git commit -m "feat: implement auth endpoints (task 2.2)"
```

---

## 🎯 Common Cursor Commands

### Generate Component
```
Create a React component AuditCard in /frontend/components/AuditCard.tsx
following the spec in /docs/FRONTEND_COMPONENTS.md
```

### Generate Tests
```
Write Jest tests for AuditCard component
with 100% coverage of user interactions
```

### Debug Error
```
I'm getting this error: [paste error]
How do I fix it?
```

### Refactor Code
```
Refactor this function to be more Pythonic
and add type hints
```

### Add Documentation
```
Add docstrings to all functions in this file
following Google style
```

---

## ⚡ Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K` - Open Cursor chat
- `Cmd+L` / `Ctrl+L` - Ask about current file
- `Cmd+I` / `Ctrl+I` - Inline edit suggestion
- `Cmd+Shift+L` / `Ctrl+Shift+L` - Ask about selection

---

## 🔥 Power User Tips

### Multi-file Generation
```
Create the entire backend/app/ structure with:
- main.py (FastAPI app)
- config.py (settings)
- database.py (SQLAlchemy setup)
- models.py (using DATABASE_SCHEMA.md)
- schemas.py (Pydantic models)

Follow ARCHITECTURE.md for the structure
```

### Batch Testing
```
Generate pytest tests for all files in backend/app/services/
Aim for 80% coverage on each file
```

### Documentation Generation
```
Read all files in /docs/ and create a comprehensive
README.md for the root directory that summarizes
the entire project
```

---

## ✅ Cursor + SiteSpector Checklist

Before starting each task:
- [ ] Read task description in BACKLOG.md
- [ ] Check related docs (e.g., API_ENDPOINTS.md, DATABASE_SCHEMA.md)
- [ ] Copy Cursor prompt
- [ ] Paste into Cursor chat
- [ ] Review generated code
- [ ] Run tests
- [ ] Commit if passing

After each Epic:
- [ ] Run full test suite
- [ ] Check test coverage
- [ ] Update README if needed
- [ ] Git tag (e.g., `epic-1-complete`)

---

## 🆘 Troubleshooting

### Cursor Not Generating Code
**Fix:** Make prompt more specific
```
❌ "Create auth"
✅ "Create FastAPI authentication endpoints in backend/app/routers/auth.py with POST /api/auth/register and POST /api/auth/login following the specs in API_ENDPOINTS.md"
```

### Generated Code Has Errors
**Fix:** Provide error + ask for fix
```
The code fails with: [error]
Fix this error and regenerate the file
```

### Cursor Generates Wrong Thing
**Fix:** Be more explicit about what you want
```
No, I meant create a React component, not a Python class.
Create frontend/components/AuditCard.tsx (TypeScript + React)
```

---

**Document Status:** ✅ COMPLETE  
**Estimated time savings:** 70-80% of coding time with Cursor!
