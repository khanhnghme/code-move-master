
-- Create storage bucket for system assets (video backgrounds, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload/manage files
CREATE POLICY "Admins can manage system assets"
ON storage.objects FOR ALL
USING (bucket_id = 'system-assets' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'system-assets' AND public.is_admin(auth.uid()));

-- Allow anyone to read system assets (needed for video bg)
CREATE POLICY "Anyone can view system assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'system-assets');
