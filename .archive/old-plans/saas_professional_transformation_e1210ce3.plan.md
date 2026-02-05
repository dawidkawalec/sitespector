---
name: SaaS Professional Transformation
overview: Transform SiteSpector from POC to professional SaaS platform with Supabase Auth, Teams (personal + team workspaces), modern UI from KawaSaaS, and Stripe billing. Maintain FastAPI backend for core audit processing while adding Supabase layer for user management and SaaS features.
todos:
  - id: phase0_supabase
    content: "Phase 0: Supabase project setup, schema creation, RLS policies, environment configuration"
    status: completed
  - id: phase1_auth_migration
    content: "Phase 1: Replace JWT with Supabase Auth, migrate users, update frontend/backend authentication"
    status: completed
  - id: phase2_teams
    content: "Phase 2: Implement workspaces (personal + team), member management, invites, workspace switcher"
    status: completed
  - id: phase3_ui
    content: "Phase 3: Port sidebar from KawaSaaS, add settings pages, implement dark mode, mobile responsive"
    status: completed
  - id: phase4_billing
    content: "Phase 4: Stripe integration, pricing page, checkout flow, webhooks, subscription management"
    status: completed
  - id: phase5_domain
    content: "Phase 5: Configure sitespector.app domain, setup Let's Encrypt SSL, final testing, production deploy"
    status: completed
isProject: false
---

# SiteSpector: POC → Professional SaaS Transformation

## Executive Summary

**Goal**: Transform current POC into production-ready SaaS with professional features:

- Supabase Auth (OAuth, magic links, email verification)
- Teams/Workspaces (personal + team model, like Vercel)
- Modern UI (sidebar navigation, settings, responsive)
- Stripe billing (Free/Pro/Enterprise tiers)
- Domain setup (sitespector.app with Let's Encrypt)

**Strategy**: Hybrid architecture - Keep FastAPI backend for audits, add Supabase layer for SaaS features.

**Timeline**: 5-7 weeks (depending on complexity)

---

## Current State Analysis

### What Works

- FastAPI backend: Audit CRUD, worker processing, AI analysis
- Frontend: Next.js 14, all rendering functions implemented
- Infrastructure: 7 Docker containers on VPS, stable production
- Core value: Audit processing with Screaming Frog + Lighthouse + Gemini AI

### Critical Gaps (Why We Need This)

- No OAuth (only email/password)
- No teams/collaboration
- No subscription management or limits
- Basic UI (no sidebar, minimal navigation)
- Self-signed SSL (browser warnings)
- Single-user architecture (no multi-tenancy)

---

## Target Architecture

```mermaid
graph TB
    subgraph Browser[Browser - sitespector.app]
        FE[Next.js Frontend]
    end
    
    subgraph SupabaseCloud[Supabase Cloud]
        SAuth[Supabase Auth<br/>OAuth + Email]
        SDB[(PostgreSQL<br/>users, teams, billing)]
        SRLS[Row Level Security]
    end
    
    subgraph VPS[Hetzner VPS - 77.42.79.46]
        Nginx[Nginx + Let's Encrypt]
        Backend[FastAPI Backend<br/>Audit API]
        Worker[Worker<br/>Audit Processing]
        AuditDB[(PostgreSQL<br/>audits, results JSONB)]
        SF[Screaming Frog]
        LH[Lighthouse]
    end
    
    subgraph External[External Services]
        Stripe[Stripe<br/>Payments]
        Gemini[Google Gemini<br/>AI Analysis]
    end
    
    FE -->|Auth + Teams| SAuth
    FE -->|Audit Operations| Backend
    SAuth --> SDB
    SDB --> SRLS
    Backend --> AuditDB
    Backend -->|Verify JWT| SAuth
    Worker --> AuditDB
    Worker --> SF
    Worker --> LH
    Worker --> Gemini
    FE -->|Checkout| Stripe
    Stripe -->|Webhooks| Backend
    
    style SAuth fill:#10b981
    style SDB fill:#10b981
    style AuditDB fill:#3b82f6
    style Worker fill:#f59e0b
```



### Database Strategy: Dual Database

**Supabase PostgreSQL** (User/SaaS data):

- `auth.users` (Supabase managed, OAuth ready)
- `public.profiles` (user profiles, avatar, name)
- `public.workspaces` (personal + team workspaces)
- `public.workspace_members` (user-workspace junction, roles)
- `public.invites` (pending invitations)
- `public.subscriptions` (Stripe customer, plan, limits)
- `public.invoices` (Stripe invoice history)

**VPS PostgreSQL** (Audit data):

- `audits` (status, scores, results JSONB, workspace_id FK)
- `competitors` (competitor audit results)
- Link to Supabase via `workspace_id` (not user_id!)

**Why dual?**

- Supabase RLS protects user/team data automatically
- VPS PostgreSQL: Fast local access for worker (large JSONB results)
- Clear separation: SaaS features vs core business logic

---

## Phase 0: Preparation & Setup (Week 1, Days 1-3)

### Objectives

- Supabase project setup
- Schema design finalization
- Environment preparation
- KawaSaaS component inventory

### Tasks

#### 1. Supabase Project Setup

**Create Supabase project**:

- Sign up at supabase.com
- Create project: "sitespector-prod"
- Note: Project URL, anon key, service role key
- Choose region: Europe (closest to VPS)
- Plan: Free tier initially (upgrade to Pro if needed)

**Configure authentication**:

```sql
-- Enable email/password
-- Enable Google OAuth (add OAuth credentials)
-- Enable GitHub OAuth (add OAuth credentials)
-- Enable magic links
-- Customize email templates (brand with SiteSpector)
```

**Add redirect URLs**:

- Development: `http://localhost:3000/auth/callback`
- Production: `https://sitespector.app/auth/callback`

#### 2. Supabase Database Schema

**File**: Create `supabase/schema.sql`

```sql
-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces (personal + team)
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'team')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members (junction table)
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Invites
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (Stripe integration)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  audit_limit INTEGER NOT NULL DEFAULT 5, -- Free: 5, Pro: 50, Enterprise: unlimited
  audits_used_this_month INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (Stripe)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount_paid INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_pdf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_subscriptions_workspace ON subscriptions(workspace_id);
```

**Run migration**:

```bash
# In Supabase dashboard: SQL Editor
# Paste and execute schema.sql
```

#### 3. Supabase RLS Policies

**File**: Create `supabase/policies.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Workspaces: Members can view their workspaces
CREATE POLICY "Members can view workspaces" ON public.workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Workspaces: Owners can update/delete
CREATE POLICY "Owners can update workspaces" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces" ON public.workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- Workspace members: Members can view
CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Workspace members: Admins/Owners can manage
CREATE POLICY "Admins can manage members" ON public.workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Subscriptions: Members can view workspace subscription
CREATE POLICY "Members can view subscription" ON public.subscriptions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- (More policies for invites, invoices...)
```

**Run policies**:

```bash
# In Supabase dashboard: SQL Editor
# Paste and execute policies.sql
```

#### 4. VPS PostgreSQL Schema Update

**Migrate `audits` table**:

```sql
-- Add workspace_id column (replaces user_id)
ALTER TABLE audits ADD COLUMN workspace_id UUID;

-- Migrate existing data (temporary: map user_id to workspace_id)
-- This will be handled in Phase 1 migration script

-- Add index
CREATE INDEX idx_audits_workspace ON audits(workspace_id);

-- Note: Keep user_id temporarily for migration
```

#### 5. Environment Variables Update

**VPS `.env**` (`/opt/sitespector/.env`):

```bash
# Existing vars...
DATABASE_URL=postgresql+asyncpg://sitespector_user:sitespector_password@postgres:5432/sitespector_db

# NEW: Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...  # For backend JWT verification

# NEW: Stripe (Phase 4)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

**Frontend `.env.local**` (local development):

```bash
NEXT_PUBLIC_API_URL=https://77.42.79.46  # Will change to sitespector.app later
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

#### 6. KawaSaaS Component Inventory

**Clone KawaSaaS** (reference only, don't integrate yet):

```bash
cd ~/Desktop/projekty\ nowe/
git clone https://github.com/dawidkawalec/KawaSaaS.git kawasaas-reference
cd kawasaas-reference
```

**Components to extract** (Phase 3):

- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/shared/Logo.tsx`
- `src/features/settings/*` (Profile, Appearance, Notifications)
- `src/features/teams/*` (TeamSwitcher, MembersList, InviteModal)
- `src/features/billing/*` (PricingTable, InvoiceHistory)
- `src/features/auth/*` (OAuth login buttons, magic link UI)

**Note**: Don't copy-paste yet. We'll adapt each component in Phase 3.

---

## Phase 1: Auth Migration (Week 1-2, Days 4-10)

### Objectives

- Replace JWT auth with Supabase Auth
- Migrate existing users to Supabase
- Update frontend to use Supabase SDK
- Update backend to verify Supabase JWTs

### 1.1 Install Supabase SDK

**Frontend** (`frontend/`):

```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs  # Next.js specific helpers
```

**Backend** (`backend/`):

```bash
pip install supabase
# Or use httpx to verify JWT manually (lighter)
```

### 1.2 Create Supabase Client

**Frontend**: [`frontend/lib/supabase.ts`]

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// For client components
export const supabase = createClientComponentClient()

// For server components (if needed later)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Backend**: [`backend/app/lib/supabase.py`]

```python
from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_KEY  # Service key for admin operations
)
```

### 1.3 Update Frontend Auth

**Replace** `frontend/lib/api.ts` auth functions:

```typescript
// OLD: Custom JWT
export const authAPI = {
  login: async (credentials) => { /* ... */ },
  register: async (credentials) => { /* ... */ }
}

// NEW: Supabase Auth
export const authAPI = {
  // Email/password login
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  // Email/password register
  register: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },

  // OAuth login
  loginWithOAuth: async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },

  // Magic link
  loginWithMagicLink: async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },

  // Get current session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut()
  }
}
```

**Update login page** [`frontend/app/login/page.tsx`]:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Login to SiteSpector</h1>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {/* OAuth buttons */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleOAuthLogin('google')}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              {/* Google icon */}
            </svg>
            Continue with Google
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleOAuthLogin('github')}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              {/* GitHub icon */}
            </svg>
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Email/password form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/register" className="text-primary hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}
```

**Create auth callback** [`frontend/app/auth/callback/page.tsx`]:

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    })
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing login...</h1>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  )
}
```

### 1.4 Update Backend JWT Verification

**Replace** `backend/app/dependencies/auth.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.lib.supabase import supabase
import jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Verify Supabase JWT token and return user info."""
    
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        user = response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        return {
            "id": user.id,
            "email": user.email,
            "user_metadata": user.user_metadata
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
```

**Update all endpoints** to use new `get_current_user`:

```python
# Example: backend/app/routers/audits.py
from app.dependencies.auth import get_current_user

@router.post("/audits", status_code=status.HTTP_201_CREATED)
async def create_audit(
    data: CreateAuditSchema,
    current_user: dict = Depends(get_current_user),  # Changed
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user["id"]  # Supabase UUID
    # ... rest of logic
```

### 1.5 User Migration Script

**Create** `backend/scripts/migrate_users_to_supabase.py`:

```python
"""
Migrate existing users from VPS PostgreSQL to Supabase Auth.

IMPORTANT: Run this ONCE after Supabase setup.
"""

import asyncio
from app.database import get_db
from app.models import User
from app.lib.supabase import supabase
from sqlalchemy import select

async def migrate_users():
    async for db in get_db():
        # Get all users from VPS database
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print(f"Found {len(users)} users to migrate")
        
        for user in users:
            try:
                # Create user in Supabase Auth
                response = supabase.auth.admin.create_user({
                    "email": user.email,
                    "password": "TEMPORARY_PASSWORD_RESET_REQUIRED",  # Force password reset
                    "email_confirm": True,
                    "user_metadata": {
                        "migrated_from_poc": True,
                        "original_id": str(user.id)
                    }
                })
                
                supabase_user_id = response.user.id
                
                # Create personal workspace for user
                workspace = supabase.table("workspaces").insert({
                    "name": f"{user.email}'s Workspace",
                    "slug": user.email.split("@")[0],
                    "type": "personal",
                    "owner_id": supabase_user_id
                }).execute()
                
                workspace_id = workspace.data[0]["id"]
                
                # Add user as workspace owner
                supabase.table("workspace_members").insert({
                    "workspace_id": workspace_id,
                    "user_id": supabase_user_id,
                    "role": "owner"
                }).execute()
                
                # Update audits to link to workspace
                # (Run SQL directly on VPS PostgreSQL)
                await db.execute(
                    f"UPDATE audits SET workspace_id = '{workspace_id}' WHERE user_id = '{user.id}'"
                )
                
                print(f"✅ Migrated user: {user.email}")
                
            except Exception as e:
                print(f"❌ Error migrating {user.email}: {e}")
        
        await db.commit()
        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_users())
```

**Run migration**:

```bash
# SSH to VPS
ssh root@77.42.79.46
cd /opt/sitespector

# Run migration script
docker exec sitespector-backend python scripts/migrate_users_to_supabase.py
```

**Send password reset emails**:

```python
# In migration script, after user creation:
supabase.auth.admin.generate_link({
    "type": "magiclink",
    "email": user.email
})
# Email users manually or automate
```

### 1.6 Testing Auth Migration

**Test checklist**:

- Login with email/password works
- Register new user works
- OAuth login (Google) works
- OAuth login (GitHub) works
- Magic link login works
- Backend verifies Supabase JWT correctly
- Protected routes require authentication
- Logout works (clears session)
- Migrated users can login (after password reset)
- New audits link to workspace_id (not user_id)

---

## Phase 2: Teams Implementation (Week 2-3, Days 11-21)

### Objectives

- Implement workspace switcher
- Team creation and management
- Member invites and roles
- RLS enforcement
- Audit ownership transfer (user → workspace)

### 2.1 Workspace Context Provider

**Create** `frontend/lib/WorkspaceContext.tsx`:

```typescript
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

interface Workspace {
  id: string
  name: string
  slug: string
  type: 'personal' | 'team'
  owner_id: string
  role: 'owner' | 'admin' | 'member'
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  switchWorkspace: (workspaceId: string) => void
  refreshWorkspaces: () => Promise<void>
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchWorkspaces = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch workspaces where user is a member
      const { data: members, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          role,
          workspaces (
            id,
            name,
            slug,
            type,
            owner_id
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const workspaceList = members.map(m => ({
        id: m.workspaces.id,
        name: m.workspaces.name,
        slug: m.workspaces.slug,
        type: m.workspaces.type,
        owner_id: m.workspaces.owner_id,
        role: m.role
      }))

      setWorkspaces(workspaceList)

      // Set current workspace from localStorage or default to first
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      const workspace = workspaceList.find(w => w.id === savedWorkspaceId) || workspaceList[0]
      setCurrentWorkspace(workspace || null)

    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
      localStorage.setItem('currentWorkspaceId', workspaceId)
    }
  }

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        switchWorkspace,
        refreshWorkspaces: fetchWorkspaces,
        isLoading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}
```

**Wrap app** in `frontend/app/layout.tsx`:

```typescript
import Providers from '@/components/Providers'
import { WorkspaceProvider } from '@/lib/WorkspaceContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <Providers>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </Providers>
      </body>
    </html>
  )
}
```

### 2.2 Workspace Switcher Component

**Adapt from KawaSaaS**: `frontend/components/WorkspaceSwitcher.tsx`

```typescript
'use client'

import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useState } from 'react'

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)

  const personalWorkspaces = workspaces.filter(w => w.type === 'personal')
  const teamWorkspaces = workspaces.filter(w => w.type === 'team')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select workspace"
          className="w-[200px] justify-between"
        >
          {currentWorkspace ? currentWorkspace.name : 'Select workspace'}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search workspace..." />
            <CommandEmpty>No workspace found.</CommandEmpty>
            
            {personalWorkspaces.length > 0 && (
              <CommandGroup heading="Personal">
                {personalWorkspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    onSelect={() => {
                      switchWorkspace(workspace.id)
                      setOpen(false)
                    }}
                  >
                    {workspace.name}
                    <Check
                      className={
                        currentWorkspace?.id === workspace.id
                          ? "ml-auto h-4 w-4"
                          : "ml-auto h-4 w-4 opacity-0"
                      }
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {teamWorkspaces.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Teams">
                  {teamWorkspaces.map((workspace) => (
                    <CommandItem
                      key={workspace.id}
                      onSelect={() => {
                        switchWorkspace(workspace.id)
                        setOpen(false)
                      }}
                    >
                      {workspace.name}
                      <Check
                        className={
                          currentWorkspace?.id === workspace.id
                            ? "ml-auto h-4 w-4"
                            : "ml-auto h-4 w-4 opacity-0"
                        }
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  // Open create team dialog
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Team
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### 2.3 Team Creation Dialog

**Create** `frontend/components/teams/CreateTeamDialog.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateTeamDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { refreshWorkspaces } = useWorkspace()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate slug from team name
      const slug = teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: teamName,
          slug: slug,
          type: 'team',
          owner_id: user.id
        })
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) throw memberError

      // Create default subscription (free plan)
      await supabase
        .from('subscriptions')
        .insert({
          workspace_id: workspace.id,
          plan: 'free',
          status: 'active',
          audit_limit: 5,
          audits_used_this_month: 0
        })

      await refreshWorkspaces()
      setOpen(false)
      setTeamName('')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a new team workspace to collaborate with others.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              placeholder="My Awesome Team"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Team'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 2.4 Team Settings Page

**Create** `frontend/app/settings/team/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Mail } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  role: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  }
  user: {
    email: string
  }
}

export default function TeamSettingsPage() {
  const { currentWorkspace } = useWorkspace()
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    if (currentWorkspace) {
      fetchMembers()
    }
  }, [currentWorkspace])

  const fetchMembers = async () => {
    if (!currentWorkspace) return

    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        profiles:user_id (
          full_name,
          avatar_url
        ),
        user:user_id (
          email
        )
      `)
      .eq('workspace_id', currentWorkspace.id)

    if (error) {
      console.error('Error fetching members:', error)
      return
    }

    setMembers(data as any)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)

    try {
      // Generate invite token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('invites')
        .insert({
          workspace_id: currentWorkspace!.id,
          email: inviteEmail,
          role: 'member',
          invited_by: user.id,
          token: token,
          expires_at: expiresAt.toISOString()
        })

      if (error) throw error

      // TODO: Send email with invite link
      // For now, show token
      alert(`Invite sent! Link: https://sitespector.app/invite/${token}`)
      setInviteEmail('')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      alert(error.message)
      return
    }

    fetchMembers()
  }

  if (!currentWorkspace) return null

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Team Settings</h1>

      {/* Invite member */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>
            Send an invitation to join this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={isInviting}>
              <Mail className="mr-2 h-4 w-4" />
              {isInviting ? 'Inviting...' : 'Invite'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage who has access to this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {member.profiles?.full_name?.charAt(0) || member.user.email.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.profiles?.full_name || member.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{member.role}</Badge>
                  {member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2.5 Update Audit API to Use Workspaces

**Backend**: Modify `backend/app/routers/audits.py`

```python
@router.post("/audits", status_code=status.HTTP_201_CREATED)
async def create_audit(
    data: CreateAuditSchema,
    workspace_id: str,  # NEW: Required query param
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify user is member of workspace
    # (Call Supabase to check workspace_members table)
    response = supabase.table("workspace_members").select("role").eq(
        "workspace_id", workspace_id
    ).eq("user_id", current_user["id"]).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    # Check subscription limits
    subscription = supabase.table("subscriptions").select("*").eq(
        "workspace_id", workspace_id
    ).single().execute()
    
    if subscription.data["audits_used_this_month"] >= subscription.data["audit_limit"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Audit limit reached for this workspace. Upgrade to Pro."
        )
    
    # Create audit
    audit = Audit(
        workspace_id=workspace_id,  # Changed from user_id
        url=data.url,
        status=AuditStatus.PENDING
    )
    db.add(audit)
    await db.commit()
    
    # Increment audit counter
    supabase.table("subscriptions").update({
        "audits_used_this_month": subscription.data["audits_used_this_month"] + 1
    }).eq("workspace_id", workspace_id).execute()
    
    return audit

@router.get("/audits")
async def list_audits(
    workspace_id: str,  # NEW: Required query param
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify membership (same as create)
    # ...
    
    # Fetch audits for workspace
    result = await db.execute(
        select(Audit).where(Audit.workspace_id == workspace_id).order_by(Audit.created_at.desc())
    )
    audits = result.scalars().all()
    
    return {"items": audits, "total": len(audits)}
```

**Frontend**: Update API calls to include `workspace_id`

```typescript
// frontend/lib/api.ts
export const auditsAPI = {
  create: async (data: CreateAuditData) => {
    const { currentWorkspace } = useWorkspace() // Access context
    
    const response = await fetch(`${API_URL}/api/audits?workspace_id=${currentWorkspace.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getSupabaseToken()}`
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  },
  
  list: async () => {
    const { currentWorkspace } = useWorkspace()
    
    const response = await fetch(`${API_URL}/api/audits?workspace_id=${currentWorkspace.id}`, {
      headers: {
        'Authorization': `Bearer ${await getSupabaseToken()}`
      }
    })
    
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }
}

async function getSupabaseToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || ''
}
```

---

## Phase 3: UI Modernization (Week 4, Days 22-28)

### Objectives

- Port sidebar layout from KawaSaaS
- Implement settings pages (Profile, Appearance, Notifications)
- Responsive navigation
- Dark mode support
- Modern dashboard design

### 3.1 Sidebar Layout

**Adapt from KawaSaaS**: `frontend/components/layout/Sidebar.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileSearch,
  Settings,
  Users,
  CreditCard,
  LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Audits', href: '/audits', icon: FileSearch },
  { name: 'Team', href: '/settings/team', icon: Users },
  { name: 'Billing', href: '/settings/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold">SiteSpector</h1>
      </div>

      {/* Workspace switcher */}
      <div className="p-4">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-secondary'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
```

**Create dashboard layout**: `frontend/app/dashboard/layout.tsx`

```typescript
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

**Update dashboard page** to remove duplicate navigation:

```typescript
// frontend/app/dashboard/page.tsx
export default function DashboardPage() {
  // Remove logout button, workspace switcher - now in Sidebar
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      {/* Audits list */}
    </div>
  )
}
```

### 3.2 Settings Pages

**Settings layout**: `frontend/app/settings/layout.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const settingsNav = [
  { name: 'Profile', href: '/settings/profile' },
  { name: 'Team', href: '/settings/team' },
  { name: 'Billing', href: '/settings/billing' },
  { name: 'Appearance', href: '/settings/appearance' },
  { name: 'Notifications', href: '/settings/notifications' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex gap-8">
          {/* Settings sidebar */}
          <nav className="w-48 space-y-1">
            {settingsNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium',
                  pathname === item.href
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Settings content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Profile page**: `frontend/app/settings/profile/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setEmail(user.email || '')

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setFullName(profile.full_name || '')
    }

    setIsLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Profile updated!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
              />
              <p className="text-sm text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Appearance page**: `frontend/app/settings/appearance/page.tsx`

```typescript
'use client'

import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Appearance</h1>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose how SiteSpector looks to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="w-32"
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="w-32"
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="w-32"
            >
              <Monitor className="mr-2 h-4 w-4" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Install theme provider**:

```bash
npm install next-themes
```

**Wrap in theme provider**: `frontend/app/layout.tsx`

```typescript
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <WorkspaceProvider>
              {children}
            </WorkspaceProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 3.3 Responsive Mobile Menu

**Mobile sidebar**: `frontend/components/layout/MobileSidebar.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from './Sidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}
```

**Update layout to show mobile menu**:

```typescript
// frontend/app/dashboard/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile header with menu */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden h-16 border-b flex items-center px-4">
          <MobileSidebar />
          <h1 className="ml-4 text-xl font-bold">SiteSpector</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Phase 4: Billing Integration (Week 5, Days 29-35)

### Objectives

- Stripe account setup
- Pricing page
- Checkout flow
- Webhook handling
- Subscription management UI
- Audit limit enforcement

### 4.1 Stripe Setup

**Create Stripe account**:

- Sign up at stripe.com
- Get API keys (test mode)
- Note: Secret key, Publishable key

**Create products & prices**:

```bash
# Via Stripe dashboard or CLI

# Product: SiteSpector Pro
# Price: $29/month (recurring)
# Price ID: price_pro_monthly

# Product: SiteSpector Enterprise
# Price: $99/month (recurring)
# Price ID: price_enterprise_monthly
```

**Install Stripe SDK**:

```bash
# Frontend
npm install @stripe/stripe-js

# Backend
pip install stripe
```

### 4.2 Pricing Page

**Create** `frontend/app/pricing/page.tsx`:

```typescript
'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useRouter } from 'next/navigation'

const plans = [
  {
    name: 'Free',
    price: '$0',
    priceId: null,
    features: [
      '5 audits per month',
      'Basic SEO analysis',
      'Performance metrics',
      'PDF reports',
      'Email support'
    ]
  },
  {
    name: 'Pro',
    price: '$29',
    priceId: 'price_pro_monthly',
    features: [
      '50 audits per month',
      'Advanced SEO analysis',
      'Competitor analysis',
      'Priority email support',
      'White-label reports',
      'API access'
    ]
  },
  {
    name: 'Enterprise',
    price: '$99',
    priceId: 'price_enterprise_monthly',
    features: [
      'Unlimited audits',
      'All Pro features',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option'
    ]
  }
]

export default function PricingPage() {
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) return // Free plan

    try {
      // Call backend to create checkout session
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSupabaseToken()}`
        },
        body: JSON.stringify({
          workspace_id: currentWorkspace?.id,
          price_id: priceId
        })
      })

      const { checkout_url } = await response.json()
      window.location.href = checkout_url
    } catch (error) {
      alert('Error creating checkout session')
    }
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.name === 'Pro' ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.name === 'Pro' ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.priceId)}
              >
                {plan.name === 'Free' ? 'Current Plan' : 'Subscribe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### 4.3 Backend Checkout Endpoint

**Create** `backend/app/routers/billing.py`:

```python
import stripe
from fastapi import APIRouter, Depends, HTTPException
from app.config import settings
from app.dependencies.auth import get_current_user
from app.lib.supabase import supabase

router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/create-checkout-session")
async def create_checkout_session(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    workspace_id = data.get("workspace_id")
    price_id = data.get("price_id")
    
    # Get or create Stripe customer
    subscription = supabase.table("subscriptions").select("*").eq(
        "workspace_id", workspace_id
    ).single().execute()
    
    if subscription.data["stripe_customer_id"]:
        customer_id = subscription.data["stripe_customer_id"]
    else:
        # Create Stripe customer
        customer = stripe.Customer.create(
            email=current_user["email"],
            metadata={"workspace_id": workspace_id}
        )
        customer_id = customer.id
        
        # Save customer ID
        supabase.table("subscriptions").update({
            "stripe_customer_id": customer_id
        }).eq("workspace_id", workspace_id).execute()
    
    # Create checkout session
    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{
            "price": price_id,
            "quantity": 1
        }],
        mode="subscription",
        success_url=f"{settings.FRONTEND_URL}/settings/billing?success=true",
        cancel_url=f"{settings.FRONTEND_URL}/pricing?canceled=true",
        metadata={
            "workspace_id": workspace_id
        }
    )
    
    return {"checkout_url": session.url}

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks (subscription events)."""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Handle different event types
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        workspace_id = session["metadata"]["workspace_id"]
        subscription_id = session["subscription"]
        
        # Update subscription in database
        supabase.table("subscriptions").update({
            "stripe_subscription_id": subscription_id,
            "plan": "pro",  # Determine from price_id
            "status": "active",
            "audit_limit": 50
        }).eq("workspace_id", workspace_id).execute()
    
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        
        # Downgrade to free plan
        customer = stripe.Customer.retrieve(subscription["customer"])
        workspace_id = customer["metadata"]["workspace_id"]
        
        supabase.table("subscriptions").update({
            "plan": "free",
            "status": "canceled",
            "audit_limit": 5
        }).eq("workspace_id", workspace_id).execute()
    
    # ... handle other events
    
    return {"status": "success"}
```

**Register billing routes**: `backend/app/main.py`

```python
from app.routers import audits, auth, billing

app.include_router(auth.router)
app.include_router(audits.router)
app.include_router(billing.router)
```

### 4.4 Billing Settings Page

**Create** `frontend/app/settings/billing/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Download } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  plan: string
  status: string
  audit_limit: number
  audits_used_this_month: number
  current_period_end: string | null
}

export default function BillingPage() {
  const { currentWorkspace } = useWorkspace()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentWorkspace) {
      fetchSubscription()
    }
  }, [currentWorkspace])

  const fetchSubscription = async () => {
    if (!currentWorkspace) return

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .single()

    if (error) {
      console.error('Error fetching subscription:', error)
      return
    }

    setSubscription(data as any)
    setIsLoading(false)
  }

  if (isLoading) return <div>Loading...</div>
  if (!subscription) return <div>No subscription found</div>

  const usagePercent = (subscription.audits_used_this_month / subscription.audit_limit) * 100

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

      {/* Current plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold capitalize">{subscription.plan}</h3>
              <p className="text-sm text-muted-foreground">
                {subscription.status === 'active' ? 'Active' : 'Canceled'}
              </p>
            </div>
            <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
              {subscription.status}
            </Badge>
          </div>

          {/* Usage */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Audits this month</span>
              <span className="text-sm text-muted-foreground">
                {subscription.audits_used_this_month} / {subscription.audit_limit}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {subscription.plan === 'free' && (
            <Link href="/pricing">
              <Button>Upgrade to Pro</Button>
            </Link>
          )}

          {subscription.plan !== 'free' && (
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invoices (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No invoices yet</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4.5 Audit Limit Enforcement

**Already implemented** in Phase 2.5 (create audit endpoint checks `audit_limit`).

**Add UI warning** when approaching limit:

```typescript
// frontend/components/NewAuditDialog.tsx
export default function NewAuditDialog() {
  const { currentWorkspace } = useWorkspace()
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    // Fetch subscription
    supabase
      .from('subscriptions')
      .select('*')
      .eq('workspace_id', currentWorkspace?.id)
      .single()
      .then(({ data }) => setSubscription(data))
  }, [currentWorkspace])

  const auditsRemaining = subscription 
    ? subscription.audit_limit - subscription.audits_used_this_month 
    : 0

  return (
    <Dialog>
      {/* ... */}
      {auditsRemaining <= 2 && (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded mb-4">
          Warning: You have {auditsRemaining} audits remaining this month. 
          <Link href="/pricing" className="underline ml-1">Upgrade to Pro</Link>
        </div>
      )}
      {/* ... */}
    </Dialog>
  )
}
```

---

## Phase 5: Domain & Final Polish (Week 6-7, Days 36-42)

### Objectives

- Configure domain (sitespector.app)
- Setup Let's Encrypt SSL
- Update environment variables
- Final testing
- Production deployment

### 5.1 Domain Configuration

**DNS Setup** (at domain registrar):

```
# Add these DNS records:

A Record:
  Name: @
  Value: 77.42.79.46
  TTL: 3600

A Record:
  Name: www
  Value: 77.42.79.46
  TTL: 3600

CNAME Record (if using Cloudflare):
  Name: www
  Value: sitespector.app
  TTL: Auto
```

**Wait for DNS propagation** (10 minutes - 48 hours):

```bash
# Check DNS resolution
dig sitespector.app
dig www.sitespector.app
```

### 5.2 Let's Encrypt SSL

**SSH to VPS**:

```bash
ssh root@77.42.79.46
cd /opt/sitespector
```

**Install certbot**:

```bash
apt update
apt install certbot python3-certbot-nginx
```

**Stop nginx temporarily**:

```bash
docker compose -f docker-compose.prod.yml stop nginx
```

**Obtain certificate**:

```bash
certbot certonly --standalone -d sitespector.app -d www.sitespector.app --non-interactive --agree-tos -m your-email@example.com
```

**Certificates location**:

```
/etc/letsencrypt/live/sitespector.app/fullchain.pem
/etc/letsencrypt/live/sitespector.app/privkey.pem
```

**Update nginx config**: `docker/nginx/nginx.conf`

```nginx
server {
    listen 80;
    server_name sitespector.app www.sitespector.app;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sitespector.app www.sitespector.app;

    # Let's Encrypt SSL
    ssl_certificate /etc/letsencrypt/live/sitespector.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sitespector.app/privkey.pem;

    # SSL optimization
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Update docker-compose.prod.yml**:

```yaml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro  # Mount Let's Encrypt certs
    - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
```

**Restart nginx**:

```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

**Setup auto-renewal**:

```bash
# Test renewal
certbot renew --dry-run

# Add cron job
crontab -e

# Add line:
0 3 * * * certbot renew --quiet && docker compose -f /opt/sitespector/docker-compose.prod.yml restart nginx
```

### 5.3 Update Environment Variables

**VPS `.env**`:

```bash
# Update CORS origins
CORS_ORIGINS=["https://sitespector.app","https://www.sitespector.app"]
```

**Frontend env** (rebuild required):

```bash
# In docker-compose.prod.yml
frontend:
  build:
    args:
      - NEXT_PUBLIC_API_URL=https://sitespector.app
  environment:
    - NEXT_PUBLIC_API_URL=https://sitespector.app
```

**Supabase redirect URLs**:

```
# In Supabase dashboard: Authentication > URL Configuration
# Add site URL: https://sitespector.app
# Add redirect URLs:
https://sitespector.app/auth/callback
https://www.sitespector.app/auth/callback
```

**Rebuild frontend**:

```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

**Restart backend**:

```bash
docker compose -f docker-compose.prod.yml restart backend
```

### 5.4 Final Testing Checklist

**Authentication**:

- Email/password login works on sitespector.app
- Google OAuth works
- GitHub OAuth works
- Magic link works
- Logout works

**Teams**:

- Create personal workspace works
- Create team workspace works
- Workspace switcher works
- Invite member works
- Accept invite works
- Remove member works
- Team settings page loads

**Audits**:

- Create audit in personal workspace
- Create audit in team workspace
- View audit details
- Download PDF works
- Download raw data works
- Delete audit works
- Audit limit enforced correctly

**Billing**:

- Pricing page loads
- Checkout flow works (test mode)
- Stripe webhook receives events
- Subscription updates in database
- Billing page shows correct info
- Audit limit increases after upgrade

**UI**:

- Sidebar navigation works
- Mobile menu works
- Dark mode toggle works
- All settings pages load
- Responsive on mobile
- No console errors

**Domain**:

- sitespector.app loads (HTTPS)
- [www.sitespector.app](http://www.sitespector.app) redirects to sitespector.app
- SSL certificate valid (no warnings)
- All API calls work on new domain

### 5.5 Production Deployment

**Final commit**:

```bash
# Local
git add .
git commit -m "Phase 5: Domain and SSL configuration complete"
# ASK USER before pushing
```

**Deploy to VPS**:

```bash
ssh root@77.42.79.46
cd /opt/sitespector
git pull origin release
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d
```

**Monitor**:

```bash
docker logs sitespector-frontend --tail 100 -f
docker logs sitespector-backend --tail 100 -f
docker logs sitespector-worker --tail 100 -f
```

---

## Post-Launch Checklist

### Week 7+ (Ongoing)

- Monitor error logs daily
- Check Stripe webhook events
- Monitor audit success rate
- Gather user feedback
- Setup automated database backups
- Add monitoring (Sentry, Plausible)
- Create user documentation
- Setup support email
- Plan next features (API access, scheduled audits)

---

## Risks & Mitigation

### Technical Risks

**Risk 1: Supabase RLS misconfiguration**

- **Impact**: Users see other teams' data (CRITICAL)
- **Mitigation**: Thorough testing, review policies before production
- **Backup**: Database-level constraints as fallback

**Risk 2: Stripe webhook failures**

- **Impact**: Subscriptions not activated
- **Mitigation**: Retry logic, manual reconciliation script
- **Monitoring**: Check webhook delivery in Stripe dashboard

**Risk 3: Worker doesn't link audits to workspaces**

- **Impact**: Audits created but not visible
- **Mitigation**: Test thoroughly in Phase 2, add database constraints
- **Backup**: Migration script to fix existing data

**Risk 4: Frontend rebuild breaks audit rendering**

- **Impact**: Existing audit pages crash
- **Mitigation**: Keep existing audit detail page working during Phase 3
- **Backup**: Git rollback if issues

### Business Risks

**Risk 1: User confusion during migration**

- **Impact**: Users can't login after password reset required
- **Mitigation**: Clear email communication, magic link fallback
- **Backup**: Manual password reset via Supabase dashboard

**Risk 2: Subscription limits too restrictive**

- **Impact**: Users downgrade or churn
- **Mitigation**: Monitor usage patterns, adjust limits if needed
- **Backup**: Grandfather existing users at higher limits

---

## Timeline Summary


| Phase                     | Duration              | Key Deliverables                               |
| ------------------------- | --------------------- | ---------------------------------------------- |
| Phase 0: Preparation      | 3 days                | Supabase setup, schema design                  |
| Phase 1: Auth Migration   | 7 days                | Supabase Auth, JWT replacement, user migration |
| Phase 2: Teams            | 11 days               | Workspaces, members, invites, RLS              |
| Phase 3: UI Modernization | 7 days                | Sidebar, settings, responsive                  |
| Phase 4: Billing          | 7 days                | Stripe, pricing, checkout, limits              |
| Phase 5: Domain & Polish  | 7 days                | SSL, domain, final testing                     |
| **Total**                 | **42 days (6 weeks)** | Professional SaaS platform                     |


**Buffer**: Add 1-2 weeks for unexpected issues, polish, user feedback

---

## Success Metrics

**Technical**:

- All tests pass
- Zero RLS bypass vulnerabilities
- 99%+ audit success rate
- <2s page load time

**Business**:

- At least 1 paying subscriber (Pro plan)
- Zero Stripe payment failures
- Positive user feedback
- <5% churn rate

---

## Next Steps (Post-Launch)

### Short-term (Month 1-2)

- Add team activity feed
- Email notifications (audit completed)
- Scheduled recurring audits
- API access (Pro plan)

### Medium-term (Month 3-6)

- White-label reports (Enterprise)
- Slack/Discord integrations
- Advanced competitor tracking
- Custom audit templates

### Long-term (Month 6+)

- Multi-language support
- On-premise deployment (Enterprise)
- Reseller program
- Mobile app

---

## Documentation Updates Required

After each phase, update:

1. `**.context7/project/ARCHITECTURE.md**` - Add Supabase layer
2. `**.context7/backend/API.md**` - Add billing endpoints
3. `**.context7/frontend/COMPONENTS.md**` - Add new components
4. `**.context7/decisions/DECISIONS_LOG.md**` - Add ADRs
5. `**.cursor/rules/global.mdc**` - Update with Supabase patterns
6. `**README.md**` - Update setup instructions

---

**Plan created**: 2025-02-03  
**Estimated completion**: 2025-03-17 (6 weeks)  
**Version**: 1.0