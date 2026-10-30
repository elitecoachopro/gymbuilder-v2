-- Prepared migration; not applied to production. Billing APIs remain disabled by default.
BEGIN;
SET LOCAL lock_timeout = '10s';
CREATE TABLE public.mobile_billing_intents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
 promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,
 store text NOT NULL CHECK (store IN ('apple','google')),
 type public.promotion_type NOT NULL,
 sku text NOT NULL CHECK (length(sku) BETWEEN 1 AND 200),
 state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','granted','expired','revoked')),
 transaction_key text UNIQUE CHECK (transaction_key ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
 UNIQUE(user_id,request_id)
);
ALTER TABLE public.mobile_billing_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_billing_intents FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.mobile_billing_intents TO service_role;

CREATE TABLE public.mobile_billing_revocations (
 store text NOT NULL CHECK(store IN ('apple','google')),
 transaction_key text NOT NULL CHECK(transaction_key ~ '^[0-9a-f]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(store,transaction_key)
);
ALTER TABLE public.mobile_billing_revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_billing_revocations FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.mobile_billing_revocations TO service_role;

CREATE FUNCTION public.reserve_mobile_promotion(p_user uuid,p_product uuid,p_type public.promotion_type,p_store text,p_sku text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE item record; old public.mobile_billing_intents; intent public.mobile_billing_intents; promotion uuid; hours integer;
BEGIN
 -- Serialize identical request keys, including requests before the row exists.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text||p_request::text,29));
 SELECT * INTO old FROM public.mobile_billing_intents WHERE user_id=p_user AND request_id=p_request;
 IF FOUND THEN
  IF old.product_id<>p_product OR old.type<>p_type OR old.store<>p_store OR old.sku<>p_sku THEN RAISE EXCEPTION 'REQUEST_CONFLICT'; END IF;
  IF old.state<>'open' OR old.expires_at<=now() THEN RAISE EXCEPTION 'INTENT_NOT_OPEN'; END IF;
  RETURN to_jsonb(old)-'user_id'-'transaction_key';
 END IF;
 IF p_type NOT IN ('oferta_zilei','anunturile_zilei','super_pret') OR p_store NOT IN ('apple','google') THEN RAISE EXCEPTION 'INVALID_OFFER'; END IF;
 SELECT p.*,s.user_id INTO item FROM public.products p JOIN public.supplier_profiles s ON s.id=p.supplier_id
 WHERE p.id=p_product AND s.user_id=p_user AND s.status='approved' AND p.status IN ('active','featured') FOR UPDATE OF p;
 IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
 -- Only release this subsystem's unpaid reservations; never edit editorial or web promotions.
 UPDATE public.promotions SET status='expired' WHERE id IN (SELECT promotion_id FROM public.mobile_billing_intents WHERE state='open' AND expires_at<=now());
 UPDATE public.mobile_billing_intents SET state='expired' WHERE state='open' AND expires_at<=now();
 hours=CASE p_type WHEN 'oferta_zilei' THEN 24 WHEN 'anunturile_zilei' THEN 168 ELSE 12 END;
 INSERT INTO public.promotions(supplier_id,product_id,title,description,type,price_eur,image_url,starts_at,ends_at,status)
 VALUES(item.supplier_id,item.id,item.name,item.description,p_type,item.price_eur,item.images[1],now(),now()+make_interval(hours=>hours),'pending') RETURNING id INTO promotion;
 INSERT INTO public.mobile_billing_intents(user_id,product_id,promotion_id,request_id,store,type,sku)
 VALUES(p_user,p_product,promotion,p_request,p_store,p_type,p_sku) RETURNING * INTO intent;
 RETURN to_jsonb(intent)-'user_id'-'transaction_key';
END $$;

CREATE FUNCTION public.grant_mobile_promotion(p_user uuid,p_intent uuid,p_transaction text,p_purchased_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE intent public.mobile_billing_intents; hours integer; product record;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_transaction,17));
 SELECT * INTO intent FROM public.mobile_billing_intents WHERE id=p_intent AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'INTENT_NOT_FOUND'; END IF;
 IF EXISTS(SELECT 1 FROM public.mobile_billing_revocations WHERE store=intent.store AND transaction_key=p_transaction) THEN RAISE EXCEPTION 'PURCHASE_REVOKED'; END IF;
 IF intent.state='granted' AND intent.transaction_key=p_transaction THEN RETURN jsonb_build_object('id',intent.promotion_id,'alreadyGranted',true); END IF;
 IF intent.state<>'open' OR intent.expires_at<=now() OR p_purchased_at<intent.created_at-interval '1 minute' OR p_purchased_at>intent.expires_at THEN RAISE EXCEPTION 'PAYMENT_REVIEW_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.mobile_billing_intents WHERE transaction_key=p_transaction) THEN RAISE EXCEPTION 'TRANSACTION_ALREADY_USED'; END IF;
 SELECT p.id INTO product FROM public.products p JOIN public.supplier_profiles s ON s.id=p.supplier_id WHERE p.id=intent.product_id AND s.user_id=p_user AND s.status='approved' AND p.status IN ('active','featured');
 IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
 hours=CASE intent.type WHEN 'oferta_zilei' THEN 24 WHEN 'anunturile_zilei' THEN 168 ELSE 12 END;
 UPDATE public.promotions SET starts_at=now(),ends_at=now()+make_interval(hours=>hours),status='active' WHERE id=intent.promotion_id AND status='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'RESERVATION_UNAVAILABLE'; END IF;
 UPDATE public.mobile_billing_intents SET state='granted',transaction_key=p_transaction WHERE id=intent.id;
 RETURN jsonb_build_object('id',intent.promotion_id,'alreadyGranted',false);
END $$;
REVOKE ALL ON FUNCTION public.reserve_mobile_promotion(uuid,uuid,public.promotion_type,text,text,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_mobile_promotion(uuid,uuid,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_mobile_promotion(uuid,uuid,public.promotion_type,text,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_mobile_promotion(uuid,uuid,text,timestamptz) TO service_role;
CREATE FUNCTION public.revoke_mobile_promotion(p_store text,p_transaction text)
RETURNS void LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_transaction,17));
 INSERT INTO public.mobile_billing_revocations(store,transaction_key) VALUES(p_store,p_transaction) ON CONFLICT DO NOTHING;
 UPDATE public.promotions SET status='expired' WHERE id IN (SELECT promotion_id FROM public.mobile_billing_intents WHERE store=p_store AND transaction_key=p_transaction AND state='granted');
 UPDATE public.mobile_billing_intents SET state='revoked' WHERE store=p_store AND transaction_key=p_transaction AND state='granted';
END $$;
REVOKE ALL ON FUNCTION public.revoke_mobile_promotion(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_mobile_promotion(text,text) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
