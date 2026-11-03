CREATE FUNCTION public.gymbuilder_private_report(p_days INTEGER DEFAULT 7)
RETURNS JSONB LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Europe/Bucharest')::date;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ := (v_today + 1)::timestamp AT TIME ZONE 'Europe/Bucharest';
  v_result JSONB;
BEGIN
  IF p_days IS NULL OR p_days NOT IN (1,7,30,90) THEN
    RAISE EXCEPTION 'Invalid period' USING ERRCODE='22023';
  END IF;
  v_start := (v_today - (p_days - 1))::timestamp AT TIME ZONE 'Europe/Bucharest';

  WITH calendar AS (SELECT v_today - n AS day FROM generate_series(0,p_days-1) n),
  all_events AS (
    SELECT t.event_id, t.path, 'view'::text AS kind, coalesce(g.source,'unknown') AS source,
      t.session_id::text AS session_key, t.viewed_at AS occurred_at, t.environment
    FROM public.traffic_views t
    LEFT JOIN public.gym_traffic_events g ON g.environment=t.environment AND g.event_id=t.event_id AND g.kind='view'
    UNION ALL
    SELECT event_id,path,kind,source,session_hash,occurred_at,environment
    FROM public.gym_traffic_events WHERE kind<>'view'
  ), filtered AS MATERIALIZED (
    SELECT kind,session_key,occurred_at,
      (occurred_at AT TIME ZONE 'Europe/Bucharest')::date AS day,
      CASE
        WHEN source='facebook' THEN 'Facebook'
        WHEN source='instagram' THEN 'Instagram'
        WHEN source='google' THEN 'Google'
        WHEN source IN ('direct','unknown') THEN 'Direct / necunoscut'
        ELSE 'Altele' END AS source,
      CASE
        WHEN path ~ '^/products/[0-9a-fA-F-]{36}$' THEN '/products/:id'
        WHEN path ~ '^/suppliers/[0-9a-fA-F-]{36}$' THEN '/suppliers/:id'
        WHEN path ~ '^/construieste-sala/[a-z0-9-]{1,60}$' THEN '/construieste-sala/:categorie'
        ELSE path END AS path
    FROM all_events
    WHERE environment='production' AND occurred_at>=v_start AND occurred_at<v_end
      AND (path IN ('/','/products','/suppliers','/pricing','/about','/faq','/contact','/consultation',
          '/cum-functioneaza','/construieste-sala','/configurator','/configurator/studio','/blog','/estimator-buget','/compare')
        OR path ~ '^/(products|suppliers)/[0-9a-fA-F-]{36}$'
        OR path ~ '^/construieste-sala/[a-z0-9-]{1,60}$')
  ), daily AS (
    SELECT day, count(DISTINCT session_key) FILTER (WHERE kind='view') AS visitors,
      count(*) FILTER (WHERE kind='view') AS pageviews,
      count(*) FILTER (WHERE kind='phone') AS phone,
      count(*) FILTER (WHERE kind='whatsapp') AS whatsapp
    FROM filtered GROUP BY day
  ), source_daily AS (
    SELECT day,source, count(DISTINCT session_key) FILTER (WHERE kind='view') AS visitors,
      count(*) FILTER (WHERE kind='view') AS pageviews,
      count(*) FILTER (WHERE kind='phone') AS phone,
      count(*) FILTER (WHERE kind='whatsapp') AS whatsapp
    FROM filtered GROUP BY day,source
  ), sources AS (
    SELECT source,sum(visitors) AS visitors,sum(pageviews) AS pageviews,sum(phone) AS phone,sum(whatsapp) AS whatsapp
    FROM source_daily GROUP BY source
  ), pages AS (
    SELECT path,count(*) AS views FROM filtered WHERE kind='view'
    GROUP BY path ORDER BY views DESC,path LIMIT 20
  ), business_events AS MATERIALIZED (
    SELECT 'projects_created'::text AS key,created_at FROM public.gym_projects
      WHERE created_at>=v_start AND created_at<v_end
    UNION ALL
    SELECT 'projects_completed',created_at FROM public.gym_projects
      WHERE created_at>=v_start AND created_at<v_end AND status='completed'
    UNION ALL
    SELECT 'requests',created_at FROM public.contact_requests WHERE created_at>=v_start AND created_at<v_end
    UNION ALL
    SELECT 'messages',created_at FROM public.contact_messages WHERE created_at>=v_start AND created_at<v_end
  ), business_daily AS (
    SELECT (created_at AT TIME ZONE 'Europe/Bucharest')::date AS day,key,count(*) AS value
    FROM business_events GROUP BY 1,2
  )
  SELECT jsonb_build_object(
    'project','gymbuilder','status','connected',
    'updatedAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'startedAt',(SELECT to_char(min(viewed_at) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') FROM public.traffic_views WHERE environment='production'),
    'traffic',jsonb_build_object(
      'totals',(SELECT jsonb_build_object('visitors',coalesce(sum(visitors),0),'pageviews',coalesce(sum(pageviews),0),
        'phone',coalesce(sum(phone),0),'whatsapp',coalesce(sum(whatsapp),0)) FROM daily),
      'days',(SELECT jsonb_agg(jsonb_build_object('date',c.day,'visitors',coalesce(d.visitors,0),'pageviews',coalesce(d.pageviews,0),
        'phone',coalesce(d.phone,0),'whatsapp',coalesce(d.whatsapp,0)) ORDER BY c.day) FROM calendar c LEFT JOIN daily d USING(day)),
      'sources',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY pageviews DESC,source) FROM sources s),'[]'::jsonb),
      'pages',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY views DESC,path) FROM pages p),'[]'::jsonb)
    ),
    'business',jsonb_build_object(
      'metrics',jsonb_build_array(
        jsonb_build_object('key','projects_created','label','Proiecte începute','value',(SELECT count(*) FROM business_events WHERE key='projects_created'),
          'note','Proiecte create în perioada selectată, după data creării.'),
        jsonb_build_object('key','projects_completed','label','Proiecte finalizate','value',(SELECT count(*) FROM business_events WHERE key='projects_completed'),
          'note','Dintre proiectele create în perioada selectată, cele care au acum statusul completed; nu data finalizării.'),
        jsonb_build_object('key','requests','label','Cereri de ofertă','value',(SELECT count(*) FROM business_events WHERE key='requests'),
          'note','Înregistrări contact_requests create în perioada selectată; nu simple apăsări pe butoane.'),
        jsonb_build_object('key','messages','label','Mesaje de contact','value',(SELECT count(*) FROM business_events WHERE key='messages'),
          'note','Formulare de contact salvate în perioada selectată; conținutul mesajelor nu este exportat.')
      ),
      'days',(SELECT jsonb_agg(jsonb_build_object('date',c.day,'values',jsonb_build_object(
        'projects_created',coalesce((SELECT value FROM business_daily b WHERE b.day=c.day AND b.key='projects_created'),0),
        'projects_completed',coalesce((SELECT value FROM business_daily b WHERE b.day=c.day AND b.key='projects_completed'),0),
        'requests',coalesce((SELECT value FROM business_daily b WHERE b.day=c.day AND b.key='requests'),0),
        'messages',coalesce((SELECT value FROM business_daily b WHERE b.day=c.day AND b.key='messages'),0)
      )) ORDER BY c.day) FROM calendar c)
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.gymbuilder_private_report(INTEGER) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gymbuilder_private_report(INTEGER) TO service_role;
NOTIFY pgrst, 'reload schema';
