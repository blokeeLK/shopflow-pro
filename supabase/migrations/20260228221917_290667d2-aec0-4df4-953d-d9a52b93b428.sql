
-- Atomic function: decrement variant stock safely
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  p_product_id uuid,
  p_size text,
  p_quantity integer
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE product_variants
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE product_id = p_product_id AND size = p_size;
$$;

-- Atomic function: increment sold_count safely
CREATE OR REPLACE FUNCTION public.increment_sold_count(
  p_product_id uuid,
  p_quantity integer
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products
  SET sold_count = sold_count + p_quantity,
      updated_at = now()
  WHERE id = p_product_id;
$$;

-- Add admin SELECT policy on addresses (currently only user self-access)
CREATE POLICY "Admins can view all addresses"
ON public.addresses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
