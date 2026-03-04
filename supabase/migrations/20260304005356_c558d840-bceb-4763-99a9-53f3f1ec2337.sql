
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_init_point text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_qr_code_base64 text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz;
