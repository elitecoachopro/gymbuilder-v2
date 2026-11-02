CREATE TABLE public.traffic_views (
  environment text NOT NULL CHECK (environment IN ('production', 'preview', 'development')),
  event_id uuid NOT NULL,
  session_id uuid NOT NULL,
  path text NOT NULL CHECK (length(path) BETWEEN 1 AND 200),
  supplier_id uuid REFERENCES public.supplier_profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(environment, event_id)
);
CREATE INDEX traffic_views_time ON public.traffic_views(environment, viewed_at, session_id);
CREATE INDEX traffic_views_supplier_time ON public.traffic_views(environment, supplier_id, viewed_at) WHERE supplier_id IS NOT NULL;
ALTER TABLE public.traffic_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.traffic_views FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.traffic_views TO service_role;

CREATE FUNCTION public.record_traffic_view(p_event_id uuid, p_session_id uuid, p_path text, p_environment text, p_actor_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_supplier uuid; v_product uuid; v_owner uuid; v_inserted uuid;
BEGIN
  IF p_path ~ '^/products/[0-9a-fA-F-]{36}$' THEN
    SELECT p.id, p.supplier_id, s.user_id INTO v_product, v_supplier, v_owner
    FROM public.products p JOIN public.supplier_profiles s ON s.id = p.supplier_id
    WHERE p.id = split_part(p_path, '/', 3)::uuid AND p.status IN ('active', 'featured') AND s.status = 'approved';
    IF v_product IS NULL OR v_owner = p_actor_id THEN RETURN false; END IF;
  ELSIF p_path ~ '^/suppliers/[0-9a-fA-F-]{36}$' THEN
    SELECT id, user_id INTO v_supplier, v_owner FROM public.supplier_profiles
    WHERE id = split_part(p_path, '/', 3)::uuid AND status = 'approved';
    IF v_supplier IS NULL OR v_owner = p_actor_id THEN RETURN false; END IF;
  ELSIF p_path <> ALL(ARRAY['/', '/products', '/suppliers', '/contact', '/about', '/pricing', '/blog', '/faq', '/cum-functioneaza', '/construieste-sala', '/estimator-buget', '/compare', '/consultation'])
    AND p_path !~ '^/construieste-sala/[a-z0-9-]{1,60}$' THEN
    RAISE EXCEPTION 'invalid public path' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.traffic_views(environment, event_id, session_id, path, supplier_id, product_id)
  VALUES(p_environment, p_event_id, p_session_id, p_path, v_supplier, v_product)
  ON CONFLICT(environment, event_id) DO NOTHING RETURNING event_id INTO v_inserted;
  IF v_inserted IS NOT NULL AND v_product IS NOT NULL AND p_environment = 'production' THEN
    INSERT INTO public.product_views(product_id, session_id) VALUES(v_product, p_session_id::text)
    ON CONFLICT(product_id, session_id) DO NOTHING;
  END IF;
  RETURN v_inserted IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.record_traffic_view(uuid, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_traffic_view(uuid, uuid, text, text, uuid) TO service_role;

CREATE FUNCTION public.traffic_summary(p_days integer, p_environment text, p_supplier_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
DECLARE v_start timestamptz; v_result jsonb;
BEGIN
  IF p_days NOT IN (7, 30, 90) THEN RAISE EXCEPTION 'invalid period' USING ERRCODE = '22023'; END IF;
  v_start := (date_trunc('day', now() AT TIME ZONE 'Europe/Bucharest') - (p_days - 1) * interval '1 day') AT TIME ZONE 'Europe/Bucharest';
  WITH totals AS (
    SELECT count(*) views, count(DISTINCT session_id) sessions,
      count(*) FILTER (WHERE supplier_id IS NOT NULL AND product_id IS NULL) profile_views,
      count(*) FILTER (WHERE product_id IS NOT NULL) product_views,
      min(viewed_at) first_view_at
    FROM public.traffic_views WHERE environment = p_environment AND viewed_at >= v_start AND (p_supplier_id IS NULL OR supplier_id = p_supplier_id)
  )
  SELECT jsonb_build_object('views', views, 'sessions', sessions, 'profileViews', profile_views, 'productViews', product_views,
    'from', v_start, 'to', now(), 'firstViewAt', first_view_at,
    'requests', CASE WHEN p_environment = 'production' THEN (SELECT count(*) FROM public.contact_requests WHERE created_at >= v_start AND (p_supplier_id IS NULL OR supplier_id = p_supplier_id)) ELSE NULL END)
  INTO v_result FROM totals;
  RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.traffic_summary(integer, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.traffic_summary(integer, text, uuid) TO service_role;
NOTIFY pgrst, 'reload schema';
