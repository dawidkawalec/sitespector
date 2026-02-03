# Context7 Update Workflow - Complete Guide

**Purpose**: Clear, step-by-step instructions on WHEN and HOW to update Context7 documentation.

---

## 🎯 Core Principle

**Context7 is your project's memory**. Every time you implement something, fix something, or learn something → it MUST go into Context7.

Think of it like this:
- **Code** = What the system does
- **Context7** = Why it does it, how it works, and what problems you solved

---

## 📝 WHEN to Update Context7

### ✅ ALWAYS Update After:

#### 1. **New Feature Implementation**
```bash
# Example: You just implemented renderSeoResults() function

# Update:
update-docs ".context7/frontend/MISSING_FEATURES.md" "
✅ COMPLETED: renderSeoResults() function
- Location: frontend/app/audits/[id]/page.tsx (line 250-320)
- Displays: title, meta, H1 tags, images, links, technical SEO
- Uses: audit.results.crawl data
- Components: Card, Badge, CheckCircle, AlertCircle from shadcn/ui
- Tested with: audit 85d6ee6f-8c55-4c98-abd8-60dedfafa9df
"

# Also update:
update-docs ".context7/frontend/COMPONENTS.md" "
Added renderSeoResults() helper function in audit detail page
- Purpose: Display SEO crawl data in user-friendly format
- Pattern: Uses shadcn/ui Card components with icon indicators
- Reusable: Can be extracted to separate component if needed
"
```

#### 2. **Bug Fix**
```bash
# Example: Fixed null pointer error in worker

# Update:
update-docs ".context7/decisions/BUGS_AND_FIXES.md" "
## Bug: Worker crashes on missing screaming_frog_data
**Date**: 2025-02-01
**Severity**: HIGH
**Symptom**: Worker crashes with NoneType error when Screaming Frog fails

**Cause**: 
- worker.py line 145 assumed crawl_data always exists
- Screaming Frog can timeout/fail, returning None

**Fix**:
```python
crawl_data = await crawl_url(url)
if not crawl_data:
    await mark_audit_failed(audit_id, 'Screaming Frog crawl failed')
    return
```

**Prevention**: Always check external service responses for None/null
**Tested**: Manually triggered Screaming Frog timeout
"
```

#### 3. **Architectural Decision**
```bash
# Example: Decided to use shadcn/ui instead of custom components

# Update:
update-docs ".context7/decisions/DECISIONS_LOG.md" "
## Decision: Use shadcn/ui for UI Components
**Date**: 2025-02-01
**Context**: Need consistent, accessible UI components for audit detail page

**Options Considered**:
1. Custom Tailwind components (pro: full control, con: time-consuming)
2. shadcn/ui (pro: battle-tested, accessible, con: opinionated)
3. Headless UI (pro: flexible, con: requires more styling)

**Decision**: Use shadcn/ui

**Rationale**:
- Already installed in project (no new dependencies)
- Accessible by default (WCAG compliant)
- Consistent with dashboard components
- Well-documented, easy to customize
- Copy-paste components (not npm package = no version conflicts)

**Impact**:
- All new components use shadcn/ui patterns
- Existing custom components can be migrated gradually
- Import from @/components/ui/*

**Next Steps**: Document component usage patterns in COMPONENTS.md
"
```

#### 4. **API Changes** (new endpoint, changed schema)
```bash
# Example: Added retry endpoint

# Update:
update-docs ".context7/backend/API.md" "
## POST /api/audits/{audit_id}/retry

**Added**: 2025-02-01
**Purpose**: Allow users to retry failed audits

**Authentication**: Required (JWT Bearer token)
**Authorization**: User must own the audit

**Request**:
```http
POST /api/audits/85d6ee6f-8c55-4c98-abd8-60dedfafa9df/retry
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  'id': '85d6ee6f-8c55-4c98-abd8-60dedfafa9df',
  'status': 'pending',
  'url': 'https://meditrue.pl/',
  'updated_at': '2025-02-01T17:30:00Z'
}
```

**Behavior**:
- Resets status from 'failed' → 'pending'
- Clears error_message
- Worker picks up automatically (next 10s poll)
- All other fields (url, user_id, competitors) unchanged

**Errors**:
- 404: Audit not found
- 403: User doesn't own audit
- 400: Audit not in 'failed' state (can only retry failed audits)

**Implementation**: backend/app/routers/audits.py:retry_audit()
"
```

#### 5. **Database Schema Changes**
```bash
# Example: Added 'retry_count' column to audits table

# Update:
update-docs ".context7/infrastructure/DATABASE.md" "
## audits Table - Schema Change (2025-02-01)

**Added column**: retry_count (INTEGER, DEFAULT 0)

**Purpose**: Track how many times user has retried a failed audit
**Use case**: Limit retries to prevent abuse (future: max 3 retries)

**Migration**:
```sql
ALTER TABLE audits ADD COLUMN retry_count INTEGER DEFAULT 0;
```

**Alembic migration**: backend/alembic/versions/20250201_add_retry_count.py

**Updated SQLAlchemy model**:
```python
class Audit(Base):
    # ...
    retry_count = Column(Integer, default=0, nullable=False)
```

**Backend logic**: Increment on each retry in audits.py:retry_audit()
"
```

#### 6. **Deployment Changes** (VPS config, Docker, environment variables)
```bash
# Example: Changed Nginx config for better SSL

# Update:
update-docs ".context7/infrastructure/NGINX.md" "
## SSL Configuration Update (2025-02-01)

**Changed**: Added stronger cipher suites for better security

**Before**:
```nginx
ssl_protocols TLSv1.2;
ssl_ciphers HIGH:!aNULL:!MD5;
```

**After**:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers on;
```

**Testing**: 
```bash
# Verify SSL config
openssl s_client -connect 77.42.79.46:443 -tls1_3
```

**Deployment**:
```bash
docker compose -f docker-compose.prod.yml restart nginx
```

**Impact**: Better SSL security, still supports older browsers (TLSv1.2)
"
```

---

## ❌ DON'T Update for:

- **Typo fixes** (unless in critical documentation)
- **Code formatting** (prettier, linter changes)
- **Comment changes** (unless they explain new pattern)
- **Dependency version bumps** (unless breaking change)
- **Trivial refactors** (rename variable, extract function without logic change)

---

## 📋 Complete Update Workflow

### Step-by-Step Process:

```bash
# === STEP 1: Implement Feature ===
# Make code changes in Cursor
# File: frontend/app/audits/[id]/page.tsx
# Add renderSeoResults() function

# === STEP 2: Test Locally (Optional - if you can) ===
# Not applicable for SiteSpector (VPS-only)
# Skip to deployment

# === STEP 3: Commit Code ===
git add frontend/app/audits/[id]/page.tsx
git commit -m "feat(frontend): implement renderSeoResults function

- Display title, meta description, H1 tags
- Show image count and alt text issues
- Display internal/external link counts
- Technical SEO indicators (robots.txt, sitemap)
- Uses shadcn/ui Card components
- Tested with audit 85d6ee6f-8c55-4c98-abd8-60dedfafa9df"

# === STEP 4: Update Context7 ===
# THIS IS CRITICAL - Don't skip this step!

# A. Update MISSING_FEATURES.md (mark as done)
update-docs ".context7/frontend/MISSING_FEATURES.md" "
✅ COMPLETED (2025-02-01): renderSeoResults() function
- Status changed from 'NOT STARTED' to 'COMPLETED'
- Implementation in frontend/app/audits/[id]/page.tsx:250-320
- Displays all crawl data from audit.results.crawl
- Uses shadcn/ui components for consistent styling
- Next: renderPerformanceResults() and renderContentResults()
"

# B. Update COMPONENTS.md (document new component)
update-docs ".context7/frontend/COMPONENTS.md" "
## Audit Detail - Helper Functions

### renderSeoResults(results)
**Added**: 2025-02-01
**Location**: frontend/app/audits/[id]/page.tsx:250-320
**Purpose**: Display SEO crawl data in audit detail page

**Data source**: audit.results.crawl
**Displays**:
- Title tag (with length indicator)
- Meta description (with length indicator)
- H1 tag structure
- Image count + alt text issues
- Internal/external link counts
- Technical SEO (robots.txt, sitemap, canonical)

**Components used**:
- Card, CardHeader, CardTitle, CardContent (shadcn/ui)
- Badge (variant: default/destructive based on status)
- CheckCircle, XCircle, AlertCircle (lucide-react)

**Pattern**: Can be extracted to separate component if reused
"

# C. Update DECISIONS_LOG.md (if architectural decision)
update-docs ".context7/decisions/DECISIONS_LOG.md" "
## Decision: Component Pattern for Audit Detail Rendering
**Date**: 2025-02-01
**Context**: Need to display complex audit data in readable format

**Decision**: Use helper functions (renderSeoResults, etc.) instead of separate components

**Rationale**:
- Audit detail page is single-use (not reused elsewhere)
- Helper functions keep all logic in one file
- Easier to refactor later if needed
- Less file overhead than separate component files

**Alternative considered**: Separate components (e.g., SeoResults.tsx)
- Rejected: Adds complexity for single-use case
- If pattern repeats 3+ times, reconsider

**Implementation**: 3 helper functions in page.tsx
"

# === STEP 5: Commit Context7 Updates ===
git add .context7/
git commit -m "docs(context7): update after implementing renderSeoResults

- Mark renderSeoResults as completed in MISSING_FEATURES.md
- Document component pattern in COMPONENTS.md
- Add architectural decision to DECISIONS_LOG.md"

# === STEP 6: Ask to Push ===
# Agent should ask user here:
# "I've committed 2 changes:
# 1. feat(frontend): implement renderSeoResults function
# 2. docs(context7): update after implementing renderSeoResults
#
# Ready to push to origin/release?"

# Wait for user confirmation

# === STEP 7: Push (after user confirms) ===
git push origin release

# === STEP 8: Deploy to VPS ===
ssh root@77.42.79.46
cd /opt/sitespector
git pull origin release
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# === STEP 9: Verify on Production ===
# Open: https://77.42.79.46/audits/85d6ee6f-8c55-4c98-abd8-60dedfafa9df
# Check: SEO tab displays crawl data correctly

# === STEP 10: If Issues, Update BUGS_AND_FIXES.md ===
# (if you discover a bug during testing)
update-docs ".context7/decisions/BUGS_AND_FIXES.md" "
## Bug: SEO tab shows 'undefined' for missing data
**Found**: 2025-02-01 during deployment testing
**Severity**: LOW
**Fix**: Added null coalescing (audit.results?.crawl?.title ?? 'No title')
**Committed**: In same deployment
"
```

---

## 🎨 How to Write Good Updates

### ✅ GOOD Update Example:
```markdown
## renderSeoResults() - COMPLETED (2025-02-01)

**What**: Display SEO crawl data from Screaming Frog
**Where**: frontend/app/audits/[id]/page.tsx:250-320
**Why**: Users couldn't see detailed SEO data (Priority 1 issue)

**Implementation**:
- Uses audit.results.crawl data structure
- shadcn/ui Card components for layout
- Icons: CheckCircle (good), AlertCircle (warning), XCircle (error)
- Null safety: Optional chaining throughout (audit.results?.crawl?.title)

**Displays**:
- Title tag (length, status indicator)
- Meta description (length, status indicator)
- H1 structure (count, list of H1s)
- Images (total, missing alt count)
- Links (internal/external counts)
- Technical SEO (robots.txt, sitemap, canonical)

**Testing**: Verified with audit 85d6ee6f-8c55-4c98-abd8-60dedfafa9df
**Next**: Implement renderPerformanceResults() (Priority 1)
```

### ❌ BAD Update Example:
```markdown
Added SEO rendering
```
*Why bad?* - Too vague, no context, no location, no "why"

---

## 📂 Which Files to Update (Quick Reference)

### `.context7/frontend/MISSING_FEATURES.md`
**When**: Feature completed or new gap discovered
**What**: Mark completed items, add new TODO items
**Format**: Checkbox lists, detailed descriptions

### `.context7/frontend/COMPONENTS.md`
**When**: New component or helper function added
**What**: Document props, usage, patterns
**Format**: Code examples, API reference

### `.context7/backend/API.md`
**When**: New endpoint, changed schema, new behavior
**What**: Full endpoint documentation (request, response, errors)
**Format**: HTTP examples, JSON schemas

### `.context7/backend/WORKER.md`
**When**: Worker logic changes (timeout, concurrency, process flow)
**What**: Updated flow, new behaviors, timing changes
**Format**: Flowcharts (text), code examples

### `.context7/infrastructure/DATABASE.md`
**When**: Schema changes, migrations, indexes
**What**: Table schemas, migration SQL, rationale
**Format**: SQL DDL, SQLAlchemy models

### `.context7/infrastructure/DOCKER.md`
**When**: Container changes, new services, environment variables
**What**: Updated docker-compose.yml, new env vars, restart instructions
**Format**: YAML snippets, bash commands

### `.context7/decisions/DECISIONS_LOG.md`
**When**: Architectural decision, technology choice, pattern adoption
**What**: Decision, alternatives considered, rationale
**Format**: Structured (Context → Decision → Rationale → Impact)

### `.context7/decisions/BUGS_AND_FIXES.md`
**When**: Bug discovered and fixed
**What**: Symptom, cause, fix, prevention
**Format**: Date, severity, code examples

---

## 🔄 Update Frequency

### After Every Feature (1-3 updates)
- Mark feature complete in MISSING_FEATURES.md
- Document implementation in relevant tech doc (COMPONENTS.md, API.md, etc.)
- (Optional) Add decision if architectural choice made

### After Bug Fix (1 update)
- Add to BUGS_AND_FIXES.md with fix details

### Weekly Review (maintenance)
- Review all Context7 files for accuracy
- Remove obsolete entries
- Consolidate related updates

### Before Major Milestone (cleanup)
- Ensure all completed items marked
- Archive old decisions if superseded
- Update OVERVIEW.md with current state

---

## 🤖 Agent Instructions for Context7 Updates

### For AI Agents (Claude, GPT, Gemini):

**MANDATORY RULE**: After implementing ANY feature, you MUST update Context7 docs.

**Process**:
1. Complete feature implementation
2. Commit code changes
3. **IMMEDIATELY** identify which Context7 files need updates
4. Call `update-docs` for EACH relevant file
5. Commit Context7 updates separately
6. Tell user: "I've updated Context7 docs. Review before we push?"

**Example**:
```
User: "Implement renderSeoResults function"

Agent:
1. [Implements function]
2. git commit -m "feat(frontend): implement renderSeoResults"
3. update-docs ".context7/frontend/MISSING_FEATURES.md" "✅ renderSeoResults completed..."
4. update-docs ".context7/frontend/COMPONENTS.md" "Added renderSeoResults helper..."
5. git commit -m "docs(context7): update after renderSeoResults"
6. "Feature complete! I've updated Context7 docs:
   - MISSING_FEATURES.md (marked complete)
   - COMPONENTS.md (documented helper function)
   
   Ready to review and push?"
```

**DON'T FORGET**: This is not optional. Context7 is the project's memory. Without updates, knowledge is lost.

---

## ✅ Checklist: Before Pushing to Git

Before asking user "Ready to push?", verify:

- [ ] Code changes committed
- [ ] Context7 docs updated (at least 1 file, usually 2-3)
- [ ] Context7 updates committed separately
- [ ] Both commits have good messages (conventional commits)
- [ ] No uncommitted changes (git status clean)

---

## 🎓 Philosophy: Why This Matters

### Without Context7:
```
[2 weeks later]
User: "Why did we use shadcn/ui instead of custom components?"
Agent: "I don't know, no documentation exists."
User: *has to remember or re-research decision*
```

### With Context7:
```
[2 weeks later]
User: "Why did we use shadcn/ui instead of custom components?"
Agent: [queries Context7 DECISIONS_LOG.md]
Agent: "We decided on 2025-02-01 to use shadcn/ui because:
- Already installed (no new dependencies)
- Accessible by default (WCAG)
- Consistent with existing dashboard
Decision documented in .context7/decisions/DECISIONS_LOG.md"
```

**Context7 is your project's institutional knowledge**. Invest 2 minutes after each feature to save hours later.

---

## 🚀 Quick Commands Reference

### Query before implementing:
```bash
query-docs "missing features"
query-docs "API endpoints"
query-docs "worker process flow"
query-docs "component patterns"
```

### Update after implementing:
```bash
update-docs ".context7/frontend/MISSING_FEATURES.md" "Brief update..."
update-docs ".context7/backend/API.md" "New endpoint..."
update-docs ".context7/decisions/DECISIONS_LOG.md" "Decision..."
```

### Verify updates:
```bash
query-docs "latest changes"
query-docs "recent updates"
```

---

**Last Updated**: 2025-02-01  
**Purpose**: Ensure Context7 stays accurate and useful  
**Rule**: Query before, update after, ALWAYS  
**Time cost**: 2-5 minutes per feature (saves hours later)
