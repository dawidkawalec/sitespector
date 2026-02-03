# Supabase Setup Guide

This directory contains SQL files for setting up Supabase database for SiteSpector SaaS features.

## Initial Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in details:
   - **Name**: sitespector-prod
   - **Database Password**: (generate strong password)
   - **Region**: Europe West (closest to VPS)
   - **Pricing Plan**: Free (upgrade to Pro if needed)

### 2. Get API Keys

After project creation, go to Project Settings > API:

- **Project URL**: `https://xxx.supabase.co`
- **Anon (public) key**: `eyJhbGc...` (safe for frontend)
- **Service role key**: `eyJhbGc...` (secret, backend only)

Save these for environment variables.

### 3. Run Schema Migration

1. Open Supabase Dashboard > SQL Editor
2. Copy contents of `schema.sql`
3. Paste and click "Run"
4. Verify tables created: profiles, workspaces, workspace_members, invites, subscriptions, invoices

### 4. Run RLS Policies

1. Open Supabase Dashboard > SQL Editor
2. Copy contents of `policies.sql`
3. Paste and click "Run"
4. Verify policies enabled (check Table Editor > each table > RLS enabled)

### 5. Configure Authentication

Go to Authentication > Providers:

#### Email/Password
- Enable Email provider
- Disable "Confirm email" for now (or setup SMTP)
- Customize email templates (optional)

#### OAuth Providers

**Google OAuth:**
1. Enable Google provider
2. Go to [Google Cloud Console](https://console.cloud.google.com)
3. Create OAuth 2.0 credentials
4. Authorized redirect URI: `https://xxx.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase

**GitHub OAuth:**
1. Enable GitHub provider
2. Go to GitHub Settings > Developer settings > OAuth Apps
3. Create new OAuth App
4. Authorization callback URL: `https://xxx.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase

#### Magic Links
- Enable Magic Link (no additional config needed)

### 6. Configure Site URL

Go to Authentication > URL Configuration:

- **Site URL**: `https://sitespector.app` (production)
- **Redirect URLs**: 
  - `https://sitespector.app/auth/callback`
  - `https://www.sitespector.app/auth/callback`
  - `http://localhost:3000/auth/callback` (development)

### 7. Update Environment Variables

Add Supabase credentials to:

**VPS** (`/opt/sitespector/.env`):
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

**Frontend** (`.env.local` for local dev):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Database Schema

### Tables Overview

- **profiles**: User profile data (name, avatar)
- **workspaces**: Personal and team workspaces
- **workspace_members**: User-workspace membership with roles
- **invites**: Pending workspace invitations
- **subscriptions**: Stripe subscription data per workspace
- **invoices**: Stripe invoice history

### Automatic Triggers

**New User Signup** (handle_new_user):
- Creates profile entry
- Creates personal workspace
- Adds user as workspace owner
- Creates free subscription

This happens automatically on user registration.

## Testing

### Test RLS Policies

1. Create test user in Authentication > Users
2. Copy JWT token
3. Test queries in SQL Editor with:
   ```sql
   -- Set JWT for testing
   SET request.jwt.claim.sub = 'user-uuid-here';
   
   -- Try to select workspaces
   SELECT * FROM workspaces;
   ```
4. Verify user only sees their own workspaces

### Test Workspace Creation

```sql
-- Create test workspace
INSERT INTO workspaces (name, slug, type, owner_id)
VALUES ('Test Team', 'test-team', 'team', 'user-uuid-here');

-- Verify workspace_members and subscriptions created
SELECT * FROM workspace_members WHERE workspace_id = 'workspace-uuid';
SELECT * FROM subscriptions WHERE workspace_id = 'workspace-uuid';
```

## Troubleshooting

### RLS Prevents All Access

If queries return empty even for valid users:
1. Check if RLS is enabled: `SELECT * FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Test with service role key (bypasses RLS)

### Trigger Not Firing

If new users don't get workspaces:
1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Check function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
3. Test manually: Create user in dashboard, check tables

### Foreign Key Errors

If foreign key constraints fail:
1. Ensure auth.users has the referenced user
2. Check UUID format (must be valid UUID v4)
3. Verify cascade rules are correct

## Maintenance

### Monthly Audit Counter Reset

Create a cron job or scheduled function to reset `audits_used_this_month`:

```sql
-- Reset all workspace audit counters on 1st of month
UPDATE subscriptions
SET audits_used_this_month = 0
WHERE EXTRACT(DAY FROM NOW()) = 1;
```

**Setup in Supabase**: Database > Cron Jobs (if available) or use Edge Function with scheduler.

### Backup

Supabase Pro includes automatic daily backups. For Free tier:
- Manual backups via Dashboard > Database > Backups
- Or use pg_dump periodically

## Next Steps

After Supabase setup is complete:
1. Update frontend to use Supabase Auth SDK
2. Update backend to verify Supabase JWTs
3. Run user migration script
4. Test authentication flow end-to-end

See main plan document for detailed implementation steps.
