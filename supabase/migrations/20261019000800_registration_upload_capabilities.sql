CREATE TABLE public.registration_upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  ip_hash TEXT NOT NULL,
  upload_count INTEGER NOT NULL DEFAULT 0 CHECK (upload_count BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '1 hour',
  claimed_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_registration_upload_ip_time ON public.registration_upload_sessions(ip_hash, created_at);
ALTER TABLE public.registration_upload_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registration_upload_sessions FROM anon, authenticated;
GRANT ALL ON public.registration_upload_sessions TO service_role;

CREATE FUNCTION public.issue_registration_upload(p_token_hash TEXT, p_ip_hash TEXT) RETURNS UUID
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE session_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('registration-upload:' || p_ip_hash, 0));
  IF (SELECT count(*) FROM public.registration_upload_sessions WHERE ip_hash=p_ip_hash AND created_at>now()-interval '1 hour') >= 3 THEN
    RAISE EXCEPTION 'Registration upload session limit reached' USING ERRCODE='23514';
  END IF;
  INSERT INTO public.registration_upload_sessions(token_hash,ip_hash) VALUES(p_token_hash,p_ip_hash) RETURNING id INTO session_id;
  RETURN session_id;
END $$;
CREATE FUNCTION public.reserve_registration_upload(p_token_hash TEXT) RETURNS UUID
LANGUAGE sql SET search_path = public, pg_temp AS $$
  UPDATE public.registration_upload_sessions SET upload_count=upload_count+1
  WHERE token_hash=p_token_hash AND expires_at>now() AND claimed_by IS NULL AND upload_count<10 RETURNING id;
$$;
CREATE FUNCTION public.release_registration_upload(p_session_id UUID) RETURNS VOID
LANGUAGE sql SET search_path = public, pg_temp AS $$
  UPDATE public.registration_upload_sessions SET upload_count=greatest(upload_count-1,0) WHERE id=p_session_id;
$$;
REVOKE ALL ON FUNCTION public.issue_registration_upload(TEXT,TEXT), public.reserve_registration_upload(TEXT), public.release_registration_upload(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_registration_upload(TEXT,TEXT), public.reserve_registration_upload(TEXT), public.release_registration_upload(UUID) TO service_role;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('registration-verifications','registration-verifications',false,5242880,ARRAY['image/jpeg','image/png','image/webp']) ON CONFLICT(id) DO NOTHING;
NOTIFY pgrst, 'reload schema';
