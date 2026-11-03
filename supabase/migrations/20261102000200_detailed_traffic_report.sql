CREATE OR REPLACE FUNCTION public.record_traffic_view(p_event_id uuid, p_session_id uuid, p_path text, p_environment text, p_actor_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_supplier uuid; v_product uuid; v_owner uuid; v_inserted uuid;
BEGIN
  IF EXISTS(SELECT 1 FROM public.users WHERE id=p_actor_id AND role='admin') THEN RETURN false; END IF;
  IF p_path ~ '^/products/[0-9a-fA-F-]{36}$' THEN
    SELECT p.id, p.supplier_id, s.user_id INTO v_product, v_supplier, v_owner
    FROM public.products p JOIN public.supplier_profiles s ON s.id = p.supplier_id
    WHERE p.id = split_part(p_path, '/', 3)::uuid AND p.status IN ('active', 'featured') AND s.status = 'approved';
    IF v_product IS NULL OR v_owner = p_actor_id THEN RETURN false; END IF;
  ELSIF p_path ~ '^/suppliers/[0-9a-fA-F-]{36}$' THEN
    SELECT id, user_id INTO v_supplier, v_owner FROM public.supplier_profiles
    WHERE id = split_part(p_path, '/', 3)::uuid AND status = 'approved';
    IF v_supplier IS NULL OR v_owner = p_actor_id THEN RETURN false; END IF;
  ELSIF p_path <> ALL(ARRAY['/', '/products', '/suppliers', '/contact', '/about', '/pricing', '/blog', '/faq', '/cum-functioneaza', '/construieste-sala', '/estimator-buget', '/compare', '/consultation', '/configurator', '/configurator/studio'])
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

CREATE TABLE public.gym_traffic_events (
  event_id UUID NOT NULL,
  environment TEXT NOT NULL DEFAULT 'development' CHECK (environment IN ('production','preview','development')),
  path TEXT NOT NULL CHECK (length(path) <= 200),
  kind TEXT NOT NULL CHECK (kind IN ('view', 'phone', 'whatsapp')),
  source TEXT NOT NULL CHECK (source IN ('direct','facebook','instagram','google','bing','email','tiktok','linkedin','campaign','referral','unknown')),
  session_hash TEXT NOT NULL CHECK (session_hash ~ '^[0-9a-f]{64}$'),
  scope TEXT NOT NULL CHECK (scope IN ('page','supplier','product')),
  supplier_id UUID REFERENCES public.supplier_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (environment,event_id)
);
CREATE INDEX gym_traffic_time ON public.gym_traffic_events(environment,occurred_at);
CREATE INDEX gym_traffic_supplier_time ON public.gym_traffic_events(environment,supplier_id, occurred_at);
ALTER TABLE public.gym_traffic_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gym_traffic_events FROM anon, authenticated;
GRANT ALL ON public.gym_traffic_events TO service_role;

CREATE FUNCTION public.record_gymbuilder_event(p_event_id UUID, p_path TEXT, p_session_hash TEXT, p_kind TEXT, p_source TEXT, p_actor_id UUID DEFAULT NULL, p_environment TEXT DEFAULT 'development', p_session_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_scope TEXT := 'page'; v_supplier UUID; v_product UUID; v_inserted UUID;
BEGIN
  IF p_event_id IS NULL OR p_session_hash IS NULL OR p_session_hash !~ '^[0-9a-f]{64}$' OR p_kind IS NULL OR p_kind NOT IN ('view','phone','whatsapp')
    OR p_source IS NULL OR p_source NOT IN ('direct','facebook','instagram','google','bing','email','tiktok','linkedin','campaign','referral','unknown') THEN RETURN false; END IF;
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
    '/consultation', '/cum-functioneaza', '/construieste-sala', '/configurator', '/configurator/studio', '/blog', '/estimator-buget', '/compare'
  ) AND p_path !~ '^/construieste-sala/[a-z0-9-]{1,60}$' THEN RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_actor_id AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.supplier_profiles WHERE id = v_supplier AND user_id = p_actor_id)
  THEN RETURN false; END IF;


  IF p_environment NOT IN ('production','preview','development') OR p_environment IS NULL OR p_session_id IS NULL THEN RETURN false; END IF;
  IF p_kind='view' THEN
    IF NOT public.record_traffic_view(p_event_id,p_session_id,p_path,p_environment,p_actor_id) THEN RETURN false; END IF;
  END IF;

  INSERT INTO public.gym_traffic_events(environment,event_id,path,kind,source,session_hash,scope,supplier_id,product_id)
  VALUES (p_environment,p_event_id,p_path,p_kind,p_source,p_session_hash,v_scope,v_supplier,v_product)
  ON CONFLICT (environment,event_id) DO NOTHING RETURNING event_id INTO v_inserted;
  IF v_inserted IS NULL THEN RETURN false; END IF;
  IF p_kind='view' AND p_environment='production' THEN
    INSERT INTO public.page_views(path,session_hash,scope,supplier_id,product_id)
    VALUES(p_path,p_session_hash,v_scope,v_supplier,v_product)
    ON CONFLICT(path,session_hash,viewed_on) DO NOTHING;
  END IF;
  RETURN true;
END;
$$;

CREATE FUNCTION public.gymbuilder_detailed_report(p_user_id UUID, p_days INTEGER DEFAULT 30, p_day DATE DEFAULT NULL, p_environment TEXT DEFAULT 'development')
RETURNS JSONB LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
DECLARE
  v_role TEXT; v_supplier UUID;
  v_today DATE := (now() AT TIME ZONE 'Europe/Bucharest')::date;
  v_day DATE;
  v_start TIMESTAMPTZ; v_end TIMESTAMPTZ; v_day_start TIMESTAMPTZ; v_day_end TIMESTAMPTZ;
  v_result JSONB;
  v_projects_created BIGINT; v_projects_completed BIGINT;
BEGIN
  IF p_environment IS NULL OR p_environment NOT IN ('production','preview','development') THEN RAISE EXCEPTION 'Invalid environment' USING ERRCODE='22023'; END IF;
  IF p_days IS NULL OR p_days NOT IN (1,7,30,90) THEN RAISE EXCEPTION 'Invalid period' USING ERRCODE='22023'; END IF;
  SELECT role::text INTO v_role FROM public.users WHERE id = p_user_id AND email_verified;
  IF v_role = 'supplier' THEN
    SELECT id INTO v_supplier FROM public.supplier_profiles WHERE user_id=p_user_id;
    IF v_supplier IS NULL THEN RAISE EXCEPTION 'Supplier profile required' USING ERRCODE='42501'; END IF;
  ELSIF v_role IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  v_day := coalesce(p_day, v_today);
  IF v_day < v_today - (p_days-1) OR v_day > v_today THEN RAISE EXCEPTION 'Day outside selected period' USING ERRCODE='22023'; END IF;
  v_start := (v_today-(p_days-1))::timestamp AT TIME ZONE 'Europe/Bucharest';
  v_end := (v_today+1)::timestamp AT TIME ZONE 'Europe/Bucharest';
  v_day_start := v_day::timestamp AT TIME ZONE 'Europe/Bucharest';
  v_day_end := (v_day+1)::timestamp AT TIME ZONE 'Europe/Bucharest';

  IF v_role='admin' AND p_environment='production' THEN
    SELECT count(*),count(*) FILTER (WHERE status='completed') INTO v_projects_created,v_projects_completed
    FROM public.gym_projects WHERE created_at>=v_start AND created_at<v_end;
  END IF;

  WITH all_events AS (
    SELECT t.event_id,t.path,'view'::text kind,coalesce(g.source,'unknown') source,
      t.session_id::text session_hash,CASE WHEN t.product_id IS NOT NULL THEN 'product' WHEN t.supplier_id IS NOT NULL THEN 'supplier' ELSE 'page' END scope,
      t.supplier_id,t.product_id,t.viewed_at occurred_at,t.environment
    FROM public.traffic_views t LEFT JOIN public.gym_traffic_events g ON g.environment=t.environment AND g.event_id=t.event_id AND g.kind='view'
    UNION ALL
    SELECT event_id,path,kind,source,session_hash,scope,supplier_id,product_id,occurred_at,environment FROM public.gym_traffic_events WHERE kind<>'view'
  ), filtered AS MATERIALIZED (
    SELECT * FROM all_events WHERE environment=p_environment AND occurred_at >= v_start AND occurred_at < v_end
      AND (v_role='admin' OR supplier_id=v_supplier)
  ), visits AS MATERIALIZED (SELECT * FROM filtered WHERE kind='view'),
  daily AS (
    SELECT (occurred_at AT TIME ZONE 'Europe/Bucharest')::date AS day, count(*) views, count(DISTINCT session_hash) sessions
    FROM visits GROUP BY 1
  ), calendar AS (SELECT v_today-n AS day FROM generate_series(0,p_days-1) n),
  hourly AS (
    SELECT extract(hour FROM occurred_at AT TIME ZONE 'Europe/Bucharest')::int AS hour, count(*) views
    FROM visits WHERE occurred_at>=v_day_start AND occurred_at<v_day_end GROUP BY 1
  ), sources AS (SELECT source,count(*) views,count(DISTINCT session_hash) sessions FROM visits GROUP BY source),
  pages AS (SELECT path,count(*) views FROM visits GROUP BY path ORDER BY views DESC,path LIMIT 10),
  recent AS (SELECT path,kind,source,occurred_at FROM filtered ORDER BY occurred_at DESC,event_id DESC LIMIT 20)
  SELECT jsonb_build_object(
    'environment',p_environment,'days',p_days,'day',v_day,'timezone','Europe/Bucharest',
    'since', CASE WHEN v_role='admin' THEN (SELECT min(viewed_at) FROM public.traffic_views WHERE environment=p_environment)
      ELSE (SELECT min(viewed_at) FROM public.traffic_views WHERE environment=p_environment AND supplier_id=v_supplier) END,
    'totals',(SELECT jsonb_build_object('views',count(*),'sessions',count(DISTINCT session_hash),
      'profile_views',count(*) FILTER (WHERE scope='supplier'),'product_views',count(*) FILTER (WHERE scope='product')) FROM visits),
    'actions',(SELECT jsonb_build_object('phone',count(*) FILTER (WHERE kind='phone'),'whatsapp',count(*) FILTER (WHERE kind='whatsapp')) FROM filtered),
    'business',jsonb_build_object(
      'projects_created',v_projects_created,
      'projects_completed',v_projects_completed,
      'requests',CASE WHEN p_environment='production' THEN (SELECT count(*) FROM public.contact_requests WHERE created_at>=v_start AND created_at<v_end AND (v_role='admin' OR supplier_id=v_supplier)) ELSE NULL END,
      'messages',CASE WHEN v_role='admin' AND p_environment='production' THEN (SELECT count(*) FROM public.contact_messages WHERE created_at>=v_start AND created_at<v_end) ELSE NULL END),
    'daily',(SELECT jsonb_agg(jsonb_build_object('day',c.day,'views',coalesce(d.views,0),'sessions',coalesce(d.sessions,0)) ORDER BY c.day) FROM calendar c LEFT JOIN daily d USING(day)),
    'hourly',(SELECT jsonb_agg(jsonb_build_object('hour',h,'views',coalesce(v.views,0)) ORDER BY h) FROM generate_series(0,23) h LEFT JOIN hourly v ON v.hour=h),
    'sources',coalesce((SELECT jsonb_agg(to_jsonb(sources) ORDER BY views DESC,source) FROM sources),'[]'::jsonb),
    'pages',coalesce((SELECT jsonb_agg(to_jsonb(pages) ORDER BY views DESC,path) FROM pages),'[]'::jsonb),
    'recent',coalesce((SELECT jsonb_agg(to_jsonb(recent) ORDER BY occurred_at DESC) FROM recent),'[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.record_gymbuilder_event(UUID,TEXT,TEXT,TEXT,TEXT,UUID,TEXT,UUID) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.gymbuilder_detailed_report(UUID,INTEGER,DATE,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_gymbuilder_event(UUID,TEXT,TEXT,TEXT,TEXT,UUID,TEXT,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.gymbuilder_detailed_report(UUID,INTEGER,DATE,TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
