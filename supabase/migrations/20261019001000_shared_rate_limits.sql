CREATE TABLE public.request_rate_limits (
  key_hash text PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 1,
  resets_at timestamptz NOT NULL
);
CREATE INDEX request_rate_limits_expiry_idx ON public.request_rate_limits(resets_at);
ALTER TABLE public.request_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.request_rate_limits FROM anon, authenticated;
GRANT ALL ON public.request_rate_limits TO service_role;
CREATE FUNCTION public.consume_request_quota(p_key_hash text, p_limit integer, p_window_ms integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE entry public.request_rate_limits;
BEGIN
  IF p_limit < 1 OR p_window_ms < 1 OR p_window_ms > 86400000 OR length(p_key_hash) <> 64 THEN RAISE EXCEPTION 'Invalid quota'; END IF;
  INSERT INTO public.request_rate_limits(key_hash, request_count, resets_at)
  VALUES(p_key_hash, 1, clock_timestamp() + p_window_ms * interval '1 millisecond')
  ON CONFLICT(key_hash) DO UPDATE SET
    request_count = CASE WHEN request_rate_limits.resets_at <= clock_timestamp() THEN 1 ELSE LEAST(request_rate_limits.request_count + 1, p_limit + 1) END,
    resets_at = CASE WHEN request_rate_limits.resets_at <= clock_timestamp() THEN clock_timestamp() + p_window_ms * interval '1 millisecond' ELSE request_rate_limits.resets_at END
  RETURNING * INTO entry;
  DELETE FROM public.request_rate_limits WHERE resets_at < clock_timestamp() - interval '1 day';
  RETURN jsonb_build_object('allowed',entry.request_count <= p_limit,'remaining',GREATEST(0,p_limit-entry.request_count),'resetTime',extract(epoch FROM entry.resets_at)*1000);
END $$;
REVOKE ALL ON FUNCTION public.consume_request_quota(text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_request_quota(text,integer,integer) TO service_role;
