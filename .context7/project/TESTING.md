# SiteSpector - Quality Assurance & Testing

## 🧪 Testing Procedures

## Smoke Tests (Feb 2026 - Senuto full data release)

### Local pre-deploy smoke checklist

#### Frontend (standalone mode)
- [x] `npm run build` passes in `frontend/`.
- [x] `npm run lint` passes in `frontend/` (warnings allowed).
- [x] `node .next/standalone/server.js` starts correctly.
- [x] Core routes return HTTP 200:
  - `/`
  - `/dashboard`
  - `/audits/{id}`
  - `/audits/{id}/visibility`
  - `/audits/{id}/ai-overviews`
  - `/audits/{id}/links?tab=incoming`
  - `/audits/{id}/competitors`

#### Backend (code-level smoke)
- [x] Python compile check passes for changed modules:
  - `backend/app/services/senuto.py`
  - `backend/worker.py`
  - `backend/app/services/ai_analysis.py`
  - `backend/app/services/data_exporter.py`
- [i] Full local API boot requires valid Supabase env (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

#### Chat / RAG smoke (code-level)
- [x] Frontend build includes chat panel (no runtime test required locally).
- [x] Backend modules compile: `backend/app/services/chat_service.py`, `backend/app/services/rag_service.py`.
- [i] Full end-to-end requires Qdrant running on VPS + migrations applied.

### Post-Deployment Verification
After every deployment to VPS, perform the following checks:

#### 1. Authentication
- [ ] Sign up with new email works.
- [ ] Login with correct credentials works.
- [ ] Logout clears session correctly.
- [ ] OAuth (Google/GitHub) login works.

#### 2. Workspace Management
- [ ] Personal workspace created on signup.
- [ ] Create team workspace works.
- [ ] Workspace switcher displays all workspaces.
- [ ] Switching workspace updates audit list.

#### 3. Audit Pipeline
- [ ] Create audit in personal/team workspace.
- [ ] Audit status transitions: PENDING → PROCESSING → COMPLETED.
- [ ] Results display correctly (SEO, Performance, AI tabs).
- [ ] New Senuto modules display correctly:
  - [ ] Visibility tabs: Pozycje / Wzrosty-Spadki / Pozyskane-Utracone / Cechy fraz / Strony / Kanibalizacja.
  - [ ] AI Overviews page renders KPI, charts and tables.
- [ ] PDF report download works.

#### 5. Agent Chat (RAG)
- [ ] Open any `/audits/{id}` page and open chat panel.
- [ ] Create a new conversation, send a message, see streamed response.
- [ ] Switch to another audit and verify the conversation list is audit-scoped.
- [ ] Verify usage badge shows `messages_sent/limit`.
- [ ] Verify sharing works (owner shares conversation; second user can view it).

#### 4. Billing & Subscriptions
- [ ] Current plan displays correctly in Settings.
- [ ] Usage meter shows accurate numbers.
- [ ] Stripe Checkout flow works (test mode).
- [ ] Webhook updates subscription status.

### Automated Testing
- **Backend**: Run pytest inside backend container.
- **Frontend**: Build checks during Docker build; lint depends on current ESLint config compatibility.

## 🛠️ Debugging Tools
- **Logs**: `docker logs sitespector-backend -f`.
- **Database**: `docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db`.
- **Health Check**: `https://sitespector.app/health`.
