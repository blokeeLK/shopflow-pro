

## Security Hardening — Analysis & Plan

### Critical Warning: The Proposed SQL Would Break Your Store

The SQL you provided must **not** be run as-is. Here is why:

1. **`REVOKE ALL ON SCHEMA public FROM anon`** — This would break the entire public storefront. Anonymous visitors need SELECT access to products, categories, banners, and site_settings to see your store.

2. **`admin_users` table + `is_admin()` function** — Your project already uses `user_roles` table + `has_role()` function for admin checks. Creating a parallel system would cause conflicts and require migrating all existing policies.

3. **Dropping existing policies** — Your current policies are **RESTRICTIVE** (deny-by-default), which is more secure than the PERMISSIVE replacements in the proposed SQL. Restrictive policies require ALL policies to pass; permissive ones allow access if ANY policy passes.

4. **`reviews` policy changes** — The proposed SQL allows users to UPDATE/DELETE their own reviews, but your current design intentionally prevents this (append-only reviews for integrity).

### What the Scanner Actually Flags (3 items)

| Finding | Real Risk | Fix |
|---|---|---|
| `profiles` — no explicit anon denial | **False positive.** Restrictive `auth.uid() = id` already blocks anon (NULL ≠ id). | Dismiss with explanation |
| `addresses` — no explicit anon denial | **False positive.** Same logic — restrictive `auth.uid() = user_id` blocks anon. | Dismiss with explanation |
| `public_reviews` — no RLS | **Real issue.** It's a VIEW (not a table), so RLS can't be enabled. But it exposes `reviews` data without going through the table's policies. | Drop the view; queries already select safe columns directly. |

### Plan

#### 1. Drop the `public_reviews` view
This view was created as a data-masking layer but is redundant — the `useReviews` hook already selects only `id, product_id, rating, comment, created_at` directly from the `reviews` table. Dropping the view resolves the scanner finding.

```sql
DROP VIEW IF EXISTS public.public_reviews;
```

#### 2. Dismiss the two false-positive findings
Use the security finding management tool to mark `profiles_table_public_exposure` and `addresses_table_exposure` as acknowledged — the restrictive policies with `auth.uid() = id` already deny anonymous access since `NULL = id` evaluates to `false`.

#### 3. No other changes needed
- RLS is already enabled on all tables
- `has_role()` already serves as the admin check function
- All sensitive tables already restrict access to own data
- Reviews are already append-only for regular users

### Files Modified
| Resource | Change |
|---|---|
| DB Migration | Drop `public_reviews` view |
| Security findings | Dismiss 2 false positives |

No frontend or backend code changes needed.

