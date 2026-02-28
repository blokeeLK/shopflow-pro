
-- Create product_reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'customer' CHECK (source IN ('customer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews FOR SELECT
USING (status = 'approved');

-- Admins can do everything
CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert reviews (as pending)
CREATE POLICY "Users can submit reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (source = 'customer' AND status = 'pending');

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true);

-- Storage policies for review images
CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-images');

CREATE POLICY "Admins can delete review images"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'));
