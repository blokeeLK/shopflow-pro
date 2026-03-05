-- Fix: Remove public SELECT policy that exposes user_id
-- Replace with user-scoped policy + secure RPC for public access

-- Drop the open public SELECT policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Users can view their own reviews (for AccountPage)
CREATE POLICY "Users can view own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Create a SECURITY DEFINER function for public review listing (no user_id exposed)
CREATE OR REPLACE FUNCTION public.get_public_reviews(p_product_id uuid)
RETURNS TABLE(id uuid, product_id uuid, rating integer, comment text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.product_id, r.rating, r.comment, r.created_at
  FROM public.reviews r
  WHERE r.product_id = p_product_id
  ORDER BY r.created_at DESC;
$$;

-- Grant execute to everyone (including anon for public product pages)
GRANT EXECUTE ON FUNCTION public.get_public_reviews(uuid) TO anon, authenticated;