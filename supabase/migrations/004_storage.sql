-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('complaint-photos', 'complaint-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('resolution-photos', 'resolution-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- complaint-photos policies
CREATE POLICY "Authenticated users can upload complaint photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'complaint-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can read their own complaint photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'complaint-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'employee')
    )
  );

-- resolution-photos policies
CREATE POLICY "Employees can upload resolution photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resolution-photos'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'employee')
  );

CREATE POLICY "Staff and complaint owners can read resolution photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resolution-photos'
    AND auth.uid() IS NOT NULL
  );
