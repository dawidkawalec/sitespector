# SiteSpector - Quality Assurance & Testing

## 🧪 Testing Procedures

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
- [ ] PDF report download works.

#### 4. Billing & Subscriptions
- [ ] Current plan displays correctly in Settings.
- [ ] Usage meter shows accurate numbers.
- [ ] Stripe Checkout flow works (test mode).
- [ ] Webhook updates subscription status.

### Automated Testing
- **Backend**: Run pytest inside backend container.
- **Frontend**: Linting and build checks during Docker build.

## 🛠️ Debugging Tools
- **Logs**: `docker logs sitespector-backend -f`.
- **Database**: `docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db`.
- **Health Check**: `https://sitespector.app/health`.
