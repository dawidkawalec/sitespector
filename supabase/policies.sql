-- SiteSpector Supabase Row Level Security (RLS) Policies
-- These policies ensure users can only access data they're authorized to see

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but allow for safety)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- WORKSPACES POLICIES
-- ============================================================================

-- Members can view workspaces they belong to
CREATE POLICY "Members can view workspaces"
ON public.workspaces
FOR SELECT
USING (
  id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Users can create workspaces (they become owner)
CREATE POLICY "Users can create workspaces"
ON public.workspaces
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can update their workspaces
CREATE POLICY "Owners can update workspaces"
ON public.workspaces
FOR UPDATE
USING (owner_id = auth.uid());

-- Owners can delete their workspaces
CREATE POLICY "Owners can delete workspaces"
ON public.workspaces
FOR DELETE
USING (owner_id = auth.uid());

-- ============================================================================
-- WORKSPACE MEMBERS POLICIES
-- ============================================================================

-- Members can view other members in their workspaces
CREATE POLICY "Members can view workspace members"
ON public.workspace_members
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Admins and owners can add members
CREATE POLICY "Admins can add members"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Admins and owners can update member roles (but not their own)
CREATE POLICY "Admins can update member roles"
ON public.workspace_members
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  AND user_id != auth.uid() -- Cannot change own role
);

-- Admins and owners can remove members (but not owners)
CREATE POLICY "Admins can remove members"
ON public.workspace_members
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  AND role != 'owner' -- Cannot remove owner
);

-- ============================================================================
-- INVITES POLICIES
-- ============================================================================

-- Users can view invites for their email
CREATE POLICY "Users can view own invites"
ON public.invites
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR invited_by = auth.uid()
  OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Admins and owners can create invites
CREATE POLICY "Admins can create invites"
ON public.invites
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  AND invited_by = auth.uid()
);

-- Invited user can update invite (accept)
CREATE POLICY "Users can accept invites"
ON public.invites
FOR UPDATE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Admins and owners can delete invites
CREATE POLICY "Admins can delete invites"
ON public.invites
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Members can view their workspace subscription
CREATE POLICY "Members can view subscription"
ON public.subscriptions
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Owners and admins can update subscription (via Stripe webhook primarily)
CREATE POLICY "Owners can update subscription"
ON public.subscriptions
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Service role can insert subscriptions (for new workspaces)
-- This is handled by the trigger, no policy needed for regular users

-- ============================================================================
-- INVOICES POLICIES
-- ============================================================================

-- Members can view invoices for their workspaces
CREATE POLICY "Members can view invoices"
ON public.invoices
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Service role can insert invoices (from Stripe webhooks)
-- No user-level INSERT policy needed

-- ============================================================================
-- ADDITIONAL HELPER POLICIES
-- ============================================================================

-- Allow service role to bypass RLS (for backend operations)
-- This is configured in Supabase, not via SQL

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 'Users can only see their own profile data';
COMMENT ON POLICY "Members can view workspaces" ON public.workspaces IS 'Users can see workspaces where they are members';
COMMENT ON POLICY "Admins can add members" ON public.workspace_members IS 'Workspace admins and owners can invite new members';
