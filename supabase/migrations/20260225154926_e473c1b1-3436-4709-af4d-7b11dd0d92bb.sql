
CREATE TABLE public.site_html (
  id text PRIMARY KEY DEFAULT 'singleton',
  home_html text DEFAULT '',
  header_html text DEFAULT '',
  footer_html text DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_html ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for rendering on the site)
CREATE POLICY "Anyone can view site_html" ON public.site_html
  FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can manage site_html" ON public.site_html
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default row
INSERT INTO public.site_html (id, home_html, header_html, footer_html) 
VALUES ('singleton', '', '', '');
