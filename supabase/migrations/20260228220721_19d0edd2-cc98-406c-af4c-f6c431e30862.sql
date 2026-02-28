
-- Fix reviews table: remove user DELETE policy, add admin-only UPDATE/DELETE
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

-- Admin can manage all reviews (UPDATE + DELETE)
CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also add UPDATE restriction: no user update policy exists, but let's be explicit
-- The existing policies are: Anyone can view (SELECT), Users can create own (INSERT), and now Admins can manage all (ALL)
