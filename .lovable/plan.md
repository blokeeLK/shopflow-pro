

## Security Audit: Profiles & Related Tables

### Current State Analysis

After reviewing the RLS policies, the **profiles table policies are already correctly configured**:
- `Users can view own profile`: `auth.uid() = id` — users can ONLY see their own profile
- `Users can update own profile`: `auth.uid() = id` — users can ONLY edit their own
- `Users can insert own profile`: `auth.uid() = id` — users can ONLY create their own
- `Admins can view all profiles`: `has_role(auth.uid(), 'admin')` — secure via `SECURITY DEFINER` function

The scanner findings are mostly theoretical risks, not actual exploitable vulnerabilities. However, we can make targeted improvements and dismiss false positives.

### Plan

#### 1. Database Migration — Harden admin_logs to append-only
The scanner correctly flags that admins can delete their own audit logs. Fix by replacing the `ALL` policy with separate `INSERT` and `SELECT` policies.

```sql
DROP POLICY "Admins can manage logs" ON admin_logs;
CREATE POLICY "Admins can insert logs" ON admin_logs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
```

#### 2. Database Migration — Add price validation trigger on order_items
Prevent price manipulation during checkout by validating `unit_price` matches the product's actual price.

```sql
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

CREATE TRIGGER check_order_item_price BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION validate_order_item_price();
```

#### 3. Dismiss false-positive / low-risk findings
Use the security finding management tool to properly categorize findings that are already mitigated:

- **Profiles**: Policies are already correct — dismiss with explanation
- **Addresses admin access**: Admin access is required for order fulfillment — dismiss as accepted risk
- **Orders/payment data**: Already scoped to own user — dismiss
- **Reviews user_id**: Public reviews showing author names is intentional for social proof
- **user_roles read own**: Needed for frontend auth flow
- **site_settings public**: Non-sensitive config data

#### 4. Files Modified
| File/Resource | Change |
|---|---|
| DB Migration | Append-only admin_logs, price validation trigger |
| Security findings | Dismiss false positives with documented reasons |

No frontend changes needed — the existing RLS is already secure.

