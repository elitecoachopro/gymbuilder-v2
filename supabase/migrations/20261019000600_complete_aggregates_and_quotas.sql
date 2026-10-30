CREATE FUNCTION public.supplier_review_stats(p_supplier_id UUID) RETURNS JSONB
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('count', count(*), 'avgRating', round(coalesce(avg(rating), 0)::numeric, 1))
  FROM public.reviews WHERE supplier_id = p_supplier_id AND verified;
$$;
REVOKE ALL ON FUNCTION public.supplier_review_stats(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.supplier_review_stats(UUID) TO service_role;

CREATE FUNCTION public.supplier_product_analytics(p_supplier_id UUID) RETURNS JSONB
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
WITH view_totals AS (
  SELECT v.product_id, count(*) total,
    count(*) FILTER (WHERE viewed_at >= date_trunc('month', now())) current_month,
    count(*) FILTER (WHERE viewed_at >= date_trunc('month', now()) - interval '1 month' AND viewed_at < date_trunc('month', now())) previous_month
  FROM public.product_views v JOIN public.products p ON p.id = v.product_id WHERE p.supplier_id = p_supplier_id GROUP BY v.product_id
), request_totals AS (
  SELECT product_id, count(*) total,
    count(*) FILTER (WHERE created_at >= date_trunc('month', now())) current_month,
    count(*) FILTER (WHERE created_at >= date_trunc('month', now()) - interval '1 month' AND created_at < date_trunc('month', now())) previous_month
  FROM public.contact_requests WHERE supplier_id = p_supplier_id GROUP BY product_id
), stats AS (
  SELECT p.id product_id, p.name product_name, p.images->>0 product_image, p.price_eur, p.status,
    coalesce(v.total,0) views_total, coalesce(v.current_month,0) views_current_month, coalesce(v.previous_month,0) views_previous_month,
    CASE WHEN v.previous_month > 0 THEN round((v.current_month-v.previous_month)::numeric/v.previous_month*100)
      WHEN v.current_month > 0 THEN 100 ELSE NULL END views_change_percent,
    coalesce(r.total,0) requests_total, coalesce(r.current_month,0) requests_current_month, coalesce(r.previous_month,0) requests_previous_month,
    CASE WHEN r.previous_month > 0 THEN round((r.current_month-r.previous_month)::numeric/r.previous_month*100)
      WHEN r.current_month > 0 THEN 100 ELSE NULL END requests_change_percent
  FROM public.products p LEFT JOIN view_totals v ON v.product_id=p.id LEFT JOIN request_totals r ON r.product_id=p.id
  WHERE p.supplier_id=p_supplier_id ORDER BY p.created_at DESC, p.id
)
SELECT coalesce(jsonb_agg(to_jsonb(stats)), '[]'::jsonb) FROM stats;
$$;
REVOKE ALL ON FUNCTION public.supplier_product_analytics(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.supplier_product_analytics(UUID) TO service_role;

CREATE FUNCTION public.enforce_child_record_limit() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE parent_id UUID;
DECLARE item_count BIGINT;
DECLARE next_sort INTEGER;
BEGIN
  parent_id := (to_jsonb(NEW)->>TG_ARGV[0])::uuid;
  IF TG_OP = 'UPDATE' AND (to_jsonb(OLD)->>TG_ARGV[0])::uuid = parent_id THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(TG_TABLE_NAME || parent_id::text, 0));
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1', TG_TABLE_NAME, TG_ARGV[0]) INTO item_count USING parent_id;
  IF item_count >= 10 THEN RAISE EXCEPTION 'Maximum 10 records per parent' USING ERRCODE = '23514'; END IF;
  IF TG_TABLE_NAME = 'product_variants' THEN
    SELECT coalesce(max(sort_order),0)+1 INTO next_sort FROM public.product_variants WHERE product_id=parent_id;
    NEW.sort_order := next_sort;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_child_record_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER product_variants_limit BEFORE INSERT OR UPDATE OF product_id ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.enforce_child_record_limit('product_id');
CREATE TRIGGER supplier_gallery_limit BEFORE INSERT OR UPDATE OF supplier_id ON public.supplier_gallery
FOR EACH ROW EXECUTE FUNCTION public.enforce_child_record_limit('supplier_id');
NOTIFY pgrst, 'reload schema';
