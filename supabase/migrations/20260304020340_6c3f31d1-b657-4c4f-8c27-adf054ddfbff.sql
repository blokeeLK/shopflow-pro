
-- Create a public view that hides user_id from reviews
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT id, product_id, rating, comment, created_at
FROM public.reviews;

-- Remove the public SELECT policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Users can only see their own reviews
CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
