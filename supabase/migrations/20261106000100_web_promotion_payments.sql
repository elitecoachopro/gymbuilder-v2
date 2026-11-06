CREATE TABLE public.web_promotion_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
 promotion_id uuid UNIQUE REFERENCES public.promotions(id) ON DELETE SET NULL,
 request_key uuid NOT NULL,
 type public.promotion_type NOT NULL,
 amount_cents integer NOT NULL,
 currency text NOT NULL DEFAULT 'eur' CHECK(currency='eur'),
 stripe_account text NOT NULL,
 livemode boolean NOT NULL,
 state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','checkout','active','expired','needs_review','refunded')),
 checkout_session text UNIQUE CHECK(checkout_session IS NULL OR starts_with(checkout_session,'cs_')),
 payment_intent text UNIQUE CHECK(payment_intent IS NULL OR starts_with(payment_intent,'pi_')),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '35 minutes',
 paid_at timestamptz,
 review_reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,request_key),
 CHECK(state NOT IN ('checkout','active') OR checkout_session IS NOT NULL),
 CHECK(state NOT IN ('active','needs_review','refunded') OR (paid_at IS NOT NULL AND payment_intent IS NOT NULL)),
 CHECK((type='super_pret' AND amount_cents=1200) OR (type='oferta_zilei' AND amount_cents=2000) OR (type='anunturile_zilei' AND amount_cents=1000))
);
ALTER TABLE public.web_promotion_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.web_promotion_orders FROM anon,authenticated;
GRANT ALL ON public.web_promotion_orders TO service_role;

CREATE INDEX web_promotion_open_expiry ON public.web_promotion_orders(expires_at) WHERE state IN ('reserved','checkout') AND paid_at IS NULL;
CREATE FUNCTION public.release_expired_web_promotions() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('gymbuilder-promotion-booking'));
 WITH expired AS (UPDATE public.web_promotion_orders SET state='expired' WHERE state IN ('reserved','checkout') AND expires_at<=now() AND paid_at IS NULL RETURNING promotion_id)
 UPDATE public.promotions p SET status='expired' FROM expired e WHERE p.id=e.promotion_id;
END $$;
REVOKE ALL ON FUNCTION public.release_expired_web_promotions() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_web_promotions() TO service_role;

CREATE FUNCTION public.reserve_web_promotion(p_user uuid,p_product uuid,p_type public.promotion_type,p_key uuid,p_account text,p_live boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE existing public.web_promotion_orders; product public.products; supplier public.supplier_profiles; promo uuid; amount integer; hours integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('gymbuilder-promotion-booking'));
 SELECT * INTO existing FROM public.web_promotion_orders WHERE user_id=p_user AND request_key=p_key FOR UPDATE;
 IF FOUND THEN
  IF existing.type IS DISTINCT FROM p_type OR existing.stripe_account IS DISTINCT FROM p_account OR existing.livemode IS DISTINCT FROM p_live OR NOT EXISTS(SELECT 1 FROM public.promotions WHERE id=existing.promotion_id AND product_id=p_product) THEN RAISE EXCEPTION 'ORDER_MISMATCH'; END IF;
  RETURN to_jsonb(existing);
 END IF;
 PERFORM public.release_expired_web_promotions();
 SELECT s.* INTO supplier FROM public.supplier_profiles s JOIN public.users u ON u.id=s.user_id WHERE u.id=p_user AND u.role='supplier' AND u.email_verified AND s.status='approved' AND s.business_type<>'service';
 IF NOT FOUND THEN RAISE EXCEPTION 'SUPPLIER_NOT_ELIGIBLE'; END IF;
 SELECT * INTO product FROM public.products WHERE id=p_product AND supplier_id=supplier.id AND status IN ('active','featured');
 IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_ELIGIBLE'; END IF;
 IF EXISTS(SELECT 1 FROM public.web_promotion_orders o JOIN public.promotions p ON p.id=o.promotion_id WHERE o.user_id=p_user AND o.type=p_type AND p.product_id=p_product AND o.state IN ('reserved','checkout')) THEN RAISE EXCEPTION 'ORDER_ALREADY_OPEN'; END IF;
 amount:=CASE p_type WHEN 'super_pret' THEN 1200 WHEN 'oferta_zilei' THEN 2000 ELSE 1000 END;
 hours:=CASE p_type WHEN 'super_pret' THEN 12 WHEN 'oferta_zilei' THEN 24 ELSE 168 END;
 IF p_type IN ('super_pret','oferta_zilei') AND EXISTS(SELECT 1 FROM public.promotions p WHERE p.type=p_type AND p.status IN ('pending','active') AND tstzrange(p.starts_at,p.ends_at,'[)') && tstzrange(now(),now()+make_interval(hours=>hours)+interval '35 minutes','[)')) THEN RAISE EXCEPTION 'PLACEMENT_BUSY'; END IF;
 INSERT INTO public.promotions(supplier_id,product_id,title,description,type,price_eur,image_url,starts_at,ends_at,status)
 VALUES(supplier.id,product.id,product.name,product.description,p_type,product.price_eur,product.images->>0,now(),now()+make_interval(hours=>hours),'pending') RETURNING id INTO promo;
 INSERT INTO public.web_promotion_orders(user_id,promotion_id,request_key,type,amount_cents,stripe_account,livemode) VALUES(p_user,promo,p_key,p_type,amount,p_account,p_live) RETURNING * INTO existing;
 RETURN to_jsonb(existing);
END $$;

CREATE FUNCTION public.attach_web_checkout(p_order uuid,p_session text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF p_session IS NULL OR NOT starts_with(p_session,'cs_') THEN RAISE EXCEPTION 'CHECKOUT_MISMATCH'; END IF;
 UPDATE public.web_promotion_orders SET checkout_session=p_session,state=CASE WHEN state='reserved' THEN 'checkout' ELSE state END WHERE id=p_order AND (checkout_session IS NULL OR checkout_session=p_session);
 IF NOT FOUND THEN RAISE EXCEPTION 'CHECKOUT_MISMATCH'; END IF;
END $$;

CREATE FUNCTION public.fulfill_web_promotion(p_order uuid,p_session text,p_payment text,p_amount integer,p_currency text,p_account text,p_live boolean,p_refunded boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.web_promotion_orders; p public.promotions; hours integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('gymbuilder-promotion-booking'));
 SELECT * INTO o FROM public.web_promotion_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR p_session IS NULL OR p_session='' OR o.checkout_session IS DISTINCT FROM p_session OR o.amount_cents IS DISTINCT FROM p_amount OR o.currency IS DISTINCT FROM p_currency OR o.stripe_account IS DISTINCT FROM p_account OR o.livemode IS DISTINCT FROM p_live OR p_payment IS NULL OR p_payment='' OR (o.payment_intent IS NOT NULL AND o.payment_intent<>p_payment) THEN RAISE EXCEPTION 'PAYMENT_MISMATCH'; END IF;
 IF o.state IN ('active','refunded','needs_review') THEN RETURN to_jsonb(o); END IF;
 SELECT * INTO p FROM public.promotions WHERE id=o.promotion_id FOR UPDATE;
 UPDATE public.web_promotion_orders SET payment_intent=p_payment,paid_at=now() WHERE id=o.id;
 IF p_refunded THEN
  UPDATE public.promotions SET status='expired' WHERE id=p.id;
  UPDATE public.web_promotion_orders SET state='refunded' WHERE id=o.id RETURNING * INTO o;
  RETURN to_jsonb(o);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.products pr JOIN public.supplier_profiles s ON s.id=pr.supplier_id WHERE pr.id=p.product_id AND pr.supplier_id=p.supplier_id AND pr.status IN ('active','featured') AND s.status='approved') THEN
  UPDATE public.promotions SET status='expired' WHERE id=p.id;
  UPDATE public.web_promotion_orders SET state='needs_review',review_reason='PRODUCT_UNAVAILABLE' WHERE id=o.id RETURNING * INTO o;
  RETURN to_jsonb(o);
 END IF;
 hours:=CASE o.type WHEN 'super_pret' THEN 12 WHEN 'oferta_zilei' THEN 24 ELSE 168 END;
 BEGIN
  UPDATE public.promotions SET starts_at=now(),ends_at=now()+make_interval(hours=>hours),status='active' WHERE id=p.id;
 EXCEPTION WHEN exclusion_violation THEN
  UPDATE public.promotions SET status='expired' WHERE id=p.id;
  UPDATE public.web_promotion_orders SET state='needs_review',review_reason='PLACEMENT_UNAVAILABLE' WHERE id=o.id RETURNING * INTO o;
  RETURN to_jsonb(o);
 END;
 UPDATE public.web_promotion_orders SET state='active',review_reason=NULL WHERE id=o.id RETURNING * INTO o;
 RETURN to_jsonb(o);
END $$;

CREATE FUNCTION public.expire_web_checkout(p_session text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.web_promotion_orders;
BEGIN
 SELECT * INTO o FROM public.web_promotion_orders WHERE checkout_session=p_session FOR UPDATE;
 IF FOUND AND o.state IN ('reserved','checkout') AND o.paid_at IS NULL THEN
  UPDATE public.promotions SET status='expired' WHERE id=o.promotion_id;
  UPDATE public.web_promotion_orders SET state='expired' WHERE id=o.id;
 END IF;
END $$;
CREATE FUNCTION public.refund_web_promotion(p_payment text,p_amount integer,p_currency text,p_account text,p_live boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.web_promotion_orders;
BEGIN
 SELECT * INTO o FROM public.web_promotion_orders WHERE payment_intent=p_payment AND stripe_account=p_account AND livemode=p_live FOR UPDATE;
 IF FOUND AND o.currency=p_currency AND p_amount>=o.amount_cents THEN
  UPDATE public.promotions SET status='expired' WHERE id=o.promotion_id;
  UPDATE public.web_promotion_orders SET state='refunded' WHERE id=o.id;
 END IF;
END $$;

REVOKE ALL ON FUNCTION public.reserve_web_promotion(uuid,uuid,public.promotion_type,uuid,text,boolean),public.attach_web_checkout(uuid,text),public.fulfill_web_promotion(uuid,text,text,integer,text,text,boolean,boolean),public.expire_web_checkout(text),public.refund_web_promotion(text,integer,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_web_promotion(uuid,uuid,public.promotion_type,uuid,text,boolean),public.attach_web_checkout(uuid,text),public.fulfill_web_promotion(uuid,text,text,integer,text,text,boolean,boolean),public.expire_web_checkout(text),public.refund_web_promotion(text,integer,text,text,boolean) TO service_role;

CREATE FUNCTION public.review_removed_web_promotion() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.web_promotion_orders SET state='needs_review',review_reason='PROMOTION_REMOVED' WHERE promotion_id=OLD.id AND state='active' AND paid_at IS NOT NULL;
 RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.review_removed_web_promotion() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER review_removed_web_promotion BEFORE DELETE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.review_removed_web_promotion();

CREATE OR REPLACE VIEW public.public_promotions WITH(security_invoker=true) AS
SELECT promotion.* FROM public.promotions promotion
JOIN public.supplier_profiles supplier ON supplier.id=promotion.supplier_id AND supplier.status='approved'
LEFT JOIN public.products product ON product.id=promotion.product_id AND product.supplier_id=promotion.supplier_id
WHERE promotion.status='active' AND promotion.starts_at<=now() AND promotion.ends_at>now()
AND (promotion.product_id IS NULL OR product.status IN ('active','featured'))
AND NOT EXISTS(SELECT 1 FROM public.web_promotion_orders o WHERE o.promotion_id=promotion.id AND NOT o.livemode);
REVOKE ALL ON public.public_promotions FROM anon,authenticated;
GRANT SELECT ON public.public_promotions TO service_role;
NOTIFY pgrst,'reload schema';
