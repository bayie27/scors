-- supabase/migrations/YYYYMMDDHHMMSS_allow_authenticated_uploads_to_equipment_images.sql

-- Policy to allow authenticated users to upload (insert) into the 'equipment_images' bucket
CREATE POLICY "Allow authenticated uploads to equipment_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'equipment_images');

-- It's also good practice to ensure a read policy exists for public access if the bucket is public.
-- The `public: true` flag during bucket creation usually handles this, but we can be explicit.
-- This policy allows anyone (anon) to read (select) files from the 'equipment_images' bucket.
CREATE POLICY "Allow public read access to equipment_images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'equipment_images');
