-- ============================================
-- SUPABASE STORAGE MIGRATION — CareConnect
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- AFTER creating the storage bucket manually.
--
-- MANUAL STEP FIRST:
--   1. Go to Supabase Dashboard → Storage → New Bucket
--   2. Bucket name:  careconnect-images
--   3. Toggle "Public" → ON
--   4. Click "Create bucket"
--
-- Then run the SQL below:

-- ─── STORAGE RLS POLICIES ───

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'careconnect-images');

-- Allow public read access to images (public bucket)
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'careconnect-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'careconnect-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'careconnect-images');

-- ============================================
-- NOTE: No database column changes are needed.
-- The existing text columns (profiles.profile_photo,
-- nurse_profiles.profile_photo, shelter_reports.photo)
-- will now store URL strings instead of base64.
-- Both formats work with <img src=...>.
-- ============================================
