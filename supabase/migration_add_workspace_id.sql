-- Migration: Add workspace_id to audits table
-- This prepares the VPS PostgreSQL database for workspace-based audits

-- Add workspace_id column to audits table
ALTER TABLE audits ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Create index for workspace_id
CREATE INDEX IF NOT EXISTS idx_audits_workspace ON audits(workspace_id);

-- Add comment
COMMENT ON COLUMN audits.workspace_id IS 'Foreign key to Supabase workspace (not enforced via FK)';

-- Note: We keep user_id temporarily for backward compatibility during migration
-- user_id will be nullable and eventually removed after full migration to workspaces

-- Make user_id nullable (for new workspace-based audits)
ALTER TABLE audits ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN audits.user_id IS 'Legacy user_id - will be deprecated in favor of workspace_id';
