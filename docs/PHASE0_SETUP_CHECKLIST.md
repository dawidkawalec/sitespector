# Phase 0: Supabase Setup Checklist

Use this checklist to ensure Supabase is properly configured before proceeding to Phase 1.

---

## 1. Supabase Project Creation

- [ ] Signed up at [supabase.com](https://supabase.com)
- [ ] Created new project: "sitespector-prod"
- [ ] Selected region: Europe West
- [ ] Saved database password securely
- [ ] Project is initialized (green checkmark in dashboard)

**Note**: Save these for later:
- Project URL: `https://xxx.supabase.co`
- Project ID: `xxx`

---

## 2. API Keys

- [ ] Opened Project Settings > API
- [ ] Copied Project URL
- [ ] Copied anon (public) key
- [ ] Copied service_role key (keep secret!)
- [ ] Added keys to password manager or secure notes

**Keys location**:
```
Project URL: https://xxx.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Database Schema

- [ ] Opened SQL Editor in Supabase Dashboard
- [ ] Copied contents of `supabase/schema.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" (should complete successfully)
- [ ] Verified tables created:
  - [ ] profiles
  - [ ] workspaces
  - [ ] workspace_members
  - [ ] invites
  - [ ] subscriptions
  - [ ] invoices
- [ ] Verified indexes created (check each table schema)
- [ ] Verified trigger `on_auth_user_created` exists

**Verify in Table Editor**:
- Open each table
- Check columns match schema
- Verify constraints (CHECKs, UNIQUEs, FKs)

---

## 4. RLS Policies

- [ ] Opened SQL Editor in Supabase Dashboard
- [ ] Copied contents of `supabase/policies.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" (should complete successfully)
- [ ] Verified RLS enabled on all tables:
  - [ ] profiles (RLS enabled)
  - [ ] workspaces (RLS enabled)
  - [ ] workspace_members (RLS enabled)
  - [ ] invites (RLS enabled)
  - [ ] subscriptions (RLS enabled)
  - [ ] invoices (RLS enabled)
- [ ] Verified policies exist (Table Editor > table > Policies tab)

**Count policies per table**:
- profiles: 3 policies
- workspaces: 4 policies
- workspace_members: 4 policies
- invites: 4 policies
- subscriptions: 2 policies
- invoices: 1 policy

---

## 5. Authentication Providers

### Email/Password
- [ ] Opened Authentication > Providers
- [ ] Email provider is enabled (default)
- [ ] Configured email templates (optional):
  - [ ] Confirmation email
  - [ ] Reset password email
  - [ ] Magic link email

### Google OAuth
- [ ] Enabled Google provider in Supabase
- [ ] Opened [Google Cloud Console](https://console.cloud.google.com)
- [ ] Created OAuth 2.0 Client ID
- [ ] Added authorized redirect URI: `https://xxx.supabase.co/auth/v1/callback`
- [ ] Copied Client ID to Supabase
- [ ] Copied Client Secret to Supabase
- [ ] Tested OAuth flow (try login with Google)

### GitHub OAuth
- [ ] Enabled GitHub provider in Supabase
- [ ] Opened GitHub Settings > Developer settings > OAuth Apps
- [ ] Created new OAuth App
- [ ] Authorization callback URL: `https://xxx.supabase.co/auth/v1/callback`
- [ ] Copied Client ID to Supabase
- [ ] Copied Client Secret to Supabase
- [ ] Tested OAuth flow (try login with GitHub)

### Magic Links
- [ ] Enabled Magic Link provider
- [ ] Tested magic link (send to your email)

---

## 6. Site URL Configuration

- [ ] Opened Authentication > URL Configuration
- [ ] Set Site URL: `https://sitespector.app`
- [ ] Added Redirect URLs:
  - [ ] `https://sitespector.app/auth/callback`
  - [ ] `https://www.sitespector.app/auth/callback`
  - [ ] `http://localhost:3000/auth/callback` (for local dev)

---

## 7. Environment Variables

### Backend (.env on VPS)

- [ ] SSH to VPS: `ssh root@77.42.79.46`
- [ ] Edited `/opt/sitespector/.env`
- [ ] Added Supabase variables:
  ```bash
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_ANON_KEY=eyJhbGc...
  SUPABASE_SERVICE_KEY=eyJhbGc...
  ```
- [ ] Saved file
- [ ] Restarted backend: `docker compose -f docker-compose.prod.yml restart backend`

### Frontend (.env.local for local dev)

- [ ] Created `frontend/.env.local`
- [ ] Added Supabase variables:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  ```
- [ ] Saved file

---

## 8. VPS Database Migration

- [ ] SSH to VPS: `ssh root@77.42.79.46`
- [ ] Navigate to project: `cd /opt/sitespector`
- [ ] Access PostgreSQL:
  ```bash
  docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db
  ```
- [ ] Run migration (paste contents of `supabase/migration_add_workspace_id.sql`):
  ```sql
  ALTER TABLE audits ADD COLUMN IF NOT EXISTS workspace_id UUID;
  CREATE INDEX IF NOT EXISTS idx_audits_workspace ON audits(workspace_id);
  ALTER TABLE audits ALTER COLUMN user_id DROP NOT NULL;
  ```
- [ ] Verify migration:
  ```sql
  \d audits
  -- Should show workspace_id column
  ```
- [ ] Exit: `\q`

---

## 9. KawaSaaS Reference Clone

- [ ] Cloned KawaSaaS for reference:
  ```bash
  cd ~/Desktop/projekty\ nowe/
  git clone https://github.com/dawidkawalec/KawaSaaS.git kawasaas-reference
  ```
- [ ] Explored component structure
- [ ] Reviewed `docs/KAWASAAS_COMPONENTS.md` inventory

---

## 10. Test Supabase Connection

### Test User Creation
- [ ] Opened Supabase Dashboard > Authentication > Users
- [ ] Clicked "Add user"
- [ ] Created test user:
  - Email: test@sitespector.app
  - Password: TestPassword123!
- [ ] Verified trigger created:
  - [ ] Profile in `profiles` table
  - [ ] Personal workspace in `workspaces` table
  - [ ] Workspace membership in `workspace_members` table
  - [ ] Subscription in `subscriptions` table

### Test RLS
- [ ] Opened SQL Editor
- [ ] Tested query with user JWT:
  ```sql
  -- Get JWT token from user (in Authentication > Users > click user > copy JWT)
  -- Paste in "Set JWT" box in SQL Editor
  
  SELECT * FROM workspaces;
  -- Should only return workspaces for that user
  ```
- [ ] Verified user can only see own data

---

## 11. Documentation

- [ ] Read `supabase/README.md` thoroughly
- [ ] Bookmarked Supabase project URL
- [ ] Saved credentials in secure location
- [ ] Documented any issues encountered

---

## Phase 0 Completion

- [ ] All checklist items above completed
- [ ] Supabase project fully configured
- [ ] Database schema and policies deployed
- [ ] VPS database updated with workspace_id
- [ ] Environment variables added
- [ ] Test user successfully created with workspace

**Ready to proceed to Phase 1: Auth Migration**

---

**Date Completed**: _____________  
**Notes**: 
- Any issues encountered:
- Time taken:
- Supabase plan: Free / Pro
