
-- Create storage bucket for site assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload to site-assets bucket
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-assets' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to update site assets
CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-assets' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to delete site assets
CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-assets' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow public read access to site assets
CREATE POLICY "Public can read site assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');
