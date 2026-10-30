ALTER TABLE public.products
  ADD COLUMN listed_price_amount numeric(12,2),
  ADD COLUMN listed_price_currency text,
  ADD CONSTRAINT published_price_valid CHECK (
    (listed_price_amount IS NULL AND listed_price_currency IS NULL) OR
    (listed_price_amount IS NOT NULL AND listed_price_amount > 0
      AND listed_price_currency IS NOT NULL AND listed_price_currency ~ '^[A-Z]{3}$'
      AND source_url IS NOT NULL)
  );

CREATE OR REPLACE VIEW public.public_catalog_products WITH (security_invoker = true) AS
SELECT product.id, product.supplier_id, product.name, product.description, product.category,
       product.brand_id, product.condition, product.price_eur, product.images, product.specs,
       product.status, product.created_at, product.updated_at, product.images_360,
       brand.name AS brand_name, supplier.country AS supplier_country,
       public.catalog_market(supplier.country) AS market, brand.country AS brand_country,
       product.source_url, product.listed_price_amount, product.listed_price_currency
FROM public.products product
JOIN public.supplier_profiles supplier ON supplier.id = product.supplier_id AND supplier.status = 'approved'
LEFT JOIN public.brands brand ON brand.id = product.brand_id
WHERE product.status IN ('active', 'featured');

NOTIFY pgrst, 'reload schema';
