# URGENT FIX: Infinite Recursion in RLS Policies

## Problem Identified

**Error**: `infinite recursion detected in policy for relation "workspace_members"`

**Root Cause**: The RLS policy for `workspace_members` table uses a subquery that references `workspace_members` itself, creating infinite recursion:

```sql
-- BAD (causes recursion):
CREATE POLICY "Members can view workspace members"
ON public.workspace_members
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members  -- ❌ Recursion!
    WHERE user_id = auth.uid()
  )
);
```

## Solution

Replace the `IN (SELECT ...)` subqueries with `EXISTS` clauses that break the recursion:

```sql
-- GOOD (no recursion):
CREATE POLICY "Users can view workspace members"
ON public.workspace_members
FOR SELECT
USING (
  -- Can always see own membership records
  user_id = auth.uid()
  OR
  -- Can see other members using EXISTS
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid()
  )
);
```

## How to Apply Fix

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/ljimahizqgewhvrgqhyx
2. Navigate to: **SQL Editor** (left sidebar)
3. Click: **+ New query**

### Step 2: Copy and Execute the Fixed Policies

1. Open file: `supabase/policies_fixed.sql`
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click: **Run** (or press Cmd+Enter)

### Step 3: Verify

After running, execute this test query:

```sql
-- Should return user's memberships without error
SELECT * FROM workspace_members 
WHERE user_id = '1548b6e5-f1d5-4e57-be32-af3a3005d8c8';
```

Expected result: 1 row showing the user's membership in their personal workspace.

### Step 4: Test in Browser

1. Go to: https://77.42.79.46/dashboard
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Open Console (F12)
4. You should now see:
   - ✅ 📋 User memberships: [array with data]
   - ✅ 🏢 Workspaces found: [array with data]
   - ✅ Dashboard loads normally

## Key Changes in Fixed Policies

### 1. workspace_members SELECT policy

**Before** (recursive):
```sql
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);
```

**After** (non-recursive):
```sql
USING (
  user_id = auth.uid()  -- ✅ Direct check first
  OR
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership  -- ✅ Aliased table
    WHERE my_membership.workspace_id = workspace_members.workspace_id
    AND my_membership.user_id = auth.uid()
  )
);
```

### 2. Added policy for user self-insertion

New policy allows users to add themselves as members when creating workspaces (needed for fallback):

```sql
CREATE POLICY "Users can create own memberships"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_id AND owner_id = auth.uid()
  )
);
```

### 3. All other policies updated

Changed all `IN (SELECT ...)` to `EXISTS (SELECT 1 ...)` for:
- workspace_members INSERT/UPDATE/DELETE
- invites SELECT/INSERT/DELETE
- subscriptions SELECT/UPDATE
- invoices SELECT

## Technical Explanation

**Why EXISTS avoids recursion**:

1. `IN (SELECT workspace_id FROM workspace_members ...)` → Postgres must evaluate the subquery first, which triggers the RLS policy on workspace_members, which needs to evaluate the same subquery → infinite loop

2. `EXISTS (SELECT 1 FROM workspace_members my_membership ...)` → Postgres uses a different table alias (`my_membership`), treating it as a separate scan that doesn't re-trigger the same policy → no recursion

## Files Modified

- `supabase/policies_fixed.sql` - New file with corrected RLS policies (ready to execute in Supabase SQL Editor)

## After Applying

The application should work correctly:
- Users can fetch their workspace memberships
- Users can fetch their workspaces
- Dashboard loads with workspace name
- WorkspaceSwitcher displays available workspaces
- All team/billing features work

## Rollback (if needed)

If something goes wrong, you can restore the original policies:

1. Open `supabase/policies.sql` (original file)
2. Copy and paste into Supabase SQL Editor
3. Run

However, this will restore the infinite recursion bug. The fixed version is the correct one.
