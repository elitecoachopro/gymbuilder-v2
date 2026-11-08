-- Add a dedicated category without changing existing product classifications.
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'dumbbells';
INSERT INTO public.categories (name, slug, icon)
VALUES ('Gantere', 'dumbbells', 'dumbbell')
ON CONFLICT (slug) DO NOTHING;
