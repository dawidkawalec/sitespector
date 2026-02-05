-- ============================================================================
-- DIAGNOSE: Check EXACT policy definitions for workspace_members
-- ============================================================================

-- Show the EXACT SQL definition of each policy
SELECT 
    pol.polname AS policy_name,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command,
    CASE
        WHEN pol.polroles = '{0}' THEN 'PUBLIC'
        ELSE pg_get_userbyid(pol.polroles[1])
    END AS role,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
AND pc.relname = 'workspace_members'
ORDER BY pol.polname;

-- This will show the EXACT policy definitions
-- Look for any that still have recursion in them
