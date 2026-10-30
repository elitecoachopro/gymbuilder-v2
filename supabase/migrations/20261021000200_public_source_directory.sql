ALTER TABLE public.supplier_profiles
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN contact_email text,
  ADD COLUMN catalog_url text,
  ADD COLUMN listing_source_url text UNIQUE,
  ADD COLUMN listing_checked_at timestamptz,
  ADD CONSTRAINT directory_source_required CHECK (user_id IS NOT NULL OR listing_source_url IS NOT NULL),
  ADD CONSTRAINT directory_not_identity_verified CHECK (user_id IS NOT NULL OR verified = false);

ALTER TABLE public.products
  ADD COLUMN source_url text UNIQUE,
  ALTER COLUMN price_eur DROP NOT NULL,
  ADD CONSTRAINT unknown_price_requires_source CHECK (price_eur IS NOT NULL OR source_url IS NOT NULL);

CREATE OR REPLACE VIEW public.public_catalog_products WITH (security_invoker = true) AS
SELECT product.id, product.supplier_id, product.name, product.description, product.category,
       product.brand_id, product.condition, product.price_eur, product.images, product.specs,
       product.status, product.created_at, product.updated_at, product.images_360,
       brand.name AS brand_name, supplier.country AS supplier_country,
       public.catalog_market(supplier.country) AS market, brand.country AS brand_country,
       product.source_url
FROM public.products product
JOIN public.supplier_profiles supplier ON supplier.id = product.supplier_id AND supplier.status = 'approved'
LEFT JOIN public.brands brand ON brand.id = product.brand_id
WHERE product.status IN ('active', 'featured');

CREATE OR REPLACE VIEW public.public_supplier_directory WITH (security_invoker = true) AS
SELECT id, company_name, country, city, website, phone, description, logo_url,
       status, plan, verified, created_at, public.catalog_market(country) AS market,
       contact_email, catalog_url, listing_source_url, listing_checked_at
FROM public.supplier_profiles WHERE status = 'approved';

NOTIFY pgrst, 'reload schema';
