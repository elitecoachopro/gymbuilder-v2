CREATE FUNCTION public.supplier_product_counts(p_supplier_ids uuid[])
RETURNS TABLE(supplier_id uuid, product_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT product.supplier_id, count(*) FROM public.public_catalog_products product
  WHERE product.supplier_id = ANY(p_supplier_ids) GROUP BY product.supplier_id;
$$;
CREATE FUNCTION public.public_marketplace_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT jsonb_build_object(
  'products', (SELECT count(*) FROM public.public_catalog_products),
  'suppliers', (SELECT count(*) FROM public.supplier_profiles WHERE status = 'approved'),
  'brands', (SELECT count(DISTINCT brand_id) FROM public.public_catalog_products)
 );
$$;
REVOKE ALL ON FUNCTION public.supplier_product_counts(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_marketplace_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.supplier_product_counts(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.public_marketplace_stats() TO service_role;
