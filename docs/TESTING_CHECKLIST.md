# SiteSpector SaaS Testing Checklist

Comprehensive testing checklist for post-deployment verification.

---

## Authentication Tests

### Email/Password Authentication
- [ ] Sign up with new email works
- [ ] Email validation prevents invalid emails
- [ ] Password validation enforces complexity rules
- [ ] Login with correct credentials works
- [ ] Login with wrong password fails with error
- [ ] Login with non-existent email fails
- [ ] Logout works and clears session
- [ ] Auto-redirect to dashboard after login
- [ ] Protected routes redirect to login when not authenticated

### OAuth Authentication
- [ ] "Continue with Google" button works
- [ ] Google OAuth redirects correctly
- [ ] Callback page handles OAuth response
- [ ] User profile created in Supabase
- [ ] Personal workspace auto-created
- [ ] GitHub OAuth works (if configured)

### Magic Link
- [ ] Magic link form appears on login page
- [ ] Email sent successfully
- [ ] Magic link redirects to dashboard
- [ ] Expired magic link shows error

---

## Workspace Tests

### Personal Workspace
- [ ] Personal workspace created on signup
- [ ] Name format: "{email}'s Workspace"
- [ ] User is owner of personal workspace
- [ ] Free subscription created automatically
- [ ] Workspace appears in switcher

### Team Workspace
- [ ] Create team workspace works
- [ ] Team name validation works
- [ ] Slug generated correctly
- [ ] Creator becomes owner
- [ ] Free subscription created
- [ ] Team appears in workspace switcher under "Teams"

### Workspace Switching
- [ ] Workspace switcher displays all workspaces
- [ ] Clicking workspace switches correctly
- [ ] Page reloads with new workspace context
- [ ] Audits list updates for new workspace
- [ ] Current workspace persists on refresh

---

## Team Management Tests

### Inviting Members
- [ ] Invite form appears for team workspaces
- [ ] Invite form hidden for personal workspaces
- [ ] Email validation works
- [ ] Role selection works (Admin/Member)
- [ ] Invite created in database
- [ ] Invite link generated
- [ ] Copy button works
- [ ] Invite appears in "Pending Invites"

### Accepting Invites
- [ ] Navigate to /invite/{token}
- [ ] Invite details display correctly
- [ ] Accept button adds user to workspace
- [ ] Redirect to dashboard after accept
- [ ] Workspace appears in switcher
- [ ] Expired invite shows error
- [ ] Invalid token shows error
- [ ] Already-accepted invite shows error

### Member Management
- [ ] Members list displays all members
- [ ] Role badges display correctly
- [ ] Owner cannot be removed
- [ ] Admin can remove members (not owner)
- [ ] Member cannot remove anyone (if not admin)
- [ ] Remove member works correctly

---

## Audit Tests

### Creating Audits
- [ ] Create audit in personal workspace
- [ ] Create audit in team workspace
- [ ] Competitor URLs optional (0-3)
- [ ] Audit created with status PENDING
- [ ] Workspace switcher context correct
- [ ] Usage warning shows when near limit
- [ ] Error when limit reached

### Viewing Audits
- [ ] List shows only workspace audits
- [ ] Switching workspace shows different audits
- [ ] Status badges display correctly
- [ ] Scores display when completed
- [ ] Polling works for processing audits
- [ ] Detail page loads correctly

### Audit Actions
- [ ] Download PDF works
- [ ] Download raw data works
- [ ] Retry audit creates new audit
- [ ] Delete audit works (admins/owners only)
- [ ] Members cannot delete audits (if role = member)

---

## Billing Tests

### Subscription Display
- [ ] Current plan displays correctly
- [ ] Usage meter shows accurate numbers
- [ ] Status badge correct (active/canceled)
- [ ] Period end date shows
- [ ] Upgrade button visible for free plan

### Checkout Flow (Test Mode)
- [ ] Pricing page loads
- [ ] Click "Get Pro" redirects to Stripe
- [ ] Stripe checkout session created
- [ ] Test card (4242 4242 4242 4242) processes
- [ ] Redirect back to /settings/billing?success=true
- [ ] Subscription updated in database
- [ ] Audit limit increased to 50

### Stripe Webhook
- [ ] Webhook endpoint receives events
- [ ] checkout.session.completed updates subscription
- [ ] customer.subscription.updated works
- [ ] invoice.paid creates invoice record
- [ ] customer.subscription.deleted downgrades to free

### Billing Portal
- [ ] "Manage Subscription" button works
- [ ] Redirects to Stripe Customer Portal
- [ ] Can update payment method
- [ ] Can cancel subscription
- [ ] Cancel flows back to free plan

---

## UI/UX Tests

### Sidebar Navigation
- [ ] Sidebar displays on desktop
- [ ] Mobile menu button shows on mobile
- [ ] Navigation links work
- [ ] Active route highlights
- [ ] Workspace switcher in sidebar
- [ ] Logout button works

### Settings Pages
- [ ] Profile page loads and saves
- [ ] Team page shows members (team workspaces only)
- [ ] Billing page shows subscription
- [ ] Appearance page changes theme
- [ ] Notifications page (placeholder) displays

### Responsive Design
- [ ] Mobile (< 768px) - menu button, stacked layout
- [ ] Tablet (768px - 1024px) - sidebar visible
- [ ] Desktop (> 1024px) - full layout
- [ ] No horizontal scroll on any breakpoint
- [ ] Touch targets large enough on mobile

### Dark Mode
- [ ] Toggle dark mode in appearance settings
- [ ] All pages render correctly in dark mode
- [ ] No white flashes on page load
- [ ] Contrast readable in both modes

---

## Security Tests

### RLS Policies
- [ ] User A cannot see User B's workspaces
- [ ] Member cannot access audits from other workspaces
- [ ] Non-member cannot view workspace data
- [ ] Admin cannot delete owner
- [ ] Member cannot invite others (if not admin/owner)

### API Authorization
- [ ] Endpoints require Bearer token
- [ ] Invalid token returns 401
- [ ] Expired token returns 401
- [ ] Workspace membership checked
- [ ] Subscription limits enforced

### HTTPS/SSL
- [ ] Site loads with https://
- [ ] No SSL warnings in browser
- [ ] HTTP redirects to HTTPS
- [ ] Certificate valid (Let's Encrypt)
- [ ] Security headers present (check devtools)

---

## Performance Tests

### Page Load
- [ ] Homepage < 1 second
- [ ] Dashboard < 2 seconds
- [ ] Audit detail < 2 seconds
- [ ] Settings pages < 1 second

### Audit Processing
- [ ] Audit completes in < 3 minutes
- [ ] Worker processes 3 audits concurrently
- [ ] No timeouts during processing
- [ ] Results stored correctly

### Database
- [ ] Queries respond < 100ms
- [ ] No connection pool exhaustion
- [ ] JSONB queries performant

---

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Load Testing

If expecting high traffic:

### Simulate Concurrent Users
```bash
# Using Apache Bench
ab -n 100 -c 10 https://sitespector.app/

# Check response times
# Check error rate (should be 0%)
```

### Simulate Audit Load
- [ ] Create 10 audits simultaneously
- [ ] Verify worker handles queue
- [ ] Check memory usage: `docker stats`
- [ ] No container crashes

---

## Data Migration Verification

### User Migration
- [ ] All users migrated to Supabase Auth
- [ ] Personal workspaces created for each user
- [ ] Existing audits linked to workspaces
- [ ] Users can login with magic link (password reset)

### Data Integrity
```sql
-- Check all audits have workspace_id
SELECT COUNT(*) FROM audits WHERE workspace_id IS NULL;
-- Should return 0

-- Check orphaned audits
SELECT COUNT(*) FROM audits WHERE user_id IS NULL AND workspace_id IS NULL;
-- Should return 0

-- Verify workspace memberships
SELECT w.name, COUNT(wm.id) as members
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
GROUP BY w.id, w.name;
```

---

## Regression Tests

Ensure existing features still work:

- [ ] Screaming Frog crawl works
- [ ] Lighthouse audit works (desktop + mobile)
- [ ] Gemini AI analysis works
- [ ] PDF generation works (all sections filled)
- [ ] Competitor analysis works
- [ ] Score calculation correct
- [ ] Local SEO detection works

---

## Edge Cases

### Test Unusual Scenarios
- [ ] Create workspace with special characters in name
- [ ] Invite user who's already a member (should fail gracefully)
- [ ] Accept expired invite (should show error)
- [ ] Delete workspace with audits (should cascade)
- [ ] Downgrade subscription mid-month (pro-rated?)
- [ ] Create audit while at exact limit (should fail)
- [ ] Logout during audit creation (audit still created?)

---

## Post-Launch Monitoring

First 24 hours after launch:

- [ ] Check error logs every 2 hours
- [ ] Monitor Stripe webhook success rate
- [ ] Watch audit success rate
- [ ] Check database disk usage
- [ ] Monitor container memory usage
- [ ] Review any user-reported issues

First week:

- [ ] Daily log review
- [ ] Weekly database backup verification
- [ ] User feedback collection
- [ ] Performance monitoring
- [ ] Bug tracking and fixes

---

## Sign-Off

Deployment is production-ready when:

- [ ] All critical tests pass
- [ ] No console errors
- [ ] SSL certificate valid
- [ ] Stripe test mode successful
- [ ] At least 1 complete end-to-end test (signup → create team → invite → create audit → download PDF → upgrade subscription)
- [ ] Rollback plan documented and tested

**Tested by**: _______________  
**Date**: _______________  
**Sign-off**: _______________
