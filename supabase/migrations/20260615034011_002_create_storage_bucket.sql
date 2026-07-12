-- Create storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for incident photos
CREATE POLICY "Allow authenticated users to upload incident photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'incident-photos');

CREATE POLICY "Allow authenticated users to view incident photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'incident-photos');

CREATE POLICY "Allow authenticated users to update their own incident photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'incident-photos' AND auth.uid()::text = owner_id);

CREATE POLICY "Allow public read access to incident photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'incident-photos');
