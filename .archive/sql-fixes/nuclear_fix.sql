-- ============================================================================
-- NUCLEAR OPTION: Complete RLS reset with FORCE
-- ============================================================================

-- STEP 1: Completely disable and re-enable RLS to clear cache
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL policies on workspace_members specifically
DROP POLICY IF EXISTS "Users can view own workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can create own memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;

-- STEP 3: Create the SIMPLEST possible SELECT policy first
-- This one has ZERO chance of recursion - it's completely direct
CREATE POLICY "workspace_members_select_simple"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  -- Users can ALWAYS see their own membership records, period.
  -- No subqueries, no EXISTS, just direct comparison
  user_id = auth.uid()
);

-- STEP 4: Test this simple policy
SELECT 'Simple policy created. Test with: SELECT * FROM workspace_members WHERE user_id = auth.uid()' as status;

-- STEP 5: Add INSERT policy for workspace creation fallback
CREATE POLICY "workspace_members_insert_own"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- STEP 6: Add INSERT policy for admins (separate, clearer)
CREATE POLICY "workspace_members_insert_admin"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin check using table alias to avoid recursion
  EXISTS (
    SELECT 1 
    FROM workspace_members AS existing_member
    WHERE existing_member.workspace_id = workspace_members.workspace_id
    AND existing_member.user_id = auth.uid()
    AND existing_member.role IN ('owner', 'admin')
  )
);

-- STEP 7: Add UPDATE policy
CREATE POLICY "workspace_members_update"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM workspace_members AS my_role
    WHERE my_role.workspace_id = workspace_members.workspace_id
    AND my_role.user_id = auth.uid()
    AND my_role.role IN ('owner', 'admin')
  )
  AND workspace_members.user_id != auth.uid()
);

-- STEP 8: Add DELETE policy
CREATE POLICY "workspace_members_delete"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM workspace_members AS my_role
    WHERE my_role.workspace_id = workspace_members.workspace_id
    AND my_role.user_id = auth.uid()
    AND my_role.role IN ('owner', 'admin')
  )
  AND workspace_members.role != 'owner'
);

-- STEP 9: Verify policies
SELECT 
    polname as policy_name,
    CASE polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
    END as command
FROM pg_policy
WHERE polrelid = 'public.workspace_members'::regclass
ORDER BY polname;

-- Expected: 5 policies total
-- If you see the old policy names, they weren't dropped - run this script again

SELECT '✅ Nuclear fix complete! Now test in browser (incognito mode)' as status;
