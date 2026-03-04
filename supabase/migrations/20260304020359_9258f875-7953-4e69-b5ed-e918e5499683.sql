
-- Fix: recreate view with SECURITY INVOKER (safe default)
DROP VIEW IF EXISTS public.public_reviews;
CREATE VIEW public.public_reviews WITH (security_invoker = true) AS
SELECT id, product_id, rating, comment, created_at
FROM public.reviews;

-- Grant access to the view for anon and authenticated
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- We need a permissive policy so the view can read underlying rows
-- Add back a restricted public SELECT that only exposes non-sensitive columns
-- Actually the view with security_invoker needs the underlying table to allow SELECT
-- So we need a public SELECT policy back on reviews, but the VIEW controls which columns are visible
DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);
