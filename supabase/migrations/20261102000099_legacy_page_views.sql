CREATE TABLE public.page_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path TEXT NOT NULL CHECK (length(path) <= 200),
  session_hash TEXT NOT NULL CHECK (session_hash ~ '^[0-9a-f]{64}$'),
  scope TEXT NOT NULL CHECK (scope IN ('page', 'supplier', 'product')),
  supplier_id UUID REFERENCES public.supplier_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  UNIQUE (path, session_hash, viewed_on)
);
CREATE INDEX page_views_time ON public.page_views(viewed_on);
CREATE INDEX page_views_supplier_time ON public.page_views(supplier_id, viewed_on);
CREATE INDEX page_views_first ON public.page_views(viewed_at);
CREATE INDEX page_views_supplier_first ON public.page_views(supplier_id, viewed_at);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.page_views FROM anon, authenticated;
GRANT ALL ON public.page_views TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.page_views_id_seq TO service_role;

CREATE FUNCTION public.record_public_page_view(p_path TEXT, p_session_hash TEXT, p_actor_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_scope TEXT := 'page';
  v_supplier UUID;
  v_product UUID;
  v_inserted BIGINT;
BEGIN
  IF p_session_hash IS NULL OR p_session_hash !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
  IF p_path ~ '^/(products|suppliers)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    IF p_path LIKE '/products/%' THEN
      v_scope := 'product';
      SELECT p.id, p.supplier_id INTO v_product, v_supplier
      FROM public.products p JOIN public.supplier_profiles s ON s.id = p.supplier_id
      WHERE p.id = split_part(p_path, '/', 3)::uuid AND p.status IN ('active', 'featured') AND s.status = 'approved';
      IF v_product IS NULL THEN RETURN false; END IF;
    ELSE
      v_scope := 'supplier';
      SELECT id INTO v_supplier FROM public.supplier_profiles
      WHERE id = split_part(p_path, '/', 3)::uuid AND status = 'approved';
      IF v_supplier IS NULL THEN RETURN false; END IF;
    END IF;
  ELSIF p_path IS NULL OR p_path NOT IN (
    '/', '/products', '/suppliers', '/pricing', '/about', '/faq', '/contact',
    '/consultation', '/cum-functioneaza', '/construieste-sala', '/configurator', '/configurator/studio', '/blog'
  ) THEN RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_actor_id AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.supplier_profiles WHERE id = v_supplier AND user_id = p_actor_id)
  THEN RETURN false; END IF;

  INSERT INTO public.page_views(path, session_hash, scope, supplier_id, product_id)
  VALUES (p_path, p_session_hash, v_scope, v_supplier, v_product)
  ON CONFLICT (path, session_hash, viewed_on) DO NOTHING RETURNING id INTO v_inserted;
  IF v_inserted IS NULL THEN RETURN false; END IF;

  IF v_product IS NOT NULL THEN
    INSERT INTO public.product_views(product_id, session_id)
    VALUES (v_product, p_session_hash || ':' || (now() AT TIME ZONE 'UTC')::date::text)
    ON CONFLICT (product_id, session_id) DO NOTHING;
  END IF;
  RETURN true;
END;
$$;

CREATE FUNCTION public.gymbuilder_traffic_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSONB LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
DECLARE
  v_role TEXT;
  v_supplier UUID;
  v_today DATE := (now() AT TIME ZONE 'UTC')::date;
  v_result JSONB;
BEGIN
  IF p_days NOT IN (7, 30, 90) OR p_days IS NULL THEN RAISE EXCEPTION 'Invalid reporting period' USING ERRCODE = '22023'; END IF;
  SELECT role::text INTO v_role FROM public.users WHERE id = p_user_id AND email_verified;
  IF v_role = 'supplier' THEN
    SELECT id INTO v_supplier FROM public.supplier_profiles WHERE user_id = p_user_id;
    IF v_supplier IS NULL THEN RAISE EXCEPTION 'Supplier profile required' USING ERRCODE = '42501'; END IF;
  ELSIF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  WITH filtered AS MATERIALIZED (
    SELECT * FROM public.page_views WHERE viewed_on BETWEEN v_today - (p_days - 1) AND v_today
      AND (v_role = 'admin' OR supplier_id = v_supplier)
  ), daily AS (
    SELECT viewed_on AS day, count(*) AS views, count(DISTINCT session_hash) AS sessions
    FROM filtered GROUP BY viewed_on
  ), calendar AS (
    SELECT v_today - n AS day FROM generate_series(0, p_days - 1) AS n
  ), pages AS (
    SELECT path, count(*) AS views FROM filtered GROUP BY path ORDER BY views DESC, path LIMIT 10
  )
  SELECT jsonb_build_object(
    'days', p_days,
    'since', CASE WHEN v_role = 'admin' THEN (SELECT viewed_at FROM public.page_views ORDER BY viewed_at LIMIT 1)
      ELSE (SELECT viewed_at FROM public.page_views WHERE supplier_id = v_supplier ORDER BY viewed_at LIMIT 1) END,
    'totals', (SELECT jsonb_build_object('views', count(*), 'sessions', count(DISTINCT session_hash),
      'profile_views', count(*) FILTER (WHERE scope = 'supplier'), 'product_views', count(*) FILTER (WHERE scope = 'product')) FROM filtered),
    'daily', (SELECT jsonb_agg(jsonb_build_object('day', c.day, 'views', coalesce(d.views,0), 'sessions', coalesce(d.sessions,0)) ORDER BY c.day)
      FROM calendar c LEFT JOIN daily d ON d.day = c.day),
    'pages', coalesce((SELECT jsonb_agg(to_jsonb(pages) ORDER BY views DESC, path) FROM pages), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.record_public_page_view(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.gymbuilder_traffic_summary(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_public_page_view(TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.gymbuilder_traffic_summary(UUID, INTEGER) TO service_role;
