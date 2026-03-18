-- P7: Branding & White-Label PDF
-- Run this in Supabase Dashboard SQL Editor

-- 1. Add branding columns to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS branding_logo_url TEXT DEFAULT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS branding_company_name TEXT DEFAULT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS branding_contact_email TEXT DEFAULT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS branding_contact_url TEXT DEFAULT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS branding_accent_color TEXT DEFAULT NULL;

-- 2. Create storage bucket for branding logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-logos', 'branding-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies: authenticated users can upload to their workspace folder
CREATE POLICY "Workspace members can upload branding logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT wm.workspace_id::text
    FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Anyone can view branding logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branding-logos');

CREATE POLICY "Workspace admins can delete branding logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'branding-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT wm.workspace_id::text
    FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);
