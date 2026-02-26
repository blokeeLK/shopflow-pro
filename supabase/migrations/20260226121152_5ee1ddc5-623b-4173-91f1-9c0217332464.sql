
CREATE TABLE public.carousel_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link text DEFAULT '',
  position integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT position_range CHECK (position >= 1 AND position <= 3)
);

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view carousel slides"
  ON public.carousel_slides FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage carousel slides"
  ON public.carousel_slides FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_carousel_slides_updated_at
  BEFORE UPDATE ON public.carousel_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
