
-- 1. Harden admin_logs to append-only
DROP POLICY IF EXISTS "Admins can manage logs" ON admin_logs;
CREATE POLICY "Admins can insert logs" ON admin_logs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Price validation trigger on order_items
CREATE OR REPLACE FUNCTION validate_order_item_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actual_price numeric;
BEGIN
  SELECT COALESCE(
    CASE WHEN is_promo AND promo_price IS NOT NULL THEN promo_price ELSE NULL END,
    price
  ) INTO actual_price FROM products WHERE id = NEW.product_id;
  IF actual_price IS NULL THEN RAISE EXCEPTION 'Product not found';
  END IF;
  IF NEW.unit_price <> actual_price THEN RAISE EXCEPTION 'Price mismatch';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS check_order_item_price ON order_items;
CREATE TRIGGER check_order_item_price BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION validate_order_item_price();
