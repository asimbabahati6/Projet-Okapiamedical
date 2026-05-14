/*
  # Create punch-selfies storage bucket

  1. Storage
    - Creates `punch-selfies` bucket for employee identification photos during punch
    - Bucket is private (not public)
  2. Security
    - Authenticated users can upload selfies to their own folder
    - Authenticated users can read their own selfies
    - Admin roles can read all selfies
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'punch-selfies',
  'punch-selfies',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff can upload own selfies"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'punch-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Staff can view own selfies"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'punch-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all selfies"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'punch-selfies'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'hr_manager')
    )
  );
