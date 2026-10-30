CREATE VIEW public.public_catalog_products WITH (security_invoker = true) AS
SELECT product.*, brand.name AS brand_name
FROM public.products product
JOIN public.supplier_profiles supplier ON supplier.id = product.supplier_id AND supplier.status = 'approved'
LEFT JOIN public.brands brand ON brand.id = product.brand_id
WHERE product.status IN ('active', 'featured');
REVOKE ALL ON public.public_catalog_products FROM anon, authenticated;
GRANT SELECT ON public.public_catalog_products TO service_role;
