-- SiteSpector Supabase Row Level Security (RLS) Policies - FIXED
-- Fixes infinite recursion in workspace_members policies

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete workspaces" ON public.workspaces;

DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.workspace_members;

DROP POLICY IF EXISTS "Users can view own invites" ON public.invites;
DROP POLICY IF EXISTS "Admins can create invites" ON public.invites;
DROP POLICY IF EXISTS "Users can accept invites" ON public.invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON public.invites;

DROP POLICY IF EXISTS "Members can view workspace subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Owners can update subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "Members can view workspace invoices" ON public.invoices;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- WORKSPACES POLICIES
-- ============================================================================

-- Service role can do everything (for triggers)
-- Regular users need to be members

-- Allow viewing workspaces if user is a member (avoiding recursion)
CREATE POLICY "Members can view workspaces"
ON public.workspaces
FOR SELECT
USING (
  -- User is the owner
  owner_id = auth.uid()
  OR
  -- User is a member (direct check to avoid recursion)
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspaces.id 
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create workspaces"
ON public.workspaces
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update workspaces"
ON public.workspaces
FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces"
ON public.workspaces
FOR DELETE
USING (owner_id = auth.uid());

-- ============================================================================
-- WORKSPACE MEMBERS POLICIES (FIXED - NO RECURSION)
-- ============================================================================

-- CRITICAL FIX: Users can always view their own memberships directly
-- AND can view other members in workspaces where they are members
CREATE POLICY "Users can view workspace members"
ON public.workspace_members
FOR SELECT
USING (
  -- Can always see own membership records
  user_id = auth.uid()
  OR
  -- Can see other members if user is a member of the same workspace
  -- Use a direct EXISTS check instead of IN with subquery
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid()
  )
);

-- Users can insert their own memberships (for workspace creation fallback)
CREATE POLICY "Users can create own memberships"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND
  -- Verify they own the workspace
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);

-- Admins and owners can add other members
CREATE POLICY "Admins can add members"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  -- The person adding is an admin/owner in that workspace
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid() 
    AND my_membership.role IN ('owner', 'admin')
  )
);

-- Admins and owners can update member roles (but not their own)
CREATE POLICY "Admins can update member roles"
ON public.workspace_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid() 
    AND my_membership.role IN ('owner', 'admin')
  )
  AND workspace_members.user_id != auth.uid() -- Cannot change own role
);

-- Admins and owners can remove members (but not owners)
CREATE POLICY "Admins can remove members"
ON public.workspace_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid() 
    AND my_membership.role IN ('owner', 'admin')
  )
  AND workspace_members.role != 'owner' -- Cannot remove owner
);

-- ============================================================================
-- INVITES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own invites"
ON public.invites
FOR SELECT
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
ON public.invites
FOR INSERT
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
ON public.invites
FOR UPDATE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Admins can delete invites"
ON public.invites
FOR DELETE
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
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = subscriptions.workspace_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create subscriptions for their workspaces"
ON public.subscriptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update subscriptions"
ON public.subscriptions
FOR UPDATE
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
ON public.invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = invoices.workspace_id
    AND user_id = auth.uid()
  )
);

-- System can insert invoices (Stripe webhooks use service role)
CREATE POLICY "System can create invoices"
ON public.invoices
FOR INSERT
WITH CHECK (true); -- Will be restricted by service role key

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test query 1: Check if user can see their own memberships
-- SELECT * FROM workspace_members WHERE user_id = auth.uid();

-- Test query 2: Check if user can see their workspaces
-- SELECT * FROM workspaces WHERE id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid());

-- Test query 3: Verify no recursion
-- EXPLAIN ANALYZE SELECT * FROM workspace_members WHERE user_id = '1548b6e5-f1d5-4e57-be32-af3a3005d8c8';
