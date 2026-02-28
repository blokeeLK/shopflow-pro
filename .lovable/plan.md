

## Plan: Security Hardening (Admin Lockdown, Anti-Copy, Data Protection)

### Current State

- **Admin routes**: Protected client-side via `AuthContext` checking `user_roles` table. Backend data is already protected by RLS policies using `has_role()`.
- **RLS**: Already enabled on all sensitive tables (profiles, addresses, orders, order_items, reviews, product_reviews). Policies are mostly correct.
- **Security scan**: 6 agent findings + 1 Supabase finding (leaked password - platform limitation).

### Implementation Steps

#### 1. Anti-Copy / Anti-Plagiarism Protection (Frontend)

Create a new component `src/components/SecurityShield.tsx` that:
- Disables right-click (`contextmenu`) globally
- Blocks keyboard shortcuts: `Ctrl+U`, `Ctrl+S`, `Ctrl+P`, `Ctrl+Shift+I/J/C`, `F12`, and Mac equivalents
- Applies `user-select: none` to body (except inputs/textareas/checkout)
- Adds invisible watermark comment in HTML

Add CSS in `src/index.css`:
```css
body { user-select: none; }
input, textarea, select, [contenteditable], .checkout-area { user-select: text; }
```

Mount `<SecurityShield />` in `App.tsx` (renders nothing visible, just event listeners).

#### 2. Strengthen Admin Route Protection (Frontend)

Update `AdminLayout.tsx` to show an explicit "Acesso negado" message and redirect to `/` instead of `/login`. The current implementation is already functional but can be improved with a toast notification.

#### 3. Fix HTML Sanitization (XSS - Security Scan Error)

Install `dompurify` and replace the custom `sanitizeHtml` regex in `CustomHtmlBlock.tsx` with `DOMPurify.sanitize()`.

#### 4. Fix Stock Race Condition (Security Scan Error)

Update `mp-webhook/index.ts` to use atomic SQL operations:
```sql
UPDATE product_variants SET stock = GREATEST(0, stock - $quantity) WHERE product_id = $pid AND size = $size
```
Same for `sold_count` on products table.

#### 5. Fix Shipping Function Auth (Security Scan Warning)

Update `calculate-shipping/index.ts` to use `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY` since product data is public via RLS.

#### 6. Database Migration for Customer-Safe View

Create a migration to add a `customer_orders_view` that excludes sensitive fields. However, reviewing current RLS policies, they are already correctly scoped:
- `addresses`: Users can only manage own (already correct)
- `orders`: Users see own, admins see all (already correct)
- `profiles`: Users see own, admins see all (already correct)

No additional RLS changes needed — current policies are already secure.

#### 7. Invisible Watermark

Add HTML comment watermark in `index.html` and a CSS comment in `index.css` for authorship proof.

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/SecurityShield.tsx` | Create - anti-copy protection component |
| `src/App.tsx` | Add SecurityShield component |
| `src/index.css` | Add user-select rules |
| `src/components/CustomHtmlBlock.tsx` | Replace sanitizer with DOMPurify |
| `supabase/functions/mp-webhook/index.ts` | Fix race condition with atomic updates |
| `supabase/functions/calculate-shipping/index.ts` | Use anon key instead of service role key |
| `src/components/admin/AdminLayout.tsx` | Improve access denied UX |
| `index.html` | Add watermark comment |
| New migration | Customer-safe view (if needed) |

### Limitations

- **Leaked Password Protection**: Platform-level setting not available in Lovable Cloud UI. Cannot be enabled via code.
- **HTTP Security Headers** (CSP, X-Frame-Options, HSTS): Cannot be configured in Lovable's hosting environment. These are controlled at the platform level.
- **Anti-copy measures**: These are deterrents only — determined users can always bypass them via browser extensions or DevTools workarounds. The real protection is server-side RLS.

