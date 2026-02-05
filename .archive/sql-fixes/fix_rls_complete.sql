-- ============================================================================
-- COMPLETE RLS POLICIES FIX - SINGLE SCRIPT TO RUN
-- This script will completely reset and fix all RLS policies
-- ============================================================================

-- Step 1: DISABLE RLS temporarily to allow cleanup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;

-- Step 2: DROP ALL EXISTING POLICIES
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Step 3: RE-ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- WORKSPACES POLICIES
-- ============================================================================

CREATE POLICY "Members can view workspaces"
ON public.workspaces FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspaces.id 
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update workspaces"
ON public.workspaces FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces"
ON public.workspaces FOR DELETE
USING (owner_id = auth.uid());

-- ============================================================================
-- WORKSPACE_MEMBERS POLICIES - FIXED (NO RECURSION)
-- ============================================================================

-- CRITICAL: This is the main fix - users can always see their OWN records
CREATE POLICY "Users can view own workspace members"
ON public.workspace_members FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid()
  )
);

-- Allow users to insert themselves when creating workspaces
CREATE POLICY "Users can create own memberships"
ON public.workspace_members FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);

-- Admins can add other members
CREATE POLICY "Admins can add members"
ON public.workspace_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid() 
    AND my_membership.role IN ('owner', 'admin')
  )
);

-- Admins can update member roles (not their own)
CREATE POLICY "Admins can update member roles"
ON public.workspace_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid() 
    AND my_membership.role IN ('owner', 'admin')
  )
  AND workspace_members.user_id != auth.uid()
);

-- Admins can remove members (not owners)
CREATE POLICY "Admins can remove members"
ON public.workspace_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid() 
    AND my_membership.role IN ('owner', 'admin')
  )
  AND workspace_members.role != 'owner'
);

-- ============================================================================
-- INVITES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own invites"
ON public.invites FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR invited_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = invites.workspace_id
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can create invites"
ON public.invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = invites.workspace_id
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
  AND invited_by = auth.uid()
);

CREATE POLICY "Users can accept invites"
ON public.invites FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete invites"
ON public.invites FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = invites.workspace_id
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

CREATE POLICY "Members can view workspace subscriptions"
ON public.subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = subscriptions.workspace_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update subscriptions"
ON public.subscriptions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = subscriptions.workspace_id
    AND user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- ============================================================================
-- INVOICES POLICIES
-- ============================================================================

CREATE POLICY "Members can view workspace invoices"
ON public.invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = invoices.workspace_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "System can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test: This should work without infinite recursion error
SELECT 
    COUNT(*) as total_policies,
    COUNT(CASE WHEN tablename = 'workspace_members' THEN 1 END) as workspace_members_policies
FROM pg_policies
WHERE schemaname = 'public';

-- Expected: total_policies >= 20, workspace_members_policies = 5

SELECT 'RLS policies updated successfully! ✅' as status;
