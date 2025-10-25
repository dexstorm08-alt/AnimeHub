-- Fix user-avatars bucket RLS policies
-- Run this in your Supabase SQL editor to properly configure the user-avatars bucket

-- First, make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow public read access to avatars
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

-- Alternative: If you want to disable RLS completely for this bucket
-- (Less secure but simpler)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
