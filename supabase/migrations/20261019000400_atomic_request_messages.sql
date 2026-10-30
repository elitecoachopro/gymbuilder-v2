CREATE OR REPLACE FUNCTION public.send_request_message(p_request_id UUID, p_user_id UUID, p_content TEXT)
RETURNS SETOF public.messages
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE request_row public.contact_requests%ROWTYPE;
DECLARE sender public.users%ROWTYPE;
DECLARE supplier public.supplier_profiles%ROWTYPE;
DECLARE result public.messages%ROWTYPE;
DECLARE sender_kind TEXT;
DECLARE display_name TEXT;
BEGIN
  IF p_content IS NULL OR char_length(trim(p_content)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Invalid message' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO request_row FROM public.contact_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO sender FROM public.users WHERE id = p_user_id AND email_verified;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unauthorized sender' USING ERRCODE = '42501'; END IF;
  IF request_row.client_id = sender.id THEN
    sender_kind := 'client';
    display_name := sender.full_name;
  ELSE
    SELECT * INTO supplier FROM public.supplier_profiles WHERE id = request_row.supplier_id AND user_id = sender.id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sender does not own conversation' USING ERRCODE = '42501'; END IF;
    sender_kind := 'supplier';
    display_name := supplier.company_name;
  END IF;
  INSERT INTO public.messages(request_id, sender_type, sender_name, sender_email, content)
  VALUES(p_request_id, sender_kind, display_name, sender.email, trim(p_content)) RETURNING * INTO result;
  IF sender_kind = 'supplier' THEN
    UPDATE public.contact_requests SET status = 'replied', updated_at = now() WHERE id = p_request_id;
  END IF;
  RETURN NEXT result;
END $$;

REVOKE ALL ON FUNCTION public.send_request_message(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_request_message(UUID, UUID, TEXT) TO service_role;
NOTIFY pgrst, 'reload schema';
