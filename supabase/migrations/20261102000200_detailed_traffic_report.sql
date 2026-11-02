CREATE TABLE public.gym_traffic_events (
  event_id UUID PRIMARY KEY,
  path TEXT NOT NULL CHECK (length(path) <= 200),
  kind TEXT NOT NULL CHECK (kind IN ('view', 'phone', 'whatsapp')),
  source TEXT NOT NULL CHECK (source IN ('direct','facebook','instagram','google','bing','email','tiktok','linkedin','campaign','referral','unknown')),
  session_hash TEXT NOT NULL CHECK (session_hash ~ '^[0-9a-f]{64}$'),
  scope TEXT NOT NULL CHECK (scope IN ('page','supplier','product')),
  supplier_id UUID REFERENCES public.supplier_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX gym_traffic_time ON public.gym_traffic_events(occurred_at);
CREATE INDEX gym_traffic_supplier_time ON public.gym_traffic_events(supplier_id, occurred_at);
ALTER TABLE public.gym_traffic_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gym_traffic_events FROM anon, authenticated;
GRANT ALL ON public.gym_traffic_events TO service_role;

CREATE FUNCTION public.record_gymbuilder_event(p_event_id UUID, p_path TEXT, p_session_hash TEXT, p_kind TEXT, p_source TEXT, p_actor_id UUID DEFAULT NULL)
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
    '/consultation', '/cum-functioneaza', '/construieste-sala', '/configurator', '/configurator/studio', '/blog'
  ) THEN RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_actor_id AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.supplier_profiles WHERE id = v_supplier AND user_id = p_actor_id)
  THEN RETURN false; END IF;


  INSERT INTO public.gym_traffic_events(event_id,path,kind,source,session_hash,scope,supplier_id,product_id)
  VALUES (p_event_id,p_path,p_kind,p_source,p_session_hash,v_scope,v_supplier,v_product)
  ON CONFLICT (event_id) DO NOTHING RETURNING event_id INTO v_inserted;
  IF v_inserted IS NULL THEN RETURN false; END IF;
  IF p_kind = 'view' THEN PERFORM public.record_public_page_view(p_path, p_session_hash, p_actor_id); END IF;
  RETURN true;
END;
$$;

CREATE FUNCTION public.gymbuilder_detailed_report(p_user_id UUID, p_days INTEGER DEFAULT 30, p_day DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
DECLARE
  v_role TEXT; v_supplier UUID;
  v_today DATE := (now() AT TIME ZONE 'Europe/Bucharest')::date;
  v_day DATE;
  v_start TIMESTAMPTZ; v_end TIMESTAMPTZ; v_day_start TIMESTAMPTZ; v_day_end TIMESTAMPTZ;
  v_result JSONB;
  v_projects_created BIGINT; v_projects_completed BIGINT;
BEGIN
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

  IF v_role='admin' THEN
    SELECT count(*),count(*) FILTER (WHERE status='completed') INTO v_projects_created,v_projects_completed
    FROM public.gym_projects WHERE created_at>=v_start AND created_at<v_end;
  END IF;

  WITH filtered AS MATERIALIZED (
    SELECT * FROM public.gym_traffic_events WHERE occurred_at >= v_start AND occurred_at < v_end
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
    'days',p_days,'day',v_day,'timezone','Europe/Bucharest',
    'since', CASE WHEN v_role='admin' THEN (SELECT occurred_at FROM public.gym_traffic_events ORDER BY occurred_at LIMIT 1)
      ELSE (SELECT occurred_at FROM public.gym_traffic_events WHERE supplier_id=v_supplier ORDER BY occurred_at LIMIT 1) END,
    'totals',(SELECT jsonb_build_object('views',count(*),'sessions',count(DISTINCT session_hash),
      'profile_views',count(*) FILTER (WHERE scope='supplier'),'product_views',count(*) FILTER (WHERE scope='product')) FROM visits),
    'actions',(SELECT jsonb_build_object('phone',count(*) FILTER (WHERE kind='phone'),'whatsapp',count(*) FILTER (WHERE kind='whatsapp')) FROM filtered),
    'business',jsonb_build_object(
      'projects_created',v_projects_created,
      'projects_completed',v_projects_completed,
      'requests',(SELECT count(*) FROM public.contact_requests WHERE created_at>=v_start AND created_at<v_end AND (v_role='admin' OR supplier_id=v_supplier)),
      'messages',CASE WHEN v_role='admin' THEN (SELECT count(*) FROM public.contact_messages WHERE created_at>=v_start AND created_at<v_end) ELSE NULL END),
    'daily',(SELECT jsonb_agg(jsonb_build_object('day',c.day,'views',coalesce(d.views,0),'sessions',coalesce(d.sessions,0)) ORDER BY c.day) FROM calendar c LEFT JOIN daily d USING(day)),
    'hourly',(SELECT jsonb_agg(jsonb_build_object('hour',h,'views',coalesce(v.views,0)) ORDER BY h) FROM generate_series(0,23) h LEFT JOIN hourly v ON v.hour=h),
    'sources',coalesce((SELECT jsonb_agg(to_jsonb(sources) ORDER BY views DESC,source) FROM sources),'[]'::jsonb),
    'pages',coalesce((SELECT jsonb_agg(to_jsonb(pages) ORDER BY views DESC,path) FROM pages),'[]'::jsonb),
    'recent',coalesce((SELECT jsonb_agg(to_jsonb(recent) ORDER BY occurred_at DESC) FROM recent),'[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.record_gymbuilder_event(UUID,TEXT,TEXT,TEXT,TEXT,UUID) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.gymbuilder_detailed_report(UUID,INTEGER,DATE) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_gymbuilder_event(UUID,TEXT,TEXT,TEXT,TEXT,UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.gymbuilder_detailed_report(UUID,INTEGER,DATE) TO service_role;
