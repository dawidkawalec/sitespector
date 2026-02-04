-- ============================================================================
-- VERIFICATION SCRIPT FOR SUPABASE RLS POLICIES
-- Execute this in Supabase SQL Editor to verify current policies
-- ============================================================================

-- 1. Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'workspaces', 'workspace_members', 'invites', 'subscriptions', 'invoices')
ORDER BY tablename;

-- 2. List all current policies on workspace_members (the problematic table)
SELECT 
    policyname AS "Policy Name",
    cmd AS "Command",
    qual AS "USING Expression",
    with_check AS "WITH CHECK Expression"
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'workspace_members'
ORDER BY policyname;

-- 3. Count policies per table
SELECT 
    tablename,
    COUNT(*) AS "Number of Policies"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Test query: Can we select from workspace_members as authenticated user?
-- This will show if the recursion is fixed
-- NOTE: You need to run this while authenticated in Supabase or use a service role
SELECT COUNT(*) as "workspace_members count" 
FROM workspace_members;

-- 5. Check if the specific user has memberships
SELECT 
    wm.workspace_id,
    wm.user_id,
    wm.role,
    w.name as workspace_name,
    w.type as workspace_type
FROM workspace_members wm
LEFT JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = '1548b6e5-f1d5-4e57-be32-af3a3005d8c8';

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Query 1: All 6 tables should show RLS Enabled = true
-- Query 2: Should show 5 policies for workspace_members (no recursion errors)
-- Query 3: Should show policy counts for all tables
-- Query 4: Should return a count without "infinite recursion" error
-- Query 5: Should return 1 row with the user's membership
-- ============================================================================
