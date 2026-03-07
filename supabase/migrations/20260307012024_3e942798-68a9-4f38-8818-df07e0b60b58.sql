ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_position_x numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS image_position_y numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS image_zoom numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS image_fit_mode text NOT NULL DEFAULT 'contain';