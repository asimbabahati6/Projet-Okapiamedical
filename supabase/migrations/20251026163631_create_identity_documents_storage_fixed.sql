/*
  # Create Identity Documents Storage Bucket

  ## Overview
  Creates a storage bucket for identity document uploads with appropriate security policies.

  ## Bucket Configuration
  - Name: identity-documents
  - Public: false (private bucket)
  - File size limit: 5MB per file
  - Allowed MIME types: image/jpeg, image/png, image/jpg, application/pdf

  ## Security Policies
  - Public can upload documents during registration
  - Staff can view all documents for verification
  - Proper RLS policies enforce access control
*/

-- Create storage bucket for identity documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-documents',
  'identity-documents',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public uploads for registration" ON storage.objects;
  DROP POLICY IF EXISTS "Staff can view identity documents" ON storage.objects;
  DROP POLICY IF EXISTS "Staff can delete identity documents" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Storage policy: Allow public uploads during registration
CREATE POLICY "Allow public uploads for registration"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'identity-documents');

-- Storage policy: Allow authenticated staff to view documents
CREATE POLICY "Staff can view identity documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'identity-documents'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Storage policy: Allow staff to delete documents if needed
CREATE POLICY "Staff can delete identity documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'identity-documents'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );
