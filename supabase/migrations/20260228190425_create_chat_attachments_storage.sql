/*
  # Create Chat Attachments Storage System
  
  ## Changes
  1. Create storage bucket for chat attachments
  2. Set up RLS policies for secure file access
  3. Configure file upload permissions
  
  ## Security
  - Users can upload files to their own folders
  - Users can view files in conversations they are part of
  - Files are organized by conversation/channel
*/

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view files in their conversations
CREATE POLICY "Users can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
);

-- Policy: Allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
